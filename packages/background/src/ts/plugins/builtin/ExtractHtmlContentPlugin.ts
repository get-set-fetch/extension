import { ISite, IResource, IEnhancedJSONSchema, BasePlugin } from 'get-set-fetch-extension-commons';


export default class ExtractHtmlContentPlugin extends BasePlugin {
  getOptsSchema(): IEnhancedJSONSchema {
    return {
      type: 'object',
      title: 'Extract Html Content Plugin',
      description: 'responsible for scraping html content based on document.querySelectorAll.',
      properties: {
        domRead: {
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
      required: [ 'selectors' ],
    };
  }

  opts: {
    domRead: boolean;
    selectors: string;
  };

  test(site: ISite, resource: IResource) {
    // only extract content of a currently crawled resource
    if (!resource || !resource.crawlInProgress) return false;

    return (/html/i).test(resource.mediaType);
  }

  apply(site: ISite, resource: IResource) {
    const content = this.extractContent();
    const result = this.diffAndMergeResult({ content });
    return result;
  }

  extractContent() {
    const selectors: string[] = this.opts.selectors.split('\n');
    const content = selectors.reduce(
      (result, selector) => Object.assign(
        result,
        {
          [selector.toString()]: Array.from(document.querySelectorAll(selector)).map(elm => (elm as HTMLElement).innerText),
        },
      ),
      {},
    );

    return content;
  }
}
