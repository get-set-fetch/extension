import ModuleHelper from '../utils/ModuleHelper.ts';
import PluginManager from '../../src/js/plugins/PluginManager.ts';
import GsfProvider from '../../src/js/storage/GsfProvider.ts';
import IdbStorage from '../../src/js/storage/IdbStorage.ts';

const { assert } = require('chai');

describe('Test PluginManager', () => {
  before(async () => {
    // 1. storage init, populate GsfProvider used by some plugin related classes
    const { UserPlugin } = await IdbStorage.init();
    GsfProvider.UserPlugin = UserPlugin;

    // discover, register builtin plugins
    await ModuleHelper.init();
  });

  it('instantiate default plugins', () => {
    const expectedPluginsNames = [
      { name: 'SelectResourcePlugin', opts: {} },
      { name: 'ExtensionFetchPlugin', opts: {} },
      { name: 'ExtractUrlPlugin', opts: {} },
      { name: 'UpdateResourcePlugin', opts: {} },
      { name: 'InsertResourcePlugin', opts: {} },
    ];
    const actualPlugins = PluginManager.instantiate(PluginManager.getDefaultPluginDefs());

    assert.strictEqual(actualPlugins.length, expectedPluginsNames.length);
    for (let i = 0; i < actualPlugins.length; i += 1) {
      const foundIdx = expectedPluginsNames.findIndex(plugin => plugin.name === actualPlugins[i].constructor.name);
      assert.isAtLeast(foundIdx, 0, `plugin ${actualPlugins[i].constructor.name} not found`);
    }
  });
});
