import { resolve } from 'path';
import { stringify } from 'query-string';
import { launch, Page, NavigationOptions, Browser, JSHandle } from 'puppeteer';

interface IExtension {
  id?: string;
  path: string;
}

export default class BrowserHelper {

  static extension: IExtension;

  static gotoOpts: NavigationOptions = {
    timeout: 10 * 1000,
    waitUntil: ['load']
  };

  // launches a browser instance
  static async launch() {
    BrowserHelper.extension = { path: resolve(__dirname, '..', '..', 'dist') };

    const browser = await launch({
      headless: false,
      ignoreHTTPSErrors: true,
      slowMo: 20,
      args: [
        '--host-rules=MAP *:80 127.0.0.1:8080, MAP *:443 127.0.0.1:8443',
        '--proxy-server="http=localhost:8080;https=localhost:8443"',
        '--ignore-certificate-errors',
        `--disable-extensions-except=${BrowserHelper.extension.path}`,
        `--load-extension=${BrowserHelper.extension.path}`,
        '--no-sandbox'
      ]
    });
    const page: Page = await browser.newPage();
    await page.bringToFront();

    BrowserHelper.extension.id = await BrowserHelper.getExtensionId(page);
    await BrowserHelper.waitForDBInitialization(page);
    await page.bringToFront();

    return new BrowserHelper(browser, page);
  }

  static async getExtensionId(page: Page): Promise<string> {
    await page.goto('chrome://extensions/', BrowserHelper.gotoOpts);

    // tslint:disable-next-line
    const devBtnHandle:any = await page.evaluateHandle('document.querySelector("body > extensions-manager").shadowRoot.querySelector("extensions-toolbar").shadowRoot.querySelector("#devMode").shadowRoot.querySelector("button")');
    await devBtnHandle.click();

    // tslint:disable-next-line
    const extIdDivHandle:any = await page.evaluateHandle('document.querySelector("body > extensions-manager").shadowRoot.querySelector("#items-list").shadowRoot.querySelector("extensions-item").shadowRoot.querySelector("#extension-id")');
    const rawExtId = await page.evaluate(div => div.textContent, extIdDivHandle);
    const extId = rawExtId.split(': ')[1];
    return extId;
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
    const queryParams = stringify({ redirectPath: '/scenarios' });
    // wait for main table to load, refresh page on 1st timeout
    try {
      await browserPage.goto(`chrome-extension://${BrowserHelper.extension.id}/admin/admin.html?${queryParams}`, BrowserHelper.gotoOpts);
      await browserPage.waitFor('table.table-main', { timeout: 2 * 1000 });
    }
    catch (err) {
      await browserPage.goto(`chrome-extension://${BrowserHelper.extension.id}/admin/admin.html?${queryParams}`, BrowserHelper.gotoOpts);
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
    const queryParams = stringify({ redirectPath: path });
    return this.page.goto(`chrome-extension://${BrowserHelper.extension.id}/admin/admin.html?${queryParams}`, BrowserHelper.gotoOpts);
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
