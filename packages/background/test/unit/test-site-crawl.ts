import * as sinon from 'sinon';
import IdbStorage from '../../src/ts/storage/IdbStorage';
import PluginManager from '../../src/ts/plugins/PluginManager';
import ModuleHelper from '../utils/ModuleHelper';
import GsfProvider from '../../src/ts/storage/GsfProvider';

const conn = { info: 'IndexedDB' };

describe(`Test Site Crawl, using connection ${conn.info}`, () => {
  let Site = null;
  let Resource = null;
  let Plugin = null;

  before(async () => {
    // 1. storage init, populate GsfProvider used by some plugin related classes
    ({ Site, Resource, Plugin } = await IdbStorage.init());

    GsfProvider.Plugin = Plugin;
    global.GsfProvider = { Plugin };

    // discover, register builtin plugins
    await ModuleHelper.init();
  });

  beforeEach(async () => {
    // cleanup
    await Site.delAll();

    // save site
    const pluginDefinitions = PluginManager.getDefaultPluginDefs().filter(
      pluginDef => ['SelectResourcePlugin', 'UpdateResourcePlugin'].indexOf(pluginDef.name) !== -1
    );

    const site = new Site({ name: 'siteA', url: 'http://siteA/page-0.html', pluginDefinitions });
    await site.save();
  });

  after(async () => {
    await IdbStorage.close();
  });

  it('default sequential crawl, 5 resources', async () => {
    const site = await Site.get('siteA');

    // save 4 additional resources, an initial resource is created when the site is created
    for (let i = 1; i <= 4; i += 1) {
      const resource = new Resource({ siteId: site.id, url: `url-${i}` });
      await resource.save();
    }
    const crawlResourceSpy = sinon.spy(site, 'crawlResource');
    await site.crawl();

    /*
      re-opening 1 connection(s)
      resource http://siteA crawled, connActive: 0
      re-opening 1 connection(s)
      resource url-1 crawled, connActive: 0
      re-opening 1 connection(s)
      resource url-2 crawled, connActive: 0
      re-opening 1 connection(s)
      resource url-3 crawled, connActive: 0
      re-opening 1 connection(s)
      resource url-4 crawled, connActive: 0
      re-opening 1 connection(s)
      no resource to crawl found, connActive: 0
      */
    sinon.assert.callCount(crawlResourceSpy, 6);
  });

  it('parallel crawl, 5 resources available from the begining, maxConnections: 2', async () => {
    const site = await Site.get('siteA');

    // save 4 additional resources, an initial resource is created when the site is created
    for (let i = 1; i <= 4; i += 1) {
      const resource = new Resource({ siteId: site.id, url: `url-${i}` });
      await resource.save();
    }
    const crawlResourceSpy = sinon.spy(site, 'crawlResource');
    await site.crawl({ maxConnections: 2 });

    /*
      re-opening 2 connection(s)
      resource http://siteA crawled, connActive: 1
      resource url-1 crawled, connActive: 0
      re-opening 2 connection(s)
      resource url-2 crawled, connActive: 1
      resource url-3 crawled, connActive: 0
      re-opening 2 connection(s)
      no resource to crawl found, connActive: 1
      resource url-4 crawled, connActive: 0
      re-opening 2 connection(s)
      no resource to crawl found, connActive: 1
      no resource to crawl found, connActive: 0
      */
    sinon.assert.callCount(crawlResourceSpy, 8);
  });

  it('parallel crawl, 5 resources available from the begining, maxConnections: 3', async () => {
    const site = await Site.get('siteA');

    // save 4 additional resources, an initial resource is created when the site is created
    for (let i = 1; i <= 4; i += 1) {
      const resource = new Resource({ siteId: site.id, url: `url-${i}` });
      await resource.save();
    }
    const crawlResourceSpy = sinon.spy(site, 'crawlResource');
    await site.crawl({ maxConnections: 3 });

    /*
      re-opening 3 connection(s)
      resource http://siteA crawled, connActive: 2, connPending: 1
      resource url-1 crawled, connActive: 1
      resource url-2 crawled, connActive: 0
      re-opening 3 connection(s)
      no resource to crawl found, connActive: 2
      resource url-3 crawled, connActive: 1
      resource url-4 crawled, connActive: 0
      re-opening 3 connection(s)
      no resource to crawl found, connActive: 2
      no resource to crawl found, connActive: 1
      no resource to crawl found, connActive: 0
      */
    sinon.assert.callCount(crawlResourceSpy, 9);
  });

  /*
    a single initial resource is available
    after the initial resource is crawled, the rest of the resources are available for crawling
    */
  it('parallel crawl, 5 resources available gradually, maxConnections: 2', async () => {
    const site = await Site.get('siteA');

    // save 4 additional resources, an initial resource is created when the site is created
    for (let i = 1; i < 4; i += 1) {
      const resource = new Resource({ siteId: site.id, url: `url-${i}` });
      await resource.save();
    }

    const crawlResourceStub = sinon.stub(site, 'crawlResource');

    // override crawlResource on 2nd call to return null - no resource found
    crawlResourceStub.onCall(1).resolves(null);
    crawlResourceStub.callThrough();

    await site.crawl({ maxConnections: 2 });

    /*
      re-opening 2 connection(s)
      no resource to crawl found, connActive: 1
      resource http://siteA crawled, connActive: 0
      re-opening 2 connection(s)
      resource url-1 crawled, connActive: 1
      resource url-2 crawled, connActive: 0
      re-opening 2 connection(s)
      no resource to crawl found, connActive: 1
      resource url-3 crawled, connActive: 0
      re-opening 2 connection(s)
      no resource to crawl found, connActive: 1
      no resource to crawl found, connActive: 0
      */
    sinon.assert.callCount(crawlResourceStub, 8);
  });

  /*
    a single initial resource is available
    after the initial resource is crawled, the rest of the resources are available for crawling
    */
  it('parallel crawl, 5 resources available gradually, maxConnections: 3', async () => {
    const site = await Site.get('siteA');

    // save 4 additional resources, an initial resource is created when the site is created
    for (let i = 1; i < 4; i += 1) {
      const resource = new Resource({ siteId: site.id, url: `url-${i}` });
      await resource.save();
    }

    const crawlResourceStub = sinon.stub(site, 'crawlResource');

    // override crawlResource on 2nd and 3rd calls to return null - no resource found
    crawlResourceStub.onCall(1).resolves(null);
    crawlResourceStub.onCall(2).resolves(null);
    crawlResourceStub.callThrough();

    await site.crawl({ maxConnections: 3 });

    /*
      re-opening 3 connection(s)
      no resource to crawl found, connActive: 2
      no resource to crawl found, connActive: 1
      resource http://siteA crawled, connActive: 0
      re-opening 3 connection(s)
      resource url-1 crawled, connActive: 2
      resource url-2 crawled, connActive: 1
      resource url-3 crawled, connActive: 0
      re-opening 3 connection(s)
      no resource to crawl found, connActive: 2
      no resource to crawl found, connActive: 1
      no resource to crawl found, connActive: 0
      */
    sinon.assert.callCount(crawlResourceStub, 9);
  });

  it('crawl until maxDepth is reached', async () => {
    // cleanup
    await Site.delAll();

    sinon.stub(PluginManager, 'runInTab').callsFake((tabId, plugin, site, resource) => {
      plugin.extractResourceUrls = () => [`http://siteA/page-${resource.depth + 1}.html`];
      return plugin.apply(site, resource);
    });

    const defaultPluginDefs = PluginManager.getDefaultPluginDefs();
    const selectPlugDef = defaultPluginDefs.find(pluginDef => pluginDef.name === 'SelectResourcePlugin');
    const extractUrlPlugDef = defaultPluginDefs.find(pluginDef => pluginDef.name === 'ExtractUrlPlugin');
    extractUrlPlugDef.opts.maxDepth = 3;
    const updatePlugDef = defaultPluginDefs.find(pluginDef => pluginDef.name === 'UpdateResourcePlugin');
    const insertPlugDef = defaultPluginDefs.find(pluginDef => pluginDef.name === 'InsertResourcePlugin');

    const pluginDefinitions = [selectPlugDef, extractUrlPlugDef, updatePlugDef, insertPlugDef];

    const site = new Site({ name: 'siteA', url: 'http://siteA/page-0.html', pluginDefinitions });
    await site.save();

    const crawlResourceSpy = sinon.spy(site, 'crawlResource');
    await site.crawl();

    // crawl resources of depth 0-3 + failed attempt returning a null resources indicating the crawling is complete
    sinon.assert.callCount(crawlResourceSpy, 4 + 1);
  });

  // ignored until maxResources flag is implemented at plugin level instead of site level
  xit('crawl until maxResources is reached', async () => {
    const site = await Site.get('siteA');

    const crawlResourceSpy = sinon.spy(site, 'crawlResource');
    await site.crawl({ maxResources: 7 });

    sinon.assert.callCount(crawlResourceSpy, 7);
  });
});
