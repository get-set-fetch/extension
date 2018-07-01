import NodeFetchPlugin from 'get-set-fetch/lib/plugins/fetch/NodeFetchPlugin';

const sinon = require('sinon');

const GetSetFetch = require('get-set-fetch');
const JsDomPlugin = require('get-set-fetch/lib/plugins/process/JsDomPlugin');
const ExtractUrlPlugin = require('get-set-fetch/lib/plugins/process/ExtractUrlPlugin');
const ExternalStorageTests = require('get-set-fetch/test/external/external-storage-tests');

const IdbStorage = gsfRequire('./src/gsf/storage/IdbStorage');
const ExtensionPluginManager = gsfRequire('./src/gsf/plugins/ExtensionPluginManager');
const ExtensionFetchPlugin = gsfRequire('./src/gsf/plugins/fetch/ExtensionFetchPlugin');
const ExtensionExtractUrlPlugin = gsfRequire('./src/gsf/plugins/process/ExtensionExtractUrlPlugin');

const conn = { info: 'IndexedDB' };

ExtensionPluginManager.registerDefaults();

const nodeFetchPlugin = new NodeFetchPlugin();
const extractUrlPlugin = new ExtractUrlPlugin();
const jsdomPlugin = new JsDomPlugin();

sinon.stub(ExtensionFetchPlugin.prototype, 'apply').callsFake((site, resource) => nodeFetchPlugin.apply(site, resource));
sinon.stub(ExtensionExtractUrlPlugin.prototype, 'extractResourceUrls').callsFake((site, resource) => {
  // init jsdom in order to parse html
  const jsdomProps = jsdomPlugin.apply(site, resource);
  const updatedResource = Object.assign(resource, jsdomProps);

  // extract links
  const { urlsToAdd } = extractUrlPlugin.apply(site, updatedResource);
  return urlsToAdd;
});


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

describe('Test Suite IndexedDB Storage', () => {
  Object.values(ExternalStorageTests).forEach((suite) => {
    suite(GetSetFetch, ExtensionPluginManager, IdbStorage, conn, ResourceFncs);
  });
});

