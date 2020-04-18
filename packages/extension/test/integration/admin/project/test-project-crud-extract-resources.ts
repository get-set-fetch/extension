import { assert } from 'chai';
import { resolve } from 'path';
import { Page } from 'puppeteer';
import { BrowserHelper } from 'get-set-fetch-extension-test-utils';
import { IProjectStorage, IPluginDefinition } from 'get-set-fetch-extension-commons';
import ProjectHelper from 'get-set-fetch-extension-test-utils/lib/helper/ProjectHelper';

declare const GsfClient;

/* eslint-disable no-shadow, max-len */
describe('Project CRUD Pages', () => {
  let browserHelper: BrowserHelper;
  let page: Page;

  const expectedProject: IProjectStorage = {
    name: 'projectA',
    description: 'projectA description',
    url: 'http://www.sitea.com/index.html',
    scenario: 'get-set-fetch-scenario-extract-resources',
    plugins: [
      {
        name: 'SelectResourcePlugin',
        opts: {
          delay: 1001,
        },
      },
      {
        name: 'FetchPlugin',
        opts: {},
      },
      {
        name: 'ExtractUrlsPlugin',
        opts: {
          selectors: 'img',
          maxDepth: 11,
          maxResources: 101,
        },
      },
      {
        name: 'ImageFilterPlugin',
        opts: {},
      },
      {
        name: 'ScrollPlugin',
        opts: {},
      },
      {
        name: 'UpsertResourcePlugin',
        opts: {},
      },
      {
        name: 'InsertResourcesPlugin',
        opts: {},
      },
    ],
  };

  const expectedProjectFull: IProjectStorage = {
    name: 'projectA',
    description: 'projectA description',
    url: 'http://www.sitea.com/index.html',
    scenario: 'get-set-fetch-scenario-extract-resources',
    plugins: [
      {
        name: 'SelectResourcePlugin',
        opts: {
          delay: 1001,
          frequency: -1,
        },
      },
      {
        name: 'FetchPlugin',
        opts: {},
      },
      {
        name: 'ScrollPlugin',
        opts: {
          delay: 1000,
          enabled: false,
          maxScrollNo: -1,
          runInTab: true,
          domManipulation: true,
          timeout: 2000,
        },
      },
      {
        name: 'ExtractUrlsPlugin',
        opts: {
          selectors: 'img',
          maxDepth: 11,
          maxResources: 101,
          runInTab: true,
        },
      },
      {
        name: 'ImageFilterPlugin',
        opts: {},
      },
      {
        name: 'InsertResourcesPlugin',
        opts: {},
      },
      {
        name: 'UpsertResourcePlugin',
        opts: {},
      },
    ],
  };

  const expectedConfigHash = 'eLsgz82lgystKMrPAjrUESOJwSQUkIVhyS6jpKTASl+/vLxcrzizJDVRLzk/Vz8zLyW1Qi8DGCioqTI9tUS3GIjTQElIFyahmwoJRN0iuCfISb0oCVYHOTFTI/WiJ1gi0ydKokdJrBhpnpzUm5mbTln6pU4KJC3FAQAl7tle';

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

  it('Test Create New Project - Form Fill', async () => {
    await browserHelper.goto('/projects');

    // open project detail page
    await page.waitFor('#newproject');
    await page.click('#newproject');

    // wait for the project detail page to load
    await page.waitFor('input#name');

    // dropdown scenario is correctly populated#
    const expectedScenariNamedOpts = [
      { label: 'Select' },
      { label: 'get-set-fetch-scenario-extract-resources (builtin)' },
      { label: 'get-set-fetch-scenario-scrape-dynamic-content (builtin)' },
      { label: 'get-set-fetch-scenario-scrape-static-content (builtin)' },
    ];
    const scenarioNameOpts = await page.evaluate(
      () => Array.from((document.getElementById('scenarioPkg.name') as HTMLSelectElement).options)
        .map(
          ({ label }) => ({ label }),
        ),
    );
    assert.sameDeepMembers(scenarioNameOpts, expectedScenariNamedOpts);

    // save project
    await ProjectHelper.saveProject(browserHelper, expectedProject);

    // get the newly created project
    const savedProject = await page.evaluate(name => GsfClient.fetch('GET', `project/${name}`), expectedProject.name);

    // check newly created project props
    const savedProjectWithoutIds = JSON.parse(JSON.stringify(savedProject));
    delete savedProjectWithoutIds.id;

    assert.deepEqual(savedProjectWithoutIds, expectedProjectFull);

    // check newly created project presence in project list
    await page.waitFor(`a[href=\\/project\\/${savedProject.id}`);
    const projectNameInList = await page.evaluate(
      id => document.querySelector(`a[href=\\/project\\/${id}`).innerHTML,
      savedProject.id,
    );
    assert.strictEqual(savedProject.name, projectNameInList);

    // check config hash
    await page.click(`#configHash-${savedProject.id}`);
    const actualConfigHash = await page.$eval('#configHashArea', el => (el as HTMLTextAreaElement).value);
    assert.strictEqual(actualConfigHash, expectedConfigHash);
  });

  it('Test Create New Project - Config Hash', async () => {
    await browserHelper.goto('/projects');

    // open project detail page
    await page.waitFor('#newproject');
    await page.click('#newproject');

    // wait for the project detail page to load
    await page.waitFor('input#name');

    // load the hash
    await page.click('#configHash');
    await page.waitFor('textarea[id="configHashArea"]');
    await page.type('textarea[id="configHashArea"]', expectedConfigHash);
    await page.click('input[data-val="loadConfig"]');

    // wait for form completion
    await page.waitFor(`input#name[value="${expectedProject.name}"]`);

    // save the project
    await page.click('#save');

    // wait for project to be saved and project list to be available
    await page.waitFor('table.table-main');

    // get the newly created project
    const savedProject = await page.evaluate(name => GsfClient.fetch('GET', `project/${name}`), expectedProject.name);

    // check newly created project props
    const savedProjectWithoutIds = JSON.parse(JSON.stringify(savedProject));
    delete savedProjectWithoutIds.id;

    assert.deepEqual(savedProjectWithoutIds, expectedProjectFull);

    // check newly created project presence in project list
    await page.waitFor(`a[href=\\/project\\/${savedProject.id}`);
    const projectNameInList = await page.evaluate(
      id => document.querySelector(`a[href=\\/project\\/${id}`).innerHTML,
      savedProject.id,
    );
    assert.strictEqual(savedProject.name, projectNameInList);

    // check config hash
    await page.click(`#configHash-${savedProject.id}`);
    const actualConfigHash = await page.$eval('#configHashArea', el => (el as HTMLTextAreaElement).value);
    assert.strictEqual(actualConfigHash, expectedConfigHash);

    await page.click('input[data-val="close"]');
  });

  it('Test Update Existing Project', async () => {
    // create a new project
    const projectId = await page.evaluate(project => GsfClient.fetch('POST', 'project', project), expectedProject as any);

    // update it
    const changedSuffix = '_changed';
    const projectToUpdate: IProjectStorage = JSON.parse(JSON.stringify(expectedProject));
    projectToUpdate.id = projectId;
    projectToUpdate.name += changedSuffix;
    projectToUpdate.description += changedSuffix;
    projectToUpdate.url += changedSuffix;

    const extractUrlsPlugin: IPluginDefinition = projectToUpdate.plugins.find(plugin => plugin.name === 'ExtractUrlsPlugin');
    extractUrlsPlugin.opts.maxDepth += 1;
    extractUrlsPlugin.opts.maxResources += 1;
    extractUrlsPlugin.opts.selectors = 'a.changed';

    const selectResourcePlugin: IPluginDefinition = projectToUpdate.plugins.find(plugin => plugin.name === 'SelectResourcePlugin');
    selectResourcePlugin.opts.delay += 1;

    await ProjectHelper.saveProject(browserHelper, projectToUpdate);

    // get the updated project
    const updatedProject = await page.evaluate(id => GsfClient.fetch('GET', `project/${id}`), projectId);

    // compare projects, projectToUpdate doesn't contain some default options that are not manually edited from UI, add them
    selectResourcePlugin.opts.frequency = -1;
    extractUrlsPlugin.opts.runInTab = true;
    const scrollPlugin: IPluginDefinition = projectToUpdate.plugins.find(plugin => plugin.name === 'ScrollPlugin');
    scrollPlugin.opts = {
      delay: 1000,
      enabled: false,
      maxScrollNo: -1,
      runInTab: true,
      domManipulation: true,
      timeout: 2000,
    };

    assert.deepEqual(updatedProject, projectToUpdate);

    // check updated project presence in project list
    await page.waitFor(`a[href=\\/project\\/${updatedProject.id}`);
    const projectNameInList = await page.evaluate(
      id => document.querySelector(`a[href=\\/project\\/${id}`).innerHTML,
      updatedProject.id,
    );
    assert.strictEqual(projectToUpdate.name, projectNameInList);
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
