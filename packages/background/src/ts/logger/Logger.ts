import { LogLevel } from 'get-set-fetch-extension-commons';
import IdbLog from '../storage/IdbLog';

export default class Logger {
  static logLevel: LogLevel = LogLevel.INFO;

  static getLogger(cls: string) {
    return new Logger(cls);
  }

  static getExtLogger(cls) {
    return new Logger(cls);
  }

  static stringifyArgs(args) {
    const compactArgs = args.map(arg => {
      // arg is object, usefull for serializing errors
      if (arg === Object(arg)) {
        return Object.getOwnPropertyNames(arg).reduce(
          (compactArg, propName) => Object.assign(compactArg, { [propName]: arg[propName] }),
          {},
        );
      }

      // arg is literal
      return arg;
    });

    return compactArgs;
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
    const logEntry = new IdbLog({ level: LogLevel.ERROR, cls: this.cls, msg: Logger.stringifyArgs(args) });
    logEntry.save();
  }
}
