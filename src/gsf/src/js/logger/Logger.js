/* eslint-disable no-param-reassign */
import IdbLog from '../storage/IdbLog';

export default class Logger {
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
        Logger.logLevel = 2;
    }
  }

  static getLogger(cls) {
    return new Logger(cls);
  }

  static getExtLogger(cls) {
    return new Logger(cls);
  }

  static stringifyArgs(args) {
    return args.length > 1 ? JSON.stringify(args) : args[0];
  }

  constructor(cls) {
    // ensure a default log level is set
    if (!Logger.logLevel) {
      Logger.setLogLevel();
    }

    this.cls = cls;
  }

  trace(...args) {
    if (Logger.logLevel > 0) return;
    const logEntry = new IdbLog('TRACE', this.cls, Logger.stringifyArgs(args));
    logEntry.save();
  }

  debug(...args) {
    if (Logger.logLevel > 1) return;
    const logEntry = new IdbLog('DEBUG', this.cls, Logger.stringifyArgs(args));
    logEntry.save();
  }

  info(...args) {
    if (Logger.logLevel > 2) return;
    const logEntry = new IdbLog('INFO', this.cls, Logger.stringifyArgs(args));
    logEntry.save();
  }

  warn(...args) {
    if (Logger.logLevel > 3) return;
    const logEntry = new IdbLog('WARN', this.cls, Logger.stringifyArgs(args));
    logEntry.save();
  }

  error(...args) {
    if (Logger.logLevel > 4) return;
    const logEntry = new IdbLog('ERROR', this.cls, Logger.stringifyArgs(args));
    logEntry.save();
  }
}
