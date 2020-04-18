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
          selectors: 'img',
          maxDepth: 11,
          maxResources: -1,
        },
      },
      {
        name: 'ImageFilterPlugin',
      },
      {
        name: 'InsertResourcesPlugin',
        opts: {
          maxResources: 101,
        },
      },
      {
        name: 'UpsertResourcePlugin',
      },
    ],
  };

  // eslint-disable-next-line max-len
  const expectedConfigHash = 'eMK7SMOiCcOawoMrLSjDisOPAjrDlBEjO8OAJBTCkMKFYVkkwqPCpMKkw4BKX8K/wrzCvFwPwphYUhPDtcKSw7Nzw7Uzw7NSUivDtDLCgMKBwoLCmsKDw5JTS3TCi8KBOA3ClMOcdWESwrrCqcKQQMOULcKCe8KCw4LCnMKGK2vCkcKRPDJzw5MJJBDDlMKcwowZwqVkR8KkIcKqR8KwRiUwAgHCicOJwp3DrA==';

  it('encode', async () => {
    const encodedConfigHash = JsonUrlHelper.encode(expectedProject);
    assert.deepEqual(encodedConfigHash, expectedConfigHash);
  });

  it('decode', async () => {
    const decodedProject = JsonUrlHelper.decode(expectedConfigHash);
    assert.deepEqual(decodedProject, expectedProject);
  });
});
