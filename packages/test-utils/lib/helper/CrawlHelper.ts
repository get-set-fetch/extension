declare const GsfClient;
export default class CrawlHelper {
  static async waitForCrawlComplete(page, siteId, prevResourceNo = null, resolve = null) {
    // if no promise defined return one
    if (!resolve) {
      return new Promise(resolve => {
        setTimeout(CrawlHelper.waitForCrawlComplete, 5000, page, siteId, null, resolve);
      });
    }

    /*
    check if crawl complete
    for static resources (2 db steps: insert not crawled resources, update resource to crawled status)
      - total resources equals crawled resources -> crawl complete
    for dynamic resources (1 db step:  resource is directly saved with crawled status and scrapped content)
      - no new resources have been added -> crawl complete
    */
    const allResources = await page.evaluate(siteId => GsfClient.fetch('GET', `resources/${siteId}`), siteId);
    const crawledResources = await page.evaluate(siteId => GsfClient.fetch('GET', `resources/${siteId}/crawled`), siteId);

    const staticCrawlComplete = allResources.length === crawledResources.length;
    const dynamicCrawlComplete = prevResourceNo === allResources.length;

    if (staticCrawlComplete && dynamicCrawlComplete) {
      resolve();
    }
    else {
      setTimeout(CrawlHelper.waitForCrawlComplete, 5000, page, siteId, allResources.length, resolve);
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
