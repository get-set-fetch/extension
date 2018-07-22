import IdbStorage from './storage/IdbStorage';
import ActiveTabHelper from './ActiveTabHelper';

/* eslint-disable no-case-declarations */
export default class GsfProvider {
  static async init() {
    // init extension storage
    const { Site, Resource, UserPlugin } = await IdbStorage.init();
    GsfProvider.Site = Site;
    GsfProvider.Resource = Resource;
    GsfProvider.UserPlugin = UserPlugin;

    this.UserPlugin.populateUserPlugins();

    // wait for client requests
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
      switch (true) {
        case /^site/.test(request.resource):
          this.siteHandler(request, sendResponse);
          break;
        case /^resource/.test(request.resource):
          this.resourceHandler(request, sendResponse);
          break;
        case /^plugin/.test(request.resource):
          this.pluginHandler(request, sendResponse);
          break;
        default:
      }

      // enable wait for callback
      return true;
    });
  }

  static async siteHandler(request, sendResponse) {
    let reqPromise = null;

    switch (request.method) {
      case 'GET':
        switch (true) {
          // sites
          case /^sites$/.test(request.resource):
            reqPromise = this.Site.getAll();
            break;
          // site/:siteId
          case /^site\/[0-9]+$/.test(request.resource):
            const getSiteId = parseInt(/\d+/.exec(request.resource)[0], 10);
            reqPromise = this.Site.get(getSiteId);
            break;
          // site/:siteName , don't allow "/" so that we can differentiate /crawl verb as another switch option
          case /^site\/[^/]+$/.test(request.resource):
            const getSiteName = /^site\/(.+)$/.exec(request.resource)[1];
            reqPromise = this.Site.get(getSiteName);
            break;
          // site/{site.id}/crawl
          case /^site\/[0-9]+\/crawl$/.test(request.resource):
            const crawlSiteId = parseInt(/\d+/.exec(request.resource)[0], 10);
            const crawlSite = await this.Site.get(crawlSiteId);

            // open a new tab for the current site to be crawled into
            const tab = await ActiveTabHelper.create();
            crawlSite.tabId = tab.id;

            // start crawling
            crawlSite.crawl({ maxResources: 10 });
            reqPromise = new Promise(resolve => resolve());
            break;
          default:
            reqPromise = new Promise(resolve => resolve());
        }
        break;
      case 'POST':
        switch (true) {
          // site
          case /^site$/.test(request.resource):
            const site = new this.Site(request.body.name, request.body.url, request.body.opts, request.body.createDefaultPlugins);
            reqPromise = site.save();
            break;
          default:
            reqPromise = new Promise(resolve => resolve());
        }
        break;
      case 'PUT':
        switch (true) {
          // site
          case /^site$/.test(request.resource):
            const site = Object.assign(new this.Site(), request.body);
            reqPromise = site.update();
            break;
          default:
            reqPromise = new Promise(resolve => resolve());
        }
        break;
      case 'DELETE':
        switch (true) {
          // sites
          case /^sites$/.test(request.resource):
            reqPromise = this.Site.delSome(request.body.ids);
            break;
          default:
            reqPromise = new Promise(resolve => resolve());
        }
        break;
      default:
        reqPromise = new Promise(resolve => resolve());
    }

    reqPromise.then((result) => {
      sendResponse(result);
    });
  }

  static async resourceHandler(request, sendResponse) {
    let reqPromise = null;
    switch (request.method) {
      case 'GET':
        switch (true) {
          // resources/:siteId
          case /^resources\/[0-9]+$/.test(request.resource):
            const siteId = parseInt(/\d+/.exec(request.resource)[0], 10);
            reqPromise = this.Resource.getAll(siteId, null, false);
            break;
          // resources/:siteId/notcrawled
          case /^resources\/[0-9]+\/notcrawled$/.test(request.resource):
            const notCrawledSiteId = parseInt(/\d+/.exec(request.resource)[0], 10);
            reqPromise = this.Resource.getAllNotCrawled(notCrawledSiteId);
            break;
          // resources/:siteId/crawled
          case /^resources\/[0-9]+\/crawled$/.test(request.resource):
            const crawledSiteId = parseInt(/\d+/.exec(request.resource)[0], 10);
            reqPromise = this.Resource.getAllCrawled(crawledSiteId);
            break;
          // resource/:urlOrId
          case /^resource\/.+$/.test(request.resource):
            const urlOrId = /^resource\/(.+)$/.exec(request.resource)[1];
            reqPromise = this.Resource.get(urlOrId);
            break;
          default:
            reqPromise = new Promise(resolve => resolve());
        }
        break;
      default:
    }

    reqPromise.then((result) => {
      sendResponse(result);
    });
  }

  static async pluginHandler(request, sendResponse) {
    let reqPromise = null;
    switch (request.method) {
      case 'GET':
        switch (true) {
          // plugins
          case /^plugins$/.test(request.resource):
            reqPromise = this.UserPlugin.getAll();
            break;
          // plugin/:pluginId
          case /^plugin\/[0-9]+$/.test(request.resource):
            const getPluginId = parseInt(/\d+/.exec(request.resource)[0], 10);
            reqPromise = this.UserPlugin.get(getPluginId);
            break;
          // plugin/:pluginName
          case /^plugin\/.+$/.test(request.resource):
            const getPluginName = /^plugin\/(.+)$/.exec(request.resource)[1];
            reqPromise = this.UserPlugin.get(getPluginName);
            break;
          default:
            reqPromise = new Promise(resolve => resolve());
        }
        break;
      case 'POST':
        switch (true) {
          // plugin
          case /^plugin$/.test(request.resource):
            const plugin = new this.UserPlugin(request.body.name, request.body.code);
            reqPromise = plugin.save();
            break;
          default:
            reqPromise = new Promise(resolve => resolve());
        }
        break;
      case 'PUT':
        switch (true) {
          // plugin
          case /^plugin$/.test(request.resource):
            const plugin = Object.assign(new this.UserPlugin(), request.body);
            reqPromise = plugin.update();
            break;
          default:
            reqPromise = new Promise(resolve => resolve());
        }
        break;
      case 'DELETE':
        switch (true) {
          // plugins
          case /^plugins$/.test(request.resource):
            reqPromise = this.UserPlugin.delSome(request.body.ids);
            break;
          default:
            reqPromise = new Promise(resolve => resolve());
        }
        break;
      default:
    }

    reqPromise.then((result) => {
      sendResponse(result);
    });
  }
}
