import { assert } from 'chai';
import IdbStorage from '../../src/ts/storage/IdbStorage';
import IdbProject from '../../src/ts/storage/IdbProject';
import IdbSite from '../../src/ts/storage/IdbSite';

const conn = { info: 'IndexedDB' };

describe(`Test Storage Project - CRUD, using connection ${conn.info}`, () => {
  let Site: typeof IdbSite;
  let Project: typeof IdbProject;

  const expectedProject: Partial<IdbProject> = {
    id: null,
    name: 'projectA',
    url: 'http://siteA',
    crawlOpts: {
      maxDepth: 11,
      maxResources: 101,
      delay: 1001,
      pathnameRe: null,
      resourcePathnameRe: null,
    },
  };

  before(async () => {
    ({ Site, Project } = await IdbStorage.init());
  });

  beforeEach(async () => {
    // cleanup
    await Project.delAll();

    // save project
    const project = new Project(expectedProject);
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
    assert.deepEqual(expectedProject.crawlOpts, projectById.crawlOpts);

    // get project by name
    const projectByName = await Project.get(expectedProject.name);
    assert.instanceOf(projectByName, Project);
    assert.strictEqual(String(expectedProject.id), String(projectByName.id));
    assert.strictEqual(expectedProject.url, projectByName.url);
    assert.deepEqual(expectedProject.crawlOpts, projectByName.crawlOpts);

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
    updateProject.crawlOpts.maxDepth = 21;
    await updateProject.update();

    // get and compare
    const getProject = await Project.get(expectedProject.id);
    assert.strictEqual(updateProject.name, getProject.name);
    assert.strictEqual(updateProject.url, getProject.url);
    assert.strictEqual(updateProject.crawlOpts.maxDepth, getProject.crawlOpts.maxDepth);
  });

  it('delete', async () => {
    // delete project
    const delProject = await Project.get(expectedProject.id);
    await delProject.del();

    // get and compare
    const getProject = await Project.get(expectedProject.id);
    assert.isNull(getProject);

    // make sure linked sites are also deleted
    const linkedSites = await Site.getAll();
    assert.sameDeepMembers(linkedSites, []);
  });
});
