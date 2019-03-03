import queryString from 'query-string';
import { assert } from 'chai';
import BrowserHelper from '../../../utils/BrowserHelper';

/* eslint-disable no-shadow, max-len */
describe('UserPlugin CRUD Pages', () => {
  let browser = null;
  let pluginPage = null;
  let pluginFrame = null;

  const queryParams = queryString.stringify({ redirectPath: '/plugins' });

  const gotoOpts = {
    timeout: 10 * 1000,
    waitUntil: 'load'
  };

  const actualPlugin = {
    name: 'pluginA',
    code: 'codeA'
  };

  before(async () => {
    browser = await BrowserHelper.launch();

    // open plugin list page
    pluginPage = await browser.newPage();
    pluginFrame = pluginPage.mainFrame();

    await BrowserHelper.waitForDBInitialization(pluginPage);
  });

  beforeEach(async () => {
    // load plugin list
    await pluginPage.goto(`chrome-extension://${extension.id}/admin/admin.html?${queryParams}`, gotoOpts);
    await pluginPage.waitFor('table.table-main', { timeout: 1 * 1000 });
  });

  after(async () => {
    await browser.close();
  });

  it('Test Check Default Plugins', async () => {
    // retrieve plugin names
    const pluginNames = await pluginPage.evaluate(
      () => {
        const pluginLinks = document.querySelectorAll('tbody th a');
        const pluginNames = [];
        for (let i = 0; i < pluginLinks.length; i++) {
          pluginNames.push(pluginLinks[i].innerHTML);
        }
        return pluginNames;
      }
    );

    // compare
    const expectedPluginNames = ['ExtensionFetchPlugin', 'ExtractTitlePlugin', 'ExtractUrlPlugin', 'InsertResourcePlugin', 'SelectResourcePlugin', 'UpdateResourcePlugin', 'ImageFilterPlugin'];
    assert.sameMembers(pluginNames, expectedPluginNames);
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
      savedPlugin.id
    );
    assert.strictEqual(actualPlugin.name, pluginNameInList);

    // cleanup
    await pluginPage.evaluate(pluginIds => GsfClient.fetch('DELETE', 'plugins', { ids: pluginIds }), [savedPlugin.id]);
  });

  it('Test Update Existing Plugin', async () => {
    const changedSuffix = '_changed';

    // create a new plugin
    const pluginId = await pluginPage.evaluate(actualPlugin => GsfClient.fetch('POST', 'plugin', actualPlugin), actualPlugin);

    // reload plugin list
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
      updatedPlugin.id
    );
    assert.strictEqual(`${actualPlugin.name}${changedSuffix}`, pluginNameInList);

    // cleanup
    await pluginPage.evaluate(pluginIds => GsfClient.fetch('DELETE', 'plugins', { ids: pluginIds }), [updatedPlugin.id]);
  });

  it('Test Start Update Existing Plugin And Cancel', async () => {
    const changedSuffix = '_changed';

    // create a new plugin
    const pluginId = await pluginPage.evaluate(actualPlugin => GsfClient.fetch('POST', 'plugin', actualPlugin), actualPlugin);

    // reload plugin list
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
      updatedPlugin.id
    );
    assert.strictEqual(actualPlugin.name, pluginNameInList);

    // cleanup
    await pluginPage.evaluate(pluginIds => GsfClient.fetch('DELETE', 'plugins', { ids: pluginIds }), [updatedPlugin.id]);
  });

  it('Test Delete Existing Plugin', async () => {
    // create a new plugin
    const pluginId = await pluginPage.evaluate(actualPlugin => GsfClient.fetch('POST', 'plugin', actualPlugin), actualPlugin);

    // reload plugin list
    await pluginPage.goto(`chrome-extension://${extension.id}/admin/admin.html?${queryParams}`, gotoOpts);

    // wait for delete button to show up for the targeted plugin
    await pluginPage.waitFor(`input#delete-${pluginId}`);

    // delete it
    await pluginPage.click(`input#delete-${pluginId}`);

    // reload plugin list, wait for the others plugins to render
    await pluginPage.goto(`chrome-extension://${extension.id}/admin/admin.html?${queryParams}`, gotoOpts);
    await pluginPage.waitFor('input#delete-1');

    // check plugin is no longer present
    const pluginLinksCount = await pluginPage.evaluate(
      pluginId => document.querySelectorAll(`input#delete-${pluginId}`).length,
      pluginId
    );
    assert.strictEqual(pluginLinksCount, 0);
  });
});
