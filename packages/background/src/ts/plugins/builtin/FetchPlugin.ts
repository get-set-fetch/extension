import Url from 'url-parse';
import { BasePlugin, IResource, ISite, IEnhancedJSONSchema } from 'get-set-fetch-extension-commons';
import ActiveTabHelper from '../../helpers/ActiveTabHelper';

export default class FetchPlugin extends BasePlugin {
  getOptsSchema(): IEnhancedJSONSchema {
    return {
      type: 'object',
      title: 'Fetch Plugin',
      description: 'depending on resource type (binary, html), either downloads or opens in the scraping tab the resource url.',
      properties: {
        stabilityTimeout: {
          type: 'integer',
          default: '0',
          title: 'Stability Timeout',
          description: 'Considers the page loaded and ready to be scraped when there are no more DOM changes within the specified amount of time (milliseconds). Only applies to html resources. Useful for bypassing preloader content.',
        },
        maxStabilityWaitingTime: {
          type: 'integer',
          default: '0',
          title: 'Max Stability Waiting Time',
          description: 'Maximum waiting time (miliseconds) for achieving DOM stability in case of a continuously updated DOM (ex: timers, countdowns).',
        },
      },
      required: [ 'stabilityTimeout', 'maxStabilityWaitingTime' ],
    };
  }

  opts: {
    stabilityTimeout: number;
    maxStabilityWaitingTime: number;
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

  completeDownload(itemId: number): Promise<string> {
    return new Promise(resolve => {
      browser.downloads.onChanged.addListener(function onChanged(downloadDelta) {
        if (downloadDelta.id === itemId && downloadDelta.state && downloadDelta.state.current === 'complete') {
          browser.downloads.onChanged.removeListener(onChanged);
          resolve(downloadDelta.state.current);
        }
      });
    });
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
      const downloadId: number = await browser.downloads.download({ url: resource.url });

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
      const downloadItems = await browser.downloads.search({ id: downloadId });
      const downloadItem = downloadItems[0];

      const mediaType = downloadItem.mime;
      resolve({ mediaType });
    });
  }

  async openInTab(site: ISite, resource: IResource) {
    let completeHandler;
    let completeDetails;

    const reqPromise: Promise<{statusCode: number}> = new Promise((resolve, reject) => {
      completeHandler = details => {
        if (details.tabId === site.tabId) {
          completeDetails = details;
          resolve();
        }
      };

      /*
      register request listeners responsible for resolving or rejecting this plugin's apply fnc
      don't add EventUrlFilters (hostEquals, pathEquals) since in case of redirects they will no longer apply
      and the listener will be filtered out, no longer invoked
      */
      browser.webNavigation.onCompleted.addListener(
        completeHandler,
      );
    });

    await Promise.all([
      ActiveTabHelper.update(site.tabId, { url: resource.url }),
      reqPromise,
    ]);

    // remove the listners
    browser.webNavigation.onCompleted.removeListener(completeHandler);

    const mediaType = await ActiveTabHelper.executeScript<string>(site.tabId, { code: 'document.contentType' });

    if (/html/.test(mediaType) && this.opts.stabilityTimeout > 0) {
      await this.waitForDomStabilityExecution(site.tabId, this.opts.stabilityTimeout, this.opts.maxStabilityWaitingTime);
    }

    /*
    in case of redirects also return the updated resource url

    This property is only present if the extension's manifest includes the `"tabs"` permission.

    ActiveTabHelper.update returns the newly updated tab
    but we can't get its url since the manifest doesn't have the tabs permissions
    rely on completeHandler details instead
    */
    return completeDetails.url === resource.url
      ? { mediaType }
      : { mediaType, url: completeDetails.url };
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

  waitForDomStabilityExecution(tabId, timeout: number, maxWaitingTime: number) {
    // use a block declaration in order not to polute the global namespace
    const code = `
    {
      (async function() {
        try {
          function ${this.waitForDomStability.toString()};
          await waitForDomStability(${timeout}, ${maxWaitingTime});
        
          // send the result back via messaging as the promise content will just be serialized to {}
          (globalThis.browser || globalThis.chrome).runtime.sendMessage({resolved: true});
        }
        catch(err) {
          (globalThis.browser || globalThis.chrome).runtime.sendMessage({resolved: false, err: JSON.stringify(err, Object.getOwnPropertyNames(err))});
        }
      })();
    }
    `;

    return ActiveTabHelper.executeAsyncScript(tabId, code);
  }

  waitForDomStability(timeout: number, maxWaitingTime: number) {
    return new Promise(resolve => {
      const startTime = Date.now();

      const waitResolve = observer => {
        observer.disconnect();
        resolve();
      };

      let timeoutId;
      const observer = new MutationObserver((mutationList, observer) => {
        for (let i = 0; i < mutationList.length; i += 1) {
          // we only care if new nodes have been added
          if (mutationList[i].type === 'childList') {
            /*
            we've waited for stability to be reached long enough,
            don't reset the timer again and allow waitForDomStability to resolve
            */
            if (maxWaitingTime > 0 && Date.now() - startTime > maxWaitingTime) {
              return;
            }

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
