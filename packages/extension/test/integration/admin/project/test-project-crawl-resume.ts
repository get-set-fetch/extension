import { assert } from 'chai';
import { resolve } from 'path';
import { Page } from 'puppeteer';
import { BrowserHelper } from 'get-set-fetch-extension-test-utils';
import { IProjectStorage } from 'get-set-fetch-extension-commons';
import ProjectHelper from 'get-set-fetch-extension-test-utils/lib/helper/ProjectHelper';
import CrawlHelper from 'get-set-fetch-extension-test-utils/lib/helper/CrawlHelper';

declare const GsfClient;

/* eslint-disable no-shadow, max-len */
describe('Resume Crawling', () => {
  let browserHelper: BrowserHelper;
  let page: Page;

  const project: IProjectStorage = {
    name: 'projectA',
    description: 'projectA description',
    url: 'http://www.sitea.com/index.html',
    scenario: 'get-set-fetch-scenario-scrape-static-content',
    plugins: [
      {
        name: 'SelectResourcePlugin',
        opts: {
          delay: 5000,
        },
      },
      {
        name: 'ExtractUrlsPlugin',
        opts: {
          maxDepth: -1,
          maxResources: -1,
          selectors: 'a[href$=".html"] # follow html links',
        },
      },
      {
        name: 'ExtractHtmlContentPlugin',
        opts: {
          selectors: 'h1\ni.classA # headlines',
        },
      },
    ],
  };

  before(async () => {
    const extensionPath = resolve(process.cwd(), 'node_modules', 'get-set-fetch-extension', 'dist');
    browserHelper = new BrowserHelper({ extension: { path: extensionPath } });
    await browserHelper.launch();
    ({ page } = browserHelper as { page: Page });
  });

  beforeEach(async () => {
    // load project list
    await browserHelper.goto('/projects');
  });

  afterEach(async () => {
    // delete existing projects
    const existingProjects = await page.evaluate(() => GsfClient.fetch('GET', 'projects'));
    if (!existingProjects) return;
    const projectIds = existingProjects.map(existingProject => existingProject.id);
    await page.evaluate(ids => GsfClient.fetch('DELETE', 'projects', { ids }), projectIds);
  });

  after(async () => {
    await browserHelper.close();
  });

  it('Test Pause/Resume', async () => {
    await browserHelper.goto('/projects');

    // open project detail page
    await page.waitFor('#newproject');
    await page.click('#newproject');

    // wait for the project detail page to load
    await page.waitFor('input#name');

    // save project
    await ProjectHelper.saveProject(browserHelper, project);

    // get the newly created project
    const savedProject = await page.evaluate(name => GsfClient.fetch('GET', `project/${name}`), project.name);

    // get the newly created site(s)
    const savedSites = await page.evaluate(projectId => GsfClient.fetch('GET', `sites/${projectId}`), savedProject.id);
    assert.strictEqual(1, savedSites.length);
    const savedSite = savedSites[0];

    // reload project list
    await browserHelper.goto('/projects');
    const crawlInputId = `input#crawl-${savedProject.id}[type=button]`;
    await page.waitFor(crawlInputId);

    // start scraping
    await page.click(crawlInputId);

    // pause scraping after 1st resource has been scraped
    await new Promise(resolve => {
      /*
      with SelectResourcePlugin having a delay of 5s between fetching consecutive resources
      a delay of 7s will ensure a single resource is crawled when the tab is closed
      */
      setTimeout(
        () => {
          // close current scraping tab
          page.evaluate(() => GsfClient.fetch('GET', 'utils/closeactivetab'));
          resolve();
        },
        8000,
      );
    });

    // wait for 2nd resource to result in crawlInError flag
    await new Promise(resolve => setTimeout(resolve, 5000));

    let actualResources = await page.evaluate(siteId => GsfClient.fetch('GET', `resources/${siteId}`), savedSite.id);

    // two resources, none crawlInProgress, one with crawledAt reseted
    assert.strictEqual(actualResources.length, 2);
    assert.strictEqual(actualResources.filter(resource => resource.crawlInProgress === 0).length, 2);
    assert.strictEqual(actualResources.filter(resource => new Date(resource.crawledAt).getTime() === new Date(0).getTime()).length, 1);

    actualResources = actualResources.map(({ url, content }) => ({ url, content }));
    let expectedResources = [
      {
        url: 'http://www.sitea.com/index.html',
        content: { h1: [ 'Main Header 1' ], 'i.classA': [ 'italics main' ] },
      },
      {
        url: 'http://www.sitea.com/static/pageA.html',
        content: {},
      },
    ];
    assert.sameDeepMembers(actualResources, expectedResources);

    // resume scraping with a little bit of pause between
    await new Promise(resolve => setTimeout(resolve, 1500));
    await page.click(crawlInputId);

    // wait for all resources to be crawled (resource.crawledAt is updated for all resources)
    await CrawlHelper.waitForCrawlComplete(page, savedSite.id);

    // check saved resources
    actualResources = await page.evaluate(siteId => GsfClient.fetch('GET', `resources/${siteId}`), savedSite.id);
    actualResources = actualResources.map(({ url, content }) => ({ url, content }));

    expectedResources = [
      {
        url: 'http://www.sitea.com/index.html',
        content: { h1: [ 'Main Header 1' ], 'i.classA': [ 'italics main' ] },
      },
      {
        url: 'http://www.sitea.com/static/pageA.html',
        content: { h1: [ 'PageA Heading Level 1' ], 'i.classA': [ 'italics A' ] },
      },
      {
        url: 'http://www.sitea.com/static/pageB.html',
        content: { h1: [ 'PageB Heading Level 1', 'PageB Heading Level 1' ], 'i.classA': [ 'italics B1', 'italics B2' ] },
      },
    ];

    assert.sameDeepMembers(actualResources, expectedResources);
  });
});
