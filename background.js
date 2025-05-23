chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete') { // Added braces for clarity
    chrome.tabs.sendMessage(tabId, {});
  }
});

// Export an empty object to ensure the file is treated as a module.
export {};