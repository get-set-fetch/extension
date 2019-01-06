import SystemJS from 'systemjs';
import ExternalStorageTests from 'get-set-fetch/test/external/external-storage-tests';
import IdbStorage from '../../src/js/storage/IdbStorage.ts';
import PluginHelper from '../utils/PluginHelper';
import PluginManager from '../../src/js/plugins/PluginManager.ts';
import GsfProvider from '../../src/js/storage/GsfProvider.ts';

global.System = SystemJS;
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

describe('Test Suite IndexedDB Storage', () => {
  // 'testSiteCrawl' suite is missing as the extension uses a new plugin management system from the core
  const suites = ['testResourceCrud', 'testSiteCrud', 'testResourceCrawl'];

  before(async () => {
    // 1. storage init, populate GsfProvider used by some plugin related classes
    const { UserPlugin } = await IdbStorage.init();
    UserPlugin.modules = {};
    GsfProvider.UserPlugin = UserPlugin;
    global.GsfProvider = { UserPlugin };

    await PluginHelper.init();
  });

  suites.forEach((suite) => {
    ExternalStorageTests[suite]({ plugins: [] }, PluginManager, IdbStorage, conn, ResourceFncs);
  });
});
