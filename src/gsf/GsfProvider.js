import IdbStorage from './storage/IdbStorage';

export default class GsfProvider {
  static async init() {
    // init extension storage
    const { Site } = await IdbStorage.init();

    /*
    // create some sites
    const siteA = new Site('siteA', 'www.siteA.com');
    await siteA.save();
    const siteB = new Site('siteB', 'www.siteB.com');
    await siteB.save();
    */

    // wait for client requests
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
      switch (request.resource) {
        case 'site':
          GsfProvider.siteHandler(Site, request, sender, sendResponse);
          break;
        default:
      }

      return true;
    });
  }

  static async siteHandler(Site, request, sender, sendResponse) {
    let sitePromise = null;
    switch (request.method) {
      case 'GET':
        sitePromise = request.body && request.body.nameOrId ? await Site.get(request.body.nameOrId) : Site.getAll();
        break;
      default:
    }

    sitePromise.then((result) => {
      sendResponse(result);
    });
  }
}
