const GetSetFetch = require('get-set-fetch');
const ExternalStorageTests = require('get-set-fetch/test/external/external-storage-tests');

const IdbStorage = gsfRequire('src/gsf/storage/IdbStorage');

const conn = { info: 'IndexedDB' };

/* functions needed by some tests, can't achieve the logic just using the Resource API */
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
    resource.crawlInProgress = 0;
    const reqUpdateResource = rwTx.put(resource.serialize());
    reqUpdateResource.onsuccess = () => resolve();
    reqUpdateResource.onerror = () => reject(new Error(`could not update resource: ${this.url}`));
  });
}

function checkInitialCrawledAt(crawledAt) {
  assert.strictEqual(crawledAt.getTime(), 0);
}

const ResourceFncs = {
  updateCrawledAt,
  resetCrawlInProgress,
  checkInitialCrawledAt,
};

console.log(IdbStorage.init);

describe('Test Suite IndexedDB Storage', () => {
  Object.values(ExternalStorageTests).forEach((suite) => {
    suite(GetSetFetch, IdbStorage, conn, ResourceFncs);
  });
});

