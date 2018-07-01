const path = require('path');
const puppeteer = require('puppeteer');
const queryString = require('query-string');
const { assert } = require('chai');

const extension = {
  id: 'cpbaclenlbncmmagcfdlblmmppgmcjfg',
  path: path.resolve(__dirname, '..', '..', '..', 'dist'),
};

describe('Test Admin, ', () => {
  let browser = null;
  let page = null;

  const gotoOpts = {
    timeout: 10 * 1000,
    waitUntil: 'load',
  };

  before(async () => {
    // launch chrome
    browser = await puppeteer.launch({
      headless: false,
      args: [
        `--disable-extensions-except=${extension.path}`,
        `--load-extension=${extension.path}`,
      ],
    });

    // open new page
    page = await browser.newPage();
  });

  it('Create New Site', async () => {
    // construct extension url
    const actualSite = {
      name: 'siteA',
      url: 'http://www.siteA.com',
    };

    const queryParams = queryString.stringify({
      redirectPath: '/project',
      name: actualSite.name,
      url: actualSite.url,
    });

    const adminUrl = `chrome-extension://${extension.id}/admin/admin.html?${queryParams}`;

    // open admin site creation
    await page.goto(adminUrl, gotoOpts);

    // save site
    await page.click('#save');
    await page.waitForNavigation(gotoOpts);

    // check redirection to site list
    const projectsUrl = `chrome-extension://${extension.id}/projects`;
    assert.strictEqual(projectsUrl, page.url());

    // check the newly created site is now present in extension IndexedDB
    const sites = await page.evaluate(() => GsfClient.fetch('GET', 'sites'));
    assert.strictEqual(1, sites.length);

    const loadedSite = sites[0];
    assert.strictEqual(actualSite.name, loadedSite.name);
    assert.strictEqual(actualSite.url, loadedSite.url);

    // check a resource with the site url has been created
    const loadedResource = await page.evaluate(url => GsfClient.fetch('GET', `resource/${url}`), actualSite.url);
    assert.strictEqual(loadedSite.id, loadedResource.siteId);
    assert.strictEqual(loadedSite.url, loadedResource.url);
    assert.strictEqual(0, loadedResource.depth);
    assert.strictEqual(false, loadedResource.crawlInProgress);
  });
});
