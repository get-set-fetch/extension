import queryString from 'query-string';
import BrowserHelper from '../../utils/BrowserHelper';

const { assert } = require('chai');

/* eslint-disable no-shadow, max-len */
describe('Site CRUD Pages', () => {
  let browser = null;
  let sitePage = null;
  let siteFrame = null;

  const gotoOpts = {
    timeout: 10 * 1000,
    waitUntil: 'load',
  };

  const queryParams = queryString.stringify({ redirectPath: '/sites' });

  const actualSite = {
    name: 'siteA',
    url: 'http://siteA.com',
  };

  before(async () => {
    browser = await BrowserHelper.launch();
    sitePage = await browser.newPage();
    siteFrame = sitePage.mainFrame();

    await BrowserHelper.waitForDBInitialization(sitePage);
  });

  beforeEach(async () => {
    // load site list
    await sitePage.goto(`chrome-extension://${extension.id}/admin/admin.html?${queryParams}`, gotoOpts);
  })

  afterEach(async () => {
    // delete existing sites
    const existingSites = await sitePage.evaluate(() => GsfClient.fetch('GET', 'sites'));
    if (!existingSites) return;
    const siteIds = existingSites.map(existingSite => existingSite.id);
    await sitePage.evaluate(siteIds => GsfClient.fetch('DELETE', 'sites', { ids: siteIds }), siteIds);
  });


  after(async () => {
    await browser.close();
  });

  it('Test Create New Site', async () => {
    // open site detail page
    await sitePage.waitFor('#newsite');
    await sitePage.click('#newsite');

    // wait for the site detail page to load
    await sitePage.waitFor('input#name');

    // fill in data for a new site
    await siteFrame.type('input#name', actualSite.name);
    await siteFrame.type('input#url', actualSite.url);

    // save the site and return to site list page
    await sitePage.click('#save');

    // get the newly created site
    const savedSite = await sitePage.evaluate(name => GsfClient.fetch('GET', `site/${name}`), actualSite.name);

    // check newly created site props
    assert.strictEqual(actualSite.name, savedSite.name);
    assert.strictEqual(actualSite.url, savedSite.url);

    // check newly created site presence in site list
    await sitePage.waitFor(`a[href=\\/site\\/${savedSite.id}`);
    const siteNameInList = await sitePage.evaluate(
      id => document.querySelector(`a[href=\\/site\\/${id}`).innerHTML,
      savedSite.id,
    );
    assert.strictEqual(actualSite.name, siteNameInList);
  });

  it('Test Update Existing Site', async () => {
    const changedSuffix = '_changed';

    // create a new site
    const siteId = await sitePage.evaluate(actualSite => GsfClient.fetch('POST', 'site', actualSite), actualSite);

    // reload site list
    await sitePage.goto(`chrome-extension://${extension.id}/admin/admin.html?${queryParams}`, gotoOpts);

    // open the newly created site
    await sitePage.waitFor(`a[href=\\/site\\/${siteId}`);
    await sitePage.click(`a[href=\\/site\\/${siteId}`);

    // wait for the site detail page to load
    await sitePage.waitFor('input#name');

    // change name and url properties
    await siteFrame.type('input#name', changedSuffix);
    await siteFrame.type('input#url', changedSuffix);

    // save the site and return to site list page
    await sitePage.click('#save');

    // get the updated site
    const updatedSite = await sitePage.evaluate(siteId => GsfClient.fetch('GET', `site/${siteId}`), siteId);

    // check newly updated site props
    assert.strictEqual(`${actualSite.name}${changedSuffix}`, updatedSite.name);
    assert.strictEqual(`${actualSite.url}${changedSuffix}`, updatedSite.url);

    // check updated site presence in site list
    await sitePage.waitFor(`a[href=\\/site\\/${updatedSite.id}`);
    const siteNameInList = await sitePage.evaluate(
      id => document.querySelector(`a[href=\\/site\\/${id}`).innerHTML,
      updatedSite.id,
    );
    assert.strictEqual(`${actualSite.name}${changedSuffix}`, siteNameInList);
  });

  it('Test Start Update Existing Site And Cancel', async () => {
    const changedSuffix = '_changed';

    // create a new site
    const siteId = await sitePage.evaluate(actualSite => GsfClient.fetch('POST', 'site', actualSite), actualSite);

    // reload site list
    await sitePage.goto(`chrome-extension://${extension.id}/admin/admin.html?${queryParams}`, gotoOpts);

    // open the newly created site
    await sitePage.waitFor(`a[href=\\/site\\/${siteId}`);
    await sitePage.click(`a[href=\\/site\\/${siteId}`);

    // wait for the site detail page to load
    await sitePage.waitFor('input#name');

    // change name and url properties
    await siteFrame.type('input#name', changedSuffix);
    await siteFrame.type('input#url', changedSuffix);

    // cancel the update
    await sitePage.click('#cancel');

    // get the updated site
    const updatedSite = await sitePage.evaluate(siteId => GsfClient.fetch('GET', `site/${siteId}`), siteId);

    // check newly updated site props
    assert.strictEqual(actualSite.name, updatedSite.name);
    assert.strictEqual(actualSite.url, updatedSite.url);

    // check updated site presence in site list
    await sitePage.waitFor(`a[href=\\/site\\/${updatedSite.id}`);
    const siteNameInList = await sitePage.evaluate(
      id => document.querySelector(`a[href=\\/site\\/${id}`).innerHTML,
      updatedSite.id,
    );
    assert.strictEqual(actualSite.name, siteNameInList);
  });

  it('Test Delete Existing Site', async () => {
    // create a new site
    const siteId = await sitePage.evaluate(actualSite => GsfClient.fetch('POST', 'site', actualSite), actualSite);

    // reload site list
    await sitePage.goto(`chrome-extension://${extension.id}/admin/admin.html?${queryParams}`, gotoOpts);

    // wait for delete button to show up
    await sitePage.waitFor(`input#delete-${siteId}`);

    // delete it
    await sitePage.click(`input#delete-${siteId}`);

    // reload site list
    await sitePage.goto(`chrome-extension://${extension.id}/admin/admin.html?${queryParams}`, gotoOpts);
    await sitePage.waitFor('p#no-entries');

    // check table is no longer present since there are no sites to display
    const tableCount = await sitePage.evaluate(() => document.querySelectorAll('table').length);
    assert.strictEqual(tableCount, 0);
  });
});
