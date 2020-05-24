/* eslint-disable no-bitwise */
import { BasePlugin, IEnhancedJSONSchema, ISite, IResource } from 'get-set-fetch-extension-commons';
import IdbSite from '../../storage/IdbSite';

/**
  There are 2 main scrapping scenarios: DynamicContentScenario, StaticContentScenario

  DynamicContentScenario
    plugins:
      SelectResourcePlugin
      FetchPlugin
      DynamicNavigationPlugin
      ExtractHtmlContentPlugin
      InsertResourcesPlugin
      UpsertResourcePlugin

    crawResource(1)
      SelectResourcePlugin - gets the ony html resource from db
      FetchPlugin - opens the resources in browser tab
      DynamicNavigationPlugin - based on selectors, finds the next valid clickPath, waits for dom to stabilize, returns the path
      ExtractHtmlContentPlugin - extracts content
      UpsertResourcePlugin - save the current resource to db (url, clickPath)

    crawlResource(2... n-1)
      SelectResourcePlugin - returns no new resource
      FetchPlugin - nothing to fetch
      DynamicNavigationPlugin - based on selectors, finds the next valid clickPath, waits for dom to stabilize, returns the clickPath and window.url
      ExtractHtmlContentPlugin - extracts content
      UpsertResourcePlugin - save the current resource to db (url, clickPath)

    crawlResource(n)
      SelectResourcePlugin - returns no new resource
      FetchPlugin - nothing to fetch
      DynamicNavigationPlugin - based on selectors, returns no valid clickPath
      ExtractHtmlContentPlugin - don't invoke it
      UpsertResourcePlugin - don't invoke it

    StaticContentScenario
      plugins
        SelectResourcePlugin
        FetchPlugin
        ScrollPlugin
        ExtractUrlsPlugin
        ExtractHtmlContentPlugin
        InsertResourcesPlugin
        UpsertResourcePlugin
*/

/*
Plugin responsible for content navigation via javascript clicks.

selectors are grouped on navigation levels separated by "\n"
clicking selectors of 1st group will update the dom with the content to be scrapped by other plugins

on plugin apply, navigation by clicking dom elms begins, starting with an empy action path
  - check for available selectors in groupIdx ascening order
  - click on first available selector that doesn't duplicate an existing path
     # history stores a tree with the already visited valid action chains
  - wait for dom content changes after selector click
  - if selector belongs to 1st groupIdx
      - it means the dom content can be scrapped by other plugins
      - return {actions: the current action path}, this will create a new IResource in ISite
    else
      - keep navigating
  - if no valid selectors are found, apply returns null, no new IResource will be created in ISite, crawl will stop
*/

interface IHistoryNode {
  innerText?: string;
  clickNo?: number;

  parent?: IHistoryNode;
  children?: {
    // nodes are refferenced by their innerText not dom reference because each time the plugin is applied, dom changes => dom references change
    [key: string]: IHistoryNode;
  };

  lvl: number;

  snapshots: number[];
  duplicateSnapshot?: boolean;
}

interface ISelector {
  selector: string;
  linksToContent: boolean;
}

export default class DynamicNavigationPlugin extends BasePlugin {
  getOptsSchema(): IEnhancedJSONSchema {
    return {
      type: 'object',
      title: 'Click Navigation Plugin',
      description: 'navigates via javascript click events within single page applications.',
      properties: {
        domRead: {
          type: 'boolean',
          const: true,
        },
        domWrite: {
          type: 'boolean',
          const: true,
        },
        selectors: {
          type: 'string',
          ui: {
            customField: 'LongTextField',
          },
          default: '.more # content',
          description: 'One or multiple CSS selectors separated by new line. In a continuous loop, a single unvisited node from each selector is clicked. Waits for DOM to become stable between clicks. Comments can be added via #. A selector containing a "# content" comment will pause the plugin and execution will be deferred to the next plugin, usually responsible for the actual scraping. As an example, the following selectors "a.product # content", "a.cancel" will open product detail pages by clicking "a.product" links and then return to product list page by clicking "a.cancel" link.',
        },
        revisit: {
          type: 'boolean',
          default: false,
          description: 'Revisit the same DOM nodes multiple times until the DOM no longer changes. Useful for "load more content" links.',
        },
        stabilityTimeout: {
          type: 'integer',
          default: '500',
          title: 'Stability Timeout',
          description: 'Considers the DOM stable when there are no more DOM changes within the specified amount of time (milliseconds). Useful for allowing content to fully load between navigational clicks.',
        },
        maxResources: {
          type: 'integer',
          default: '100',
          title: "Max Resources",
          description: 'Maximum number of resources to be scraped. A value of -1 disables this check.',
        },
        /*

        delay, depth ??
        */
      },
      required: [ 'selectors', 'revisit', 'stabilityTimeout', 'maxResources' ],
    };
  }

  opts: {
    domRead: boolean;
    domWrite: boolean;
    selectors: string;
    revisit: boolean;
    stabilityTimeout: number;
    maxResources: number;
  };

  selectors: ISelector[];

  rootNode: IHistoryNode;
  activeNode: IHistoryNode;

  init() {
    this.selectors = [ { selector: null, linksToContent: false } ].concat(this.getSelectors(this.opts.selectors));

    this.rootNode = {
      lvl: 0,
      children: {},
      snapshots: [ this.getSnapshot() ],
    };

    this.activeNode = this.rootNode;
  }

  test(site: ISite & IdbSite, resource: IResource) {
    // only apply the plugin (and generate a new resource) based on an already crawled resource
    if (!resource || resource.crawlInProgress) return false;

    const validMaxResources = this.opts.maxResources === -1 ? true : site.resourcesNo < this.opts.maxResources;

    // don't extract new resources from non-parsable pages
    const validMediaType = (/html/i).test(resource.mediaType);

    return validMaxResources && validMediaType;
  }

  async apply(site: ISite, resource: IResource) {
    // one time plugin initialization, don't put the logic in constructor as ModuleRuntimeManager initializes plugin prior to their invocation
    if (!this.selectors) {
      this.init();
    }

    await this.waitForDomStability();

    return this.navigate(this.activeNode);
  }

  async navigate(parentNode: IHistoryNode) {
    const parentSelector = this.selectors[parentNode.lvl];
    let childSelector;

    let childElm: HTMLElement;

    if (parentNode.lvl < this.selectors.length - 1) {
      childSelector = this.selectors[parentNode.lvl + 1];

      // find a click candidate
      const childElmCandidates = Array.from(document.querySelectorAll<HTMLElement>(childSelector.selector));
      childElm = childElmCandidates.find(childElm => {
        const childKey: string = childElm.innerText;
        let childIsValid: boolean;

        // new child, always valid
        if (!Object.prototype.hasOwnProperty.call(parentNode.children, childKey)) {
          childIsValid = true;
        }
        // existing child
        else {
          // navigation child
          if (!childSelector.linksToContent) {
            // after parent linking to content, assume "cancel" navigation returning back to a prev nav step, always valid
            // at some point this needs better generalization and a lot more integration test scenarios
            if (parentSelector.linksToContent) {
              childIsValid = true;
            }
            else {
              childIsValid = false;
            }
          }
          // existing content child
          else {
            // only valid if revisit flag is true and the last click action didn't result in an existing dom snapshot
            if (this.opts.revisit && !parentNode.children[childKey].duplicateSnapshot) {
              childIsValid = true;
            }
            else {
              childIsValid = false;
            }
          }
        }

        return childIsValid;
      });
    }

    // no suitable candidate found, go back one history step and try to find another route or stop the navigation
    if (!childElm) {
      return parentNode.parent ? this.navigate(parentNode.parent) : null;
    }

    // suitable candidate found
    const childKey = childElm.innerText;

    let childNode: IHistoryNode;
    if (parentNode.children[childKey]) {
      childNode = parentNode.children[childKey];
    }
    else {
      childNode = {
        innerText: childElm.innerText,
        clickNo: 0,

        parent: parentNode,
        lvl: parentNode.lvl + 1,
        children: {},

        snapshots: [],
      };

      if (childNode.lvl >= this.selectors.length) {
        throw new Error('invalid childNode level reached');
      }

      // eslint-disable-next-line no-param-reassign
      parentNode.children[childKey] = childNode;
    }

    childNode.clickNo += 1;
    await this.clickAndWaitForDomStability(childElm);

    const snapshot = this.getSnapshot();

    if (snapshot === undefined) throw new Error('undefined snapshot');

    const originNode: IHistoryNode = this.findNodeWithSnapshot(snapshot);

    // dom content matches a previous history state, resume from that state
    if (originNode) {
      childNode.duplicateSnapshot = true;
      return this.navigate(originNode);
    }

    // valid node found
    childNode.snapshots.push(snapshot);

    // linksToContent node, stop navigation return the current route
    if (childSelector.linksToContent) {
      this.activeNode = childNode;
      return { actions: this.getHistoryPath(childNode) };
    }

    // non linkToContent node, continue navigation
    return this.navigate(childNode);
  }

  waitForDomStability() {
    return new Promise(resolve => {
      if (this.opts.stabilityTimeout === 0) {
        resolve();
        return;
      }

      const waitResolve = observer => {
        observer.disconnect();
        resolve();
      };

      let timeoutId;
      const observer = new MutationObserver((mutationList, observer) => {
        for (let i = 0; i < mutationList.length; i += 1) {
          // we only care if new nodes have been added
          if (mutationList[i].type === 'childList') {
            // restart the countdown timer
            window.clearTimeout(timeoutId);
            timeoutId = window.setTimeout(waitResolve, this.opts.stabilityTimeout, observer);
            break;
          }
        }
      });

      timeoutId = setTimeout(waitResolve, this.opts.stabilityTimeout, observer);

      // start observing document.body
      observer.observe(document.body, { attributes: true, childList: true, subtree: true });
    });
  }

  clickAndWaitForDomStability(selectorElm: HTMLElement) {
    // resolved when dom is stable
    const stabilityPromise = this.waitForDomStability();

    // do the actual clicking
    selectorElm.click();

    return stabilityPromise;
  }

  getSelectors(rawSelectors: string): ISelector[] {
    return rawSelectors.split('\n').map((rawSelector: string) => {
      let selector = rawSelector.trim();
      let linksToContent = false;

      // remove comments with last occurance of ' #', ex: a.class # comment becomes a.class
      if (/\s#/.test(selector)) {
        const selectorMatch = /(.+)(?=(\s#))(.+)/.exec(selector);
        // eslint-disable-next-line prefer-destructuring
        selector = selectorMatch[1];
        linksToContent = /content/.test(selectorMatch[3]);
      }

      return {
        selector,
        linksToContent,
      };
    });
  }

  getHistoryPath(node: IHistoryNode, path = []): string[] {
    const crtPathSegment = this.opts.revisit ? `${node.innerText}#${node.clickNo}` : node.innerText;
    if (node.parent) {
      return this.getHistoryPath(node.parent, [ crtPathSegment ].concat(path));
    }

    return path;
  }

  findNodeWithSnapshot(snapshot: number, node = this.rootNode) {
  // duplicate snapshot, return origin node
    if (node.snapshots.includes(snapshot)) return node;

    // parse children looking for snapshot
    if (node.children) {
      // eslint-disable-next-line no-restricted-syntax
      for (const child of Object.values(node.children)) {
        if (this.findNodeWithSnapshot(snapshot, child)) {
          return child;
        }
      }
    }

    // no child with the same snapshot found
    return null;
  }

  /*
  returns a dom element snapshot as innerText hash code
  starting point is java String hashCode: s[0]*31^(n-1) + s[1]*31^(n-2) + ... + s[n-1]
  keep everything fast: only work with a 32 bit hash, remove exponentiation
  custom implementation: s[0]*31 + s[1]*31 + ... + s[n-1]
  */
  getSnapshot(): number {
    const snapshotSelector = 'body';
    const nodeToBeHashed = document.querySelector<HTMLElement>(snapshotSelector);
    if (!nodeToBeHashed) return 0;

    const { innerText } = nodeToBeHashed;

    let hash = 0;
    if (innerText.length === 0) {
      return hash;
    }

    for (let i = 0; i < innerText.length; i += 1) {
      // an integer between 0 and 65535 representing the UTF-16 code unit
      const charCode = innerText.charCodeAt(i);

      // multiply by 31 and add current charCode
      hash = ((hash << 5) - hash) + charCode;

      // convert to 32 bits as bitwise operators treat their operands as a sequence of 32 bits
      hash |= 0;
    }

    return hash;
  }
}
