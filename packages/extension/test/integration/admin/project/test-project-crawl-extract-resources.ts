import JSZip from 'jszip/dist/jszip';
import queryString from 'query-string';
import { readFileSync } from 'fs';
import TestUtils from 'get-set-fetch/test/utils/TestUtils';
import { assert } from 'chai';
import { join, resolve } from 'path';
import BrowserHelper from '../../../utils/BrowserHelper';

/* eslint-disable no-shadow */
xdescribe('Project Crawl Extract Resources', () => {
  let browser = null;
  let adminPage = null;

  const targetDir = join(__dirname, '..', '..', '..', 'tmp');

  const gotoOpts = {
    timeout: 10 * 1000,
    waitUntil: 'load'
  };

  const queryParams = queryString.stringify({ redirectPath: '/projects' });

  const actualProject = {
    name: 'projectA',
    description: 'projectA description',
    url: 'https://www.sitea.com/index.html',
    opts: {},
    // directly set scenarioId and overwrite pluginDefinitions normally generated by a scenario instance
    scenarioId: 1,
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

  const expectedResources = [
    { url: 'https://www.sitea.com/index.html', mediaType: 'text/html', info: { title: 'siteA' } },
    { url: 'https://www.sitea.com/pageA.html', mediaType: 'text/html', info: { title: 'pageA' } },
    { url: 'https://www.sitea.com/pageB.html', mediaType: 'text/html', info: { title: 'pageB' } },
    { url: 'https://www.sitea.com/img/imgA-150.png', mediaType: 'image/png', info: { width: 150, height: 150, name: 'imgA-150.png' } },
    { url: 'https://www.sitea.com/img/imgB-850.png', mediaType: 'image/png', info: { width: 850, height: 850, name: 'imgB-850.png' } }
  ];

  before(async () => {
    browser = await BrowserHelper.launch();
    adminPage = await browser.newPage();
    await BrowserHelper.waitForDBInitialization(adminPage);
  });

  afterEach(async () => {
    // cleanup fs
    TestUtils.emptyDir(targetDir);

    // move to admin page
    await adminPage.goto(`chrome-extension://${extension.id}/admin/admin.html?${queryParams}`, gotoOpts);

    // delete existing projects
    const existingProjects = await adminPage.evaluate(() => GsfClient.fetch('GET', 'projects'));
    if (!existingProjects) return;
    const projectIds = existingProjects.map(existingProject => existingProject.id);
    await adminPage.evaluate(projectIds => GsfClient.fetch('DELETE', 'projects', { ids: projectIds }), projectIds);
  });

  after(async () => {
    await browser.close();
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

  async function checkCrawledResources(siteId) {
    // retrieve crawled resources
    let actualResources = await adminPage.evaluate(siteId => GsfClient.fetch('GET', `resources/${siteId}/crawled`), siteId);

    // only keep the properties we're interested in
    actualResources = actualResources.map(({ url, mediaType, info })=> ({ url, mediaType, info }) );

    // check matching
    assert.sameDeepMembers(actualResources, expectedResources);
  }

  async function downloadCsv(project) {
    // open export dropdown
    const downloadBtn = 'button#export';
    await adminPage.waitFor(downloadBtn);
    await adminPage.click(downloadBtn);

    // initiate download
    const csvLink = `a#csv-${project.id}`;
    await adminPage.waitFor(csvLink);
    await adminPage.click(csvLink);

    // wait a bit for file to be generated and saved
    await new Promise(resolve => setTimeout(resolve, 1000));

    // check file content
    const expectedHeader = 'url,info.title,mediaType';
    const expectedBody: string[] = expectedResources
      .map(
        resource =>
        [resource.url, resource.info.title ? resource.info.title : '', resource.mediaType].join(',')
      );

    const generatedContent = readFileSync(resolve(targetDir, `${project.name}.csv`), 'utf8');
    const csvLines = generatedContent.split('\n');

    const generatedHeader = csvLines[0];
    const generatedBody = csvLines.slice(1);

    assert.strictEqual(generatedHeader, expectedHeader);
    assert.sameDeepMembers(generatedBody, expectedBody);
  }

  async function downloadZip(project) {
    // open export dropdown
    const downloadBtn = 'button#export';
    await adminPage.waitFor(downloadBtn);
    await adminPage.click(downloadBtn);

    // initiate download
    const zipLink = `a#zip-${project.id}`;
    await adminPage.waitFor(zipLink);
    await adminPage.click(zipLink);

    // wait a bit for file to be generated and saved
    await new Promise(resolve => setTimeout(resolve, 1000));

    const generatedContent = readFileSync(resolve(targetDir, `${project.name}.zip`), 'binary');
    const archive = await JSZip.loadAsync(generatedContent);

    const expectedEntries = ['imgA-150.png', 'imgB-850.png'];
    const actualEntries = Object.keys(archive.files).map(name => archive.files[name].name);
    assert.sameDeepMembers(actualEntries, expectedEntries);
  }

  it('Test Crawl Project Extract Resources', async () => {
    // open project list
    await adminPage.goto(`chrome-extension://${extension.id}/admin/admin.html?${queryParams}`, gotoOpts);

    // create project to crawl
    await adminPage.evaluate(project => GsfClient.fetch('POST', 'project', project), actualProject);
    const projects = await adminPage.evaluate(() => GsfClient.fetch('GET', 'projects'));
    assert.strictEqual(1, projects.length);
    const loadedProject = projects[0];
    const loadedSites = await adminPage.evaluate(projectId => GsfClient.fetch('GET', `sites/${projectId}`), loadedProject.id);
    assert.strictEqual(1, loadedSites.length);
    const loadedSite = loadedSites[0];

    // reload project list
    await adminPage.goto(`chrome-extension://${extension.id}/admin/admin.html?${queryParams}`, gotoOpts);
    const crawlInputId = `input#crawl-${loadedProject.id}[type=button]`;
    await adminPage.waitFor(crawlInputId);

    // start crawling project
    await adminPage.click(crawlInputId);

    // wait for all resources to be crawled (resource.crawledAt is updated for all resources)
    await waitForCrawlComplete(adminPage, loadedSite.id);

    // check crawled resources
    await checkCrawledResources(loadedSite.id);

    // reload project list
    await adminPage.goto(`chrome-extension://${extension.id}/admin/admin.html?${queryParams}`, gotoOpts);
    adminPage.bringToFront();

    // goto project results page
    const resultsInputId = `input#results-${loadedProject.id}[type=button]`;
    await adminPage.waitFor(resultsInputId);
    await adminPage.click(resultsInputId);

    // start a CDPSession in order to change download behavior via Chrome Devtools Protocol
    const client = await adminPage
      .target()
      .createCDPSession();
    await client.send('Page.setDownloadBehavior', {
      behavior: 'allow',
      downloadPath: resolve(targetDir)
    });

    // download csv
    await downloadCsv(loadedProject);

    // download zip
    await downloadZip(loadedProject);
  });

});
