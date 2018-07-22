import BasePlugin from 'get-set-fetch/lib/plugins/base/BasePlugin';
import ActiveTabHelper from '../../ActiveTabHelper';

const URL = require('url-parse');

class ExtensionFetchPlugin extends BasePlugin {
  // eslint-disable-next-line class-methods-use-this
  getPhase() {
    return BasePlugin.PHASE.FETCH;
  }

  // eslint-disable-next-line class-methods-use-this
  test(resource) {
    const { protocol } = new URL(resource.url);
    return protocol === 'http:' || protocol === 'https:';
  }

  // eslint-disable-next-line
  async apply(site, resource) {
    return new Promise(async (resolve, reject) => {
      let statusCode = null;

      const reqHandler = (request) => {
        ({ statusCode } = request);

        chrome.webRequest.onErrorOccurred.removeListener(reqHandler);
        chrome.webRequest.onCompleted.removeListener(reqHandler);
      };

      // register request listers responsible for resolving or rejecting this plugin's apply fnc
      chrome.webRequest.onErrorOccurred.addListener(reqHandler, { urls: [resource.url], tabId: site.tabId });
      chrome.webRequest.onCompleted.addListener(reqHandler, { urls: [resource.url], tabId: site.tabId });

      // load the new resource
      await ActiveTabHelper.update(site.tabId, { url: resource.url });

      // url request error
      if (statusCode < 200 || statusCode > 299) {
        reject(new Error(`onErrorOccurred: ${statusCode}`));
      }
      // url request succesfully completed
      else {
        const contentType = await ActiveTabHelper.executeScript(site.tabId, { code: 'document.contentType' });
        resolve({ contentType });
      }
    });
  }
}

module.exports = ExtensionFetchPlugin;
