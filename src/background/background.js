// Background - Service Worker (MV3)

chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.sync.set({
    automation: false,
    value: 10,
    period: 0,
    minPayout: 80
  });
});

// Captura visível da aba
async function captureVisible() {
  return new Promise((resolve, reject) => {
    try {
      chrome.tabs.captureVisibleTab({ format: 'png' }, (dataUrl) => {
        if (chrome.runtime.lastError) return reject(new Error(chrome.runtime.lastError.message));
        if (!dataUrl) return reject(new Error('Falha na captura'));
        resolve(dataUrl);
      });
    } catch (e) { reject(e); }
  });
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  let isAsync = false;
  try {
    switch (message?.action) {
      case 'CAPTURE_SCREENSHOT': {
        isAsync = true;
        (async () => {
          try {
            const dataUrl = await captureVisible();
            sendResponse({ success: true, dataUrl });
          } catch (err) {
            sendResponse({ success: false, error: err.message });
          }
        })();
        break;
      }
      default:
        sendResponse({ success: false, error: 'ACTION_NOT_HANDLED' });
    }
  } catch (err) {
    sendResponse({ success: false, error: err.message });
  }
  return isAsync;
});
