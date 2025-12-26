function createLoggerService() {
  const logWithLevel = (level, message, data) => {
    const payload = data !== undefined ? [message, data] : [message];
    console[level](...payload);
  };

  return {
    info: (message, data) => logWithLevel('info', message, data),
    warn: (message, data) => logWithLevel('warn', message, data),
    error: (message, data) => logWithLevel('error', message, data),
  };
}
