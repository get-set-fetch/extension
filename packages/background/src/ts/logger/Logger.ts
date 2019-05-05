import IdbLog from '../storage/IdbLog';

export enum LogLevel {
  TRACE = 0,
  DEBUG = 1,
  INFO = 2,
  WARN = 3,
  ERROR = 4
}

export default class Logger {
  static logLevel: LogLevel = LogLevel.INFO;

  static getLogger(cls: string) {
    return new Logger(cls);
  }

  static getExtLogger(cls) {
    return new Logger(cls);
  }

  static stringifyArgs(args) {
    return args.length > 1 ? JSON.stringify(args) : args[0];
  }

  static setLogLevel(logLevel: LogLevel) {
    Logger.logLevel = logLevel;
  }

  cls: string;

  constructor(cls: string) {
    // ensure a default log level is set
    if (!Logger.logLevel) {
      Logger.logLevel = LogLevel.INFO;
    }

    this.cls = cls;
  }

  trace(...args) {
    if (Logger.logLevel > 0) return;
    const logEntry = new IdbLog({ level: LogLevel.TRACE, cls: this.cls, msg: Logger.stringifyArgs(args) });
    logEntry.save();
  }

  debug(...args) {
    if (Logger.logLevel > 1) return;
    const logEntry = new IdbLog({ level: LogLevel.DEBUG, cls: this.cls, msg: Logger.stringifyArgs(args) });
    logEntry.save();
  }

  info(...args) {
    if (Logger.logLevel > 2) return;
    const logEntry = new IdbLog({ level: LogLevel.INFO, cls: this.cls, msg: Logger.stringifyArgs(args) });
    logEntry.save();
  }

  warn(...args) {
    if (Logger.logLevel > 3) return;
    const logEntry = new IdbLog({ level: LogLevel.WARN, cls: this.cls, msg: Logger.stringifyArgs(args) });
    logEntry.save();
  }

  error(...args) {
    if (Logger.logLevel > 4) return;
    const logEntry = new IdbLog({ level: LogLevel.ERROR, cls: this.cls });
    if (args.length === 1 && args[0] instanceof Error) {
      const err: Error = args[0] as Error;
      logEntry.msg = err.message;
      logEntry.stack = err.stack;
    }
    else {
      logEntry.msg = Logger.stringifyArgs(args);
    }

    console.log(logEntry);
    logEntry.save();
  }
}
