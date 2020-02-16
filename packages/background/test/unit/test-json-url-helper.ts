/* eslint-disable no-useless-escape */
import { assert } from 'chai';
import { IProjectStorage } from 'get-set-fetch-extension-commons';
import JsonUrlHelper from '../../src/ts/helpers/JsonUrlHelper';

describe('Test JsonUrlHelper', () => {
  const expectedProject: Partial<IProjectStorage> = {
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

  // eslint-disable-next-line max-len
  const expectedConfigHash = 'eMK7CMOpasKtwoPDqy0ow4rDjwLDusOeESMIYRIKw4jDgsKwYMONKCkpwrDDksOXLy8vw5crw44sSU3DlEvDjsOPw5XDj8OMS0nCrcOQw4sow4nDjUENw7XDtMOUEsOdYiBOA8KFwpguTEI3FRJSwrpFcMKnURY7wobDlMKMHX0YT18JLWbDtGE8wpAMw4zDrQEoKjTDkjPDk2oKw7LDkmvCsgpAODVdU0U/EyXCvg1RHMOrwpnCm8KYwp7DqsKWwplTwpJawoTDqWTDqkbCviEowphiawFWw73Cs3E=';

  it('encode', async () => {
    const encodedConfigHash = JsonUrlHelper.encode(expectedProject);
    assert.deepEqual(encodedConfigHash, expectedConfigHash);
  });

  it('decode', async () => {
    const decodedProject = JsonUrlHelper.decode(expectedConfigHash);
    assert.deepEqual(decodedProject, expectedProject);
  });
});
