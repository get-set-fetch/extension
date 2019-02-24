import URL from 'url-parse';
import ActiveTabHelper from '../../helpers/ActiveTabHelper';
import { IPlugin, IResource, ISite } from 'get-set-fetch';

export default class ExtensionFetchPlugin implements IPlugin {

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
      else {
        return this.fetch(resource);
      }
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
        const response = await fetch(resource.url, { method: 'GET' , credentials: 'include' });
        if (response.blob) {
          const blob = await response.blob();
          resolve({ blob, mediaType: blob.type });
        }
      }
      catch(err) {
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
        reject('error initializing download');
        return;
      }

      // download succesfully started, wait for its completion
      const downloadState: string = await this.completeDownload(downloadId);

      // download did not complete succesfully
      if (downloadState !== 'complete') {
        reject('invalid downloadstate: ' + downloadState);
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
        const mediaType = await ActiveTabHelper.executeScript(site.tabId, { code: 'document.contentType' });
        resolve({ mediaType });
      }
    });
  }

  probableHtmlMimeType(url) {
    const extensionMatch = /^.*\.(.+)$/.exec(url);
    // no extension found, most probably html
    if (!extensionMatch) {
      return true;
    }

    // extension found, test it against most probable extensions of html compatible mime types
    const ext = extensionMatch[1];
    return /htm|php/.test(ext);
  }
}
