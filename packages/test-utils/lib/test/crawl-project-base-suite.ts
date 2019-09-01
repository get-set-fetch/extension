import { assert } from 'chai';
import { before } from 'mocha';
import { join, resolve } from 'path';
import { Page } from 'puppeteer';
import BrowserHelper from '../helper/BrowserHelper';
import ScenarioHelper from '../helper/ScenarioHelper';
import ProjectHelper from '../helper/ProjectHelper';
import CrawlHelper from '../helper/CrawlHelper';
import FileHelper from '../helper/FileHelper';

export interface ICrawlDefinition {
  title: string;
  project: {
    name: string;
    description: string;
    url: string;
    crawlOpts?;
  };
  scenarioOpts;
  expectedResources: {
    url: string;
    mediaType: string;
    info;
  }[];
  expectedCsv: string[];
  csvLineSeparator: string;
}

const crawlProjectBaseSuite = (title, crawlDefinitions) => describe(`Project Crawl ${title}`, () => {
  let browserHelper: BrowserHelper;
  let page: Page;
  const targetDir = resolve(process.cwd(), 'test', 'tmp');

  before(async () => {
    const extensionPath = resolve(process.cwd(), 'node_modules', 'get-set-fetch-extension', 'dist');
    browserHelper = new BrowserHelper({ extension: { path: extensionPath } });
    await browserHelper.launch();
    ({ page } = browserHelper);
  });

  afterEach(async () => {
    // cleanup fs
    FileHelper.emptyDir(targetDir);

    // move to admin page
    await browserHelper.goto('/projects');

    // delete existing projects
    const existingProjects = await page.evaluate(() => GsfClient.fetch('GET', 'projects'));
    if (!existingProjects) return;
    const projectIds = existingProjects.map(existingProject => existingProject.id);
    await page.evaluate(projectIds => GsfClient.fetch('DELETE', 'projects', { ids: projectIds }), projectIds);
  });

  after(async () => {
    await browserHelper.close();
  });

  async function checkCrawledResources(siteId, expectedResources) {
    const actualResources = await CrawlHelper.getCrawledResources(page, siteId);
    assert.sameDeepMembers(actualResources, expectedResources);
  }

  async function downloadAndCheckCsv(project, expectedCsv, csvLineSeparator) {
    const generated = await ProjectHelper.downloadProjectCsv(page, project, targetDir, csvLineSeparator);
    assert.strictEqual(generated.header, expectedCsv[0]);
    assert.sameDeepMembers(generated.body, expectedCsv.slice(1));
  }

  function crawlProjectIt(crawlDefinition) {
    return it(crawlDefinition.title, async () => {
      const { project, scenarioOpts } = crawlDefinition;

      // install scenario if not present
      const scenarios = await page.evaluate(() => GsfClient.fetch('GET', 'scenarios'));
      const scenario = scenarios.find(scenario => scenario.name === scenarioOpts.name);
      if (!scenario) {
        await ScenarioHelper.installScenario(browserHelper, scenarioOpts.name);
      }

      // save new project
      await ProjectHelper.saveProject(browserHelper, project, scenarioOpts);

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
      await checkCrawledResources(loadedSite.id, crawlDefinition.expectedResources);

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
        downloadPath: resolve(targetDir),
      });

      // download and check csv
      await downloadAndCheckCsv(loadedProject, crawlDefinition.expectedCsv, crawlDefinition.csvLineSeparator);
    });
  }

  crawlDefinitions.map(crawlDefinition => crawlProjectIt(crawlDefinition));
});

export default crawlProjectBaseSuite;
