declare const GsfClient;
export default class CrawlHelper {
  static async waitForCrawlComplete(page, siteId, resolve = null) {
    // if no promise defined return one
    if (!resolve) {
      return new Promise(resolve => {
        setTimeout(CrawlHelper.waitForCrawlComplete, 5000, page, siteId, resolve);
      });
    }

    const allResources = await page.evaluate(siteId => GsfClient.fetch('GET', `resources/${siteId}`), siteId);
    const crawledResources = await page.evaluate(siteId => GsfClient.fetch('GET', `resources/${siteId}/crawled`), siteId);

    const notCrawledNo = allResources.length - crawledResources.length;

    // crawl complete, there are no more resources to be crawled
    if (notCrawledNo === 0) {
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
