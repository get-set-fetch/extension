import { ISite, IResource, IEnhancedJSONSchema, BasePlugin } from 'get-set-fetch-extension-commons';

interface ISelectorPair {
  selector: string;
  prop: string;
}

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
          default: 'h1 # headline innerText\nimg.main,alt # image alternate text',
          ui: {
            customField: 'LongTextField',
          },
          description: 'One or multiple CSS selectors separated by new line. Each one will be a column when exporting resources under the csv format. By default the innerText property will be scraped but you can define your own using a selector pair, ex: h1, title.  Comments can be added via #.',
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
    const selectorPairs: ISelectorPair[] = this.opts.selectors
      .split('\n')
      .map((rawSelector: string) => {
        let selectorPair = this.trimSelector(rawSelector);

        // remove comments with last occurance of ' #', ex: a.class # comment becomes a.class
        if (/\s#/.test(selectorPair)) {
          const selectorMatch = /(.+)(?=(\s#))/.exec(selectorPair);
          // eslint-disable-next-line prefer-destructuring
          selectorPair = selectorMatch[1];
        }

        if (selectorPair.length > 0) {
          const pair = selectorPair.split(',').map(elm => elm.trim());
          return {
            selector: pair[0],
            prop: pair[1] ? pair[1] : 'innerText',
          };
        }

        return null;
      })
      .filter((selectorPair: ISelectorPair) => selectorPair);

    let content;

    // only makes sense for more than one selector and only if selectorBase returns multiple elements
    let selectorBase = null;
    if (selectorPairs.length > 1) {
      const potentialSelectorBase = this.getSelectorBase(selectorPairs);
      if (potentialSelectorBase && Array.from(document.querySelectorAll(potentialSelectorBase)).length > 1) {
        selectorBase = potentialSelectorBase;
      }
    }

    /*
    common base detected for all selectors, query selectors within base elements
    see https://github.com/get-set-fetch/extension/issues/44
    */
    if (selectorBase) {
      const suffixSelectors = selectorPairs.map(selectorPair => selectorPair.selector.replace(selectorBase, '').trim());
      content = Array.from(document.querySelectorAll(selectorBase)).reduce(
        (result, baseElm) => {
          for (let i = 0; i < suffixSelectors.length; i += 1) {
            const { selector, prop } = selectorPairs[i];
            const suffixSelector = suffixSelectors[i];
            // eslint-disable-next-line no-param-reassign
            if (!result[selector]) result[selector] = [];
            result[selector].push(
              Array.from(baseElm.querySelectorAll(suffixSelector)).map(elm => this.getContent((elm as HTMLElement), prop)).join(','),
            );
          }

          return result;
        },
        {},
      );
    }
    // no common base detected
    else {
      content = selectorPairs.reduce(
        (result, selectorPair) => Object.assign(
          result,
          {
            [selectorPair.selector]: Array.from(
              document.querySelectorAll(selectorPair.selector),
            ).map(elm => this.getContent(elm as HTMLElement, selectorPair.prop)),
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

  getSelectorBase(selectorPairs: ISelectorPair[]) {
    const selectors = selectorPairs.map(selectorPair => selectorPair.selector);

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

  getContent(elm: HTMLElement, prop: string) {
    return elm[prop] || elm.getAttribute(prop) || '';
  }
}
