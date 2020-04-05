/* eslint-disable no-param-reassign */

import * as sinon from 'sinon';
import { assert } from 'chai';
import { BasePlugin } from 'get-set-fetch-extension-commons';
import IdbStorage from '../../src/ts/storage/IdbStorage';
import ModuleHelper from '../utils/ModuleHelper';
import GsfProvider from '../../src/ts/storage/GsfProvider';
import IdbSite from '../../src/ts/storage/IdbSite';
import IdbResource from '../../src/ts/storage/IdbResource';
import IdbPlugin from '../../src/ts/storage/IdbPlugin';
import ModuleStorageManager from '../../src/ts/plugins/ModuleStorageManager';
import ModuleRuntimeManager from '../../src/ts/plugins/ModuleRuntimeManager';
import ExtractHtmlContentPlugin from '../../src/ts/plugins/builtin/ExtractHtmlContentPlugin';

const conn = { info: 'IndexedDB' };

describe(`Test Site Static Crawl, using connection ${conn.info}`, () => {
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
  });

  beforeEach(async () => {
    // cleanup
    await Site.delAll();

    // save site

    const plugins = [ 'SelectResourcePlugin', 'ExtractUrlsPlugin', 'InsertResourcesPlugin', 'UpsertResourcePlugin' ].map(
      name => ModuleStorageManager.getAvailablePluginDefs().find(pluginDef => pluginDef.name === name),
    );
    site = new Site({ name: 'siteA', url: 'http://siteA/page-0.html', plugins });
    await site.save();

    // stub ExtractUrlsPlugin, the only one running in tab via "runInTab"
    sinon.stub(ModuleRuntimeManager, 'runInTab').callsFake((tabId, plugin, site, resource) => {
      plugin.extractResourceUrls = () => [ `http://siteA/page-${resource.depth + 1}.html` ];
      if (resource) {
        resource.mediaType = 'html';
      }
      const isApplicable = plugin.test(site, resource);
      return isApplicable ? plugin.apply(site, resource) : null;
    });
  });

  afterEach(async () => {
    (ModuleRuntimeManager.runInTab as any).restore();
  });

  after(async () => {
    await IdbStorage.close();
  });

  it('crawl all available resources', async () => {
    const maxResources = 5;

    site.plugins = [ 'SelectResourcePlugin', 'UpsertResourcePlugin' ].map(
      name => ModuleStorageManager.getAvailablePluginDefs().find(pluginDef => pluginDef.name === name),
    );

    // save 4 additional resources, an initial resource is created when the site is created
    for (let i = 1; i < maxResources; i += 1) {
      const resource = new Resource({ siteId: site.id, url: `url-${i}`, depth: 1 });
      // eslint-disable-next-line no-await-in-loop
      await resource.save();
    }

    const crawlResourceSpy = sinon.spy(site, 'crawlResource');
    await site.crawl();
    sinon.assert.callCount(crawlResourceSpy, maxResources + 1);
  });

  it('crawl until maxDepth is reached', async () => {
    const maxDepth = 3;
    const extractUrlPlugDef = site.plugins.find(plugin => plugin.name === 'ExtractUrlsPlugin');
    extractUrlPlugDef.opts.maxDepth = maxDepth;

    const crawlResourceSpy = sinon.spy(site, 'crawlResource');
    await site.crawl();

    // crawl resources of depth 0-3 (4) + failed attempt returning a null resources indicating the crawling is complete
    sinon.assert.callCount(crawlResourceSpy, (maxDepth + 1) + 1);
  });

  it('crawl until maxResources is reached', async () => {
    // define maxResources threshold
    const maxResources = 7;

    // make sure maxDepth is not reached before reaching maxResources threshold
    const extractUrlsPlugDef = site.plugins.find(plugin => plugin.name === 'ExtractUrlsPlugin');
    extractUrlsPlugDef.opts.maxDepth = 100;
    extractUrlsPlugDef.opts.maxResources = maxResources;

    const crawlResourceSpy = sinon.spy(site, 'crawlResource');
    await site.crawl();

    // one crawlResource invocation for each resource, +1 for the last invocation returning no resources to crawl
    sinon.assert.callCount(crawlResourceSpy, maxResources + 1);
  });

  it('check crawl delay', async () => {
    // define crawl delay
    const delay = 500;

    // keep the plugins to a minimum
    site.plugins = [ 'SelectResourcePlugin', 'UpsertResourcePlugin' ].map(
      name => ModuleStorageManager.getAvailablePluginDefs().find(pluginDef => pluginDef.name === name),
    );

    // adjust crawl delay
    const selectResourceDef = site.plugins.find(plugin => plugin.name === 'SelectResourcePlugin');
    selectResourceDef.opts.delay = delay;

    const crawlResourceSpy = sinon.spy(site, 'crawlResource');

    const hrstart = process.hrtime();
    await site.crawl();
    const hrend = process.hrtime(hrstart);

    const elapsedTime = 1000 * hrend[0] + hrend[1] / 1000 / 1000;

    // a single resource has been crawled succefully, 2nd one returned null causing crawl to stop
    sinon.assert.callCount(crawlResourceSpy, 2);
    assert.approximately(elapsedTime, delay * 2, delay * 0.20);
  });

  it('crawl with lazy loading', async () => {
    site.plugins = [ 'SelectResourcePlugin', 'ScrollPlugin', 'ExtractUrlsPlugin', 'UpsertResourcePlugin' ].map(
      name => ModuleStorageManager.getAvailablePluginDefs().find(pluginDef => pluginDef.name === name),
    );

    // enable lazy loading, by default it's false
    const scrollPluginDef = site.plugins.find(plugin => plugin.name === 'ScrollPlugin');
    scrollPluginDef.opts.enabled = true;

    let updatePluginSpy;
    const origInstantiate = ModuleRuntimeManager.instantiatePlugins;
    (ModuleRuntimeManager.runInTab as any).restore();
    sinon.stub(ModuleRuntimeManager, 'instantiatePlugins').callsFake(async plugins => {
      const pluginInstances: BasePlugin[] = await origInstantiate(plugins);

      // spy on UpsertResourcePlugin
      const updatePluginInst = pluginInstances.find(pluginInst => pluginInst.constructor.name === 'UpsertResourcePlugin');
      updatePluginSpy = sinon.spy(updatePluginInst, 'apply');

      // insert entry for ExtractHtmlContentPlugin, not available on default plugin list
      pluginInstances.splice(3, 0, new ExtractHtmlContentPlugin());
      return pluginInstances;
    });

    const crawlResourceSpy = sinon.spy(site, 'crawlResource');

    // stub ExtractUrlsPlugin, the only one running in tab via "runInTab"
    const runInTabStub = sinon.stub(ModuleRuntimeManager, 'runInTab');

    /*
    1st call runInTab from lazy loading ScrollPlugin,
    plugin does not create a new resource, the static resource from SelectResourcePlugin has crawlInProgress = true
    */
    runInTabStub.onCall(0).callsFake((tabId, plugin, site, resource) => null);

    // 2nd call runInTab from ExtractUrlsPlugin
    runInTabStub.onCall(1).callsFake((tabId, plugin, site, resource) => {
      plugin.extractResourceUrls = () => [ 'link-1.html', 'link-2.html' ];
      resource.mediaType = 'html';
      const isApplicable = plugin.test(site, resource);
      return isApplicable ? plugin.apply(site, resource) : null;
    });

    // 3rd call runInTab from ExtractTitlePlugin
    runInTabStub.onCall(2).callsFake((tabId, plugin, site, resource) => {
      plugin.extractContent = () => ({
        h1: [ 'h1a', 'h1b' ],
        h2: [ 'h2a', 'h2b' ],
      });
      const isApplicable = plugin.test(site, resource);
      return isApplicable ? plugin.apply(site, resource) : null;
    });

    /*
    4th call runInTab from lazy loading ScrollPlugin
    plugin creates a new resource, the static resource from SelectResourcePlugin has crawlInProgress = false
    */
    runInTabStub.onCall(3).callsFake((tabId, plugin, site, resource) => ({ url: 'page-0.html', actions: [ 'scroll#1' ] }));

    // 5th call runInTab from ExtractUrlsPlugin
    runInTabStub.onCall(4).callsFake((tabId, plugin, site, resource) => {
      plugin.extractResourceUrls = () => [ 'link-2.html', 'link-3.html' ];
      const isApplicable = plugin.test(site, resource);
      return isApplicable ? plugin.apply(site, resource) : null;
    });

    // 6th call runInTab from ExtractTitlePlugin
    runInTabStub.onCall(5).callsFake((tabId, plugin, site, resource) => {
      plugin.extractContent = () => ({
        h1: [ 'h1b', 'h1c' ],
        h2: [ 'h2a' ],
        h3: [ 'h3a' ],
      });
      const isApplicable = plugin.test(site, resource);
      return isApplicable ? plugin.apply(site, resource) : null;
    });

    // 7th call runInTab from lazy loading ScrollPlugin, dom remains unchanged, a new resource is not created
    runInTabStub.onCall(6).callsFake((tabId, plugin, site, resource) => null);

    // 8th call runInTab from ExtractUrlsPlugin, no crawlInProgress resource, plugin.apply is not invoked
    runInTabStub.onCall(7).callsFake((tabId, plugin, site, resource) => null);

    // 9th call runInTab from ExtractTitlePlugin,no crawlInProgress resource, plugin.apply is not invoked
    runInTabStub.onCall(8).callsFake((tabId, plugin, site, resource) => null);

    await site.crawl();

    /*
    crawlResource sequence:
      1 - crawlResource() -> returns a new static resource
      2 - crawlResource(resource) -> returns a new dynamic resource
      3 - crawlResource(resource) -> attempts to crawl a dynamic resource but doesn't find one
      4 - crawlResource() -> attempts to crawl a static resource but doesn't find one
    */
    sinon.assert.callCount(crawlResourceSpy, 4);

    // 2 resources crawled (1 static, 1 dynamic), 2 update operations by the UpsertResourcePlugin
    sinon.assert.callCount(updatePluginSpy, 2);

    const filterResourceProps = ({ url, depth, content, crawlInProgress, urlsToAdd, mediaType, actions }) => ({
      url, depth, content, crawlInProgress, urlsToAdd, mediaType, actions,
    });

    // verify static resource
    const expectedStaticResource = {
      url: 'http://siteA/page-0.html',
      depth: 0,
      content: {
        h1: [ 'h1a', 'h1b' ],
        h2: [ 'h2a', 'h2b' ],
      },
      crawlInProgress: false,
      urlsToAdd: [ 'link-1.html', 'link-2.html' ],
      mediaType: 'html',
      actions: [],
    };
    const staticResource = filterResourceProps(updatePluginSpy.getCall(0).args[1]);
    assert.deepEqual(staticResource, expectedStaticResource);

    // verify dynamic resource
    const expectedDynamicResource = {
      url: 'http://siteA/page-0.html',
      depth: 0,
      content: {
        h1: [ 'h1c' ],
        h2: [],
        h3: [ 'h3a' ],
      },
      crawlInProgress: false,
      urlsToAdd: [ 'link-3.html' ],
      mediaType: 'html',
      actions: [ 'scroll#1' ],
    };

    const dynamicResource = filterResourceProps(updatePluginSpy.getCall(1).args[1]);
    assert.deepEqual(dynamicResource, expectedDynamicResource);
  });
});
