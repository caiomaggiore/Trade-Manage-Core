// Sistema global de logs e status (iframe)
window.sendLog = (message, level = 'INFO', source = 'CORE') => {
  window.postMessage({ type: 'LOG_MESSAGE', data: { message, level, source } }, '*');
};
window.sendStatus = (message, type = 'info', duration = 3000) => {
  window.postMessage({ type: 'UPDATE_STATUS', data: { message, type, duration } }, '*');
};
window.logToSystem = (message, level = 'INFO', source = 'CORE') => window.sendLog(message, level, source);
