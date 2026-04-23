/**
 * Doomscroll Bot - Background Service Worker v2.2.2
 * Handles downloads and cross-origin tasks
 */

chrome.runtime.onInstalled.addListener(() => {
  console.log("Doomscroll Bot installed & ready.");
});

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    if (msg.type === "DOWNLOAD_JSON") {
        const blob = new Blob([msg.data], { type: 'application/json' });
        const reader = new FileReader();
        reader.onload = function() {
            chrome.downloads.download({
                url: reader.result,
                filename: msg.filename,
                saveAs: true
            }, (downloadId) => {
                sendResponse({ status: "downloading", id: downloadId });
            });
        };
        reader.readAsDataURL(blob);
        return true; // Keep channel open for async
    }
});
