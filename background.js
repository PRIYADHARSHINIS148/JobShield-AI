// background.js — extension service worker

chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: 'jobshield-scan',
    title: '🛡️ Scan with JobShield',
    contexts: ['selection'],
  });
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === 'jobshield-scan') {
    chrome.storage.local.set({ selectedText: info.selectionText }, () => {
      chrome.action.openPopup();
    });
  }
});
