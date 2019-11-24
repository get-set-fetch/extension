/* eslint-disable no-useless-escape */
import { assert } from 'chai';
import { IProjectStorage } from 'get-set-fetch-extension-commons';
import JsonUrlHelper from '../../src/ts/helpers/JsonUrlHelper';

describe('Test JsonUrlHelper', () => {
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

  // eslint-disable-next-line max-len
  const expectedConfigHash = 'eMK7w5xrwpDCmMKDwrMLworDssKzwoABw6PCiBFrMAkFZGFYTGbClMKUFFjDqcOrwpfCl8KXw6sVZ8KWwqQmw6olw6fDp8OqZ8OmwqXCpFbDqGXClMOkw6bCoEc0IgwMwrHDhMKlwqEOUsOwG8KiwqUEfRhPXwktw7TDtGE8fVDDpMOjw7BqemrCiW4xEMKnwoEiUhfCpkg3FRLCgcK6RXB3w6gow4HDmAEowpZowqRnwqbDlRTDpMKlw5dkFcKAcGrCusKmwop+JsO1UsKbITVTG1FhRcKaR3VQw6IOw5nCscKewrnCicOpwqluwpk5JcKpRcKYTsKmbmI2BAVTbC0AwpDCssOxGA==';

  it('encode', async () => {
    const encodedConfigHash = JsonUrlHelper.encode(expectedProject);
    assert.deepEqual(encodedConfigHash, expectedConfigHash);
  });

  it('decode', async () => {
    const decodedProject = JsonUrlHelper.decode(expectedConfigHash);
    assert.deepEqual(decodedProject, expectedProject);
  });
});
