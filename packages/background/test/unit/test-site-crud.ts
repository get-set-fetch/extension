import { assert } from 'chai';
import ModuleHelper from '../utils/ModuleHelper';
import IdbStorage from '../../src/ts/storage/IdbStorage';
import GsfProvider from '../../src/ts/storage/GsfProvider';
import IdbSite from '../../src/ts/storage/IdbSite';
import IdbResource from '../../src/ts/storage/IdbResource';
import IdbPlugin from '../../src/ts/storage/IdbPlugin';

const conn = { info: 'IndexedDB' };

describe(`Test Storage Site - CRUD, using connection ${conn.info}`, () => {
  let Site: typeof IdbSite;
  let Resource: typeof IdbResource;
  let Plugin: typeof IdbPlugin;

  const expectedSite: Partial<IdbSite> = {
    id: null,
    projectId: 1,
    name: 'siteA',
    url: 'http://siteA',
    crawlOpts: {
      maxResources: 10,
      delay: 100
    },
    storageOpts: {
      resourceFilter: {
        maxEntries: 5000,
        probability: 0.01
      }
    }
  };

  before(async () => {
     // 1. storage init, populate GsfProvider used by some plugin related classes
    ({ Site, Plugin, Resource } = await IdbStorage.init());
    GsfProvider.Plugin = Plugin;
    global.GsfProvider = { Plugin };

       // discover, register builtin plugins
    await ModuleHelper.init();
  });

  beforeEach(async () => {
    // cleanup
    await Site.delAll();

    // save site
    const site = new Site({ projectId: expectedSite.projectId, name: expectedSite.name, url: expectedSite.url });
    await site.save();
    assert.isNotNull(site.id);
    expectedSite.id = site.id;
  });

  after(async () => {
    await IdbStorage.close();
  });

  it('getAll', async () => {
    // add a 2nd and 3rd sites for a 2nd projectId = 2
    const siteB = new Site({ projectId: 2, name: 'siteB', url: 'http://siteB' });
    await siteB.save();

    const siteC = new Site({ projectId: 2, name: 'siteC', url: 'http://siteC' });
    await siteC.save();

    // retrieve all sites for project 1
    const proj1Sites = await Site.getAll(1);
    assert.strictEqual(proj1Sites.length, 1);
    assert.strictEqual(proj1Sites[0].url, expectedSite.url);

    // retrieve all sites for project 2
    const proj2Sites = await Site.getAll(2);
    assert.strictEqual(proj2Sites.length, 2);
    const expectedSiteNames = ['siteB', 'siteC'];
    const actualSiteNames = proj2Sites.map(site => site.name);
    assert.sameMembers(actualSiteNames, expectedSiteNames);
  });

  it('get', async () => {
    // get site by id
    const siteById = await Site.get(expectedSite.id);
    assert.instanceOf(siteById, Site);
    assert.strictEqual(expectedSite.projectId, siteById.projectId);
    assert.strictEqual(expectedSite.name, siteById.name);
    assert.strictEqual(expectedSite.url, siteById.url);
    assert.deepEqual(expectedSite.storageOpts, expectedSite.storageOpts);
    assert.deepEqual(expectedSite.crawlOpts, expectedSite.crawlOpts);

    // get site by name
    const siteByName = await Site.get(expectedSite.name);
    assert.instanceOf(siteByName, Site);
    assert.strictEqual(expectedSite.projectId, siteByName.projectId);
    assert.strictEqual(expectedSite.id, siteByName.id);
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
    // link a 2nd resource to site
    const resource =  new Resource({ siteId: expectedSite.id, url: expectedSite.url });
    await resource.save();

    // delete site
    const delSite = await Site.get(expectedSite.id);
    await delSite.del();

    // get and compare
    const getSite = await Site.get(expectedSite.id);
    assert.isNull(getSite);

    // make sure linked resources are also deleted
    const linkedResources = await Resource.getAll(expectedSite.id);
    assert.sameDeepMembers(linkedResources, []);
  });
});
