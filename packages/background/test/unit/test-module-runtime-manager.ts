import { assert } from 'chai';
import * as sinon from 'sinon';
import { IEnhancedJSONSchema } from 'get-set-fetch-extension-commons';
import ModuleHelper from '../utils/ModuleHelper';
import GsfProvider from '../../src/ts/storage/GsfProvider';
import IdbStorage from '../../src/ts/storage/IdbStorage';
import ModuleRuntimeManager from '../../src/ts/plugins/ModuleRuntimeManager';
import ModuleStorageManager from '../../src/ts/plugins/ModuleStorageManager';

describe('Test ModuleRuntimeManager', () => {
  before(async () => {
    // 1. storage init, populate GsfProvider used by some plugin related classes
    const { Plugin } = await IdbStorage.init();
    GsfProvider.Plugin = Plugin;

    // discover, register builtin plugins
    await ModuleHelper.init();
  });

  it('instantiate default plugins', async () => {
    const expectedPluginInfo = [
      {
        name: 'SelectResourcePlugin',
        opts: {
          frequency: -1,
          delay: 1000,
        },
      },
      {
        name: 'FetchPlugin',
        opts: {
          stabilityTimeout: 0,
        },
      },
      {
        name: 'DynamicNavigationPlugin',
        opts: {
          domRead: true,
          domWrite: true,
          selectors: '.more # content',
          revisit: false,
          stabilityTimeout: 500,
          maxResources: 100,
        },
      },
      {
        name: 'ScrollPlugin',
        opts: {
          domRead: true,
          domWrite: true,
          enabled: false,
          delay: 1000,
          changeTimeout: 2000,
          maxOperations: -1,
        },
      },
      {
        name: 'ExtractUrlsPlugin',
        opts: {
          selectors: 'a[href$=".html"] # follow html links',
          maxDepth: -1,
          maxResources: 100,
          domRead: true,
        },
      },
      {
        name: 'ExtractHtmlContentPlugin',
        opts: {
          domRead: true,
          selectors: 'h1\nh2',
        },
      },

      {
        name: 'UpsertResourcePlugin',
        opts: {},
      },
      {
        name: 'InsertResourcesPlugin',
        opts: {
          maxEntries: 5000,
          probability: 0.01,
        },
      },
    ];
    const actualPlugins = await ModuleRuntimeManager.instantiatePlugins(ModuleStorageManager.getDefaultPluginDefs());
    const actualPluginInfo = actualPlugins.map(plugin => ({ name: plugin.constructor.name, opts: plugin.opts }));

    assert.sameDeepOrderedMembers(actualPluginInfo, expectedPluginInfo);
  });

  it('get scenario plugins schemas', async () => {
    sinon.stub(ModuleRuntimeManager, 'instantiateScenario').callsFake(async name => ({
      getPluginNames: () => [ 'SelectResourcePlugin' ],
    }));

    const expectedSchemas: IEnhancedJSONSchema[] = [
      {
        $id: 'SelectResourcePlugin',
        type: 'object',
        title: 'Select Resource Plugin',
        description: 'selects a resource to scrape from the current project.',
        properties: {
          frequency: {
            type: 'integer',
            const: '-1',
            description: 'How often a resource should be re-crawled (hours), enter -1 to never re-crawl.',
          },
          delay: {
            type: 'integer',
            default: '1000',
            description: 'Delay in milliseconds between fetching two consecutive resources.',
          },
        },
        required: [ 'frequency', 'delay' ],
      },
      // te iubesc.
    ];

    const actualSchemas = await ModuleRuntimeManager.getPluginSchemas('scenarioName');

    assert.sameDeepOrderedMembers(actualSchemas, expectedSchemas);
    (ModuleRuntimeManager.instantiateScenario as any).restore();
  });
});
