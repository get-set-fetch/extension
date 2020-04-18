import Url from 'url-parse';
import { BasePlugin, IResource, ISite, IEnhancedJSONSchema } from 'get-set-fetch-extension-commons';
import ActiveTabHelper from '../../helpers/ActiveTabHelper';

export default class FetchPlugin extends BasePlugin {
  getOptsSchema(): IEnhancedJSONSchema {
    return {
      type: 'object',
      title: 'Fetch Plugin',
      description: 'responsible for either downloading or loading in the current tab a new resource url.',
      properties: {
        stabilityTimeout: {
          type: 'number',
          default: '0',
          description: 'consider the page loaded when there are no more dom changes within the specified amount (miliseconds). only applies to html resources.',
        },
      },
      required: [ 'stabilityTimeout' ],
    };
  }

  opts: {
    stabilityTimeout: number;
  };

  test(site: ISite, resource: IResource) {
    if (!resource) return false;

    // only fetch a resource that hasn't been fetched yet
    if (resource.mediaType) return false;

    const { protocol } = new URL(resource.url);
    return protocol === 'http:' || protocol === 'https:';
  }

  apply(site: ISite, resource: IResource) {
    // url appears to be of html mime type, loaded it in a browser tab
    if (this.probableHtmlMimeType(resource.url)) {
      return this.openInTab(site, resource);
    }

    // url appears to be a non html mime type, download it and store it as blob
    return this.fetch(resource);
  }

  startDownload(url: string): Promise<number> {
    return new Promise(resolve => chrome.downloads.download({ url }, (downloadId: number) => resolve(downloadId)));
  }

  completeDownload(itemId: number): Promise<string> {
    return new Promise(resolve => {
      chrome.downloads.onChanged.addListener(function onChanged(downloadDelta: chrome.downloads.DownloadDelta) {
        if (downloadDelta.id === itemId && downloadDelta.state && downloadDelta.state.current !== 'in_progress') {
          chrome.downloads.onChanged.removeListener(onChanged);
          resolve(downloadDelta.state.current);
        }
      });
    });
  }

  searchDownload(id: number): Promise<chrome.downloads.DownloadItem> {
    return new Promise(resolve => chrome.downloads.search({ id }, (downloadItems: chrome.downloads.DownloadItem[]) => resolve(downloadItems[0])));
  }

  // fetch resource via builtin fetch
  fetch(resource: IResource) {
    return new Promise(async (resolve, reject) => {
      try {
        const response = await fetch(resource.url, { method: 'GET', credentials: 'include' });
        if (response.blob) {
          const blob = await response.blob();
          resolve({ blob, mediaType: blob.type });
        }
      }
      catch (err) {
        reject(err);
      }
    });
  }

  // download resource via extension downloads API
  download(resource: IResource) {
    return new Promise(async (resolve, reject) => {
      const downloadId: number = await this.startDownload(resource.url);

      // download could not start
      if (!downloadId) {
        reject(new Error('error initializing download'));
        return;
      }

      // download succesfully started, wait for its completion
      const downloadState: string = await this.completeDownload(downloadId);

      // download did not complete succesfully
      if (downloadState !== 'complete') {
        reject(new Error(`invalid downloadstate: ${downloadState}`));
        return;
      }

      // download succesfully completed
      const downloadItem = await this.searchDownload(downloadId);
      const mediaType = downloadItem.mime;
      resolve({ mediaType });
    });
  }

  openInTab(site: ISite, resource: IResource) {
    return new Promise(async (resolve, reject) => {
      let statusCode = null;
      let redirectUrl = null;

      const reqHandler = request => {
        ({ statusCode } = request);
        chrome.webRequest.onErrorOccurred.removeListener(reqHandler);
        chrome.webRequest.onCompleted.removeListener(reqHandler);
      };

      // https://developer.chrome.com/extensions/webRequest#event-onBeforeRedirect
      const redirectHandler = details => {
        ({ statusCode, redirectUrl } = details);
        chrome.webRequest.onBeforeRedirect.removeListener(redirectHandler);
      };

      // https://developer.chrome.com/extensions/match_patterns, path is required, make sure it at least '/'
      const { pathname } = new Url(resource.url);
      const urlFilters = pathname.length === 0 ? [ `${resource.url}/` ] : [ resource.url ];

      // register request listers responsible for resolving or rejecting this plugin's apply fnc
      chrome.webRequest.onErrorOccurred.addListener(reqHandler, { urls: urlFilters, tabId: site.tabId });
      chrome.webRequest.onCompleted.addListener(reqHandler, { urls: urlFilters, tabId: site.tabId });
      chrome.webRequest.onBeforeRedirect.addListener(redirectHandler, { urls: urlFilters, tabId: site.tabId });

      // load the new resource
      await ActiveTabHelper.update(site.tabId, { url: resource.url });

      // url request succesfully completed with (3xx) or without (2xx) redirection
      if (/^(2|3)\d{2}$/.test(statusCode)) {
        const mediaType = await ActiveTabHelper.executeScript<string>(site.tabId, { code: 'document.contentType' });

        if (/html/.test(mediaType) && this.opts.stabilityTimeout > 0) {
          await this.waitForDomStabilityExecution(site.tabId, this.opts.stabilityTimeout);
        }

        resolve({ mediaType });
      }
      // url request error
      else {
        reject(new Error(`onErrorOccurred: ${statusCode}`));
      }
    });
  }

  probableHtmlMimeType(urlStr: string) {
    const { pathname } = new Url(urlStr);
    const extensionMatch = /^.*\.(.+)$/.exec(pathname);

    // no extension found, most probably html
    if (!extensionMatch) {
      return true;
    }

    // extension found, test it against most probable extensions of html compatible mime types
    const ext = extensionMatch[1];
    return /htm|php/.test(ext);
  }

  waitForDomStabilityExecution(tabId, timeout: number) {
    // use a block declaration in order not to polute the global namespace
    const code = `
    {
      (async function() {
        try {
          function ${this.waitForDomStability.toString()};
          await waitForDomStability(${timeout});
        
          // send the result back via messaging as the promise content will just be serialized to {}
          chrome.runtime.sendMessage({resolved: true});
        }
        catch(err) {
          chrome.runtime.sendMessage({resolved: false, err: JSON.stringify(err, Object.getOwnPropertyNames(err))});
        }
      })();
    }
    `;

    return ActiveTabHelper.executeAsyncScript(tabId, code);
  }

  waitForDomStability(timeout: number) {
    return new Promise(resolve => {
      const waitResolve = observer => {
        observer.disconnect();
        resolve();
      };

      let timeoutId;
      const observer = new MutationObserver((mutationList, observer) => {
        for (let i = 0; i < mutationList.length; i += 1) {
          // we only care if new nodes have been added
          if (mutationList[i].type === 'childList') {
            // restart the countdown timer
            window.clearTimeout(timeoutId);
            timeoutId = window.setTimeout(waitResolve, timeout, observer);
            break;
          }
        }
      });

      timeoutId = setTimeout(waitResolve, timeout, observer);

      // start observing document.body
      observer.observe(document.body, { attributes: true, childList: true, subtree: true });
    });
  }
}
