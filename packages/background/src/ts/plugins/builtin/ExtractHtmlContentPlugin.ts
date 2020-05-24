import { ISite, IResource, IEnhancedJSONSchema, BasePlugin } from 'get-set-fetch-extension-commons';

export default class ExtractHtmlContentPlugin extends BasePlugin {
  getOptsSchema(): IEnhancedJSONSchema {
    return {
      type: 'object',
      title: 'Extract Html Content Plugin',
      description: 'extracts text content from the current html page.',
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
          description: 'One or multiple CSS selectors separated by new line. Each one will be a column when exporting resources under the csv format. Comments can be added via #.',
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
    const selectors: string[] = this.opts.selectors
      .split('\n')
      .map((rawSelector: string) => {
        let selector = rawSelector.trim();

        // remove comments with last occurance of ' #', ex: a.class # comment becomes a.class
        if (/\s#/.test(selector)) {
          const selectorMatch = /(.+)(?=(\s#))/.exec(selector);
          // eslint-disable-next-line prefer-destructuring
          selector = selectorMatch[1];
        }

        return selector;
      })
      .filter((selector: string) => selector.length > 0);

    const content = selectors.reduce(
      (result, selector) => Object.assign(
        result,
        {
          [selector.toString()]: Array.from(document.querySelectorAll(selector)).map(elm => (elm as HTMLElement).innerText),
        },
      ),
      {},
    );

    /*
    selector array values should be grouped by common dom parent, but a versatile way to do it has yet to be implemented
    (lots of use cases to be covered)
    simple example:
        selectors: h1\nh2
        h1: a1, a2
        h2: b2
        dom:
          <div>
            <h1>a1</h1>
          </div>
          <div>
            <h1>a2</h1>
            <h2>b2</h2>
          </div>

    ideal result:
        h1: a1, a2
        h2: '', b2
    resulting in csv entries (further down the chain):
        a1, ''
        a2, b2

    current implementation result
        h1: a1, a2
        h2: b2,
    resulting in csv entries (further down the chain):
        a1, b2
        a2, ''
    */

    return content;
  }
}
