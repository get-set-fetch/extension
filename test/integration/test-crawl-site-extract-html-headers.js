import NodeFetchPlugin from 'get-set-fetch/lib/plugins/fetch/NodeFetchPlugin';
import TestUtils from 'get-set-fetch/test/utils/TestUtils';

const path = require('path');
const URL = require('url-parse');
const puppeteer = require('puppeteer');
const { assert } = require('chai');

const extension = {
  id: 'cpbaclenlbncmmagcfdlblmmppgmcjfg',
  path: path.resolve(__dirname, '..', '..', 'dist'),
};

console.log(`extUnpackedPath: ${extension.path}`);


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


  const siteDomain = 'http://www.site1.com';
  const siteMainUrl = `${siteDomain}/index.html`;

  before(async () => {
    // configure nock to serve fs files
    nockScopes = TestUtils.fs2http(
      path.join('test', 'integration', 'test-crawl-site-extract-html-headers'),
      siteDomain,
    );

    // launch chrome
    browser = await puppeteer.launch({
      headless: false,
      args: [
        `--disable-extensions-except=${extension.path}`,
        `--load-extension=${extension.path}`,
      ],
    });

    // add new page and intercept request
    page = await browser.newPage();
    await page.setRequestInterception(true);
    page.on('request', async (request) => {
      if (request.url().indexOf(siteDomain) === -1) {
        request.continue();
        return;
      }

      console.log(`requestInterceptFnc for: ${request.url()}`);
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
      console.log('preparing to do get');
      console.log(reqOpts);
      lib.get(reqOpts, async (response) => {
        console.log('lib get response');
        const contentType = response.headers['Content-Type'] || response.headers['content-type'];
        let body = null;

        if (/(text|html)/.test(contentType)) {
          console.log('NodeFetchPlugin.readUtf8Stream');
          body = await NodeFetchPlugin.readUtf8Stream(response);
        }
        else {
          console.log('NodeFetchPlugin.readBufferStream');
          body = await NodeFetchPlugin.readBufferStream(response);
        }

        request.respond({
          status: response.statusCode,
          headers: response.headers,
          body,
        });
      });
    });
  });

  after(() => {
    TestUtils.stopPersisting(nockScopes);
  });

  it('Test Default Popup', async () => {
    // open extension popup
    await page.goto(`chrome-extension://${extension.id}/popup/popup.html`, gotoOpts);

    // detect links
    const ctx = await page.mainFrame().executionContext();
    const detectedlinks = await ctx.evaluate(() => {
      const links = [];
      const aElms = document.querySelectorAll('a');

      aElms.forEach((aElm) => {
        links.push({
          text: aElm.innerHTML,
          href: aElm.href,
        });
      });

      return links;
    });

    // check if links are rendered correctly
    const expectedLinks = [
      { text: 'Create new project', href: `chrome-extension://${extension.id}/popup/popup.html#` },
      { text: 'Admin Area', href: `chrome-extension://${extension.id}/admin/admin.html` },
    ];
    assert.sameDeepMembers(detectedlinks, expectedLinks);
  });

  it('Test Single Page Crawl Project', async () => {
    // open site main page
    await page.goto(siteMainUrl, gotoOpts);

    // trigger new project
    // await page.click('a#newproject');
  });
});
