import { assert } from 'chai';
import { resolve } from 'path';
import { Page } from 'puppeteer';
import { BrowserHelper, clearQuerySelector } from 'get-set-fetch-extension-test-utils';
import { IProjectStorage } from 'get-set-fetch-extension-commons';

declare const GsfClient;

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
      pathnameRe: '/pathname/',
    },
    scenarioOpts: {
      name: 'get-set-fetch-scenario-extract-resources',
      resourcePathnameRe: '/(gif|png|jpg|jpeg)$/i',
    },
    pluginDefinitions: [
      {
        name: 'SelectResourcePlugin',
        opts: {
          delay: 1001,
        },
      },
      {
        name: 'FetchPlugin',
      },
      {
        name: 'ExtractUrlsPlugin',
        opts: {
          hostnameRe: '/hostname/',
          pathnameRe: '/pathname/',
          resourcePathnameRe: '/(gif|png|jpg|jpeg)$/i',
          maxDepth: 11,
        },
      },
      {
        name: 'ImageFilterPlugin',
      },
      {
        name: 'UpdateResourcePlugin',
      },
      {
        name: 'InsertResourcesPlugin',
        opts: {
          maxResources: 101,
        },
      },
    ],
  };

  const expectedConfigHash = 'eLvca5CYg7MLivKzgAHjiBFrMAkFZGFYTGaUlBRY6euXl5frFWeWpCbqJefn6mfmpaRW6GWU5OagRzQiDAyxxKWhDlLwG6KlBH0YT18JLfT0YTx9UOTj8Gp6aoluMRCngSJSF6ZINxUSgbpFcHfoKMHYASiWaKRnptUU5KXXZBWAcGq6pop+JvVSmyGFqY0UR+ugxQMZ4YycHnMT01PdMnNKUoswnUzdxGwICqbYWgCsQvEY';

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

    // fill in text input data for a new project
    await page.type('input#name', expectedProject.name);
    await page.type('input#description', expectedProject.description);
    await page.type('input#url', expectedProject.url);

    await page.evaluate(() => {
      (document.getElementById('crawlOpts.maxDepth') as HTMLInputElement).value = '';
    });
    await page.type('input[id="crawlOpts.maxDepth"]', expectedProject.crawlOpts.maxDepth.toString());

    await page.evaluate(() => {
      (document.getElementById('crawlOpts.maxResources') as HTMLInputElement).value = '';
    });
    await page.type('input[id="crawlOpts.maxResources"]', expectedProject.crawlOpts.maxResources.toString());

    await page.evaluate(() => {
      (document.getElementById('crawlOpts.delay') as HTMLInputElement).value = '';
    });
    await page.type('input[id="crawlOpts.delay"]', expectedProject.crawlOpts.delay.toString());

    await page.evaluate(() => {
      (document.getElementById('crawlOpts.hostnameRe') as HTMLInputElement).value = '';
    });
    await page.type('input[id="crawlOpts.hostnameRe"]', expectedProject.crawlOpts.hostnameRe.toString());

    await page.evaluate(() => {
      (document.getElementById('crawlOpts.pathnameRe') as HTMLInputElement).value = '';
    });
    await page.type('input[id="crawlOpts.pathnameRe"]', expectedProject.crawlOpts.pathnameRe.toString());

    // dropdown scenario is correctly populated#
    const expectedScenariNamedOpts = [
      { label: 'Select' },
      { label: 'get-set-fetch-scenario-extract-html-content' },
      { label: 'get-set-fetch-scenario-extract-resources' },
    ];
    const scenarioNameOpts = await page.evaluate(
      () => Array.from((document.getElementById('scenarioOpts.name') as HTMLSelectElement).options)
        .map(
          ({ label }) => ({ label }),
        ),
    );
    assert.sameDeepMembers(scenarioNameOpts, expectedScenariNamedOpts);

    // fill in dropdown scenario
    await page.select('select[id="scenarioOpts.name"]', expectedProject.scenarioOpts.name);

    // save the project
    await page.click('#save');

    // wait for project to be saved and project list to be available
    await page.waitFor('table.table-main');

    // get the newly created project
    const savedProject = await page.evaluate(name => GsfClient.fetch('GET', `project/${name}`), expectedProject.name);

    // check newly created project props
    const savedProjectWithoutIds = JSON.parse(JSON.stringify(savedProject));
    delete savedProjectWithoutIds.id;
    assert.deepEqual(savedProjectWithoutIds, expectedProject);

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
    assert.deepEqual(savedProjectWithoutIds, expectedProject);

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

    await page.evaluate(() => {
      (document.getElementById('crawlOpts.maxDepth') as HTMLInputElement).value = '';
    });
    await page.type('input[id="crawlOpts.maxDepth"]', (expectedProject.crawlOpts.maxDepth + 1).toString());

    await page.evaluate(() => {
      (document.getElementById('crawlOpts.maxResources') as HTMLInputElement).value = '';
    });
    await page.type('input[id="crawlOpts.maxResources"]', (expectedProject.crawlOpts.maxResources + 1).toString());

    await page.evaluate(() => {
      (document.getElementById('crawlOpts.delay') as HTMLInputElement).value = '';
    });
    await page.type('input[id="crawlOpts.delay"]', (expectedProject.crawlOpts.delay + 1).toString());

    await page.evaluate(() => {
      (document.getElementById('crawlOpts.hostnameRe') as HTMLInputElement).value = '';
    });
    await page.type('input[id="crawlOpts.hostnameRe"]', '/hostname_changed/');

    await page.evaluate(() => {
      (document.getElementById('crawlOpts.pathnameRe') as HTMLInputElement).value = '';
    });
    await page.type('input[id="crawlOpts.pathnameRe"]', '/pathname_changed/');

    // change linked scenario properties
    const expectedScenarioresourcePathnameRe = '/png/';
    await clearQuerySelector(page, 'input[id="scenarioOpts.resourcePathnameRe"]');
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

    const InsertResourcesPlugin = updatedProject.pluginDefinitions.find(pluginDef => pluginDef.name === 'InsertResourcesPlugin');
    assert.strictEqual(InsertResourcesPlugin.opts.maxResources, expectedProject.crawlOpts.maxResources + 1);

    const selectResourcePlugin = updatedProject.pluginDefinitions.find(pluginDef => pluginDef.name === 'SelectResourcePlugin');
    assert.strictEqual(selectResourcePlugin.opts.delay, expectedProject.crawlOpts.delay + 1);

    // check updated project presence in project list
    await page.waitFor(`a[href=\\/project\\/${updatedProject.id}`);
    const projectNameInList = await page.evaluate(
      id => document.querySelector(`a[href=\\/project\\/${id}`).innerHTML,
      updatedProject.id,
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
