import { BasePlugin, IEnhancedJSONSchema, ISite, IResource } from 'get-set-fetch-extension-commons';

/**
 * Plugin responsible for content navigation via javascript clicks.
 *
 *
 *

  DynamicContentScenario
    plugins:
      SelectResourcePlugin
      FetchPlugin
      DynamicNavigationPlugin
      ExtractHtmlContentPlugin
      UpsertResourcePlugin
      InsertResourcesPlugin

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
        UpsertResourcePlugin
        InsertResourcesPlugin


 *
 *
 */
export default class DynamicNavigationPlugin extends BasePlugin {
  getOptsSchema(): IEnhancedJSONSchema {
    return {
      type: 'object',
      title: 'Click Navigation Plugin',
      description: 'responsible for navigating via javascript click events for single page applications.',
      properties: {
        selectors: {
          type: 'string',
          ui: {
            customField: 'LongTextField',
          },
          description: 'Html selectors.',
        },
        /*

        delay, depth ??
        */
        runInTab: {
          type: 'boolean',
          const: true,
        },
      },
      required: [ 'runInTab' ],
    };
  }

  snapshots: {
    [key: string]: string;
  }

  selectors: string[];
  history: {
    [key: string]: boolean;
  }

  test(site: ISite, resource: IResource) {
    return (/html/i).test(resource.mediaType);
  }

  apply(site, resource) {
    this.selectors = this.getSelectors();

    /*
    let actionChain = [];

    let {actionChain, snapshot} = this.
    return resource.update();
    */
  }

  /*
  .product
  .cancel

  list with more, each more is different content

  [] > productA : scrape
  [] > productA > cancel becomes []
  [] > productB : scrape
  [] > productB > cancel becomes []

  [] > more > productC
  [] > more > productC > cancel becomes [] > more

  [] > more > more > productD
  */

  /*
  find 1st available selector
    - click
    - snapshot
    - history add

  */

  /*
  example 1: product list
  a table contains product entries, clicking an entry shows the product detail, clicking back redirects to product list

  selectors: .product, .cancel

  assumptations:
  - clicking 1st selector will always show the final content to be scrapped
  - selectors are defined from specific to general
    - navigation related ones (next page, more, etc..) will be at the bottom
  */
  async navigate(currentPath: string[] = []) {
    /*
    retrieve all available selector nodes from current dom as text
    they will be used to construct the current path
    */
    const groupedSelectors = this.getSelectorsAsText(this.selectors);

    // find the 1st group containing a history path not already visited
    const { groupIdx, selector } = this.findAvailableSelector(currentPath, groupedSelectors);

    // no selectors found, all possible navigation paths have been exhausted, nothing else to do
    if (!selector) return;

    // found scrapable content, record the current path as a full path in navigation history
    if (groupIdx === 0) {
      const finalPath = currentPath.concat(selector).join('.');
      this.history[finalPath] = true;
    }

    // navigate based on current selector
    await this.clickAndWaitForDomStability(selector as any);
  }

  doClick(selector: string) {
    // can't do click because we don't have corresponding dom element, only text
    // maybe get all elements as a single order array with {elm: Node, selector}, text can always be retrieved as elm.innerText
  }


  clickAndWaitForDomStability(selectorElm: HTMLElement) {
    const timeout = 1000; // should be opts.param !

    return new Promise(resolve => {
      const waitResolve = observer => {
        observer.disconnect();
        resolve();
      };

      let timeoutId;
      const observer = new MutationObserver((mutationsList, observer) => {
        for (let i = 0; i < mutationsList.length; i += 1) {
          // we only care if new nodes have been added
          if (mutationsList[i].type === 'childList') {
            // restart the countdown timer
            window.clearTimeout(timeoutId);
            timeoutId = window.setTimeout(waitResolve, timeout, observer);
            break;
          }
        }
      });

      timeoutId = setTimeout(waitResolve, timeout, observer);


      // start observing document.body
      observer.observe(document.body, { attributes: true, childList: true, subtree: true });

      // do the actual clicking
      selectorElm.click();
    });
  }

  findAvailableSelector(currentPath: string[], groupedSelectors: string[][]): { groupIdx: number; selector: string } {
    for (let groupIdx = 0; groupIdx < groupedSelectors.length; groupIdx += 1) {
      for (let selectorIdx = 0; selectorIdx < groupedSelectors[groupIdx].length; selectorIdx += 1) {
        const selector = groupedSelectors[groupIdx][selectorIdx];
        const nextPath = currentPath.concat(selector).join('.');
        if (!this.history[nextPath]) return { groupIdx, selector };
      }
    }

    // no available selector found
    return { groupIdx: null, selector: null };
  }

  getSelectors() {
    return this.opts.selectors.split('\n');
  }

  getSelectorsAsText(selectors: string[]): string[][] {
    const groupedSelectorElms: HTMLElement[][] = selectors.map(
      selector => Array.from(window.document.querySelectorAll(selector)),
    );

    return groupedSelectorElms
      .map(
        (selectors: HTMLElement[]) => selectors
          .map(
            (selector: HTMLElement) => selector.innerText,
          ),
      );
  }

  /*
  getSelectorsSnapshot(groupedSelectorElms: HTMLElement[][]) {
    return groupedSelectorElms
      .map(
        (selectors: HTMLElement[]) => selectors
          .map(
            (selector:HTMLElement) => selector.innerText)
          .join()
        )
      .join();
  }

  getSelectorElms(selectors):HTMLElement[][] {
    return selectors.map(selector => Array.from(window.document.querySelectorAll(selector)));
  }
  */

  /*
  doScrap() {
    this should belong to a different plugin, but don't have any idea on how to do it
    a plugin has access to site, so it calls one of its plugins ?
    OR
    DESIRED FUNCTIONALITY
    site applies plugins in order like now
    when DynamicNavigation plugin needs to be executed, it continues the previous instance with all its state
  }
  */
}
