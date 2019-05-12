import { assert } from 'chai';
import ModuleHelper from '../utils/ModuleHelper';
import PluginManager from '../../src/ts/plugins/PluginManager';
import GsfProvider from '../../src/ts/storage/GsfProvider';
import IdbStorage from '../../src/ts/storage/IdbStorage';

describe('Test PluginManager', () => {
  before(async () => {
    // 1. storage init, populate GsfProvider used by some plugin related classes
    const { Plugin } = await IdbStorage.init();
    GsfProvider.Plugin = Plugin;
    global.GsfProvider = { Plugin };

    // discover, register builtin plugins
    await ModuleHelper.init();
  });

  it('instantiate default plugins', async () => {
    const expectedPluginInfo = [
      {
        name: 'SelectResourcePlugin',
        opts: {
          crawlFrequency: -1,
        },
      },
      {
        name: 'FetchPlugin',
        opts: undefined,
      },
      {
        name: 'ExtractUrlsPlugin',
        opts: {
          allowNoExtension: true,
          extensionRe: null,
          maxDepth: -1,
          runInTab: true,
        },
      },
      {
        name: 'UpdateResourcePlugin',
        opts: undefined,
      },
      {
        name: 'InsertResourcePlugin',
        opts: undefined,
      },
    ];
    const actualPlugins = await PluginManager.instantiate(PluginManager.getDefaultPluginDefs());
    const actualPluginInfo = actualPlugins.map(plugin => ({ name: plugin.constructor.name, opts: plugin.opts }));

    assert.sameDeepOrderedMembers(actualPluginInfo, expectedPluginInfo);
  });
});
