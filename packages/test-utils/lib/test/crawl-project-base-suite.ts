import { assert } from 'chai';
import { resolve } from 'path';
import { Page } from 'puppeteer';
import { IProjectStorage, IResource } from 'get-set-fetch-extension-commons';
import BrowserHelper, { IBrowserProps } from '../helper/browser/BrowserHelper';
import ScenarioHelper from '../helper/ScenarioHelper';
import ProjectHelper from '../helper/ProjectHelper';
import CrawlHelper from '../helper/CrawlHelper';
import FileHelper from '../helper/FileHelper';
import FirefoxHelper from '../helper/browser/FirefoxHelper';
import ChromeHelper from '../helper/browser/ChromeHelper';

export interface ICrawlDefinition {
  title: string;
  project: IProjectStorage;
  expectedResourceFields?: string[];
  expectedResources: Partial<IResource>[];
  expectedCsv?: string[];
  csvLineSeparator?: string;
  expectedZipEntries?: string[];
}

export function getBrowserHelper(customProps: IBrowserProps = {}): BrowserHelper {
  const extensionPath = resolve(process.cwd(), 'node_modules', 'get-set-fetch-extension', 'dist');
  const props = Object.assign(
    { extension: { path: extensionPath }, closeExtraPages: false },
    customProps,
  );
  return process.env.browser === 'firefox' ? new FirefoxHelper(props) : new ChromeHelper(props);
}

declare const GsfClient;

const crawlProjectBaseSuite = (title: string, crawlDefinitions: ICrawlDefinition[], cleanup = true) : Mocha.Suite => describe(`Project Crawl ${title}`, () => {
  let browserHelper: BrowserHelper;
  let page: Page;
  const targetDir:string = resolve(process.cwd(), 'test', 'tmp');

  before(async () => {
    browserHelper = getBrowserHelper();
    await browserHelper.launch();
    ({ page } = browserHelper);
  });

  afterEach(async () => {
    if (!cleanup) return;

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
    if (!cleanup) return;

    await browserHelper.close();
  });

  async function checkCrawledResources(siteId, expectedResources, fields) {
    const actualResources = await CrawlHelper.getCrawledResources(page, siteId, fields);
    assert.sameDeepMembers(actualResources, expectedResources);
  }

  async function downloadAndCheckCsv(project, expectedCsv, csvLineSeparator) {
    const generated = await ProjectHelper.downloadProjectCsv(page, project, targetDir, csvLineSeparator);
    assert.strictEqual(generated.header, expectedCsv[0]);
    assert.sameDeepMembers(generated.body, expectedCsv.slice(1));
  }

  async function downloadAndCheckZip(project, expectedZipEntries) {
    const generatedZipEntries = await ProjectHelper.downloadProjectZip(page, project, targetDir);
    assert.sameMembers(generatedZipEntries, expectedZipEntries);
  }

  function crawlProjectIt(crawlDefinition) {
    return it(crawlDefinition.title, async () => {
      const { project } = crawlDefinition;

      // install scenario if not present
      const scenarios = await page.evaluate(() => GsfClient.fetch('GET', 'scenarios'));
      const scenario = scenarios.find(scenario => scenario.name === project.scenario);
      if (!scenario) {
        await ScenarioHelper.installScenario(browserHelper, project.scenario);
      }

      // save new project
      await ProjectHelper.saveProject(browserHelper, project);

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
      await checkCrawledResources(loadedSite.id, crawlDefinition.expectedResources, crawlDefinition.expectedResourceFields);

      // reload project list
      await browserHelper.goto('/projects');
      page.bringToFront();

      // goto project results page
      const resultsInputId = `input#results-${loadedProject.id}[type=button]`;
      await page.waitFor(resultsInputId);
      await page.click(resultsInputId);

      // download and check csv
      if (crawlDefinition.expectedCsv && crawlDefinition.csvLineSeparator) {
        await downloadAndCheckCsv(loadedProject, crawlDefinition.expectedCsv, crawlDefinition.csvLineSeparator);
      }

      // download and check zip
      if (crawlDefinition.expectedZipEntries) {
        await downloadAndCheckZip(loadedProject, crawlDefinition.expectedZipEntries);
      }
    });
  }

  crawlDefinitions.map(crawlDefinition => crawlProjectIt(crawlDefinition));
});

export default crawlProjectBaseSuite;
