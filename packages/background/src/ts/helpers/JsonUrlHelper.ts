import { deflate as pakoDeflate, inflate as pakoInflate } from 'pako';

export default class JsonUrlHelper {
  static getDictionary() {
    const sampleJSON = {
      name: '',
      description: '',
      url: '',

      crawlOpts: {
        delay: 1000,
        hostnameRe: '',
        maxDepth: -1,
        maxResources: 100,
        pathnameRe: '',
      },

      pluginDefinitions: [
        {
          name: 'SelectResourcePlugin',
          opts: {
            delay: 1000,
          },
        },
        {
          name: 'FetchPlugin',
        },
        {
          name: 'ExtractUrlsPlugin',
          opts: {
            hostnameRe: '',
            maxDepth: -1,
            pathnameRe: '',
          },
        },
        {
          name: 'UpdateResourcePlugin',
        },
        {
          name: 'InsertResourcesPlugin',
          opts: {
            maxResources: 5,
          },
        },
      ],

      scenarioOpts: {
        name: '',
      },
    };

    return JSON.stringify(sampleJSON);
  }

  static encode(input: object): string {
    const stringified = JSON.stringify(input);
    const deflatedIntArr = pakoDeflate(stringified, { dictionary: JsonUrlHelper.getDictionary() });
    const deflatedString = String.fromCharCode(...deflatedIntArr);
    const deflatedBase64String = btoa(deflatedString);
    return deflatedBase64String;
  }

  static decode(deflatedBase64String: string): object {
    const deflatedString = atob(deflatedBase64String);
    const deflatedIntArr = deflatedString.split('').map(val => val.charCodeAt(0));
    const inflatedString = pakoInflate(deflatedIntArr, { dictionary: JsonUrlHelper.getDictionary(), to: 'string' } as any);
    const inflatedInstance = JSON.parse(inflatedString);

    return inflatedInstance;
  }
}
