/* eslint-disable no-useless-escape */
import { assert } from 'chai';
import { IProjectStorage } from 'get-set-fetch-extension-commons';
import JsonUrlHelper from '../../src/ts/helpers/JsonUrlHelper';

describe('Test JsonUrlHelper', () => {
  const expectedProject: Partial<IProjectStorage> = {
    name: 'projectA',
    description: 'projectA description',
    url: 'http://www.sitea.com/index.html',
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

  // eslint-disable-next-line max-len
  const expectedConfigHash = 'eMK7w6HDkn05woMrLSjDisOPAsKGwpsjwoYWwpjChALCsjAsMjJKSgrCrMO0w7XDi8OLw4vDtcKKM0tSE8O1wpLDs3PDtTPDs1JSK8O0Mkpyc8KUcMK6LD3CtUTCtxjCiMOTQMOhwq4LU8KkwpsKCW/DnSLCuAd1wpRgw6wAw6QQw5XDl0jDj0zCqynDiEvCr8OJKgDDocOUdE0Vw71MYDBSKXEYUjNxw6jDg3jDukpoCUMfw4bDkyfDkcKjw4jDicONEMOFwrHCnsK5w4DDiHXDi8OMKUktw4J0MnXDk8KeISjCmGJrAcKHw5rDjMKE';

  it('encode', async () => {
    const encodedConfigHash = JsonUrlHelper.encode(expectedProject);
    assert.deepEqual(encodedConfigHash, expectedConfigHash);
  });

  it('decode', async () => {
    const decodedProject = JsonUrlHelper.decode(expectedConfigHash);
    assert.deepEqual(decodedProject, expectedProject);
  });
});
