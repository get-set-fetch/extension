import { BasePlugin, IEnhancedJSONSchema } from 'get-set-fetch-extension-commons';

/**
 * Plugin responsible for lazy loading scrolling in order to load additional content.
 */
export default class ScrollPlugin extends BasePlugin {
  getMetaSchema(): IEnhancedJSONSchema {
    return {
      type: 'object',
      properties: {
        name: {
          type: 'string',
          const: 'ScrollPlugin',
          description: 'responsible for lazy loading scrolling in order to load additional content.',
        },
      },
    };
  }

  getOptsSchema(): IEnhancedJSONSchema {
    return {
      type: 'object',
      properties: {
        runInTab: {
          type: 'boolean',
          default: true,
        },
        lazyLoading: {
          type: 'boolean',
          default: true,
        },
        enabled: {
          type: 'boolean',
          default: false,
        },
        delay: {
          type: 'number',
          default: '2000',
          description: 'Maximum waiting time (miliseconds) for DOM changes.',
        },
        timeout: {
          type: 'number',
          default: '2000',
          description: 'Maximum waiting time (miliseconds) for DOM changes.',
        },
        maxScrollNo: {
          type: 'number',
          default: '-1',
          description: 'Number of maximum scroll operations. -1 scrolls till no new content is added to the page',
        },
      },
    };
  }

  opts: {
    runInTab: boolean;
    lazyLoading: boolean;
    enabled: boolean;
    timeout: number;
    delay: number;
    maxScrollNo: number;
  };

  test() {
    return this.opts.enabled;
  }

  apply(site) {
    return new Promise(resolve => {
      this.listenToDOMChanges(resolve);
      setTimeout(() => resolve(false), this.opts.timeout);
    });
  }

  listenToDOMChanges(resolve: (val: boolean) => void) {
    // create observer linked to the callback function
    const observer = new MutationObserver((mutationsList, observer) => {
      for (let i = 0; i < mutationsList.length; i += 1) {
        // we only care if new nodes have been added
        if (mutationsList[i].type === 'childList') {
          observer.disconnect();
          resolve(true);
          break;
        }
      }
    });

    // start observing document.body
    observer.observe(document.body, { attributes: true, childList: true, subtree: true });
  }
}
