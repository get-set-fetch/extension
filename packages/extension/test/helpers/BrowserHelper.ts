import queryString from 'query-string';
import { launch, Page, NavigationOptions, Browser } from 'puppeteer';

export default class BrowserHelper {

  static gotoOpts: NavigationOptions = {
    timeout: 10 * 1000,
    waitUntil: ['load']
  };

  // launches a browser instance
  static async launch() {
    const browser = await launch({
      headless: false,
      ignoreHTTPSErrors: true,
      slowMo: 20,
      args: [
        '--host-rules=MAP *:80 127.0.0.1:8080, MAP *:443 127.0.0.1:8443',
        '--proxy-server="http=localhost:8080;https=localhost:8443"',
        '--ignore-certificate-errors',
        `--disable-extensions-except=${extension.path}`,
        `--load-extension=${extension.path}`,
        '--no-sandbox'
      ]
    });
    const page: Page = await browser.newPage();
    await BrowserHelper.waitForDBInitialization(page);

    return new BrowserHelper(browser, page);
  }

  static waitForPageCreation(browser): Promise<Page> {
    return new Promise((resolve) => {
      browser.once('targetcreated', async (target) => {
        const page = await target.page();
        resolve(page);
      });
    });
  }

  /*
  scenario plugins are the last to be discovered and imported,
  once scenarios are present it means all db initial operations are complete
  */
  static async waitForDBInitialization(browserPage) {
    const queryParams = queryString.stringify({ redirectPath: '/scenarios' });
    // wait for main table to load, refresh page on 1st timeout
    try {
      await browserPage.goto(`chrome-extension://${extension.id}/admin/admin.html?${queryParams}`, BrowserHelper.gotoOpts);
      await browserPage.waitFor('table.table-main', { timeout: 2 * 1000 });
    }
    catch (err) {
      await browserPage.goto(`chrome-extension://${extension.id}/admin/admin.html?${queryParams}`, BrowserHelper.gotoOpts);
      await browserPage.waitFor('table.table-main', { timeout: 1 * 1000 });
    }
  }

  browser: Browser;
  page: Page;

  constructor(browser: Browser, page: Page) {
    this.browser = browser;
    this.page = page;
  }

  goto(path: string) {
    const queryParams = queryString.stringify({ redirectPath: path });
    return this.page.goto(`chrome-extension://${extension.id}/admin/admin.html?${queryParams}`, BrowserHelper.gotoOpts);
  }

  waitFor(selector: string, timeout: number = 1 * 1000) {
    return this.page.waitFor(selector, { timeout });
  }

  close() {
    return this.browser.close();
  }
}

const clear = async (page, selector) => {
  await page.evaluate(selector => {
    document.querySelector(selector).value = '';
  }, selector);
};

export { clear };
