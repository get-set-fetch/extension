import * as React from 'react';
import { HttpMethod, LogLevel } from 'get-set-fetch-extension-commons';
import Modal from './Modal';

export default class GsfClient {
  static fetchCount: number = 0;
  static spinnerTimeout: number;

  static addFetchOp() {
    GsfClient.fetchCount += 1;
    if (GsfClient.fetchCount === 1) {
      GsfClient.showSpinner();
    }
  }

  /*
  show the spinner with a delay so that fast fetch responses don't cause the spinner to flicker
  */
  static showSpinner() {
    GsfClient.spinnerTimeout = window.setTimeout(
      () => Modal.instance.show(
        null,
        [
          <div key ="loader" className="spinner-border text-secondary" role="status">
            <span className="sr-only">Loading...</span>
          </div>,
        ],
        null,
      ),
      300,
    );
  }

  static removeFetchOp() {
    GsfClient.fetchCount -= 1;
    if (GsfClient.fetchCount === 0) {
      window.clearTimeout(GsfClient.spinnerTimeout);
      Modal.instance.hide();
    }
  }

  static fetch<T = object>(method: HttpMethod, resource: string, body?: object): Promise<T> {
    return new Promise(resolve => {
      GsfClient.addFetchOp();
      chrome.runtime.sendMessage({ method, resource, body }, response => {
        resolve(response);
        GsfClient.removeFetchOp();
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
