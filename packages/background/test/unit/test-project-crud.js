import SystemJS from 'systemjs';
import ExternalStorageTests from 'get-set-fetch/test/external/external-storage-tests';
import IdbStorage from '../../src/js/storage/IdbStorage.ts';
import ModuleHelper from '../utils/ModuleHelper.ts';
import PluginManager from '../../src/js/plugins/PluginManager.ts';
import GsfProvider from '../../src/js/storage/GsfProvider.ts';

const { assert } = require('chai');

const conn = { info: 'IndexedDB' };

describe(`Test Storage Project - CRUD, using connection ${conn.info}`, () => {
  let Site = null;
  let Project = null;

  const expectedProject = {
    id: null,
    name: 'projectA',
    url: 'http://siteA'
  };

  before(async () => {
    ({ Site, Project } = await IdbStorage.init(conn));
  });

  beforeEach(async () => {
    // cleanup
    await Site.delAll();
    await Project.delAll();

    // save project
    const project = new Project({name: expectedProject.name, url: expectedProject.url});
    await project.save();
    assert.isNotNull(project.id);
    expectedProject.id = project.id;
  });

  after(async () => {
    await IdbStorage.close();
  });

  it('get', async () => {
    // get project by id
    const projectById = await Project.get(expectedProject.id);
    assert.instanceOf(projectById, Project);
    assert.strictEqual(expectedProject.name, projectById.name);
    assert.strictEqual(expectedProject.url, projectById.url);

    // get project by name
    const projectByName = await Project.get(expectedProject.name);
    assert.instanceOf(projectByName, Project);
    assert.strictEqual(String(expectedProject.id), String(projectByName.id));
    assert.strictEqual(expectedProject.url, projectByName.url);

    // get corresponding site
    const projectSite = await Site.get(`${expectedProject.name}-1`);
    assert.instanceOf(projectSite, Site);
    assert.strictEqual(expectedProject.url, projectSite.url);
  });

  it('update', async () => {
    // update project
    const updateProject = await Project.get(expectedProject.id);
    updateProject.name = 'projectA_updated';
    updateProject.url = 'http://siteA/updated';
    await updateProject.update();

    // get and compare
    const getProject = await Project.get(expectedProject.id);
    assert.strictEqual(updateProject.name, getProject.name);
    assert.strictEqual(updateProject.url, getProject.url);
  });

  it('delete', async () => {
    // delete project
    const delProject = await Site.get(expectedProject.id);
    await delProject.del();

    // get and compare
    const getProject = await Site.get(expectedProject.id);
    assert.isNull(getProject);
  });
});
