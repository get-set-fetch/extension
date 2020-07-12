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
        let selector = this.trimSelector(rawSelector);

        // remove comments with last occurance of ' #', ex: a.class # comment becomes a.class
        if (/\s#/.test(selector)) {
          const selectorMatch = /(.+)(?=(\s#))/.exec(selector);
          // eslint-disable-next-line prefer-destructuring
          selector = selectorMatch[1];
        }

        return selector;
      })
      .filter((selector: string) => selector.length > 0);

    let content;

    // only makes sense for more than one selector
    const selectorBase = selectors.length > 1 ? this.getSelectorBase(selectors) : null;

    /*
    common base detected for all selectors, query selectors within base elements
    see https://github.com/get-set-fetch/extension/issues/44
    */
    if (selectorBase) {
      const suffixSelectors = selectors.map(selector => selector.replace(selectorBase, '').trim());
      content = Array.from(document.querySelectorAll(selectorBase)).reduce(
        (result, baseElm) => {
          for (let i = 0; i < suffixSelectors.length; i += 1) {
            const selector = selectors[i];
            const suffixSelector = suffixSelectors[i];
            // eslint-disable-next-line no-param-reassign
            if (!result[selector]) result[selector] = [];
            result[selector].push(
              Array.from(baseElm.querySelectorAll(suffixSelector)).map(elm => (elm as HTMLElement).innerText).join(','),
            );
          }

          return result;
        },
        {},
      );
    }
    // no common base detected
    else {
      content = selectors.reduce(
        (result, selector) => Object.assign(
          result,
          {
            [selector]: Array.from(document.querySelectorAll(selector)).map(elm => (elm as HTMLElement).innerText),
          },
        ),
        {},
      );
    }

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

  getSelectorBase(selectors: string[]) {
    const cssFragments = selectors[0].split(' ');
    let selectorBase = null;
    for (let i = 0; i < cssFragments.length; i += 1) {
      const checkBase = cssFragments.slice(0, i + 1).join(' ');
      for (let j = 0; j < selectors.length; j += 1) {
        if (!selectors[j].startsWith(checkBase)) return selectorBase;
      }
      selectorBase = checkBase;
    }
    return selectorBase;
  }

  removeUnquotedBracketSpaces(selector: string) {
    let insideQuote = 0;
    let insideBrackets = 0;
    return selector.replace(
      /\s+|"|'|\[|\]/g,
      m => {
        // check / uncheck insideQuote flag
        if (m === '"' || m === "'") {
          // eslint-disable-next-line no-bitwise
          insideQuote ^= 1;
          return m;
        }

        // check / uncheck insideBrackets flag
        if (m === '[' || m === ']') {
          // eslint-disable-next-line no-bitwise
          insideBrackets ^= 1;
          return m;
        }

        // replace spaces inside brackets but not in quotes
        return insideBrackets && !insideQuote ? '' : m;
      },
    );
  }

  trimSelector(rawSelector: string) {
    const selectorWithSingleSpaces = rawSelector.trim().replace(/ +/, ' ');
    return this.removeUnquotedBracketSpaces(selectorWithSingleSpaces);
  }
}
