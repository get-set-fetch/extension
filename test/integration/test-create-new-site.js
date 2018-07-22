import BrowserHelper from 'test/utils/BrowserHelper';

const path = require('path');

describe('Site Pages', () => {
  let browser = null;

  const gotoOpts = {
    timeout: 10 * 1000,
    waitUntil: 'load',
  };

  const actualSite = {
    name: 'siteA',
    url: 'http://www.sitea.com/index.html',
  };

  before(async () => {
    browser = await BrowserHelper.launchAndStubRequests(
      actualSite.url,
      path.join('test', 'integration', actualSite.name),
    );
  });

  after(async () => {
    await browser.close();
  });

  it('Test Create New Site', async () => {
    // open stubbed site
    const sitePage = await browser.newPage();
    await sitePage.goto(actualSite.url, gotoOpts);

    // open popup page
    const popupPage = await browser.newPage();
    await popupPage.goto(`chrome-extension://${extension.id}/popup/popup.html`, gotoOpts);

    // move focus to stubbed site
    await sitePage.bringToFront();

    // initiate create new site from the popup page based on currently active tab
    await popupPage.click('a#newsite');

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
    await adminPage.click('#save');
    await adminPage.waitForNavigation(gotoOpts);

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
