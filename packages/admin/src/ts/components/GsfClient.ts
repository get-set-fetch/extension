import { HttpMethod, LogLevel } from 'get-set-fetch-extension-commons';

export default class GsfClient {
  static fetch(method: HttpMethod, resource: string, body?: object): Promise<object> {
    return new Promise(resolve => {
      chrome.runtime.sendMessage({ method, resource, body }, response => {
        resolve(response);
      });
    });
  }

  static log(level: LogLevel, cls: string, ...msg: string[]) {
    return GsfClient.fetch(HttpMethod.POST, 'logs', { level, cls, msg: GsfClient.stringifyArgs(msg) });
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
}
