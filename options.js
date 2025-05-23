import vex from 'vex-js';

vex.defaultOptions.className = 'vex-theme-default';

// Promise wrapper for chrome.storage.local.get
function getStorageData(keys) {
  return new Promise((resolve, reject) => {
    chrome.storage.local.get(keys, (result) => {
      if (chrome.runtime.lastError) {
        return reject(chrome.runtime.lastError);
      }
      resolve(result);
    });
  });
}

// Promise wrapper for chrome.storage.local.set
function setStorageData(data) {
  return new Promise((resolve, reject) => {
    chrome.storage.local.set(data, () => {
      if (chrome.runtime.lastError) {
        return reject(chrome.runtime.lastError);
      }
      resolve();
    });
  });
}

// Main function to initialize and set up event listeners
async function initializeOptions() {
  const usernameInput = document.getElementById('username');
  const wifInput = document.getElementById('wif');
  const saveButton = document.getElementById('save');
  const resetButton = document.getElementById('reset');

  // Load initial data
  try {
    const result = await getStorageData(['wif', 'username']);
    // Original behavior: only populate if both wif and username are present (not null)
    if (result.wif != null && result.username != null) {
      usernameInput.value = result.username;
      wifInput.value = result.wif;
    }
    // If one or both are null, the input fields will remain empty or show placeholders.
  } catch (error) {
    console.error('Error loading data from chrome.storage:', error);
  }

  // Event listener for the Save button
  if (saveButton) {
    saveButton.addEventListener('click', async () => {
      console.log('saving...');
      const username = usernameInput.value;
      const wif = wifInput.value;

      // Validate WIF: must be 51 characters. Username can be empty.
      // The original check `username == null` is unlikely for an input field's value (it would be an empty string).
      // The main concern is the WIF length.
      if (wif && wif.length !== 51) { // Check if wif is not empty and length is not 51
        console.error('Bad WIF: Must be 51 characters long.');
      } else if (wif === "" && username === "") { // Allow saving empty fields (effectively a reset)
         try {
          await setStorageData({ "wif": wif, "username": username });
          // Consider providing user feedback here instead of just closing.
          window.close(); // As per original functionality
        } catch (error) {
          console.error('Error saving data to chrome.storage:', error);
        }
      }
      else if (wif && wif.length === 51) { // If WIF is valid
         try {
          await setStorageData({ "wif": wif, "username": username });
          window.close(); // As per original functionality
        } catch (error) {
          console.error('Error saving data to chrome.storage:', error);
        }
      } else if (!wif) { // If WIF is empty, but username might not be
        console.error('WIF cannot be empty if you intend to save a username that is not also empty. Or, WIF must be 51 characters.');
      }
      // If username is provided but WIF is empty or invalid, it's an error based on above conditions.
    });
  } else {
    console.error('Save button not found in the DOM.');
  }

  // Event listener for the Reset button
  if (resetButton) {
    resetButton.addEventListener('click', async () => {
      const defaultUsername = "";
      const defaultWif = "";
      usernameInput.value = defaultUsername;
      wifInput.value = defaultWif;
      try {
        // Use the cleared variables directly, not by re-reading from cleared inputs.
        await setStorageData({ "wif": defaultWif, "username": defaultUsername });
        // Optionally, add user feedback here (e.g., vex.dialog.alert('Settings reset!')).
      } catch (error) {
        console.error('Error resetting data in chrome.storage:', error);
      }
    });
  } else {
    console.error('Reset button not found in the DOM.');
  }
}

// Initialize when the DOM is fully loaded
document.addEventListener('DOMContentLoaded', initializeOptions);