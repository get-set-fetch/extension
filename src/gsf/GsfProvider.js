import IdbStorage from './storage/IdbStorage';
import ActiveTabHelper from './ActiveTabHelper';

/* eslint-disable no-case-declarations */
export default class GsfProvider {
  static async init() {
    // init extension storage
    const { Site, Resource } = await IdbStorage.init();
    GsfProvider.Site = Site;
    GsfProvider.Resource = Resource;

    /*
    // create some sites
    const siteA = new Site('siteA', 'www.siteA.com');
    await siteA.save();
    const siteB = new Site('siteB', 'www.siteB.com');
    await siteB.save();
    */

    // wait for client requests
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
      switch (true) {
        case /^site/.test(request.resource):
          GsfProvider.siteHandler(request, sendResponse);
          break;
        case /^resource/.test(request.resource):
          GsfProvider.resourceHandler(request, sendResponse);
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
            reqPromise = GsfProvider.Site.getAll();
            break;
          // site/:siteId
          case /^site\/[0-9]+$/.test(request.resource):
            const getSiteId = parseInt(/\d+/.exec(request.resource)[0], 10);
            reqPromise = GsfProvider.Site.get(getSiteId);
            break;
          // site/{site.id}/crawl
          case /^site\/[0-9]+\/crawl$/.test(request.resource):
            const crawlSiteId = parseInt(/\d+/.exec(request.resource)[0], 10);
            const crawlSite = await GsfProvider.Site.get(crawlSiteId);

            // open a new tab for the current site to be crawled into
            await ActiveTabHelper.create();
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
            const site = new GsfProvider.Site(request.body.name, request.body.url);
            reqPromise = site.save();
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
          // resources
          case /^resources$/.test(request.resource):
            reqPromise = GsfProvider.Site.getAll();
            break;
          // resource/:urlOrId
          case /^resource\/.+$/.test(request.resource):
            const urlOrId = /^resource\/(.+)$/.exec(request.resource)[1];
            // console.log(urlOrId);
            reqPromise = GsfProvider.Resource.get(urlOrId);
            // reqPromise = new Promise(resolve => resolve(urlOrId[1]));
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
