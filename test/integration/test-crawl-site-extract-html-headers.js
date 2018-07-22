import TestUtils from 'get-set-fetch/test/utils/TestUtils';
import BrowserHelper from 'test/utils/BrowserHelper';

const fs = require('fs');
const path = require('path');

/* eslint-disable no-shadow */
describe('Site Crawl', () => {
  let browser = null;

  const targetDir = './test/tmp';

  const gotoOpts = {
    timeout: 10 * 1000,
    waitUntil: 'load',
  };

  const actualSite = {
    name: 'siteA',
    url: 'http://www.sitea.com/index.html',
    opts: {
      userPlugins: ['ExtractTitle'],
    },
  };

  before(async () => {
    browser = await BrowserHelper.launchAndStubRequests(
      actualSite.url,
      path.join('test', 'integration', actualSite.name),
    );
  });

  beforeEach(async () => {
    // cleanup fs
    TestUtils.emptyDir(targetDir);
  });

  after(async () => {
    // await browser.close();
  });

  async function waitForCrawlComplete(adminPage, siteId, resolve = null) {
    // if no promise defined return one
    if (!resolve) {
      return new Promise((resolve) => {
        waitForCrawlComplete(adminPage, siteId, resolve);
      });
    }

    const notCrawledResources = await adminPage.evaluate(
      siteId => GsfClient.fetch('GET', `resources/${siteId}/notcrawled`),
      siteId,
    );

    // crawl complete, there are no more resources to be crawled
    if (notCrawledResources.length === 0) {
      resolve();
    }
    // crawl in progress, check again later
    else {
      setTimeout(waitForCrawlComplete, 2000, adminPage, siteId, resolve);
    }

    return null;
  }


  it('Test Crawl Site', async () => {
    // open site list, the default admin page
    const adminPage = await browser.newPage();
    await adminPage.goto(`chrome-extension://${extension.id}/admin/admin.html`, gotoOpts);

    // create site to crawl
    await adminPage.evaluate(site => GsfClient.fetch('POST', 'site', site), actualSite);
    const sites = await adminPage.evaluate(() => GsfClient.fetch('GET', 'sites'));
    assert.strictEqual(1, sites.length);
    const loadedSite = sites[0];

    // reload site list
    const crawlInputId = `input#crawl-${loadedSite.id}[type=button]`;
    await adminPage.goto(`chrome-extension://${extension.id}/admin/admin.html`, gotoOpts);
    await adminPage.waitFor(crawlInputId);

    // start crawling site
    await adminPage.click(crawlInputId);

    // wait for all resources to be crawled (resource.crawledAt is updated for all resources)
    await waitForCrawlComplete(adminPage, loadedSite.id);

    // retrievel crawled resources
    const crawledResources = await adminPage.evaluate(
      siteId => GsfClient.fetch('GET', `resources/${siteId}/crawled`),
      loadedSite.id,
    );
    assert.strictEqual(3, crawledResources.length);

    // check each resource
    const titles = {
      'http://www.sitea.com/index.html': 'siteA',
      'http://www.sitea.com/pageA.html': 'pageA',
      'http://www.sitea.com/pageB.html': 'pageB',
    };
    for (let i = 0; i < crawledResources.length; i += 1) {
      const crawledResource = crawledResources[i];
      assert.strictEqual('text/html', crawledResource.contentType);
      assert.strictEqual(titles[crawledResource.url], crawledResource.info.title);
    }

    // start a CDPSession in order to change download behavior via Chrome Devtools Protocol
    const client = await adminPage.target().createCDPSession();
    await client.send('Page.setDownloadBehavior', { behavior: 'allow', downloadPath: path.resolve(targetDir) });

    // download csv
    await adminPage.click(`a#csv-${loadedSite.id}`);

    // wait a bit for file to be generated and saved
    await new Promise(resolve => setTimeout(resolve, 1000));

    // check file content
    const expectedHeader = 'title';
    const expectedBody = Object.values(titles).join('\n');
    const expectedCsv = `${expectedHeader}\n${expectedBody}`;
    const generatedCsv = fs.readFileSync(path.resolve('./', 'test', 'tmp', `${loadedSite.name}.txt`), 'utf8');
    assert.strictEqual(expectedCsv, generatedCsv);
  });
});
