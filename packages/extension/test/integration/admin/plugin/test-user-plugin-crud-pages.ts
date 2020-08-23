import { assert } from 'chai';
import { Page } from 'puppeteer';
import { BrowserHelper, getBrowserHelper } from 'get-set-fetch-extension-test-utils';

/* eslint-disable no-shadow, max-len */
describe('UserPlugin CRUD Pages', () => {
  let browserHelper: BrowserHelper;
  let page: Page;

  const actualPlugin = {
    name: 'pluginA',
    code: 'codeA',
  };

  before(async () => {
    browserHelper = getBrowserHelper();
    await browserHelper.launch();
    ({ page } = browserHelper as { page: Page });
  });

  beforeEach(async () => {
    // load plugin list
    await browserHelper.goto('/plugins');
    await browserHelper.waitFor('table.table-main');
  });

  after(async () => {
    await browserHelper.close();
  });

  it('Test Check Available Plugins', async () => {
    // retrieve plugin names
    const pluginNames = await page.evaluate(
      () => {
        const pluginLinks = document.querySelectorAll('tbody th a');
        return Array.from(pluginLinks).map(pluginLink => pluginLink.innerHTML);
      },
    );

    // compare
    const expectedPluginNames = [
      'FetchPlugin',
      'ExtractUrlsPlugin',
      'InsertResourcesPlugin',
      'SelectResourcePlugin',
      'UpsertResourcePlugin',
      'ExtractHtmlContentPlugin',
      'ScrollPlugin',
      'DynamicNavigationPlugin',
    ];
    assert.sameMembers(pluginNames, expectedPluginNames);
  });

  it('Test Create New Plugin', async () => {
    // open plugin detail page
    await page.waitFor('#newplugin');
    await page.click('#newplugin');

    // wait for the plugin detail page to load
    await page.waitFor('input#name');

    // fill in data for a new plugin
    await page.type('input#name', actualPlugin.name);
    await page.type('textarea#code', actualPlugin.code);

    // save the plugin and return to plugin list page
    await page.click('#save');

    // get the newly created plugin
    const savedPlugin = await page.evaluate(name => GsfClient.fetch('GET', `plugin/${name}`), actualPlugin.name);

    // check newly created plugin props
    assert.strictEqual(actualPlugin.name, savedPlugin.name);
    assert.strictEqual(actualPlugin.code, savedPlugin.code);

    // check newly created plugin presence in plugin list
    await page.waitFor(`a[href=\\/plugin\\/${savedPlugin.id}`);
    const pluginNameInList = await browserHelper.page.evaluate(
      id => document.querySelector(`a[href=\\/plugin\\/${id}`).innerHTML,
      savedPlugin.id,
    );
    assert.strictEqual(actualPlugin.name, pluginNameInList);

    // cleanup
    await page.evaluate(pluginIds => GsfClient.fetch('DELETE', 'plugins', { ids: pluginIds }), [ savedPlugin.id ]);
  });

  it('Test Update Existing Plugin', async () => {
    const changedSuffix = '_changed';

    // create a new plugin
    const pluginId = await browserHelper.page.evaluate(actualPlugin => GsfClient.fetch('POST', 'plugin', actualPlugin), actualPlugin);

    // reload plugin list
    await browserHelper.goto('/plugins');

    // open the newly created plugin
    await page.waitFor(`a[href=\\/plugin\\/${pluginId}`);
    await page.click(`a[href=\\/plugin\\/${pluginId}`);

    // wait for the plugin detail page to load
    await page.waitFor('input#name');

    // change name property
    await page.type('input#name', changedSuffix);

    // change code property, type for textarea positions the cursor at the begining, use below alternative
    await page.evaluate(() => {
      (document.getElementById('code') as HTMLTextAreaElement).value = '';
    });
    await page.type('textarea#code', `${actualPlugin.code}${changedSuffix}`);

    // save the plugin and return to plugin list page
    await page.click('#save');

    // get the updated plugin
    const updatedPlugin = await page.evaluate(pluginId => GsfClient.fetch('GET', `plugin/${pluginId}`), pluginId);

    // check newly updated plugin props
    assert.strictEqual(`${actualPlugin.name}${changedSuffix}`, updatedPlugin.name);
    assert.strictEqual(`${actualPlugin.code}${changedSuffix}`, updatedPlugin.code);

    // check updated plugin presence in plugin list
    await page.waitFor(`a[href=\\/plugin\\/${updatedPlugin.id}`);
    const pluginNameInList = await page.evaluate(
      id => document.querySelector(`a[href=\\/plugin\\/${id}`).innerHTML,
      updatedPlugin.id,
    );
    assert.strictEqual(`${actualPlugin.name}${changedSuffix}`, pluginNameInList);

    // cleanup
    await page.evaluate(pluginIds => GsfClient.fetch('DELETE', 'plugins', { ids: pluginIds }), [ updatedPlugin.id ]);
  });

  it('Test Start Update Existing Plugin And Cancel', async () => {
    const changedSuffix = '_changed';

    // create a new plugin
    const pluginId = await page.evaluate(actualPlugin => GsfClient.fetch('POST', 'plugin', actualPlugin), actualPlugin);

    // reload plugin list
    await browserHelper.goto('/plugins');

    // open the newly created plugin
    await page.waitFor(`a[href=\\/plugin\\/${pluginId}`);
    await page.click(`a[href=\\/plugin\\/${pluginId}`);

    // wait for the plugin detail page to load
    await page.waitFor('input#name');

    // change name property
    await page.type('input#name', changedSuffix);

    // change code property, type for textarea positions the cursor at the begining, use below alternative
    await page.evaluate(() => {
      (document.getElementById('code') as HTMLTextAreaElement).value = '';
    });
    await page.type('textarea#code', `${actualPlugin.code}${changedSuffix}`);

    // cancel the update
    await page.click('#cancel');

    // get the updated plugin
    const updatedPlugin = await page.evaluate(pluginId => GsfClient.fetch('GET', `plugin/${pluginId}`), pluginId);

    // check newly updated plugin props
    assert.strictEqual(actualPlugin.name, updatedPlugin.name);
    assert.strictEqual(actualPlugin.code, updatedPlugin.code);

    // check updated plugin presence in plugin list
    await page.waitFor(`a[href=\\/plugin\\/${updatedPlugin.id}`);
    const pluginNameInList = await page.evaluate(
      id => document.querySelector(`a[href=\\/plugin\\/${id}`).innerHTML,
      updatedPlugin.id,
    );
    assert.strictEqual(actualPlugin.name, pluginNameInList);

    // cleanup
    await page.evaluate(pluginIds => GsfClient.fetch('DELETE', 'plugins', { ids: pluginIds }), [ updatedPlugin.id ]);
  });

  it('Test Delete Existing Plugin', async () => {
    // create a new plugin
    const pluginId = await page.evaluate(actualPlugin => GsfClient.fetch('POST', 'plugin', actualPlugin), actualPlugin);

    // reload plugin list
    await browserHelper.goto('/plugins');

    // wait for delete button to show up for the targeted plugin
    await page.waitFor(`input#delete-${pluginId}`);

    // delete it
    await page.click(`input#delete-${pluginId}`);

    // reload plugin list, wait for the others plugins to render
    await browserHelper.goto('/plugins');
    await page.waitFor('input#delete-1');

    // check plugin is no longer present
    const pluginLinksCount = await page.evaluate(
      pluginId => document.querySelectorAll(`input#delete-${pluginId}`).length,
      pluginId,
    );
    assert.strictEqual(pluginLinksCount, 0);
  });
});
