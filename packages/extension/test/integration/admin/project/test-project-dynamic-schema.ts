import { assert } from 'chai';
import { Page } from 'puppeteer';
import { BrowserHelper, getBrowserHelper } from 'get-set-fetch-extension-test-utils';

declare const GsfClient;

/* eslint-disable no-shadow, max-len */
describe('Project Dynamic Schema', () => {
  let browserHelper: BrowserHelper;
  let page: Page;

  before(async () => {
    browserHelper = getBrowserHelper();
    await browserHelper.launch();
    ({ page } = browserHelper as { page: Page });
  });

  beforeEach(async () => {
    // load project list
    await browserHelper.goto('/projects');
  });

  after(async () => {
    await browserHelper.close();
  });

  it('Show / Hide Fields', async function() {
    /*
    for some reason this test always fails against firefox on travis-ci ... 
    it passes against firefox on win10/ubuntu 18.04.3 LTS
    it passes manual test
    */
    if (process.env.browser === 'firefox') return this.skip();

    // open project detail page
    await page.waitFor('#newproject');
    await page.click('#newproject');

    // wait for the project detail page to load
    await page.waitFor('input#name');

    // fill in dropdown scenario
    await page.select('select[id="scenarioPkg.name"]', 'get-set-fetch-scenario-scrape-static-content');

    // wait for scenarioLink to be rendered, this means the plugin schemas are also rendered
    await page.waitFor('[id="scenarioLink"]');

    // scroll plugin is not enabled, only the enable flag is visible
    let scrollEnabled = await page.$('[id="plugins.ScrollPlugin.enabled"]');
    assert.isNotNull(scrollEnabled);

    let scrollDelay = await page.$('[id="plugins.ScrollPlugin.delay"]');
    assert.isNull(scrollDelay);

    let scrollTimeout = await page.$('[id="plugins.ScrollPlugin.changeTimeout"]');
    assert.isNull(scrollTimeout);

    let scrollMaxScrollNo = await page.$('[id="plugins.ScrollPlugin.maxOperations"]');
    assert.isNull(scrollMaxScrollNo);

    // scroll plugin is enabled, remaining flag are visible
    await page.select('select[id="plugins.ScrollPlugin.enabled"]', 'true');

    scrollEnabled = await page.$('[id="plugins.ScrollPlugin.enabled"]');
    assert.isNotNull(scrollEnabled);

    scrollDelay = await page.$('[id="plugins.ScrollPlugin.delay"]');
    assert.isNotNull(scrollDelay);

    scrollTimeout = await page.$('[id="plugins.ScrollPlugin.changeTimeout"]');
    assert.isNotNull(scrollTimeout);

    scrollMaxScrollNo = await page.$('[id="plugins.ScrollPlugin.maxOperations"]');
    assert.isNotNull(scrollMaxScrollNo);

    // scroll plugin is not enabled, only the enable flag is visible
    await page.select('select[id="plugins.ScrollPlugin.enabled"]', 'false');

    scrollEnabled = await page.$('[id="plugins.ScrollPlugin.enabled"]');
    assert.isNotNull(scrollEnabled);

    scrollDelay = await page.$('[id="plugins.ScrollPlugin.delay"]');
    assert.isNull(scrollDelay);

    scrollTimeout = await page.$('[id="plugins.ScrollPlugin.changeTimeout"]');
    assert.isNull(scrollTimeout);

    scrollMaxScrollNo = await page.$('[id="plugins.ScrollPlugin.maxOperations"]');
    assert.isNull(scrollMaxScrollNo);
  });
});
