import { assert } from 'chai';
import { join, resolve } from 'path';
import BrowserHelper from '../../../helpers/BrowserHelper';
import { Page } from 'puppeteer';
import ScenarioHelper from '../../../helpers/ScenarioHelper';
import ProjectHelper from '../../../helpers/ProjectHelper';
import CrawlHelper from '../../../helpers/CrawlHelper';

describe('Project Crawl Extract Html Headings', () => {
  let browserHelper: BrowserHelper;
  let page: Page;

  const targetDir = join(__dirname, '..', '..', '..', 'tmp');

  const expectedResources = [
    { url: 'https://www.sitea.com/index.html', mediaType: 'text/html', info: { headings: ['Main Header 1'] } },
    { url: 'https://www.sitea.com/pageA.html', mediaType: 'text/html', info: { headings: ['PageA Heading Level 1', 'PageA Heading Level 2'] } },
    { url: 'https://www.sitea.com/pageB.html', mediaType: 'text/html', info: { headings: ['PageA Heading Level 1', 'PageA Heading Level 3'] } }
  ];

  before(async () => {
    browserHelper = await BrowserHelper.launch();
    page = browserHelper.page;
  });

  afterEach(async () => {
    /*
    // cleanup fs
    TestUtils.emptyDir(targetDir);

    // move to admin page
    await browserHelper.goto('/projects');

    // delete existing projects
    const existingProjects = await page.evaluate(() => GsfClient.fetch('GET', 'projects'));
    if (!existingProjects) return;
    const projectIds = existingProjects.map(existingProject => existingProject.id);
    await page.evaluate(projectIds => GsfClient.fetch('DELETE', 'projects', { ids: projectIds }), projectIds);
    */
  });

  after(async () => {
    // await browserHelper.close();
  });

  async function checkCrawledResources(siteId) {
    const actualResources = await CrawlHelper.getCrawledResources(page, siteId);
    assert.sameDeepMembers(actualResources, expectedResources);
  }

  async function downloadAndCheckCsv(project) {
    const generated = await ProjectHelper.downloadProjectCsv(page, project, targetDir);

    // check file content
    const expectedHeader = 'url,mediaType';
    const expectedBody: string[] = expectedResources
      .map(
        resource =>
        [resource.url, resource.mediaType].join(',')
      );

    assert.strictEqual(generated.header, expectedHeader);
    assert.sameDeepMembers(generated.body, expectedBody);
  }

  async function downloadAndCheckZip(project) {
    const actualEntries = await ProjectHelper.downloadProjectZip(page, project, targetDir);
    const expectedEntries = ['imgA-150.png', 'imgB-850.png'];
    assert.sameDeepMembers(actualEntries, expectedEntries);
  }

  it('Test Crawl Project Extract Html Headings', async () => {
    // install extract-html-headings scenario
    await ScenarioHelper.installScenario(page, 'extract-html-headings');

    // save new project
    const project = {
      name: 'projA',
      description: 'descriptionA',
      url: 'https://sitea.com'
    };
    await ProjectHelper.saveProject(browserHelper, project, 'extract-html-headings');

    // verify project has been saved
    const projects = await page.evaluate(() => GsfClient.fetch('GET', 'projects'));
    assert.strictEqual(1, projects.length);
    const loadedProject = projects[0];
    const loadedSites = await page.evaluate(projectId => GsfClient.fetch('GET', `sites/${projectId}`), loadedProject.id);
    assert.strictEqual(1, loadedSites.length);
    const loadedSite = loadedSites[0];

    // reload project list
    await browserHelper.goto('/projects');
    const crawlInputId = `input#crawl-${loadedProject.id}[type=button]`;
    await page.waitFor(crawlInputId);

    // start crawling project
    await page.click(crawlInputId);

    // wait for all resources to be crawled (resource.crawledAt is updated for all resources)
    await CrawlHelper.waitForCrawlComplete(page, loadedSite.id);

    // check crawled resources
    await checkCrawledResources(loadedSite.id);

    // reload project list
    await browserHelper.goto('/projects');
    page.bringToFront();

    // goto project results page
    const resultsInputId = `input#results-${loadedProject.id}[type=button]`;
    await page.waitFor(resultsInputId);
    await page.click(resultsInputId);

    // start a CDPSession in order to change download behavior via Chrome Devtools Protocol
    const client = await page
      .target()
      .createCDPSession();
    await client.send('Page.setDownloadBehavior', {
      behavior: 'allow',
      downloadPath: resolve(targetDir)
    });

    // download and check csv
    await downloadAndCheckCsv(loadedProject);

    // download and check zip
    await downloadAndCheckZip(loadedProject);
  });

});
