import { assert } from 'chai';
import { resolve } from 'path';
import { Page } from 'puppeteer';
import { BrowserHelper } from 'get-set-fetch-extension-test-utils';

/* eslint-disable no-shadow, max-len */
xdescribe('Site CRUD Pages', () => {
  let browserHelper: BrowserHelper;
  let page: Page;

  const actualSite = {
    name: 'siteA',
    url: 'http://siteA.com',
  };

  before(async () => {
    const extensionPath = resolve(process.cwd(), 'node_modules', 'get-set-fetch-extension', 'dist');
    browserHelper = new BrowserHelper({ extension: { path: extensionPath } });
    await browserHelper.launch();
    ({ page } = browserHelper as { page: Page });
  });

  beforeEach(async () => {
    // load site list
    await browserHelper.goto('/sites');
  });

  afterEach(async () => {
    // delete existing sites
    const existingSites = await page.evaluate(() => GsfClient.fetch('GET', 'sites'));
    if (!existingSites) return;
    const siteIds = existingSites.map(existingSite => existingSite.id);
    await page.evaluate(siteIds => GsfClient.fetch('DELETE', 'sites', { ids: siteIds }), siteIds);
  });

  after(async () => {
    await browserHelper.close();
  });

  it('Test Create New Site', async () => {
    await browserHelper.goto('/sites');

    // open site detail page
    await page.waitFor('#newsite');
    await page.click('#newsite');

    // wait for the site detail page to load
    await page.waitFor('input#name');

    // fill in data for a new site
    await page.type('input#name', actualSite.name);
    await page.type('input#url', actualSite.url);

    // save the site and return to site list page
    await page.click('#save');

    // get the newly created site
    const savedSite = await page.evaluate(name => GsfClient.fetch('GET', `site/${name}`), actualSite.name);

    // check newly created site props
    assert.strictEqual(actualSite.name, savedSite.name);
    assert.strictEqual(actualSite.url, savedSite.url);

    // check newly created site presence in site list
    await page.waitFor(`a[href=\\/site\\/${savedSite.id}`);
    const siteNameInList = await page.evaluate(
      id => document.querySelector(`a[href=\\/site\\/${id}`).innerHTML,
      savedSite.id,
    );
    assert.strictEqual(actualSite.name, siteNameInList);
  });

  it('Test Update Existing Site', async () => {
    const changedSuffix = '_changed';

    // create a new site
    const siteId = await page.evaluate(actualSite => GsfClient.fetch('POST', 'site', actualSite), actualSite);

    // reload site list
    await browserHelper.goto('/sites');

    // open the newly created site
    await page.waitFor(`a[href=\\/site\\/${siteId}`);
    await page.click(`a[href=\\/site\\/${siteId}`);

    // wait for the site detail page to load
    await page.waitFor('input#name');

    // change name and url properties
    await page.type('input#name', changedSuffix);
    await page.type('input#url', changedSuffix);

    // save the site and return to site list page
    await page.click('#save');

    // get the updated site
    const updatedSite = await page.evaluate(siteId => GsfClient.fetch('GET', `site/${siteId}`), siteId);

    // check newly updated site props
    assert.strictEqual(`${actualSite.name}${changedSuffix}`, updatedSite.name);
    assert.strictEqual(`${actualSite.url}${changedSuffix}`, updatedSite.url);

    // check updated site presence in site list
    await page.waitFor(`a[href=\\/site\\/${updatedSite.id}`);
    const siteNameInList = await page.evaluate(
      id => document.querySelector(`a[href=\\/site\\/${id}`).innerHTML,
      updatedSite.id,
    );
    assert.strictEqual(`${actualSite.name}${changedSuffix}`, siteNameInList);
  });

  it('Test Start Update Existing Site And Cancel', async () => {
    const changedSuffix = '_changed';

    // create a new site
    const siteId = await page.evaluate(actualSite => GsfClient.fetch('POST', 'site', actualSite), actualSite);

    // reload site list
    await browserHelper.goto('/sites');

    // open the newly created site
    await page.waitFor(`a[href=\\/site\\/${siteId}`);
    await page.click(`a[href=\\/site\\/${siteId}`);

    // wait for the site detail page to load
    await page.waitFor('input#name');

    // change name and url properties
    await page.type('input#name', changedSuffix);
    await page.type('input#url', changedSuffix);

    // cancel the update
    await page.click('#cancel');

    // get the updated site
    const updatedSite = await page.evaluate(siteId => GsfClient.fetch('GET', `site/${siteId}`), siteId);

    // check newly updated site props
    assert.strictEqual(actualSite.name, updatedSite.name);
    assert.strictEqual(actualSite.url, updatedSite.url);

    // check updated site presence in site list
    await page.waitFor(`a[href=\\/site\\/${updatedSite.id}`);
    const siteNameInList = await page.evaluate(
      id => document.querySelector(`a[href=\\/site\\/${id}`).innerHTML,
      updatedSite.id,
    );
    assert.strictEqual(actualSite.name, siteNameInList);
  });

  it('Test Delete Existing Site', async () => {
    // create a new site
    const siteId = await page.evaluate(actualSite => GsfClient.fetch('POST', 'site', actualSite), actualSite);

    // reload site list
    await browserHelper.goto('/sites');

    // wait for delete button to show up
    await page.waitFor(`input#delete-${siteId}`);

    // delete it
    await page.click(`input#delete-${siteId}`);

    // reload site list
    await browserHelper.goto('/sites');
    await page.waitFor('p#no-entries');

    // check table is no longer present since there are no sites to display
    const tableCount = await page.evaluate(() => document.querySelectorAll('table').length);
    assert.strictEqual(tableCount, 0);
  });
});
