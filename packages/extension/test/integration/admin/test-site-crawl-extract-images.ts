import queryString from 'query-string';
import { assert } from 'chai';
import { join, resolve } from 'path';
import BrowserHelper from '../../utils/BrowserHelper';

/* eslint-disable no-shadow */
describe('Site Crawl Extract Images', () => {
  let browser = null;
  let adminPage = null;

  const targetDir = join('test', 'tmp'); // ../../test/tmp';

  const gotoOpts = {
    timeout: 10 * 1000,
    waitUntil: 'load'
  };

  const queryParams = queryString.stringify({ redirectPath: '/sites' });

  const actualSite = {
    name: 'siteA',
    url: 'http://www.sitea.com/index.html',
    opts: {},
    pluginDefinitions: [
      {
        name: 'SelectResourcePlugin'
      },
      {
        name: 'ExtensionFetchPlugin'
      },
      {
        name: 'ExtractUrlPlugin',
        opts: {
          extensionRe: '/^(html|htm|php|png)$/i'
        }
      },
      {
        name: 'ExtractTitlePlugin'
      },
      {
        name: 'ImageFilterPlugin'
      },
      {
        name: 'UpdateResourcePlugin'
      },
      {
        name: 'InsertResourcePlugin'
      }
    ]
  };

  before(async () => {
    browser = await BrowserHelper.launch();
    adminPage = await browser.newPage();
    await BrowserHelper.waitForDBInitialization(adminPage);
  });

  afterEach(async () => {
    /*
    // cleanup fs
    TestUtils.emptyDir(targetDir);

    // move to admin page
    await adminPage.goto(`chrome-extension://${extension.id}/admin/admin.html?${queryParams}`, gotoOpts);

    // delete existing sites
    const existingSites = await adminPage.evaluate(() => GsfClient.fetch('GET', 'sites'));
    if (!existingSites) return;
    const siteIds = existingSites.map(existingSite => existingSite.id);
    await adminPage.evaluate(siteIds => GsfClient.fetch('DELETE', 'sites', { ids: siteIds }), siteIds);
    */
  });

  after(async () => {
    // await browser.close();
  });

  async function waitForCrawlComplete(adminPage, siteId, resolve = null) {
    // if no promise defined return one
    if (!resolve) {
      return new Promise((resolve) => {
        setTimeout(waitForCrawlComplete, 5000, adminPage, siteId, resolve);
      });
    }

    const notCrawledResources = await adminPage.evaluate(siteId => GsfClient.fetch('GET', `resources/${siteId}/notcrawled`), siteId);

    // crawl complete, there are no more resources to be crawled
    if (notCrawledResources.length === 0) {
      resolve();
    }
    else {
      setTimeout(waitForCrawlComplete, 5000, adminPage, siteId, resolve);
    }

    return null;
  }

  it('Test Crawl Site Images', async () => {
    // open site list
    await adminPage.goto(`chrome-extension://${extension.id}/admin/admin.html?${queryParams}`, gotoOpts);

    // create site to crawl
    await adminPage.evaluate(site => GsfClient.fetch('POST', 'site', site), actualSite);
    const sites = await adminPage.evaluate(() => GsfClient.fetch('GET', 'sites'));
    assert.strictEqual(1, sites.length);
    const loadedSite = sites[0];

    // reload site list
    await adminPage.goto(`chrome-extension://${extension.id}/admin/admin.html?${queryParams}`, gotoOpts);
    const crawlInputId = `input#crawl-${loadedSite.id}[type=button]`;
    await adminPage.waitFor(crawlInputId);

    // start crawling site
    await adminPage.click(crawlInputId);

    // wait for all resources to be crawled (resource.crawledAt is updated for all resources)
    await waitForCrawlComplete(adminPage, loadedSite.id);

    // retrievel crawled resources
    const crawledResources = await adminPage.evaluate(siteId => GsfClient.fetch('GET', `resources/${siteId}/crawled`), loadedSite.id);
    assert.strictEqual(5, crawledResources.length);

    // check each resource
    const expectedResources = {
      'http://www.sitea.com/index.html': { mediaType: 'text/html', info: { title: 'siteA' } } ,
      'http://www.sitea.com/pageA.html': { mediaType: 'text/html', info: { title: 'pageA' } } ,
      'http://www.sitea.com/pageB.html': { mediaType: 'text/html', info: { title: 'pageB' } } ,
      'http://www.sitea.com/img/imgA-150.png': { mediaType: 'image/png', info: { width: 150, height: 150 } },
      'http://www.sitea.com/img/imgB-850.png': { mediaType: 'image/png', info: { width: 850, height: 850 } }
    };

    for (let i = 0; i < crawledResources.length; i += 1) {
      const crawledResource = crawledResources[i];
      const { url } = crawledResource;
      assert.strictEqual(crawledResource.mediaType, expectedResources[url].mediaType);
      assert.deepEqual(crawledResource.info, expectedResources[url].info);
    }

    // reload site list
    await adminPage.goto(`chrome-extension://${extension.id}/admin/admin.html?${queryParams}`, gotoOpts);
    adminPage.bringToFront();

    // start a CDPSession in order to change download behavior via Chrome Devtools Protocol
    const client = await adminPage
      .target()
      .createCDPSession();
    await client.send('Page.setDownloadBehavior', {
      behavior: 'allow',
      downloadPath: resolve(targetDir)
    });

    // implement: download zip
    /*
    // download csv
    await adminPage.click(`a#csv-${loadedSite.id}`);

    // wait a bit for file to be generated and saved
    await new Promise(resolve => setTimeout(resolve, 1000));

    // check file content
    const expectedHeader = 'title';
    const expectedBody = Object
      .values(titles)
      .join('\n');
    const expectedCsv = `${expectedHeader}\n${expectedBody}`;
    const generatedCsv = readFileSync(resolve('./', 'test', 'tmp', `${loadedSite.name}.txt`), 'utf8');
    assert.strictEqual(expectedCsv, generatedCsv);
    */
  });
});
