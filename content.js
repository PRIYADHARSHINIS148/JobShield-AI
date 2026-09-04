// content.js — injected into all pages
// Listens for messages from popup/background if needed in future
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type === 'GET_SELECTION') {
    sendResponse({ text: window.getSelection().toString() });
  }
});
