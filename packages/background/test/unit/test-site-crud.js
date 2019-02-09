import SystemJS from 'systemjs';
import ExternalStorageTests from 'get-set-fetch/test/external/external-storage-tests';
import IdbStorage from '../../src/js/storage/IdbStorage.ts';
import ModuleHelper from '../utils/ModuleHelper.ts';
import PluginManager from '../../src/js/plugins/PluginManager.ts';
import GsfProvider from '../../src/js/storage/GsfProvider.ts';

const { assert } = require('chai');

const conn = { info: 'IndexedDB' };

describe(`Test Storage Site - CRUD, using connection ${conn.info}`, () => {
  let Site = null;
  const expectedSite = {
    id: null,
    name: 'siteA',
    url: 'http://siteA',
    opts: {
      resourceFilter: {
        maxEntries: 5000,
        probability: 0.01,
      },
    },
  };

  before(async () => {
    ({ Site } = await IdbStorage.init(conn));
    // 1. storage init, populate GsfProvider used by some plugin related classes
    const { UserPlugin } = await IdbStorage.init();
    GsfProvider.UserPlugin = UserPlugin;
    global.GsfProvider = { UserPlugin };

    await ModuleHelper.init();
  });

  beforeEach(async () => {
    // cleanup
    await Site.delAll();

    // save site
    const site = new Site({name: expectedSite.name, url: expectedSite.url});
    await site.save();
    assert.isNotNull(site.id);
    expectedSite.id = site.id;
  });

  after(async () => {
    await IdbStorage.close();
  });

  it('get', async () => {
    // get site by id
    const siteById = await Site.get(expectedSite.id);
    assert.instanceOf(siteById, Site);
    assert.strictEqual(expectedSite.name, siteById.name);
    assert.strictEqual(expectedSite.url, siteById.url);
    assert.deepEqual(expectedSite.opts.resourceFilter, Site.defaultSiteOpts.resourceFilter);

    // get site by name
    const siteByName = await Site.get(expectedSite.name);
    assert.instanceOf(siteByName, Site);
    assert.strictEqual(String(expectedSite.id), String(siteByName.id));
    assert.strictEqual(expectedSite.url, siteByName.url);
  });

  it('update', async () => {
    // update site
    const updateSite = await Site.get(expectedSite.id);
    updateSite.name = 'siteA_updated';
    updateSite.url = 'http://siteA/updated';
    await updateSite.update();

    // get and compare
    const getSite = await Site.get(expectedSite.id);
    assert.strictEqual(updateSite.name, getSite.name);
    assert.strictEqual(updateSite.url, getSite.url);
  });

  it('delete', async () => {
    // delete site
    const delSite = await Site.get(expectedSite.id);
    await delSite.del();

    // get and compare
    const getSite = await Site.get(expectedSite.id);
    assert.isNull(getSite);
  });
});
