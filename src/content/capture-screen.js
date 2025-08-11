// API de captura (para usar no iframe)
window.CaptureScreen = {
  async capture() {
    const resp = await chrome.runtime.sendMessage({ action: 'CAPTURE_SCREENSHOT' });
    if (!resp?.success) throw new Error(resp?.error || 'CAPTURE_ERROR');
    return resp.dataUrl;
  }
};
