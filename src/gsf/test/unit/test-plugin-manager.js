import PluginManager from '../../src/js/plugins/PluginManager';

const { assert } = require('chai');

xdescribe('Test PluginManager', () => {
  before(() => {
    // PluginManager.registerDefaultClassDefinitions();
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
      assert.strictEqual(actualPlugins[i].constructor.name, expectedPluginsNames[i].name);
    }
  });
});
