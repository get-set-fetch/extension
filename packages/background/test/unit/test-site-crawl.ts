import * as sinon from 'sinon';
import { assert } from 'chai';
import IdbStorage from '../../src/ts/storage/IdbStorage';
import PluginManager from '../../src/ts/plugins/PluginManager';
import ModuleHelper from '../utils/ModuleHelper';
import GsfProvider from '../../src/ts/storage/GsfProvider';
import IdbSite from '../../src/ts/storage/IdbSite';
import IdbResource from '../../src/ts/storage/IdbResource';
import IdbPlugin from '../../src/ts/storage/IdbPlugin';

const conn = { info: 'IndexedDB' };

describe(`Test Site Crawl, using connection ${conn.info}`, () => {
  let Site: typeof IdbSite;
  let Resource: typeof IdbResource;
  let Plugin: typeof IdbPlugin;
  let site: IdbSite;

  before(async () => {
    // 1. storage init, populate GsfProvider used by some plugin related classes
    ({ Site, Resource, Plugin } = await IdbStorage.init());

    GsfProvider.Plugin = Plugin;
    global.GsfProvider = { Plugin };

    // discover, register builtin plugins
    await ModuleHelper.init();

    // stub ExtractUrlsPlugin, the only one running in tab via "runInTab"
    sinon.stub(PluginManager, 'runInTab').callsFake((tabId, plugin, site, resource) => {
      plugin.extractResourceUrls = () => [ `http://siteA/page-${resource.depth + 1}.html` ];
      resource.mediaType = 'html';
      const isApplicable = plugin.test(resource);
      return isApplicable ? plugin.apply(site, resource) : null;
    });
  });

  beforeEach(async () => {
    // cleanup
    await Site.delAll();

    // save site
    const testPlugins = [ 'SelectResourcePlugin', 'ExtractUrlsPlugin', 'UpdateResourcePlugin', 'InsertResourcePlugin' ];
    const pluginDefinitions = PluginManager.getDefaultPluginDefs().filter(pluginDef => testPlugins.indexOf(pluginDef.name) !== -1);
    site = new Site({ name: 'siteA', url: 'http://siteA/page-0.html', pluginDefinitions });
    await site.save();
  });

  after(async () => {
    await IdbStorage.close();
  });

  it('crawl all available resources', async () => {
    const maxResources = 5;
    site.pluginDefinitions = PluginManager.getDefaultPluginDefs().filter(
      pluginDef => [ 'SelectResourcePlugin', 'UpdateResourcePlugin' ].indexOf(pluginDef.name) !== -1,
    );

    // save 4 additional resources, an initial resource is created when the site is created
    for (let i = 1; i < maxResources - 1; i += 1) {
      const resource = new Resource({ siteId: site.id, url: `url-${i}`, depth: 1 });
      // eslint-disable-next-line no-await-in-loop
      await resource.save();
    }
    const crawlResourceSpy = sinon.spy(site, 'crawlResource');
    await site.crawl();

    sinon.assert.callCount(crawlResourceSpy, maxResources);
  });

  it('crawl until maxDepth is reached', async () => {
    const maxDepth = 3;
    const extractUrlPlugDef = site.pluginDefinitions.find(pluginDef => pluginDef.name === 'ExtractUrlsPlugin');
    extractUrlPlugDef.opts.maxDepth = maxDepth;

    const crawlResourceSpy = sinon.spy(site, 'crawlResource');
    await site.crawl();

    // crawl resources of depth 0-3 + failed attempt returning a null resources indicating the crawling is complete
    sinon.assert.callCount(crawlResourceSpy, maxDepth + 2);
  });

  it('crawl until maxResources is reached', async () => {
    // define maxResources threshold
    const maxResources = 7;

    // make sure maxDepth is not reached before reaching maxResources threshold
    const extractUrlsPlugDef = site.pluginDefinitions.find(pluginDef => pluginDef.name === 'ExtractUrlsPlugin');
    extractUrlsPlugDef.opts.maxDepth = 100;

    const insertResourcePlugDef = site.pluginDefinitions.find(pluginDef => pluginDef.name === 'InsertResourcePlugin');
    insertResourcePlugDef.opts.maxResources = maxResources;

    const crawlResourceSpy = sinon.spy(site, 'crawlResource');
    await site.crawl();

    // one crawlResource invocation for each resource, +1 for the last invocation returning no resources to crawl
    sinon.assert.callCount(crawlResourceSpy, maxResources + 1);
  });

  it('check crawl delay', async () => {
    // define crawl delay
    const delay = 500;

    // keep the plugins to a minimum
    site.pluginDefinitions = PluginManager.getDefaultPluginDefs().filter(
      pluginDef => [ 'SelectResourcePlugin', 'UpdateResourcePlugin' ].indexOf(pluginDef.name) !== -1,
    );

    // adjust crawl delay
    const selectResourceDef = site.pluginDefinitions.find(pluginDef => pluginDef.name === 'SelectResourcePlugin');
    selectResourceDef.opts.crawlDelay = delay;


    const crawlResourceSpy = sinon.spy(site, 'crawlResource');

    const hrstart = process.hrtime();
    await site.crawl();
    const hrend = process.hrtime(hrstart);

    const elapsedTime = 1000 * hrend[0] + hrend[1] / 1000 / 1000;

    // a single resource has been crawled succefully, 2nd one returned null causing crawl to stop
    sinon.assert.callCount(crawlResourceSpy, 2);
    assert.approximately(elapsedTime, delay * 2, delay * 0.20);
  });
});
