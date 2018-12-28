import IdbStorage from '../../src/js/storage/IdbStorage';

const { assert } = require('chai');

const conn = { info: 'IndexedDB' };

describe(`Test Storage UserPlugin - CRUD, using connection ${conn.info}`, () => {
  let UserPlugin = null;
  const expectedPlugin = {
    id: null,
    name: 'pluginA',
    code: 'codeA',
  };

  before(async () => {
    ({ UserPlugin } = await IdbStorage.init());
  });


  beforeEach(async () => {
    // cleanup
    await UserPlugin.delAll();

    // save plugin
    const plugin = new UserPlugin(expectedPlugin.name, expectedPlugin.code);
    await plugin.save();
    assert.isNotNull(plugin.id);
    expectedPlugin.id = plugin.id;
  });

  after(async () => {
    await IdbStorage.close();
  });

  it('get', async () => {
    // get plugin by id
    const pluginById = await UserPlugin.get(expectedPlugin.id);
    assert.instanceOf(pluginById, UserPlugin);
    assert.strictEqual(expectedPlugin.name, pluginById.name);
    assert.strictEqual(expectedPlugin.code, pluginById.code);

    // get plugin by url
    const pluginByName = await UserPlugin.get(expectedPlugin.name);
    assert.instanceOf(pluginByName, UserPlugin);
    assert.strictEqual(expectedPlugin.name, pluginByName.name);
    assert.strictEqual(expectedPlugin.code, pluginByName.code);
  });

  it('update', async () => {
    // update plugin
    const updatePlugin = await UserPlugin.get(expectedPlugin.id);
    updatePlugin.name = 'pluginA_updated';
    updatePlugin.code = 'codeA_updated';
    await updatePlugin.update();

    // get and compare
    const getPlugin = await UserPlugin.get(expectedPlugin.id);
    assert.strictEqual(updatePlugin.name, getPlugin.name);
    assert.strictEqual(updatePlugin.code, getPlugin.code);
  });

  it('delete single', async () => {
    // delete site
    const delPlugin = await UserPlugin.get(expectedPlugin.id);
    await delPlugin.del();

    // get and compare
    const getPlugin = await UserPlugin.get(expectedPlugin.id);
    assert.isNull(getPlugin);
  });

  it('delete some', async () => {
    // create pluginB and pluginC
    const pluginB = new UserPlugin('pluginB', 'codeB');
    await pluginB.save();

    const pluginC = new UserPlugin('pluginC', 'codeC');
    await pluginC.save();

    // remove pluginA, pluginB
    await UserPlugin.delSome([expectedPlugin.id, pluginB.id]);

    // retrieve and compare remaining plugin
    const remainingPlugins = await UserPlugin.getAll();
    assert.strictEqual(remainingPlugins.length, 1);

    const remainingPlugin = remainingPlugins[0];
    assert.strictEqual(remainingPlugin.name, pluginC.name);
    assert.strictEqual(remainingPlugin.code, pluginC.code);
  });
});
