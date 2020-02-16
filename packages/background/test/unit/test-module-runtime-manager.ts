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
        opts: {},
      },
      {
        name: 'ExtractUrlsPlugin',
        opts: {
          hostnameRe: undefined,
          pathnameRe: undefined,
          resourcePathnameRe: undefined,
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
          delay: 1000,
          timeout: 2000,
          maxScrollNo: -1,
        },
      },
      {
        name: 'UpdateResourcePlugin',
        opts: {},
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

    const expectedSchemas: IEnhancedJSONSchema[] = [
      {
        $id: 'SelectResourcePlugin',
        type: 'object',
        title: 'Select Resource Plugin',
        description: 'responsible for selecting a resource to scrape from the current site / project.',
        properties: {
          frequency: {
            type: 'number',
            const: '-1',
            description: 'How often a resource should be re-crawled (hours), enter -1 to never re-crawl.',
          },
          delay: {
            type: 'number',
            default: '1000',
            description: 'Delay in miliseconds between fetching two consecutive resources.',
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
