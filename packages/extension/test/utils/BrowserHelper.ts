import queryString from 'query-string';
import { launch, Page } from 'puppeteer';

export default class BrowserHelper {
  // launches a browser instance
  static async launch() {
    const browser = await launch({
      headless: false,
      slowMo: 20,
      args: [
        '--proxy-server=localhost:3000',
        `--disable-extensions-except=${extension.path}`,
        `--load-extension=${extension.path}`,
        '--no-sandbox'
      ]
    });

    return browser;
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
    const gotoOpts =  {
      timeout: 10 * 1000,
      waitUntil: 'load'
    };

    // wait for main table to load, refresh page on 1st timeout
    try {
      await browserPage.goto(`chrome-extension://${extension.id}/admin/admin.html?${queryParams}`, gotoOpts);
      await browserPage.waitFor('table.table-main', { timeout: 2 * 1000 });
    }
    catch (err) {
      await browserPage.goto(`chrome-extension://${extension.id}/admin/admin.html?${queryParams}`, gotoOpts);
      await browserPage.waitFor('table.table-main', { timeout: 1 * 1000 });
    }
  }
}

const clear = async (page, selector) => {
  await page.evaluate(selector => {
    document.querySelector(selector).value = '';
  }, selector);
};

export { clear };
