/* eslint-disable no-await-in-loop */
import { launch, Page, NavigationOptions, Browser, Response, LaunchOptions } from 'puppeteer';

declare const GsfClient;
interface IExtension {
  id?: string;
  path: string;
}

export interface IBrowserProps {
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
    IBrowserProps,
  ) {
    this.gotoOpts = gotoOpts;
    this.httpPort = httpPort;
    this.httpsPort = httpsPort;
    this.closeExtraPages = closeExtraPages;
    this.extension = extension;
  }

  launchBrowser() {
    return launch(this.getLaunchOptions());
  }

  // launches a browser instance
  async launch() {
    this.browser = await this.launchBrowser();

    // wait for the extension to be installed and open the thank_you page
    await this.waitForExtensionPage();

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
    throw new Error('getExtensionId not implemented');
  }

  getLaunchOptions(): LaunchOptions {
    throw new Error('getLaunchOptions not implemented');
  }

  async waitForExtensionPage(): Promise<Page> {
    // retry max 3 times
    let tyPage: Page;
    let retryNo = 0;
    do {
      const pages = await this.browser.pages();
      tyPage = pages.find(page => page.url() === 'https://getsetfetch.org/thank-you-install.html');
      if (tyPage) break;

      retryNo += 1;
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    while (retryNo < 3);

    if (!tyPage) {
      throw new Error('ThankYou Page not opened');
    }

    return tyPage;
  }

  /*
  scenario plugins are the last to be discovered and imported,
  once all scenarios are present it means all db initial operations are complete
  currently number of builtin installed scenarios: 1
  */
  async waitForDBInitialization() {
    // wait for the scenario page to load, have access to GsfClient
    await this.goto('/scenarios');

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

  goto(path: string): Promise<Response> {
    throw new Error('goto not implemented');
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
