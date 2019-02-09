import { assert } from 'chai';
import IdbStorage from '../../src/js/storage/IdbStorage';
const conn = { info: 'IndexedDB' };

async function updateCrawledAt(IdbResource, resourceId, deltaHours) {
  const resource = await IdbResource.get(resourceId);
  return new Promise((resolve, reject) => {
    const rwTx = IdbResource.rwTx();
    resource.crawledAt = new Date(Date.now() - (deltaHours * 60 * 60 * 1000));
    const reqUpdateResource = rwTx.put(resource.serialize());
    reqUpdateResource.onsuccess = () => resolve();
    reqUpdateResource.onerror = () => reject(new Error(`could not update resource: ${this.url}`));
  });
}

async function resetCrawlInProgress(IdbResource, resourceId) {
  const resource = await IdbResource.get(resourceId);
  return new Promise((resolve, reject) => {
    const rwTx = IdbResource.rwTx();
    resource.crawlInProgress = false;
    const reqUpdateResource = rwTx.put(resource.serialize());
    reqUpdateResource.onsuccess = () => resolve();
    reqUpdateResource.onerror = () => reject(new Error(`could not update resource: ${this.url}`));
  });
}

function checkInitialCrawledAt(crawledAt) {
  assert.strictEqual(crawledAt.getTime(), 0);
}

describe(`Test Storage Resource - Crawl, using connection ${conn.info}`, () => {
  let Site = null;
  let Resource = null;
  let site = null;

  before(async () => {
    ({ Site, Resource } = await IdbStorage.init());
    await Site.delAll();
    site = new Site({ name: 'siteA', url: 'http://siteA' });
    await site.save();
  });

  beforeEach(async () => {
    // cleanup
    await Resource.delAll();
  });

  after(async () => {
    await IdbStorage.close();
  });

  it('getResourceToCrawl without crawlFrequency', async () => {
    const resourceUrl = 'http://siteA/resourceA';

    // save a not crawled resource
    const resource = new Resource({ siteId: site.id, url: resourceUrl });
    await resource.save();

    // getResourceToCrawl returns a resource with a crawledAt value of null
    let notCrawledResource = await Resource.getResourceToCrawl(site.id);
    assert.strictEqual(notCrawledResource.url, resourceUrl);
    checkInitialCrawledAt(notCrawledResource.crawledAt);

    // mark the resource as crawled
    await resource.update();

    // check crawlInProgress flag
    assert.strictEqual(false, resource.crawlInProgress);

    // getResourceToCrawl finds no resource with crawledAt value of null
    notCrawledResource = await Resource.getResourceToCrawl(site.id);
    assert.isNull(notCrawledResource);
  });

  it('getResourceToCrawl with crawlFrequency', async () => {
    const resourceUrl = 'http://siteA/resourceA';

    // save a not crawled resource
    let resource = new Resource({ siteId: site.id, url: resourceUrl });
    await resource.save();

    // getResourceToCrawl returns resource with a crawledAt value of null
    const notCrawledResource = await Resource.getResourceToCrawl(site.id, 1);
    assert.strictEqual(notCrawledResource.url, resourceUrl);
    checkInitialCrawledAt(notCrawledResource.crawledAt);

    // how many hours ago was the last crawl
    const deltaHours = 2;

    // update crawlAt value and re-fetch the resource
    await updateCrawledAt(Resource, resource.id, deltaHours);
    resource = await Resource.get(resource.id);

    // getResourceToCrawl returns an expired resource
    await resetCrawlInProgress(Resource, resource.id);
    let expiredResource = await Resource.getResourceToCrawl(site.id, deltaHours - 1);
    assert.strictEqual(expiredResource.url, resourceUrl);
    assert.deepEqual(expiredResource.crawledAt, resource.crawledAt);

    // getResourceToCrawl returns an expired resource
    await resetCrawlInProgress(Resource, resource.id);
    expiredResource = await Resource.getResourceToCrawl(site.id, deltaHours);
    assert.strictEqual(expiredResource.url, resourceUrl);
    assert.deepEqual(expiredResource.crawledAt, resource.crawledAt);

    // getResourceToCrawl returns null, there are no crawled and expired resources
    await resetCrawlInProgress(Resource, resource.id);
    expiredResource = await Resource.getResourceToCrawl(site.id, deltaHours + 1);
    assert.isNull(expiredResource);
  });
});
