import { assert } from 'chai';
import { Page } from 'puppeteer';
import BrowserHelper from '../../../helpers/BrowserHelper';

xdescribe('Site Pages', () => {
  let browserHelper: BrowserHelper;
  let page: Page;

  const actualSite = {
    name: 'siteA',
    url: 'http://www.sitea.com/index.html'
  };

  before(async () => {
    browserHelper = await BrowserHelper.launch();
    page = browserHelper.page;
  });

  afterEach(async () => {
    // move to admin page
    await browserHelper.goto('/sites');

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
    // open stubbed site
    await page.goto(actualSite.url, BrowserHelper.gotoOpts);

    // open popup page
    const popupPage = await browserHelper.browser.newPage();
    await popupPage.goto(`chrome-extension://${BrowserHelper.extension.id}/popup/popup.html`, BrowserHelper.gotoOpts);

    // move focus to stubbed site
    await page.bringToFront();

    // initiate create new site from the popup page based on currently active tab
    await popupPage.waitFor('a#newsite');

    // interesting enough await popupPage.click('a#newsite') does not work but the workaround does
    await popupPage.evaluate(anchorId => document.getElementById(anchorId).click(), 'newsite');

    // retrieve the newly created admin page
    const adminPage = await BrowserHelper.waitForPageCreation(browserHelper.browser);

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
      adminPage.waitForNavigation(BrowserHelper.gotoOpts)
    ]);

    // check redirection to site list
    const sitesUrl = `chrome-extension://${BrowserHelper.extension.id}/sites`;
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
