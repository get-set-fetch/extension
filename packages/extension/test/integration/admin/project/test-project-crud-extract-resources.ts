import { assert } from 'chai';
import { Page } from 'puppeteer';
import BrowserHelper, { clear } from '../../../helpers/BrowserHelper';
import { IProjectStorage } from 'get-set-fetch-extension-commons';

/* eslint-disable no-shadow, max-len */
describe('Project CRUD Pages', () => {
  let browserHelper: BrowserHelper;
  let page: Page;

  const expectedProject: Partial<IProjectStorage> = {
    name: 'projectA',
    description: 'projectA description',
    url: 'http://www.sitea.com/index.html',
    crawlOpts: {
      maxDepth: 11,
      maxResources: 101,
      delay: 1001,
      hostnameRe: '/hostname/',
      pathnameRe: '/pathname/'
    },
    scenarioOpts: {
      scenarioId: null
    },
    pluginDefinitions: [
      {
        name: 'SelectResourcePlugin',
        opts: {
          delay: 1001
        }
      },
      {
        name: 'FetchPlugin'
      },
      {
        name: 'ExtractUrlsPlugin',
        opts: {
          hostnameRe: '/hostname/',
          pathnameRe: '/pathname/',
          resourcePathnameRe: '/(gif|png|jpg|jpeg)$/i',
          maxDepth: 11
        }
      },
      {
        name: 'ImageFilterPlugin'
      },
      {
        name: 'UpdateResourcePlugin'
      },
      {
        name: 'InsertResourcePlugin',
        opts: {
          maxResources: 101
        }
      }
    ]
  };

  before(async () => {
    browserHelper = await BrowserHelper.launch();
    page = browserHelper.page;

    // get expectedProject scenarioId
    const scenarios = await page.evaluate(() => GsfClient.fetch('GET', `scenarios`));
    expectedProject.scenarioOpts.scenarioId = scenarios.find(scenario => scenario.name === 'get-set-fetch-scenario-extract-resources').id;
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

  it('Test Create New Project', async () => {
    await browserHelper.goto('/projects');

    // open project detail page
    await page.waitFor('#newproject');
    await page.click('#newproject');

    // wait for the project detail page to load
    await page.waitFor('input#name');

    // fill in text input data for a new project
    await page.type('input#name', expectedProject.name);
    await page.type('input#description', expectedProject.description);
    await page.type('input#url', expectedProject.url);

    await page.evaluate( () => (document.getElementById('crawlOpts.maxDepth') as HTMLInputElement).value = '');
    await page.type('input[id="crawlOpts.maxDepth"]', expectedProject.crawlOpts.maxDepth.toString());

    await page.evaluate( () => (document.getElementById('crawlOpts.maxResources') as HTMLInputElement).value = '');
    await page.type('input[id="crawlOpts.maxResources"]', expectedProject.crawlOpts.maxResources.toString());

    await page.evaluate( () => (document.getElementById('crawlOpts.delay') as HTMLInputElement).value = '');
    await page.type('input[id="crawlOpts.delay"]', expectedProject.crawlOpts.delay.toString());

    await page.evaluate( () => (document.getElementById('crawlOpts.hostnameRe') as HTMLInputElement).value = '');
    await page.type('input[id="crawlOpts.hostnameRe"]', expectedProject.crawlOpts.hostnameRe.toString());

    await page.evaluate( () => (document.getElementById('crawlOpts.pathnameRe') as HTMLInputElement).value = '');
    await page.type('input[id="crawlOpts.pathnameRe"]', expectedProject.crawlOpts.pathnameRe.toString());

    // dropdown scenario is correctly populated#
    const expectedScenarioIdOpts = [
      { label: 'Crawl Scenario' },
      { label: 'get-set-fetch-scenario-extract-html-content' },
      { label: 'get-set-fetch-scenario-extract-resources' }
    ];
    const scenarioIdOpts = await page.evaluate(
      () =>
      Array.from((document.getElementById('scenarioOpts.scenarioId') as HTMLSelectElement).options)
      .map(
        ({ label }) => ({ label })
      )
    );
    assert.sameDeepMembers(scenarioIdOpts, expectedScenarioIdOpts);

     // fill in dropdown scenario
    await page.select('select[id="scenarioOpts.scenarioId"]', expectedProject.scenarioOpts.scenarioId.toString());

    // save the project
    await page.click('#save');

    // wait for project to be saved and project list to be available
    await page.waitFor('table.table-main');

    // get the newly created project
    const savedProject = await page.evaluate(name => GsfClient.fetch('GET', `project/${name}`), expectedProject.name);

    // get the linked scenario
    const linkedScenario = await page.evaluate(scenarioId => GsfClient.fetch('GET', `scenario/${scenarioId}`), expectedProject.scenarioOpts.scenarioId);

    // check newly created project props
    assert.strictEqual(savedProject.name, expectedProject.name);
    assert.strictEqual(savedProject.description, expectedProject.description);
    assert.strictEqual(savedProject.url, expectedProject.url);
    assert.strictEqual(savedProject.scenarioOpts.scenarioId, expectedProject.scenarioOpts.scenarioId);
    assert.deepEqual(savedProject.crawlOpts, expectedProject.crawlOpts);
    assert.sameDeepMembers(savedProject.pluginDefinitions, expectedProject.pluginDefinitions);

    // check newly created project presence in project list
    await page.waitFor(`a[href=\\/project\\/${savedProject.id}`);
    const projectNameInList = await page.evaluate(
      id => document.querySelector(`a[href=\\/project\\/${id}`).innerHTML,
      savedProject.id
    );
    assert.strictEqual(savedProject.name, projectNameInList);
  });

  it('Test Update Existing Project', async () => {
    const changedSuffix = '_changed';

    // create a new project
    const projectId = await page.evaluate(project => GsfClient.fetch('POST', 'project', project), expectedProject as any);

    // reload project list
    await browserHelper.goto('/projects');

    // open the newly created project
    await page.waitFor(`a[href=\\/project\\/${projectId}`);
    await page.click(`a[href=\\/project\\/${projectId}`);

    // wait for the project detail page to load
    await page.waitFor('input#name');

    // change project properties
    await page.type('input#name', changedSuffix);
    await page.type('input#description', changedSuffix);
    await page.type('input#url', changedSuffix);

    await page.evaluate( () => (document.getElementById('crawlOpts.maxDepth') as HTMLInputElement).value = '');
    await page.type('input[id="crawlOpts.maxDepth"]', (expectedProject.crawlOpts.maxDepth + 1).toString());

    await page.evaluate( () => (document.getElementById('crawlOpts.maxResources') as HTMLInputElement).value = '');
    await page.type('input[id="crawlOpts.maxResources"]', (expectedProject.crawlOpts.maxResources + 1).toString());

    await page.evaluate( () => (document.getElementById('crawlOpts.delay') as HTMLInputElement).value = '');
    await page.type('input[id="crawlOpts.delay"]', (expectedProject.crawlOpts.delay + 1).toString());

    await page.evaluate( () => (document.getElementById('crawlOpts.hostnameRe') as HTMLInputElement).value = '');
    await page.type('input[id="crawlOpts.hostnameRe"]', '/hostname_changed/');

    await page.evaluate( () => (document.getElementById('crawlOpts.pathnameRe') as HTMLInputElement).value = '');
    await page.type('input[id="crawlOpts.pathnameRe"]', '/pathname_changed/');

    // change linked scenario properties
    const expectedScenarioresourcePathnameRe = '/png/';
    await clear(page, 'input[id="scenarioOpts.resourcePathnameRe"]');
    await page.type('input[id="scenarioOpts.resourcePathnameRe"]', expectedScenarioresourcePathnameRe);

    // save the project and return to project list page
    await page.click('#save');

    // get the updated site
    const updatedProject = await page.evaluate(id => GsfClient.fetch('GET', `project/${id}`), projectId);

    // check newly updated project props
    assert.strictEqual(updatedProject.name, `${expectedProject.name}${changedSuffix}`);
    assert.strictEqual(updatedProject.description, `${expectedProject.description}${changedSuffix}`);
    assert.strictEqual(updatedProject.url, `${expectedProject.url}${changedSuffix}`);

    assert.strictEqual(updatedProject.crawlOpts.maxDepth, expectedProject.crawlOpts.maxDepth + 1);
    assert.strictEqual(updatedProject.crawlOpts.maxResources, expectedProject.crawlOpts.maxResources + 1);
    assert.strictEqual(updatedProject.crawlOpts.delay, expectedProject.crawlOpts.delay + 1);

    assert.strictEqual(updatedProject.crawlOpts.hostnameRe, '/hostname_changed/');
    assert.strictEqual(updatedProject.crawlOpts.pathnameRe, '/pathname_changed/');

    // check scenario opts
    assert.strictEqual(updatedProject.scenarioOpts.resourcePathnameRe, expectedScenarioresourcePathnameRe);

    // check plugin definitions
    const updatedExtractUrlsPlugin = updatedProject.pluginDefinitions.find(pluginDef => pluginDef.name === 'ExtractUrlsPlugin');
    assert.strictEqual(updatedExtractUrlsPlugin.opts.resourcePathnameRe, expectedScenarioresourcePathnameRe);
    assert.strictEqual(updatedExtractUrlsPlugin.opts.maxDepth, expectedProject.crawlOpts.maxDepth + 1);

    const insertResourcePlugin = updatedProject.pluginDefinitions.find(pluginDef => pluginDef.name === 'InsertResourcePlugin');
    assert.strictEqual(insertResourcePlugin.opts.maxResources, expectedProject.crawlOpts.maxResources + 1);

    const selectResourcePlugin = updatedProject.pluginDefinitions.find(pluginDef => pluginDef.name === 'SelectResourcePlugin');
    assert.strictEqual(selectResourcePlugin.opts.delay, expectedProject.crawlOpts.delay + 1);

    // check updated project presence in project list
    await page.waitFor(`a[href=\\/project\\/${updatedProject.id}`);
    const projectNameInList = await page.evaluate(
      id => document.querySelector(`a[href=\\/project\\/${id}`).innerHTML,
      updatedProject.id
    );
    assert.strictEqual(`${expectedProject.name}${changedSuffix}`, projectNameInList);
  });

  it('Test Update and Cancel Existing Project', async () => {
    // create a new project
    const projectId = await page.evaluate(project => GsfClient.fetch('POST', 'project', project), expectedProject as any);

    // reload project list
    await browserHelper.goto('/projects');

    // open the newly created project
    await page.waitFor(`a[href=\\/project\\/${projectId}`);
    await page.click(`a[href=\\/project\\/${projectId}`);

    // wait for the project detail page to load
    await page.waitFor('input#name');

    // cancel the update
    await page.click('#cancel');

    // wait for list redirection, check project presence in project list
    await page.waitFor(`a[href=\\/project\\/${projectId}`);
  });

  it('Test Delete Existing Project', async () => {
   // create a new project
   const projectId = await page.evaluate(project => GsfClient.fetch('POST', 'project', project), expectedProject as any);

   // reload project list
   await browserHelper.goto('/projects');

    // wait for delete button to show up
   await page.waitFor(`input#delete-${projectId}`);

    // delete it
   await page.click(`input#delete-${projectId}`);

    // reload project list
   await browserHelper.goto('/projects');
   await page.waitFor('p#no-entries');

    // check table is no longer present since there are no sites to display
   const tableCount = await page.evaluate(() => document.querySelectorAll('table').length);
   assert.strictEqual(tableCount, 0);
  });

});
