import { assert } from 'chai';
import * as sinon from 'sinon';
import * as fs from 'fs';
import * as path from 'path';
import { Response } from 'node-fetch';
import ScenarioManager from '../../src/ts/scenarios/ScenarioManager';
import { NpmPackage } from 'get-set-fetch-extension-commons';
import { IScenarioPackage } from 'get-set-fetch-extension-commons/lib/scenario';

describe('Test ScenarioManager', () => {
  let sandbox;
  let fetchStub;

  before(() => {
    sandbox = sinon.createSandbox();
    fetchStub = sandbox.stub(window, 'fetch');

    // stub gsf readme.md
    fetchStub.withArgs('https://raw.githubusercontent.com/get-set-fetch/extension/master/README.md', sinon.match.any)
    .returns(
      new Promise((resolve) => {
        const readme = fs.readFileSync(path.join(__dirname, '..', 'resources', 'scenarios', 'gsf-readme.md'));
        const response = new Response(readme);
        resolve(response);
      })
    );

    // stub scenario-a package json
    fetchStub.withArgs('https://registry.npmjs.org/scenario-a/0.1.5', sinon.match.any)
    .returns(
      new Promise((resolve) => {
        const readme = fs.readFileSync(path.join(__dirname, '..', 'resources', 'scenarios', 'scenario-a-package.json'));
        const response = new Response(readme);
        resolve(response);
      })
    );

    // stub scenario-a tarball
    fetchStub.withArgs('https://registry.npmjs.org/scenario-a/-/scenario-a-0.1.5.tgz', sinon.match.any)
    .returns(
      new Promise((resolve) => {
        const readme = fs.readFileSync(path.join(__dirname, '..', 'resources', 'scenarios', 'scenario-a.tgz'));
        const response = new Response(readme);
        resolve(response);
      })
    );
  });

  after(() => {
    sandbox.restore();
  });

  it('get available scenarios from readme', async () => {
    const actualScenarios = await ScenarioManager.getNpmScenarioUrls();
    const expectedScenarios: string[] = [
      'https://registry.npmjs.org/scenario-a/0.1.5',
      'https://registry.npmjs.org/scenario-b/2.3.0'
    ];

    assert.sameDeepOrderedMembers(actualScenarios, expectedScenarios);
  });

  it('get npm scenario details', async () => {
    const actualDetails: IScenarioPackage = await ScenarioManager.getNpmScenarioDetails('https://registry.npmjs.org/scenario-a/0.1.5');
    const expectedDetails: IScenarioPackage = {
      name: 'scenario-a',
      package: {
        name: 'scenario-a',
        version: '0.1.5',
        description: 'Scenario A description',
        main: 'dist/scenario-a.js',
        author: 'Author A',
        license: 'MIT',
        homepage: 'https://github.com/scenario-a/scenario-a#readme'
      },
      code: 'scenario a code',
      builtin: false
    };
    assert.deepEqual(actualDetails, expectedDetails);
  });
});
