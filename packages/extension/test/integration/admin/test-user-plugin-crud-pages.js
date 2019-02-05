import queryString from 'query-string';
import BrowserHelper from '../../utils/BrowserHelper';

const { assert } = require('chai');

/* eslint-disable no-shadow, max-len */
describe('UserPlugin CRUD Pages', () => {
  let browser = null;
  let pluginPage = null;
  let pluginFrame = null;

  const gotoOpts = {
    timeout: 10 * 1000,
    waitUntil: 'load',
  };

  const actualPlugin = {
    name: 'pluginA',
    code: 'codeA',
  };

  before(async () => {
    browser = await BrowserHelper.launch();

    // open plugin list page
    pluginPage = await browser.newPage();
    pluginFrame = pluginPage.mainFrame();
    const queryParams = queryString.stringify({ redirectPath: '/plugins' });
    await pluginPage.goto(`chrome-extension://${extension.id}/admin/admin.html?${queryParams}`, gotoOpts);
  });

  afterEach(async () => {
    // delete existing plugins
    const existingPlugins = await pluginPage.evaluate(() => GsfClient.fetch('GET', 'plugins'));
    if (!existingPlugins) return;
    const pluginIds = existingPlugins.map(existingPlugin => existingPlugin.id);
    await pluginPage.evaluate(pluginIds => GsfClient.fetch('DELETE', 'plugins', { ids: pluginIds }), pluginIds);
  });


  after(async () => {
    await browser.close();
  });

  it('Test Create New Plugin', async () => {
    // open plugin detail page
    await pluginPage.waitFor('#newplugin');
    await pluginPage.click('#newplugin');

    // wait for the plugin detail page to load
    await pluginPage.waitFor('input#name');

    // fill in data for a new plugin
    await pluginFrame.type('input#name', actualPlugin.name);
    await pluginFrame.type('textarea#code', actualPlugin.code);

    // save the plugin and return to plugin list page
    await pluginPage.click('#save');

    // get the newly created plugin
    const savedPlugin = await pluginPage.evaluate(name => GsfClient.fetch('GET', `plugin/${name}`), actualPlugin.name);

    // check newly created plugin props
    assert.strictEqual(actualPlugin.name, savedPlugin.name);
    assert.strictEqual(actualPlugin.code, savedPlugin.code);

    // check newly created plugin presence in plugin list
    await pluginPage.waitFor(`a[href=\\/plugin\\/${savedPlugin.id}`);
    const pluginNameInList = await pluginPage.evaluate(
      id => document.querySelector(`a[href=\\/plugin\\/${id}`).innerHTML,
      savedPlugin.id,
    );
    assert.strictEqual(actualPlugin.name, pluginNameInList);
  });

  it('Test Update Existing Plugin', async () => {
    const changedSuffix = '_changed';

    // create a new plugin
    const pluginId = await pluginPage.evaluate(actualPlugin => GsfClient.fetch('POST', 'plugin', actualPlugin), actualPlugin);

    // reload plugin list
    const queryParams = queryString.stringify({ redirectPath: '/plugins' });
    await pluginPage.goto(`chrome-extension://${extension.id}/admin/admin.html?${queryParams}`, gotoOpts);

    // open the newly created plugin
    await pluginPage.waitFor(`a[href=\\/plugin\\/${pluginId}`);
    await pluginPage.click(`a[href=\\/plugin\\/${pluginId}`);

    // wait for the plugin detail page to load
    await pluginPage.waitFor('input#name');

    // change name and code properties
    await pluginFrame.type('input#name', changedSuffix);
    await pluginFrame.type('textarea#code', changedSuffix);

    // save the plugin and return to plugin list page
    await pluginPage.click('#save');

    // get the updated plugin
    const updatedPlugin = await pluginPage.evaluate(pluginId => GsfClient.fetch('GET', `plugin/${pluginId}`), pluginId);

    // check newly updated plugin props
    assert.strictEqual(`${actualPlugin.name}${changedSuffix}`, updatedPlugin.name);
    assert.strictEqual(`${actualPlugin.code}${changedSuffix}`, updatedPlugin.code);

    // check updated plugin presence in plugin list
    await pluginPage.waitFor(`a[href=\\/plugin\\/${updatedPlugin.id}`);
    const pluginNameInList = await pluginPage.evaluate(
      id => document.querySelector(`a[href=\\/plugin\\/${id}`).innerHTML,
      updatedPlugin.id,
    );
    assert.strictEqual(`${actualPlugin.name}${changedSuffix}`, pluginNameInList);
  });

  it('Test Start Update Existing Plugin And Cancel', async () => {
    const changedSuffix = '_changed';

    // create a new plugin
    const pluginId = await pluginPage.evaluate(actualPlugin => GsfClient.fetch('POST', 'plugin', actualPlugin), actualPlugin);

    // reload plugin list
    const queryParams = queryString.stringify({ redirectPath: '/plugins' });
    await pluginPage.goto(`chrome-extension://${extension.id}/admin/admin.html?${queryParams}`, gotoOpts);

    // open the newly created plugin
    await pluginPage.waitFor(`a[href=\\/plugin\\/${pluginId}`);
    await pluginPage.click(`a[href=\\/plugin\\/${pluginId}`);

    // wait for the plugin detail page to load
    await pluginPage.waitFor('input#name');

    // change name and code properties
    await pluginFrame.type('input#name', changedSuffix);
    await pluginFrame.type('textarea#code', changedSuffix);

    // cancel the update
    await pluginPage.click('#cancel');

    // get the updated plugin
    const updatedPlugin = await pluginPage.evaluate(pluginId => GsfClient.fetch('GET', `plugin/${pluginId}`), pluginId);

    // check newly updated plugin props
    assert.strictEqual(actualPlugin.name, updatedPlugin.name);
    assert.strictEqual(actualPlugin.code, updatedPlugin.code);

    // check updated plugin presence in plugin list
    await pluginPage.waitFor(`a[href=\\/plugin\\/${updatedPlugin.id}`);
    const pluginNameInList = await pluginPage.evaluate(
      id => document.querySelector(`a[href=\\/plugin\\/${id}`).innerHTML,
      updatedPlugin.id,
    );
    assert.strictEqual(actualPlugin.name, pluginNameInList);
  });

  it('Test Delete Existing Plugin', async () => {
    // create a new plugin
    const pluginId = await pluginPage.evaluate(actualPlugin => GsfClient.fetch('POST', 'plugin', actualPlugin), actualPlugin);

    // reload plugin list
    const queryParams = queryString.stringify({ redirectPath: '/plugins' });
    await pluginPage.goto(`chrome-extension://${extension.id}/admin/admin.html?${queryParams}`, gotoOpts);

    // wait for delete button to show up
    await pluginPage.waitFor(`input#delete-${pluginId}`);

    // delete it
    await pluginPage.click(`input#delete-${pluginId}`);

    // reload plugin list
    await pluginPage.goto(`chrome-extension://${extension.id}/admin/admin.html?${queryParams}`, gotoOpts);
    await pluginPage.waitFor('p#no-entries');

    // check plugin is no longer present
    const pluginLinksCount = await pluginPage.evaluate(() => document.querySelectorAll('a[href=\\/plugin\\/]:not(.nav-link)').length);
    assert.strictEqual(pluginLinksCount, 0);

    // check table is no longer present since there are no plugins to display
    const tableCount = await pluginPage.evaluate(() => document.querySelectorAll('table').length);
    assert.strictEqual(tableCount, 0);
  });
});
