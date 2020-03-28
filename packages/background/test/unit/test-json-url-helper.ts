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
  const expectedConfigHash = 'eMK7IMOPw43CpcKDKy0ow4rDjwI6w5QRI8KJw4EkFMKQwoVhw4kuwqPCpMKkw4BKX8K/wrzCvFzCrzjCsyQ1US85P1c/My8lwrVCLwMYKMKowqkyPcK1RMK3GMKIw5NASUgXJsKhwpsKCUTDnSLCuCcoTMK9wrjCkisZw6kjMzfCnUAKQcONHcKYUUp2RBrConoEa1QCIxAAwonDicKdw6w=';

  it('encode', async () => {
    const encodedConfigHash = JsonUrlHelper.encode(expectedProject);
    assert.deepEqual(encodedConfigHash, expectedConfigHash);
  });

  it('decode', async () => {
    const decodedProject = JsonUrlHelper.decode(expectedConfigHash);
    assert.deepEqual(decodedProject, expectedProject);
  });
});
