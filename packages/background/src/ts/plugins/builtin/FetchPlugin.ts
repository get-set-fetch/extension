import Url from 'url-parse';
import { BasePlugin, IResource, ISite, IEnhancedJSONSchema } from 'get-set-fetch-extension-commons';
import ActiveTabHelper from '../../helpers/ActiveTabHelper';

export default class FetchPlugin extends BasePlugin {
  getMetaSchema(): IEnhancedJSONSchema {
    return {
      type: 'object',
      properties: {
        name: {
          type: 'string',
          const: 'FetchPlugin',
          description: 'responsible for either downloading or loading in the current tab a new resource url.',
        },
      },
    };
  }

  getOptsSchema(): IEnhancedJSONSchema {
    return {};
  }

  test(resource: IResource) {
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
        const mediaType = await ActiveTabHelper.executeScript(site.tabId, { code: 'document.contentType' });
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
}
