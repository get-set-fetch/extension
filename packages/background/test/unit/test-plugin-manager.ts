import { assert } from 'chai';
import ModuleHelper from '../utils/ModuleHelper';
import PluginManager from '../../src/ts/plugins/PluginManager';
import GsfProvider from '../../src/ts/storage/GsfProvider';
import IdbStorage from '../../src/ts/storage/IdbStorage';

xdescribe('Test PluginManager', () => {
  before(async () => {
    // 1. storage init, populate GsfProvider used by some plugin related classes
    const { Plugin } = await IdbStorage.init();
    GsfProvider.Plugin = Plugin;
    global.GsfProvider = { Plugin };

    // discover, register builtin plugins
    await ModuleHelper.init();
  });

  it('instantiate default plugins', async () => {
    const expectedPluginsNames = [
      { name: 'SelectResourcePlugin', opts: {} },
      { name: 'ExtensionFetchPlugin', opts: {} },
      { name: 'ExtractUrlPlugin', opts: {} },
      { name: 'UpdateResourcePlugin', opts: {} },
      { name: 'InsertResourcePlugin', opts: {} }
    ];
    const actualPlugins = await PluginManager.instantiate(PluginManager.getDefaultPluginDefs());

    assert.strictEqual(actualPlugins.length, expectedPluginsNames.length);
    for (let i = 0; i < actualPlugins.length; i += 1) {
      const foundIdx = expectedPluginsNames.findIndex(plugin => plugin.name === actualPlugins[i].constructor.name);
      assert.isAtLeast(foundIdx, 0, `plugin ${actualPlugins[i].constructor.name} not found`);
    }
  });
});
