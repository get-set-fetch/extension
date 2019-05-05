import { assert } from 'chai';
import { Page } from 'puppeteer';
import BrowserHelper, { clear } from '../../../helpers/BrowserHelper';

/* eslint-disable no-shadow, max-len */
describe('Project CRUD Pages', () => {
  let browserHelper: BrowserHelper;
  let page: Page;

  const expectedProject = {
    name: 'projectA',
    description: 'projectA description',
    url: 'http://www.sitea.com/index.html',
    opts: {},
    scenarioId: 2,
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
          extensionRe: '/^(gif|png|jpg|jpeg)$/i',
          maxDepth: '1'
        }
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
    browserHelper = await BrowserHelper.launch();
    page = browserHelper.page;
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

    // wait for the project detail page to load, react-json-schema form has its own id generating policy appending 'root_" to 1st level schema properties
    await page.waitFor('input#root_name');

    // fill in text input data for a new project
    await page.type('input#root_name', expectedProject.name);
    await page.type('input#root_description', expectedProject.description);
    await page.type('input#root_url', expectedProject.url);

    // dropdown scenario is correctly populated
    const expectedScenarioIdOpts = [
      { value: '', label: '' },
      { value: '1', label: 'get-set-fetch-scenario-extract-html-content' },
      { value: '2', label: 'get-set-fetch-scenario-extract-resources' }
    ];
    const scenarioIdOpts = await page.evaluate(
      () =>
      Array.from((document.getElementById('root_scenarioId') as HTMLSelectElement).options)
      .map(
        ({ value, label }) => ({ value, label })
      )
    );
    assert.sameDeepMembers(scenarioIdOpts, expectedScenarioIdOpts);

     // fill in dropdown scenario
    await page.select('#root_scenarioId', expectedProject.scenarioId.toString());

    // save the project
    await page.click('#save');

    // wait for project to be saved and project list to be available
    await page.waitFor('table.table-main');

    // get the newly created project
    const savedProject = await page.evaluate(name => GsfClient.fetch('GET', `project/${name}`), expectedProject.name);

    // get the linked scenario
    const linkedScenario = await page.evaluate(scenarioId => GsfClient.fetch('GET', `scenario/${scenarioId}`), expectedProject.scenarioId);

    // check newly created project props
    assert.strictEqual(savedProject.name, expectedProject.name);
    assert.strictEqual(savedProject.description, expectedProject.description);
    assert.strictEqual(savedProject.url, expectedProject.url);
    assert.strictEqual(savedProject.scenarioId, expectedProject.scenarioId);
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
    const projectId = await page.evaluate(project => GsfClient.fetch('POST', 'project', project), expectedProject);

    // reload project list
    await browserHelper.goto('/projects');

    // open the newly created project
    await page.waitFor(`a[href=\\/project\\/${projectId}`);
    await page.click(`a[href=\\/project\\/${projectId}`);

    // wait for the project detail page to load
    await page.waitFor('input#root_name');

    // change project properties
    await page.type('input#root_name', changedSuffix);
    await page.type('input#root_description', changedSuffix);
    await page.type('input#root_url', changedSuffix);

    // change linked scenario properties
    const expectedScenarioExtensionRe = '/png/';
    await clear(page, '#root_scenarioProps_extensionRe');
    await page.type('#root_scenarioProps_extensionRe', expectedScenarioExtensionRe);

    const expectedScenarioMaxDepth = '3';
    await clear(page, '#root_scenarioProps_maxDepth');
    await page.type('#root_scenarioProps_maxDepth', expectedScenarioMaxDepth);

    // save the project and return to project list page
    await page.click('#save');

    // get the updated site
    const updatedProject = await page.evaluate(id => GsfClient.fetch('GET', `project/${id}`), projectId);

    // check newly updated project props
    assert.strictEqual(updatedProject.name, `${expectedProject.name}${changedSuffix}`);
    assert.strictEqual(updatedProject.description, `${expectedProject.description}${changedSuffix}`);
    assert.strictEqual(updatedProject.url, `${expectedProject.url}${changedSuffix}`);

    // check scenario opts
    assert.strictEqual(updatedProject.scenarioProps.extensionRe, expectedScenarioExtensionRe);
    assert.strictEqual(updatedProject.scenarioProps.maxDepth, expectedScenarioMaxDepth);

    // check plugin definitions
    const updatedExtractUrlPlugin = updatedProject.pluginDefinitions.find(pluginDef => pluginDef.name === 'ExtractUrlPlugin');
    assert.strictEqual(updatedExtractUrlPlugin.opts.extensionRe, expectedScenarioExtensionRe);

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
    const projectId = await page.evaluate(project => GsfClient.fetch('POST', 'project', project), expectedProject);

    // reload project list
    await browserHelper.goto('/projects');

    // open the newly created project
    await page.waitFor(`a[href=\\/project\\/${projectId}`);
    await page.click(`a[href=\\/project\\/${projectId}`);

    // wait for the project detail page to load
    await page.waitFor('input#root_name');

    // cancel the update
    await page.click('#cancel');

    // wait for list redirection, check project presence in project list
    await page.waitFor(`a[href=\\/project\\/${projectId}`);
  });

  it('Test Delete Existing Project', async () => {
   // create a new project
   const projectId = await page.evaluate(project => GsfClient.fetch('POST', 'project', project), expectedProject);

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
