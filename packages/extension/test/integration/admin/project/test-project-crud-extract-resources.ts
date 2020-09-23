import { assert } from 'chai';
import { Page } from 'puppeteer';
import { BrowserHelper, getBrowserHelper } from 'get-set-fetch-extension-test-utils';
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
    scenario: 'get-set-fetch-scenario-scrape-static-content',
    plugins: [
      {
        name: 'SelectResourcePlugin',
        opts: {
          delay: 1001,
        },
      },
      {
        name: 'FetchPlugin',
        opts: {
          stabilityTimeout: 0,
        },
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
        name: 'ScrollPlugin',
        opts: {},
      },
      {
        name: 'ExtractHtmlContentPlugin',
        opts: {
          selectors: 'h1.title',
        },
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
    scenario: 'get-set-fetch-scenario-scrape-static-content',
    plugins: [
      {
        name: 'SelectResourcePlugin',
        opts: {
          delay: 1001,
        },
      },
      {
        name: 'FetchPlugin',
        opts: {
          stabilityTimeout: 0,
          maxStabilityWaitingTime: 0
        },
      },
      {
        name: 'ScrollPlugin',
        opts: {
          delay: 1000,
          enabled: false,
          maxOperations: -1,
          changeTimeout: 2000,
        },
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
        name: 'ExtractHtmlContentPlugin',
        opts: {
          selectors: 'h1.title',
        },
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

  const expectedConfigHash = 'eLtI4gnagystKMrPAjrUESM7wCQUkIVhWSSjpKTASl+/vLxcD5hYUhP1kvNz9TPzUlIr9DKAgYKag9JTS3SLgTgNlNx1YRJARlFiQaouMIGVZCbrIlIgRbmNrOwFSX8w8fDEzJLMvHSQNFrWw5Gy0RMzSkpPzkjMS08NQU6vYOv8C1KLwNm3GL1UIDYJZ+amE07ElKRaQ72SzJKcVCUSEiVpiRAAWA7hhw==';

  before(async () => {
    browserHelper = getBrowserHelper();
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
      { label: 'get-set-fetch-scenario-scrape-dynamic-content (builtin)' },
      { label: 'get-set-fetch-scenario-scrape-static-content (builtin)' },
    ];
    const scenarioNameOpts = await page.evaluate(
      () => Array.from((document.getElementById('scenarioPkg.name') as HTMLSelectElement).options)
        .map(
          ({ label }) => ({ label }),
        ),
    );
    assert.sameDeepOrderedMembers(scenarioNameOpts, expectedScenariNamedOpts);

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
    await page.waitFor('#configHashArea');
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
    const scrollPlugin: IPluginDefinition = projectToUpdate.plugins.find(plugin => plugin.name === 'ScrollPlugin');
    scrollPlugin.opts = {
      delay: 1000,
      enabled: false,
      maxOperations: -1,
      changeTimeout: 2000,
    };

    const fetchPlugin: IPluginDefinition = projectToUpdate.plugins.find(plugin => plugin.name === 'FetchPlugin');
    fetchPlugin.opts = Object.assign(
      fetchPlugin.opts,
      {
        maxStabilityWaitingTime: 0
      }
    );

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

  it('Test Create Project With Existing Name', async () => {
    // create a new project
    await page.evaluate(project => GsfClient.fetch('POST', 'project', project), expectedProject as any);

    // reload project list
    await browserHelper.goto('/projects');

    // open a new project form
    await page.waitFor('a#newproject');
    await page.click('a#newproject');

    // wait for the project detail page to load
    await page.waitFor('input#name');

    // fill in text input data for the new project
    await page.evaluate(() => {
      (document.getElementById('name') as HTMLInputElement).value = '';
    });
    await page.type('input#name', expectedProject.name);

    await page.evaluate(() => {
      (document.getElementById('url') as HTMLInputElement).value = '';
    });
    await page.type('input#url', expectedProject.url);

    // fill in dropdown scenario
    await page.select('select[id="scenarioPkg.name"]', expectedProject.scenario);

    // wait for scenarioLink to be rendered, this means the plugin schemas are also rendered
    await page.waitFor('[id="scenarioLink"]');

    // save the project
    await page.click('#save');

    // wait for error modal to show up
    await page.waitFor('div.modal-body p#error');
  });
});
