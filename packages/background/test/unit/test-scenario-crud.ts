import { assert } from 'chai';
import { IScenarioStorage } from 'get-set-fetch-extension-commons';
import IdbStorage from '../../src/ts/storage/IdbStorage';

const conn = { info: 'IndexedDB' };

describe(`Test Storage ScenarioPackage - CRUD, using connection ${conn.info}`, () => {
  let Scenario = null;

  const expectedScenarioPkg: IScenarioStorage = {
    id: null,
    name: 'scenario A',
    code: 'code A',
    builtin: true,
    package: {
      name: 'Scenario A',
      version: '0.1.5',
      description: 'Scenario A description',
      main: 'dist/scenario-a.js',
      author: 'Author A',
      license: 'MIT',
      homepage: 'https://github.com/scenario-a/scenario-a#readme',
    },
  };

  before(async () => {
    ({ Scenario } = await IdbStorage.init());
  });

  beforeEach(async () => {
    // cleanup
    await Scenario.delAll();

    // save scenario package
    const scenarioPkg = new Scenario(expectedScenarioPkg);
    await scenarioPkg.save();
    assert.isNotNull(scenarioPkg.id);
    expectedScenarioPkg.id = scenarioPkg.id;
  });

  after(async () => {
    await IdbStorage.close();
  });

  it('get', async () => {
    // get scenario package by id
    const scenarioPkgById = await Scenario.get(expectedScenarioPkg.id);
    assert.instanceOf(scenarioPkgById, Scenario);
    assert.deepEqual(expectedScenarioPkg, scenarioPkgById);

    // get scenario package by name
    const scenarioPkgByName = await Scenario.get(expectedScenarioPkg.name);
    assert.instanceOf(scenarioPkgByName, Scenario);
    assert.deepEqual(String(expectedScenarioPkg.id), String(scenarioPkgByName.id));
  });

  it('update', async () => {
    // update scenario package
    const updateScenarioPkg = await Scenario.get(expectedScenarioPkg.id);
    updateScenarioPkg.name = 'scenario A updated';
    updateScenarioPkg.code = 'code A updated';
    await updateScenarioPkg.update();

    // get and compare
    const getScenarioPkg = await Scenario.get(expectedScenarioPkg.id);
    assert.deepEqual(updateScenarioPkg, getScenarioPkg);
  });

  it('delete', async () => {
    // delete scenario package
    const delScenarioPkg = await Scenario.get(expectedScenarioPkg.id);
    await delScenarioPkg.del();

    // get and compare
    const getScenarioPkg = await Scenario.get(expectedScenarioPkg.id);
    assert.isNull(getScenarioPkg);
  });
});
