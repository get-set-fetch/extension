/* eslint-disable no-param-reassign */

import * as sinon from 'sinon';
import { SinonSandbox } from 'sinon';
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

const conn = { info: 'IndexedDB' };

describe(`Test Site Dynamic Crawl, using connection ${conn.info}`, () => {
  let Site: typeof IdbSite;
  let Resource: typeof IdbResource;
  let Plugin: typeof IdbPlugin;
  let site: IdbSite;
  let sandbox: SinonSandbox;

  before(async () => {
    // 1. storage init, populate GsfProvider used by some plugin related classes
    ({ Site, Resource, Plugin } = await IdbStorage.init());

    GsfProvider.Plugin = Plugin;
    global.GsfProvider = { Plugin };

    // discover, register builtin plugins
    await ModuleHelper.init();

    // prepare stubbing
    sandbox = sinon.createSandbox();
  });

  beforeEach(async () => {
    // cleanup
    await Site.delAll();

    // save site
    const plugins = [ 'SelectResourcePlugin', 'DynamicNavigationPlugin', 'ExtractHtmlContentPlugin', 'UpsertResourcePlugin' ].map(
      name => ModuleStorageManager.getAvailablePluginDefs().find(pluginDef => pluginDef.name === name),
    );
    site = new Site({ name: 'siteA', url: 'http://siteA/page-0.html', plugins });
    await site.save();

    // stub "domRead", run plugins directly don't inject them into dom
    sandbox.stub(ModuleRuntimeManager, 'runPluginInDom').callsFake((tabId, plugin, site, resource) => {
      if (resource) {
        resource.mediaType = 'html';
      }

      const isApplicable = plugin.test(site, resource);
      return isApplicable ? plugin.apply(site, resource) : null;
    });
  });

  afterEach(async () => {
    sandbox.restore();
  });

  after(async () => {
    await IdbStorage.close();
  });

  it('load more results, single selector, maxResources = -1', async () => {
    const dynamicNavPlugDef = site.plugins.find(plugin => plugin.name === 'DynamicNavigationPlugin');
    dynamicNavPlugDef.opts.selectors = '.more # content';
    dynamicNavPlugDef.opts.revisit = true;
    dynamicNavPlugDef.opts.maxResources = -1;
    dynamicNavPlugDef.opts.stabilityTimeout = 0;


    let upsertSpy;
    let snapshotStub;
    let extractContentStub;
    const origInstantiate = ModuleRuntimeManager.instantiatePlugins;

    sandbox.stub(ModuleRuntimeManager, 'instantiatePlugins').callsFake(async pluginsDefs => {
      const pluginInstances: BasePlugin[] = await origInstantiate(pluginsDefs);

      // stub ExtractHtmlContentPlugin
      const extractContentPluginInst = pluginInstances.find(pluginInst => pluginInst.constructor.name === 'ExtractHtmlContentPlugin');
      extractContentStub = sandbox.stub(extractContentPluginInst, 'extractContent');

      // stub DynamicNavigationPlugin
      const dynamicNavPluginInst = pluginInstances.find(pluginInst => pluginInst.constructor.name === 'DynamicNavigationPlugin');
      sandbox.stub(dynamicNavPluginInst, 'clickAndWaitForDomStability');
      snapshotStub = sandbox.stub(dynamicNavPluginInst, 'getSnapshot');

      // spy on UpsertResourcePlugin
      const updatePluginInst = pluginInstances.find(pluginInst => pluginInst.constructor.name === 'UpsertResourcePlugin');
      upsertSpy = sandbox.spy(updatePluginInst, 'apply');

      // stub querySelectorAll, everytime returns a single "a.more" element
      const querySelectorAllStub = sandbox.stub(global.window.document, 'querySelectorAll');
      querySelectorAllStub.withArgs('.more').returns([ { innerText: 'more' } as HTMLElement ]);

      // 1st resource, initial static html, DynamicNavigationPlugin not triggered on this pass
      extractContentStub.onCall(0).returns({ '.content': [ 'contentA1', 'contentA2' ] });

      // 2nd resource, actions: ['more#1'],
      snapshotStub.onCall(0).returns(0); // static content snapshot
      snapshotStub.onCall(1).returns(1); // dynamic content snapshot after clicking ".more" 1st time
      extractContentStub.onCall(1).returns({ '.content': [ 'contentA1', 'contentA2', 'contentB1' ] });

      // 3rd resource, actions: ['more#2'],
      snapshotStub.onCall(2).returns(2); // dynamic content snapshot after clicking ".more" 2nd time
      extractContentStub.onCall(2).returns({ '.content': [ 'contentA1', 'contentA2', 'contentB1', 'contentC1', 'contentC2' ] });

      // 4th resource, duplicate, no new resource
      snapshotStub.onCall(3).returns(2); // dynamic content snapshot after clicking ".more" 3rd time
      extractContentStub.onCall(3).returns({ '.content': [ 'contentA1', 'contentA2', 'contentB1', 'contentC1', 'contentC2' ] });

      return pluginInstances;
    });

    const crawlResourceSpy = sandbox.spy(site, 'crawlResource');


    await site.crawl();

    /*
    crawlResource sequence:
      1 - crawlResource() -> returns a new static resource
      2 - crawlResource(resource) -> returns a new dynamic resource, actions ['more#1']
      3 - crawlResource(resource) -> returns a new dynamic resource, actions ['more#2']
      4 - crawlResource(resource) -> attempts to crawl a dynamic resource but doesn't find one
      5 - crawlResource() -> attempts to crawl a static resource but doesn't find one
    */
    sinon.assert.callCount(crawlResourceSpy, 5);

    // 3 resources crawled (1 static, 2 dynamic), 3 update operations by the UpsertResourcePlugin
    sinon.assert.callCount(upsertSpy, 3);

    const filterResourceProps = ({ url, depth, content, crawlInProgress, urlsToAdd, mediaType, actions }) => ({
      url, depth, content, crawlInProgress, urlsToAdd, mediaType, actions,
    });

    // verify static resource
    const expectedStaticResource = {
      url: 'http://siteA/page-0.html',
      depth: 0,
      content: {
        '.content': [
          'contentA1',
          'contentA2',
        ],
      },
      crawlInProgress: false,
      urlsToAdd: [],
      mediaType: 'html',
      actions: [],
    };
    const staticResource = filterResourceProps(upsertSpy.getCall(0).args[1]);
    assert.deepEqual(staticResource, expectedStaticResource);

    // verify dynamic resource 1
    const expectedDynamicResource1 = {
      url: 'http://siteA/page-0.html',
      depth: 0,
      content: {
        '.content': [
          'contentB1',
        ],
      },
      crawlInProgress: false,
      urlsToAdd: [ ],
      mediaType: 'html',
      actions: [ 'more#1' ],
    };

    const dynamicResource1 = filterResourceProps(upsertSpy.getCall(1).args[1]);
    assert.deepEqual(dynamicResource1, expectedDynamicResource1);

    // verify dynamic resource 2
    const expectedDynamicResource2 = {
      url: 'http://siteA/page-0.html',
      depth: 0,
      content: {
        '.content': [
          'contentC1',
          'contentC2',
        ],
      },
      crawlInProgress: false,
      urlsToAdd: [ ],
      mediaType: 'html',
      actions: [ 'more#2' ],
    };

    const dynamicResource2 = filterResourceProps(upsertSpy.getCall(2).args[1]);
    assert.deepEqual(dynamicResource2, expectedDynamicResource2);
  });

  it('load more results, single selector, maxResources = 2', async () => {
    const dynamicNavPlugDef = site.plugins.find(plugin => plugin.name === 'DynamicNavigationPlugin');
    dynamicNavPlugDef.opts.selectors = '.more # content';
    dynamicNavPlugDef.opts.revisit = true;
    dynamicNavPlugDef.opts.maxResources = 2;
    dynamicNavPlugDef.opts.stabilityTimeout = 0;

    let upsertSpy;
    let snapshotStub;
    let extractContentStub;
    const origInstantiate = ModuleRuntimeManager.instantiatePlugins;

    sandbox.stub(ModuleRuntimeManager, 'instantiatePlugins').callsFake(async pluginsDefs => {
      const pluginInstances: BasePlugin[] = await origInstantiate(pluginsDefs);

      // stub ExtractHtmlContentPlugin
      const extractContentPluginInst = pluginInstances.find(pluginInst => pluginInst.constructor.name === 'ExtractHtmlContentPlugin');
      extractContentStub = sandbox.stub(extractContentPluginInst, 'extractContent');

      // stub DynamicNavigationPlugin
      const dynamicNavPluginInst = pluginInstances.find(pluginInst => pluginInst.constructor.name === 'DynamicNavigationPlugin');
      sandbox.stub(dynamicNavPluginInst, 'clickAndWaitForDomStability');
      snapshotStub = sandbox.stub(dynamicNavPluginInst, 'getSnapshot');

      // spy on UpsertResourcePlugin
      const updatePluginInst = pluginInstances.find(pluginInst => pluginInst.constructor.name === 'UpsertResourcePlugin');
      upsertSpy = sandbox.spy(updatePluginInst, 'apply');

      // stub querySelectorAll, everytime returns a single "a.more" element
      const querySelectorAllStub = sandbox.stub(global.window.document, 'querySelectorAll');
      querySelectorAllStub.withArgs('.more').returns([ { innerText: 'more' } as HTMLElement ]);

      // 1st resource, initial static html, DynamicNavigationPlugin not triggered on this pass
      extractContentStub.onCall(0).returns({ '.content': [ 'contentA1', 'contentA2' ] });

      // 2nd resource, actions: ['more#1'],
      snapshotStub.onCall(0).returns(0); // static content snapshot
      snapshotStub.onCall(1).returns(1); // dynamic content snapshot after clicking ".more" 1st time
      extractContentStub.onCall(1).returns({ '.content': [ 'contentA1', 'contentA2', 'contentB1' ] });

      // 3rd resource, actions: ['more#2'],
      snapshotStub.onCall(2).returns(2); // dynamic content snapshot after clicking ".more" 2nd time
      extractContentStub.onCall(2).returns({ '.content': [ 'contentA1', 'contentA2', 'contentB1', 'contentC1', 'contentC2' ] });

      // 4th resource, duplicate, no new resource
      snapshotStub.onCall(3).returns(2); // dynamic content snapshot after clicking ".more" 3rd time
      extractContentStub.onCall(3).returns({ '.content': [ 'contentA1', 'contentA2', 'contentB1', 'contentC1', 'contentC2' ] });

      return pluginInstances;
    });

    const crawlResourceSpy = sandbox.spy(site, 'crawlResource');

    await site.crawl();

    /*
    crawlResource sequence:
      1 - crawlResource() -> returns a new static resource
      2 - crawlResource(resource) -> returns a new dynamic resource, actions ['more#1']
      3 - crawlResource(resource) -> test fails, maxResources (2) met
      4 - crawlResource() -> attempts to crawl a static resource but doesn't find one
    */
    sinon.assert.callCount(crawlResourceSpy, 4);

    // 3 resources crawled (1 static, 1 dynamic), 3 update operations by the UpsertResourcePlugin
    sinon.assert.callCount(upsertSpy, 2);

    const filterResourceProps = ({ url, depth, content, crawlInProgress, urlsToAdd, mediaType, actions }) => ({
      url, depth, content, crawlInProgress, urlsToAdd, mediaType, actions,
    });

    // verify static resource
    const expectedStaticResource = {
      url: 'http://siteA/page-0.html',
      depth: 0,
      content: {
        '.content': [
          'contentA1',
          'contentA2',
        ],
      },
      crawlInProgress: false,
      urlsToAdd: [],
      mediaType: 'html',
      actions: [],
    };
    const staticResource = filterResourceProps(upsertSpy.getCall(0).args[1]);
    assert.deepEqual(staticResource, expectedStaticResource);

    // verify dynamic resource 1
    const expectedDynamicResource1 = {
      url: 'http://siteA/page-0.html',
      depth: 0,
      content: {
        '.content': [
          'contentB1',
        ],
      },
      crawlInProgress: false,
      urlsToAdd: [ ],
      mediaType: 'html',
      actions: [ 'more#1' ],
    };

    const dynamicResource1 = filterResourceProps(upsertSpy.getCall(1).args[1]);
    assert.deepEqual(dynamicResource1, expectedDynamicResource1);
  });

  it('product list linked to product detail, two selector (.detail, .cancel), maxResources = -1', async () => {
    const dynamicNavPlugDef = site.plugins.find(plugin => plugin.name === 'DynamicNavigationPlugin');
    dynamicNavPlugDef.opts.selectors = '.detail # content\n.cancel';
    dynamicNavPlugDef.opts.maxResources = -1;
    dynamicNavPlugDef.opts.stabilityTimeout = 0;

    let upsertSpy;
    let snapshotStub;
    let extractContentStub;
    const origInstantiate = ModuleRuntimeManager.instantiatePlugins;

    sandbox.stub(ModuleRuntimeManager, 'instantiatePlugins').callsFake(async pluginsDefs => {
      const pluginInstances: BasePlugin[] = await origInstantiate(pluginsDefs);

      // stub ExtractHtmlContentPlugin
      const extractContentPluginInst = pluginInstances.find(pluginInst => pluginInst.constructor.name === 'ExtractHtmlContentPlugin');
      extractContentStub = sandbox.stub(extractContentPluginInst, 'extractContent');

      // stub DynamicNavigationPlugin
      const dynamicNavPluginInst = pluginInstances.find(pluginInst => pluginInst.constructor.name === 'DynamicNavigationPlugin');
      sandbox.stub(dynamicNavPluginInst, 'clickAndWaitForDomStability');
      snapshotStub = sandbox.stub(dynamicNavPluginInst, 'getSnapshot');

      // spy on UpsertResourcePlugin
      const updatePluginInst = pluginInstances.find(pluginInst => pluginInst.constructor.name === 'UpsertResourcePlugin');
      upsertSpy = sandbox.spy(updatePluginInst, 'apply');

      // stub querySelectorAll
      const querySelectorAllStub = sandbox.stub(global.window.document, 'querySelectorAll');
      querySelectorAllStub.withArgs('.detail').returns([ { innerText: 'prodA' }, { innerText: 'prodB' } ]);
      querySelectorAllStub.withArgs('.cancel').returns([ { innerText: 'cancel' } ]);

      // 1st resource, initial list, DynamicNavigationPlugin not triggered on this pass, no product detail returned
      extractContentStub.onCall(0).returns(null);

      // 2nd resource, actions: ['prod1#1'],
      snapshotStub.onCall(0).returns(0); // list content snapshot
      snapshotStub.onCall(1).returns(11); // dynamic content snapshot after clicking prod1
      extractContentStub.onCall(1).returns({ '.detail': [ 'productA' ] });

      // 3rd resource, actions: ['prod2#2'],
      snapshotStub.onCall(2).returns(0); // dynamic content snapshot after clicking prod1 > cancel
      snapshotStub.onCall(3).returns(22); // dynamic content snapshot after clicking prod2
      extractContentStub.onCall(2).returns({ '.detail': [ 'productB' ] });

      // 4th resource, duplicate, no new resource
      snapshotStub.onCall(4).returns(0); // dynamic content snapshot after clicking prod2 > cancel

      return pluginInstances;
    });

    const crawlResourceSpy = sandbox.spy(site, 'crawlResource');

    await site.crawl();

    /*
    crawlResource sequence:
      1 - crawlResource() -> returns a new static resource (product list)
      2 - crawlResource(resource) -> returns a new dynamic resource, actions ['prod#1']
      3 - crawlResource(resource) -> returns a new dynamic resource, actions ['prod#2']
      4 - crawlResource(resource) -> attempts to crawl a dynamic resource but doesn't find one
      5 - crawlResource() -> attempts to crawl a static resource but doesn't find one
    */
    sinon.assert.callCount(crawlResourceSpy, 5);

    // 3 resources crawled (1 static, 2 dynamic), 3 update operations by the UpsertResourcePlugin
    sinon.assert.callCount(upsertSpy, 3);

    // exhausing all selector click options, snapshot was invoked 5 times, see snapshotStub behavior above
    sinon.assert.callCount(snapshotStub, 5);

    const filterResourceProps = ({ url, depth, content, crawlInProgress, urlsToAdd, mediaType, actions }) => ({
      url, depth, content, crawlInProgress, urlsToAdd, mediaType, actions,
    });

    // verify static resource
    const expectedStaticResource = {
      url: 'http://siteA/page-0.html',
      depth: 0,
      content: null,
      crawlInProgress: false,
      urlsToAdd: [],
      mediaType: 'html',
      actions: [],
    };
    const staticResource = filterResourceProps(upsertSpy.getCall(0).args[1]);
    assert.deepEqual(staticResource, expectedStaticResource);

    // verify dynamic resource 1
    const expectedDynamicResource1 = {
      url: 'http://siteA/page-0.html',
      depth: 0,
      content: {
        '.detail': [
          'productA',
        ],
      },
      crawlInProgress: false,
      urlsToAdd: [ ],
      mediaType: 'html',
      actions: [ 'prodA' ],
    };

    const dynamicResource1 = filterResourceProps(upsertSpy.getCall(1).args[1]);
    assert.deepEqual(dynamicResource1, expectedDynamicResource1);

    // verify dynamic resource 2
    const expectedDynamicResource2 = {
      url: 'http://siteA/page-0.html',
      depth: 0,
      content: {
        '.detail': [
          'productB',
        ],
      },
      crawlInProgress: false,
      urlsToAdd: [ ],
      mediaType: 'html',
      actions: [ 'prodB' ],
    };

    const dynamicResource2 = filterResourceProps(upsertSpy.getCall(2).args[1]);
    assert.deepEqual(dynamicResource2, expectedDynamicResource2);
  });
});
