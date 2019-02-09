import queryString from 'query-string';
import { assert } from 'chai';
import { join } from 'path';
import { NavigationOptions } from 'puppeteer';
import BrowserHelper from '../../utils/BrowserHelper';

describe('Site Pages', () => {
  let browser = null;
  let sitePage = null;

  const gotoOpts: NavigationOptions = {
    timeout: 10 * 1000,
    waitUntil: ['load', 'domcontentloaded', 'networkidle0']
  };

  const queryParams = queryString.stringify({ redirectPath: '/sites' });

  const actualSite = {
    name: 'siteA',
    url: 'http://www.sitea.com/index.html'
  };

  before(async () => {
    browser = await BrowserHelper.launchAndStubRequests(
      actualSite.url,
      join('test', 'resources', actualSite.name)
    );

    sitePage = await browser.newPage();

    // await BrowserHelper.waitForDBInitialization(sitePage);
  });

  afterEach(async () => {
    // move to admin page
    await sitePage.goto(`chrome-extension://${extension.id}/admin/admin.html?${queryParams}`, gotoOpts);

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
    // open stubbed site
    await sitePage.goto(actualSite.url, gotoOpts);

    // open popup page
    const popupPage = await browser.newPage();
    await popupPage.goto(`chrome-extension://${extension.id}/popup/popup.html`, gotoOpts);

    // move focus to stubbed site
    await sitePage.bringToFront();

    // initiate create new site from the popup page based on currently active tab
    await popupPage.waitFor('a#newsite');

    // interesting enough await popupPage.click('a#newsite') does not work but the workaround does
    await popupPage.evaluate(anchorId => document.getElementById(anchorId).click(), 'newsite');

    // retrieve the newly created admin page
    const adminPage = await BrowserHelper.waitForPageCreation(browser);

    // wait for redirection to "new site" page
    await adminPage.waitFor('#save');

    // check form fields
    const ctx = await adminPage.mainFrame().executionContext();
    const inputName = await ctx.evaluate(selector => document.querySelector(selector).value, 'input#name');
    assert.strictEqual(actualSite.name, inputName);
    const inputUrl = await ctx.evaluate(selector => document.querySelector(selector).value, 'input#url');
    assert.strictEqual(actualSite.url, inputUrl);

    // save site
    await Promise.all([
      adminPage.click('#save'),
      adminPage.waitForNavigation(gotoOpts)
    ]);

    // check redirection to site list
    const sitesUrl = `chrome-extension://${extension.id}/sites`;
    assert.strictEqual(sitesUrl, adminPage.url());

    // check the newly created site is now present in extension IndexedDB
    const sites = await adminPage.evaluate(() => GsfClient.fetch('GET', 'sites'));
    assert.strictEqual(1, sites.length);

    const loadedSite = sites[0];
    assert.strictEqual(actualSite.name, loadedSite.name);
    assert.strictEqual(actualSite.url, loadedSite.url);

    // check a resource with the site url has been created
    const loadedResource = await adminPage.evaluate(url => GsfClient.fetch('GET', `resource/${url}`), actualSite.url);
    assert.strictEqual(loadedSite.id, loadedResource.siteId);
    assert.strictEqual(loadedSite.url, loadedResource.url);
    assert.strictEqual(0, loadedResource.depth);
    assert.strictEqual(false, loadedResource.crawlInProgress);
  });
});
