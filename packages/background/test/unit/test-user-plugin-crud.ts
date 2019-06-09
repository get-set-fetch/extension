import { assert } from 'chai';
import IdbStorage from '../../src/ts/storage/IdbStorage';
import IdbPlugin from '../../src/ts/storage/IdbPlugin';

const conn = { info: 'IndexedDB' };

describe(`Test Storage Plugin - CRUD, using connection ${conn.info}`, () => {
  let Plugin: typeof IdbPlugin;

  const expectedPlugin = {
    id: null,
    name: 'pluginA',
    code: 'codeA',
  };

  before(async () => {
    ({ Plugin } = await IdbStorage.init());
  });

  beforeEach(async () => {
    // cleanup
    await Plugin.delAll();

    // save plugin
    const plugin = new Plugin({ name: expectedPlugin.name, code: expectedPlugin.code });
    await plugin.save();
    assert.isNotNull(plugin.id);
    expectedPlugin.id = plugin.id;
  });

  after(async () => {
    await IdbStorage.close();
  });

  it('get', async () => {
    // get plugin by id
    const pluginById = await Plugin.get(expectedPlugin.id);
    assert.instanceOf(pluginById, Plugin);
    assert.strictEqual(expectedPlugin.name, pluginById.name);
    assert.strictEqual(expectedPlugin.code, pluginById.code);

    // get plugin by url
    const pluginByName = await Plugin.get(expectedPlugin.name);
    assert.instanceOf(pluginByName, Plugin);
    assert.strictEqual(expectedPlugin.name, pluginByName.name);
    assert.strictEqual(expectedPlugin.code, pluginByName.code);
  });

  it('update', async () => {
    // update plugin
    const updatePlugin = await Plugin.get(expectedPlugin.id);
    updatePlugin.name = 'pluginA_updated';
    updatePlugin.code = 'codeA_updated';
    await updatePlugin.update();

    // get and compare
    const getPlugin = await Plugin.get(expectedPlugin.id);
    assert.strictEqual(updatePlugin.name, getPlugin.name);
    assert.strictEqual(updatePlugin.code, getPlugin.code);
  });

  it('delete single', async () => {
    // delete site
    const delPlugin = await Plugin.get(expectedPlugin.id);
    await delPlugin.del();

    // get and compare
    const getPlugin = await Plugin.get(expectedPlugin.id);
    assert.isNull(getPlugin);
  });

  it('delete some', async () => {
    // create pluginB and pluginC
    const pluginB = new Plugin({ name: 'pluginB', code: 'codeB' });
    await pluginB.save();

    const pluginC = new Plugin({ name: 'pluginC', code: 'codeC' });
    await pluginC.save();

    // remove pluginA, pluginB
    await Plugin.delSome([ expectedPlugin.id, pluginB.id ]);

    // retrieve and compare remaining plugin
    const remainingPlugins = await Plugin.getAll();
    assert.strictEqual(remainingPlugins.length, 1);

    const remainingPlugin = remainingPlugins[0];
    assert.strictEqual(remainingPlugin.name, pluginC.name);
    assert.strictEqual(remainingPlugin.code, pluginC.code);
  });
});
