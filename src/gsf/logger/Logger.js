/* eslint-disable no-param-reassign */
class Logger {
  static setLogLevel(logLevel) {
    switch (logLevel ? String(logLevel).toLowerCase() : '') {
      case 'trace':
        Logger.logLevel = 0;
        break;
      case 'debug':
        Logger.logLevel = 1;
        break;
      case 'info':
        Logger.logLevel = 2;
        break;
      case 'warn':
        Logger.logLevel = 3;
        break;
      case 'error':
        Logger.logLevel = 4;
        break;
      default:
        Logger.logLevel = 3;
    }
  }

  static getLogger(cls) {
    return new Logger(cls);
  }

  static getExtLogger(cls) {
    return new Logger(cls);
  }

  constructor(cls) {
    // ensure a default log level is set
    if (!Logger.logLevel) {
      Logger.setLogLevel();
    }

    this.console = window.console;
    this.cls = cls;
  }

  trace(...args) {
    if (Logger.logLevel > 0) return;
    args[0] = `[TRACE] ${this.cls} ${new Date(Date.now())} ${args[0]}`;
    this.console.trace.apply(this, args);
  }

  debug(...args) {
    if (Logger.logLevel > 1) return;
    args[0] = `[DEBUG] ${this.cls} ${new Date(Date.now())} ${args[0]}`;
    this.console.debug.apply(this, args);
  }

  info(...args) {
    if (Logger.logLevel > 2) return;
    args[0] = `[INFO] ${this.cls} ${new Date(Date.now())} ${args[0]}`;
    this.console.info.apply(this, args);
  }

  warn(...args) {
    if (Logger.logLevel > 3) return;
    args[0] = `[WARN] ${this.cls} ${new Date(Date.now())} ${args[0]}`;
    this.console.warn.apply(this, args);
  }

  error(...args) {
    if (Logger.logLevel > 4) return;
    args[0] = `[ERROR] ${this.cls} ${new Date(Date.now())} ${args[0]}`;
    this.console.error.apply(this, args);
  }
}

module.exports = Logger;
