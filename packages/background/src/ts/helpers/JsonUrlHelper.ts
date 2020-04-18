import { deflate as pakoDeflate, inflate as pakoInflate } from 'pako';

export default class JsonUrlHelper {
  static getDictionary() {
    const sampleJSON = {
      name: '',
      description: '',
      url: '',

      scenario: '',

      plugins: [
        {
          name: 'SelectResourcePlugin',
          opts: {
            delay: 1001,
            frequency: -1,
          },
        },
        {
          name: 'FetchPlugin',
          opts: {
            stabilityTimeout: 0,
          },
        },
        {
          name: 'DynamicNavigationPlugin',
          opts: {
            domRead: true,
            domWrite: true,
            selectors: '.more # content',
            revisit: false,
            stabilityTimeout: 0,
            maxResources: 100,
          },
        },
        {
          name: 'ScrollPlugin',
          opts: {
            delay: 1000,
            enabled: false,
            maxScrollNo: -1,
            domRead: true,
            domWrite: true,
            timeout: 2000,
          },
        },
        {
          name: 'ExtractUrlsPlugin',
          opts: {
            selectors: 'a',
            maxDepth: 11,
            maxResources: 101,
            domRead: true,
          },
        },
        {
          name: 'ExtractHtmlContentPlugin',
          opts: {
            selectors: 'h5',
          },
        },
        {
          name: 'ImageFilterPlugin',
          opts: {},
        },
        {
          name: 'InsertResourcesPlugin',
          opts: {
            maxResources: 5,
          },
        },
        {
          name: 'UpsertResourcePlugin',
          opts: {},
        },
      ],
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
