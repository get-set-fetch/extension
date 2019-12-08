import { SchemaHelper, IPlugin } from 'get-set-fetch-extension-commons';

/**
 * Plugin responsible for selecting a resource to crawl from the current site.
 */
export default class LazyLoadPlugin implements IPlugin {
  opts: {
    runInTab: boolean;
    enabled: boolean;
    timeout: number;
    delay: number;
    scrollNo: number;
  };

  static get OPTS_SCHEMA() {
    return {
      $id: 'https://getsetfetch.org/lazy-load-plugin.schema.json',
      $schema: 'http://json-schema.org/draft-07/schema#',
      title: 'LazyLoadPlugin',
      type: 'object',
      properties: {
        runInTab: {
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
          help: 'Maximum waiting time (miliseconds) for DOM changes.',
        },
        timeout: {
          type: 'number',
          default: '2000',
          help: 'Maximum waiting time (miliseconds) for DOM changes.',
        },
        scrollNo: {
          type: 'number',
          default: '-1',
          help: 'Number of maximum scroll operations. -1 scrolls till no new content is added to the page',
        },
      },
    };
  }

  constructor(opts = {}) {
    this.opts = SchemaHelper.instantiate(LazyLoadPlugin.OPTS_SCHEMA, opts);
  }

  test() {
    return this.opts.enabled;
  }

  apply(site) {
    return new Promise(resolve => {
      this.listenToDOMChanges(resolve);
      setTimeout(() => resolve(false), 1000);
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
