import queryString from 'query-string';
import NodeFetchPlugin from 'get-set-fetch/lib/plugins/fetch/NodeFetchPlugin';
import TestUtils from 'get-set-fetch/test/utils/TestUtils';

import URL from 'url-parse';
import { launch, Request, Page } from 'puppeteer';

export default class BrowserHelper {
  // launches a browser instance
  static async launch() {
    const browser = await launch({
      headless: false,
      args: [
        `--disable-extensions-except=${extension.path}`,
        `--load-extension=${extension.path}`,
        '--no-sandbox'
      ]
    });

    return browser;
  }

  // launches a browser instance stubbing siteUrl requests from siteFilePath static files
  static async launchAndStubRequests(siteUrl, siteFilePath) {
    // launch browser
    const browser = await launch({
      headless: false,
      args: [
        `--disable-extensions-except=${extension.path}`,
        `--load-extension=${extension.path}`,
        '--no-sandbox'
      ]
    });

    // configure nock to serve fs files
    const urlObj = new URL(siteUrl);
    const baseUrl = `${urlObj.protocol}//${urlObj.host}`;
    const nockScopes = TestUtils.fs2http(siteFilePath, baseUrl.toLowerCase());

    browser.on('targetcreated', async (target) => {
      // when chrome is launch, event is trigerred with target.type === background_page, a non visible page. ignore it
      if (target.type() === 'page') {
        const page = await target.page();
        BrowserHelper.interceptAndStubRequests(page, baseUrl);
      }
    });

    browser.on('disconnected', () => {
      TestUtils.stopPersisting(nockScopes);
    });

    return browser;
  }

  static async interceptAndStubRequests(page, siteUrl) {
    // intercept request
    await page.setRequestInterception(true);
    page.on('request', async (request: Request) => {
      if (request.url().indexOf(siteUrl) === -1) {
        request.continue();
        return;
      }

      // add urlObj props to http|https request options
      const urlObj = new URL(request.url());
      const reqOpts = {
        protocol: urlObj.protocol,
        host: urlObj.host,
        port: urlObj.port,
        path: urlObj.pathname,
        headers: null
      };

      reqOpts.headers = request.headers();
      const lib = reqOpts.protocol === 'https:' ? require('https') : require('http');
      lib.get(reqOpts, async (response) => {
        const contentType = response.headers['Content-Type'] || response.headers['content-type'];
        let body = null;

        if (/(text|html)/.test(contentType)) {
          body = await NodeFetchPlugin.readUtf8Stream(response);
        }
        else {
          body = await NodeFetchPlugin.readBufferStream(response);
        }

        request.respond({
          status: response.statusCode,
          headers: response.headers,
          body
        });
      });
    });

    return page;
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
      await browserPage.waitFor('table.table-main', { timeout: 1 * 1000 });
    }
    catch (err) {
      await browserPage.goto(`chrome-extension://${extension.id}/admin/admin.html?${queryParams}`, gotoOpts);
      await browserPage.waitFor('table.table-main', { timeout: 1 * 1000 });
    }
  }
}
