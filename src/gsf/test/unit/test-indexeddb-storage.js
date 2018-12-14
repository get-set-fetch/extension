import GetSetFetch from 'get-set-fetch';
import NodeFetchPlugin from 'get-set-fetch/lib/plugins/fetch/NodeFetchPlugin';
import JsDomPlugin from 'get-set-fetch/lib/plugins/process/JsDomPlugin';
import ExtractUrlPlugin from 'get-set-fetch/lib/plugins/process/ExtractUrlPlugin';
import ExternalStorageTests from 'get-set-fetch/test/external/external-storage-tests';

import PluginManager from '../../src/js/plugins/PluginManager';
import IdbStorage from '../../src/js/storage/IdbStorage';
import ExtensionFetchPlugin from '../../src/js/plugins/builtin/ExtensionFetchPlugin';
import ExtensionExtractUrlPlugin from '../../src/js/plugins/builtin/ExtractUrlPlugin';

const sinon = require('sinon');

const conn = { info: 'IndexedDB' };

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

xdescribe('Test Suite IndexedDB Storage', () => {
  Object.values(ExternalStorageTests).forEach((suite) => {
    suite(GetSetFetch, PluginManager, IdbStorage, conn, ResourceFncs);
  });
});

