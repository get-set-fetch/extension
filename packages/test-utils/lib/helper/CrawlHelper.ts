import { ISite } from 'get-set-fetch-extension-commons';

declare const GsfClient;
export default class CrawlHelper {
  static async waitForCrawlComplete(page, siteId, resolve = null) {
    // if no promise defined return one
    if (!resolve) {
      return new Promise(resolve => {
        setTimeout(CrawlHelper.waitForCrawlComplete, 2000, page, siteId, resolve);
      });
    }

    // check if crawl complete
    const site: ISite = await page.evaluate(siteId => GsfClient.fetch('GET', `site/${siteId}`), siteId);
    if (!site.crawlInProgress) {
      resolve();
    }
    else {
      setTimeout(CrawlHelper.waitForCrawlComplete, 5000, page, siteId, resolve);
    }

    return null;
  }

  static async getCrawledResources(page, siteId) {
    // retrieve crawled resources
    let actualResources = await page.evaluate(siteId => GsfClient.fetch('GET', `resources/${siteId}/crawled`), siteId);

    // only keep the properties we're interested in
    actualResources = actualResources.map(({ url, actions, mediaType, meta, content }) => ({ url, mediaType, meta, content, actions }));

    return actualResources;
  }
}
