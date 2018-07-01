import NodeFetchPlugin from 'get-set-fetch/lib/plugins/fetch/NodeFetchPlugin';
import TestUtils from 'get-set-fetch/test/utils/TestUtils';

const path = require('path');
const URL = require('url-parse');
const puppeteer = require('puppeteer');

const extension = {
  id: 'cpbaclenlbncmmagcfdlblmmppgmcjfg',
  path: path.resolve(__dirname, '..', '..', 'dist'),
};

/*
discover all site pages
for each one extract document.title as resource.content
export them as csv
*/
describe('Test Extract Document Titles, ', () => {
  let browser = null;
  let page = null;
  let nockScopes = null;

  const gotoOpts = {
    timeout: 10 * 1000,
    waitUntil: 'load',
  };

  async function launchAndInterceptChrome(siteUrl) {
    browser = await puppeteer.launch({
      headless: false,
      args: [
        `--disable-extensions-except=${extension.path}`,
        `--load-extension=${extension.path}`,
        '--no-sandbox',
      ],
    });

    // add new page and intercept request
    page = await browser.newPage();
    await page.setRequestInterception(true);
    page.on('request', async (request) => {
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
          body,
        });
      });
    });
  }

  const siteUrl = 'http://www.site1.com';
  const mainPageUrl = `${siteUrl}/index.html`;

  before(async () => {
    // configure nock to serve fs files
    nockScopes = TestUtils.fs2http(
      path.join('test', 'integration', 'test-crawl-site-extract-html-headers'),
      siteUrl,
    );

    // configure, launch, intercept chrome requests
    await launchAndInterceptChrome(siteUrl);

    // create new site
  });

  after(async () => {
    TestUtils.stopPersisting(nockScopes);

    // close chromium
    await browser.close();
  });

  it('Test Single Page Crawl Project', async () => {
    // open site main page
    await page.goto(mainPageUrl, gotoOpts);

    // trigger new project
    // await page.click('a#newproject');
  });
});
