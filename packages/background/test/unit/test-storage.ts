import { assert } from 'chai';
import * as sinon from 'sinon';
import IdbStorage from '../../src/ts/storage/IdbStorage';
import IdbProject from '../../src/ts/storage/IdbProject';
import IdbSite from '../../src/ts/storage/IdbSite';
import IdbResource from '../../src/ts/storage/IdbResource';
import IdbPlugin from '../../src/ts/storage/IdbPlugin';
import IdbLog from '../../src/ts/storage/IdbLog';
import Logger from '../../src/ts/logger/Logger';
import ModuleHelper from '../utils/ModuleHelper';
import ModuleStorageManager from '../../src/ts/plugins/ModuleStorageManager';
import GsfProvider from '../../src/ts/storage/GsfProvider';
import IdbScenario from '../../src/ts/storage/IdbScenario';
import IdbSetting from '../../src/ts/storage/IdbSetting';

const conn = { info: 'IndexedDB' };

describe(`Test Export/Import Storage, using connection ${conn.info}`, () => {
  let Project: typeof IdbProject;
  let Site: typeof IdbSite;
  let Resource: typeof IdbResource;
  let Plugin: typeof IdbPlugin;
  let Scenario: typeof IdbScenario;
  let Setting: typeof IdbSetting;

  before(async () => {
    // 1. storage init, populate GsfProvider used by some plugin related classes
    ({ Project, Site, Resource, Plugin, Scenario, Setting } = await IdbStorage.init());

    GsfProvider.Plugin = Plugin;
    global.GsfProvider = { Plugin };

    // discover, register builtin plugins
    await ModuleHelper.init();

    // discover, register builtin plugins
    await ModuleHelper.init();
  });

  after(async () => {
    await IdbStorage.close();
  });

  it('export/import logs store', async () => {
    // clear content
    await IdbLog.delAll();

    // create some entries
    const Log = Logger.getLogger('ClsA');
    await Log.info('info msg');
    await Log.warn('warn msg part1', 'warn msg part2');

    // record expected result
    const expectedInstances = await IdbLog.getAll();
    const exportedContent = await IdbStorage.getStoresContent([ 'Logs' ]);

    // import content
    await IdbLog.delAll();
    const result = await IdbStorage.importStores([ 'Logs' ], exportedContent);
    // result is either null (success) or {error}
    assert.isNull(result);

    // check imported instances
    const importedInstances = await IdbLog.getAll();
    assert.sameDeepMembers(importedInstances, expectedInstances);
  });

  it('export/import plugins store', async () => {
    // record expected result
    const expectedInstances = await Plugin.getAll();
    const exportedContent = await IdbStorage.getStoresContent([ 'Plugins' ]);

    // import content
    await Plugin.delAll();
    const result = await IdbStorage.importStores([ 'Plugins' ], exportedContent);
    // result is either null (success) or {error}
    assert.isNull(result);

    // check imported instances
    const importedInstances = await Plugin.getAll();
    assert.sameDeepMembers(importedInstances, expectedInstances);
  });

  it('export/import scenarios store', async () => {
    // record expected result
    const expectedInstances = await Scenario.getAll();
    const exportedContent = await IdbStorage.getStoresContent([ 'Scenarios' ]);

    // import content
    await Scenario.delAll();
    const result = await IdbStorage.importStores([ 'Scenarios' ], exportedContent);
    // result is either null (success) or {error}
    assert.isNull(result);

    // check imported instances
    const importedInstances = await Scenario.getAll();
    assert.sameDeepMembers(importedInstances, expectedInstances);
  });

  it('export/import project/site/resources store', async () => {
    // clear content
    await Project.delAll();
    await Site.delAll();
    await Resource.delAll();

    // create new site and corresponding entries
    const plugins = [ 'SelectResourcePlugin', 'ExtractUrlsPlugin', 'InsertResourcesPlugin', 'UpsertResourcePlugin' ].map(
      name => ModuleStorageManager.getAvailablePluginDefs().find(pluginDef => pluginDef.name === name),
    );
    const project = new Project({
      name: 'projA',
      description: 'descrA',
      url: 'urlA',
      scenario: 'get-set-fetch-scenario-scrape-static-content',
      plugins,
    });
    const siteId = await project.save();

    // record expected result
    const expectedProjectInstances = await Project.getAll();
    const expectedSiteInstances = await Site.getAll();
    const expectedResourceInstances = await Resource.getAll(siteId);
    const exportedContent = await IdbStorage.getStoresContent([ 'Projects', 'Sites', 'Resources' ]);

    // import content
    await Project.delAll();
    await Site.delAll();
    await Resource.delAll();
    const result = await IdbStorage.importStores([ 'Projects', 'Sites', 'Resources' ], exportedContent);
    // result is either null (success) or {error}
    assert.isNull(result);

    // re-export content
    const importedProjectInstances = await Project.getAll();
    const importedSiteInstances = await Site.getAll();
    const importedResourceInstances = await Resource.getAll(siteId);

    assert.sameDeepMembers(importedProjectInstances, expectedProjectInstances);
    assert.sameDeepMembers(importedSiteInstances, expectedSiteInstances);
    assert.sameDeepMembers(importedResourceInstances, expectedResourceInstances);
  });

  it('export/import settings store', async () => {
    // record expected result
    const expectedInstances = await Setting.getAll();
    const exportedContent = await IdbStorage.getStoresContent([ 'Settings' ]);

    // import content
    const result = await IdbStorage.importStores([ 'Settings' ], exportedContent);
    // result is either null (success) or {error}
    assert.isNull(result);

    // check imported instances
    const importedInstances = await Setting.getAll();
    assert.sameDeepMembers(importedInstances, expectedInstances);
  });
});
