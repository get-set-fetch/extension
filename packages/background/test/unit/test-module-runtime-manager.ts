import { assert } from 'chai';
import * as sinon from 'sinon';
import { IEnhancedJSONSchema, IPluginSchemas } from 'get-set-fetch-extension-commons';
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
        opts: null,
      },
      {
        name: 'ExtractUrlsPlugin',
        opts: {
          hostnameRe: null,
          pathnameRe: null,
          resourcePathnameRe: null,
          maxDepth: -1,
          runInTab: true,
        },
      },
      {
        name: 'ScrollPlugin',
        opts: {
          runInTab: true,
          lazyLoading: true,
          enabled: false,
          delay: 2000,
          timeout: 2000,
          maxScrollNo: -1,
        },
      },
      {
        name: 'UpdateResourcePlugin',
        opts: null,
      },
      {
        name: 'InsertResourcesPlugin',
        opts: {
          maxResources: 100,
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

    const expectedSchemas: IPluginSchemas[] = [
      {
        meta: {
          type: 'object',
          properties: {
            name: {
              type: 'string',
              const: 'SelectResourcePlugin',
              description: 'responsible for selecting a resource to scrape from the current site / project.',
            },
          },
        },
        opts: {
          type: 'object',
          properties: {
            frequency: {
              type: 'number',
              default: '-1',
              description: 'How often a resource should be re-crawled (hours), enter -1 to never re-crawl.',
            },
            delay: {
              type: 'number',
              default: '1000',
              description: 'Delay in miliseconds between fetching two consecutive resources.',
            },
          },
        },
      },
      // te iubesc.
    ];

    const actualSchemas = await ModuleRuntimeManager.getPluginSchemas('scenarioName');

    assert.sameDeepOrderedMembers(actualSchemas, expectedSchemas);
    (ModuleRuntimeManager.instantiateScenario as any).restore();
  });
});
