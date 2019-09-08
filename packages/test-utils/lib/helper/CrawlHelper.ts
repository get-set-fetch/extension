declare const GsfClient;
export default class CrawlHelper {
  static async waitForCrawlComplete(page, siteId, resolve = null) {
    // if no promise defined return one
    if (!resolve) {
      return new Promise(resolve => {
        setTimeout(CrawlHelper.waitForCrawlComplete, 5000, page, siteId, resolve);
      });
    }

    const notCrawledResources = await page.evaluate(siteId => GsfClient.fetch('GET', `resources/${siteId}/notcrawled`), siteId);

    // crawl complete, there are no more resources to be crawled
    if (notCrawledResources.length === 0) {
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
    actualResources = actualResources.map(({ url, mediaType, info }) => ({ url, mediaType, info }));

    return actualResources;
  }
}
