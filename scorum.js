import Mustache from 'mustache';
import vex from 'vex-js';
import '../vendor/scorum.min.js'; // For side effects, setting up global scorum object

// Initial setup from original script
// Ensure scorum object is available globally after import for side effects
if (typeof scorum !== 'undefined' && scorum.api && scorum.config) {
  scorum.api.setOptions({ url: 'https://prodnet.scorum.com' });
  scorum.config.set('chain_id', 'db4007d45f04c1403a7e66a5c66b5b1cdfc2dde8b5335d1d2f116d592ca3dbb1');
} else {
  console.error("Scorum library not found after import. Ensure '../vendor/scorum.min.js' correctly initializes the global 'scorum' object.");
}

vex.defaultOptions.className = 'vex-theme-default';

// --- Promise Wrappers ---
function storageGetAsync(keys) {
  return new Promise((resolve) => {
    chrome.storage.local.get(keys, (result) => resolve(result));
  });
}

function getAccountsAsync(delegatee) {
  return new Promise((resolve, reject) => {
    scorum.api.getAccounts([delegatee], (err, result) => {
      if (err) reject(err);
      else resolve(result);
    });
  });
}

function delegateScorumpowerAsync(wif, username, delegatee, amount) {
  return new Promise((resolve, reject) => {
    scorum.broadcast.delegateScorumpower(wif, username, delegatee, amount, (err, result) => {
      if (err) reject(err);
      else resolve(result);
    });
  });
}

async function fetchAsync(url, options = {}) {
  const response = await fetch(url, options);
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  if (options.contentType === "application/json" || url.includes("application/json")) {
    return response.json();
  }
  return response.text();
}

// --- Profile Page Logic ---
async function handleProfilePage() {
  const profileIcons = document.querySelector('.profile-icons');
  if (!profileIcons) return;

  const delegateSpan = document.createElement('span');
  delegateSpan.className = 'font-weight-bold text-white delegate';
  delegateSpan.title = 'Delegate';
  delegateSpan.textContent = 'D';
  profileIcons.append(delegateSpan);

  const delegatee = window.location.pathname.substring(window.location.pathname.indexOf('@') + 1);

  try {
    const accounts = await getAccountsAsync(delegatee);
    if (accounts && accounts.length > 0) {
      const account = accounts[0];
      
      const delegatedSpan = document.createElement('span');
      delegatedSpan.className = 'font-weight-bold text-white ml-0_5';
      delegatedSpan.title = 'The amount delegated';
      delegatedSpan.textContent = `${Number.parseFloat(account.delegated_scorumpower).toFixed(0)} SP `;
      profileIcons.append(delegatedSpan);

      const separatorSpan = document.createElement('span');
      separatorSpan.className = 'separator text-white';
      separatorSpan.textContent = ' | ';
      profileIcons.append(separatorSpan);

      const receivedSpan = document.createElement('span');
      receivedSpan.className = 'font-weight-bold text-white ml-0_5';
      receivedSpan.title = 'The amount of delegation received';
      receivedSpan.textContent = `${Number.parseFloat(account.received_scorumpower).toFixed(0)} SP `;
      profileIcons.append(receivedSpan);
    }
  } catch (err) {
    console.error('Error fetching account data:', err);
  }
}

// --- Betting Information Loading ---
async function loadBettingInformation() {
  if (document.querySelector(".container.betting")) return;

  try {
    const storage = await storageGetAsync(['wif', 'username']);
    if (!storage.username) return;

    const bets = await fetchAsync(`https://bet-api.scorum.com/v1/account/${storage.username}/bets?is_finished=false&limit=10`, { contentType: "application/json" });

    if (!bets || bets.length === 0) return;

    const homeContainer = document.querySelector(".home-container");
    if (!homeContainer) return;

    const bettingDiv = document.createElement('div');
    bettingDiv.className = 'container betting';
    homeContainer.prepend(bettingDiv);
    
    const bettingHtmlUrl = chrome.extension.getURL("betting.html");
    const bettingPageHtml = await fetchAsync(bettingHtmlUrl);
    bettingDiv.innerHTML = bettingPageHtml;

    const template = document.getElementById('template')?.innerHTML;
    if (template) {
      Mustache.parse(template);
      const rendered = Mustache.render(template, {
        "matches": bets,
        "toDate": function () { return new Date(this.game.start_time).toDateString() },
        "matched": function () { return this.unmatched == 0 ? "Matched" : "Unmatched" },
      });
      const bettingTableBody = bettingDiv.querySelector(".betting-table-body");
      if (bettingTableBody) {
        bettingTableBody.innerHTML = rendered;
      }
    }
  } catch (error) {
    console.error("Error loading betting information:", error);
  }
}

// --- MutationObserver for .home-container ---
// Strategy for $.initialize: Use MutationObserver to detect when ".home-container" is added to the DOM.
// This is a standard way to react to dynamically added elements.
let homeContainerObserver;

function observeHomeContainer() {
  if (homeContainerObserver) homeContainerObserver.disconnect(); // Disconnect previous observer if any

  homeContainerObserver = new MutationObserver((mutationsList, observer) => {
    for (const mutation of mutationsList) {
      if (mutation.type === 'childList') {
        const homeContainer = document.querySelector(".home-container");
        if (homeContainer) {
          // Original code had a setTimeout here. Keeping it to mimic behavior,
          // as it might be waiting for other content within .home-container.
          setTimeout(loadBettingInformation, 0); 
          observer.disconnect(); // Stop observing once found and action initiated
          return; 
        }
      }
    }
  });

  homeContainerObserver.observe(document.body, { childList: true, subtree: true });
}


// --- Delegate Click Handling ---
async function handleDelegateClick(event) {
  if (!event.target.matches('.delegate')) return;

  const delegateeElement = event.target.closest('[data-delegatee]') || window.location.pathname.substring(window.location.pathname.indexOf('@') + 1);
  const delegatee = typeof delegateeElement === 'string' ? delegateeElement : delegateeElement.dataset.delegatee;


  if (!delegatee) {
      console.error("Could not determine delegatee from profile path or element attribute.");
      return;
  }
  
  try {
    const storage = await storageGetAsync(['wif', 'username']);
    if (!storage.wif || !storage.username) {
      vex.dialog.alert('Please set your username and wif key in the chrome extension options first. <br>To do this, right click on the Scorum extension icon in the top right section of your browser and select OPTIONS.');
      return;
    }

    vex.dialog.prompt({
      message: `Delegation to @${delegatee}`,
      input: `<label style="font-size: 14px;" for="number">Type the amount you wish to delegate (0 to remove delegation)</label><input name="number" type="number" min="0" max="100000000" step="1">`,
      callback: async function (value) {
        if (value === null || value === false) return; // Handle cancel or empty submission

        const precisionValue = Number.parseFloat(value).toFixed(9);
        try {
          const delegateResult = await delegateScorumpowerAsync(storage.wif, storage.username, delegatee, `${precisionValue} SP`);
          vex.dialog.alert({ message: `Success!<br>Here is your Transaction Id: ${delegateResult.id}` });
          console.log('Delegation successful:', delegateResult);
        } catch (err) {
          console.error('Delegation error:', err);
          vex.dialog.alert({ message: `Delegation failed: ${err.message || 'Unknown error'}`});
        }
      }
    });
  } catch (error) {
    console.error("Error setting up delegation prompt:", error);
  }
}

function initDelegateEventListener() {
    // Check if the listener is already attached to avoid duplicates if script re-runs (e.g. in some SPA navigations)
    if (document.body.dataset.delegateListenerAttached === 'true') {
        return;
    }
    document.body.addEventListener('click', handleDelegateClick);
    document.body.dataset.delegateListenerAttached = 'true';
}


// --- Main Message Listener ---
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  // Logic for profile page
  if (window.location.pathname.includes('/profile/@')) {
    handleProfilePage();
  }

  // Initialize observer for home container (replaces $.initialize)
  // This needs to run regardless of the path, as the home container might appear on various pages or SPAs.
  observeHomeContainer();
  
  // Initialize the global delegate click listener
  initDelegateEventListener();

  // sendResponse might be needed if the message expects a reply
  // For now, assuming no response is needed.
  return true; // Indicate async response if sendResponse might be called later.
});

// Initial listener setup when script first loads, in case onMessage isn't triggered immediately
// for scenarios like direct page load rather than navigation.
if (window.location.pathname.includes('/profile/@')) {
    handleProfilePage();
}
observeHomeContainer();
initDelegateEventListener();
