import { ISite, IResource, IEnhancedJSONSchema } from 'get-set-fetch-extension-commons';
import { BasePlugin } from 'get-set-fetch-extension-commons/lib/plugin';

export default class ExtractHtmlContentPlugin extends BasePlugin {
  getOptsSchema(): IEnhancedJSONSchema {
    return {
      type: 'object',
      title: 'Extract Html Content Plugin',
      description: 'responsible for scraping html content based on document.querySelectorAll.',
      properties: {
        runInTab: {
          type: 'boolean',
          const: true,
        },
        selectors: {
          type: 'string',
          default: 'h1\nh2',
          ui: {
            customField: 'LongTextField',
          },
        },
      },
      required: [ 'runInTab', 'selectors' ],
    };
  }

  opts: {
    runInTab: boolean;
    selectors: string;
  };

  test(resource: IResource) {
    return (/html/i).test(resource.mediaType);
  }

  apply(site: ISite, resource: IResource) {
    const selectors: string[] = this.opts.selectors.split('\n');
    const textResult = selectors.reduce(
      (result, selector) => Object.assign(
        result,
        {
          [selector.toString()]: Array.from(document.querySelectorAll(selector)).map(elm => (elm as HTMLElement).innerText),
        },
      ),
      {},
    );

    return {
      info: {
        content: textResult,
      },
    };
  }
}
