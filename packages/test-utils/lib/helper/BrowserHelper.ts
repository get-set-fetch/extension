import { stringify } from 'query-string';
import { launch, Page, NavigationOptions, Browser } from 'puppeteer';

interface IExtension {
  id?: string;
  path: string;
}

interface IBrowserHelper {
  httpPort?: number;
  httpsPort?: number;
  extension: IExtension;
  gotoOpts?: NavigationOptions;
  closeExtraPages?: boolean;
}

export default class BrowserHelper {
  httpPort: number;
  httpsPort: number;
  extension: IExtension;
  gotoOpts: NavigationOptions;
  browser: Browser;
  page: Page;
  closeExtraPages: boolean;

  constructor(
    {
      gotoOpts = {
        timeout: 10 * 1000,
        waitUntil: [ 'load' ],
      },
      httpPort = 8080,
      httpsPort = 8443,
      closeExtraPages = true,
      extension,
    }:
    IBrowserHelper,
  ) {
    this.gotoOpts = gotoOpts;
    this.httpPort = httpPort;
    this.httpsPort = httpsPort;
    this.closeExtraPages = closeExtraPages;
    this.extension = extension;
  }

  // launches a browser instance
  async launch() {
    this.browser = await launch({
      headless: false,
      ignoreHTTPSErrors: true,
      slowMo: 20,
      args: [
        `--host-rules=MAP *:80 127.0.0.1:${this.httpPort}, MAP *:443 127.0.0.1:${this.httpsPort}`,
        `--proxy-server="http=localhost:${this.httpPort};https=localhost:${this.httpsPort}"`,
        '--ignore-certificate-errors',
        `--disable-extensions-except=${this.extension.path}`,
        `--load-extension=${this.extension.path}`,
        '--no-sandbox',
      ],
    });

    // wait for the extension to be installed and open the thank_you page
    await this.waitForPageCreation();

    if (this.closeExtraPages) {
      await Promise.all(
        (await this.browser.pages()).slice(1).map(page => page.close()),
      );
    }

    this.page = (await this.browser.pages())[0] as Page;
    await this.page.bringToFront();

    this.extension.id = await this.getExtensionId();
    await this.waitForDBInitialization();
    await this.page.bringToFront();
  }

  async getExtensionId(): Promise<string> {
    await this.page.goto('chrome://extensions/', this.gotoOpts);

    // eslint-disable-next-line max-len
    const devBtnHandle: any = await (this.page as any).evaluateHandle('document.querySelector("body > extensions-manager").shadowRoot.querySelector("extensions-toolbar").shadowRoot.querySelector("#devMode")');
    await devBtnHandle.click();

    // eslint-disable-next-line max-len
    const extIdDivHandle: any = await (this.page as any).evaluateHandle('document.querySelector("body > extensions-manager").shadowRoot.querySelector("#items-list").shadowRoot.querySelector("extensions-item").shadowRoot.querySelector("#extension-id")');
    const rawExtId = await this.page.evaluate(div => div.textContent, extIdDivHandle);
    const extId = rawExtId.split(': ')[1];
    return extId;
  }

  waitForPageCreation(): Promise<Page> {
    return new Promise(resolve => {
      this.browser.once('targetcreated', async target => {
        const page = await target.page();
        resolve(page);
      });
    });
  }

  /*
  scenario plugins are the last to be discovered and imported,
  once all scenarios are present it means all db initial operations are complete
  currently number of builtin installed scenarios: 1
  */
  async waitForDBInitialization() {
    // wait for the scenario page to load, have access to GsfClient
    const queryParams = stringify({ redirectPath: '/scenarios' });
    await this.page.goto(`chrome-extension://${this.extension.id}/admin/admin.html?${queryParams}`, this.gotoOpts);

    const scenarioNo = 2;
    let tryNo = 0;
    let scenarios = [];
    while (tryNo < 10 && scenarios.length < scenarioNo) {
      // eslint-disable-next-line
      scenarios = await this.page.evaluate(() => GsfClient.fetch('GET', 'scenarios'));
      tryNo += 1;

      // eslint-disable-next-line
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    if (scenarios.length !== scenarioNo) {
      throw new Error(`could not get all ${scenarioNo} scenarios`);
    }

    // wait for main table to load,
    await this.page.waitFor('table.table-main', { timeout: 4 * 1000 });
  }

  goto(path: string) {
    const queryParams = stringify({ redirectPath: path });
    return this.page.goto(`chrome-extension://${this.extension.id}/admin/admin.html?${queryParams}`, this.gotoOpts);
  }

  waitFor(selector: string, timeout: number = 1 * 1000) {
    return this.page.waitFor(selector, { timeout });
  }

  close() {
    return this.browser.close();
  }
}

const clearQuerySelector = async (page, selector) => {
  await page.evaluate(selector => {
    document.querySelector(selector).value = '';
  }, selector);
};

export {
  clearQuerySelector,
};
