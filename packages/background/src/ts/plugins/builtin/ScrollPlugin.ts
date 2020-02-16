import { BasePlugin, IEnhancedJSONSchema, ISite, IResource } from 'get-set-fetch-extension-commons';
import { resolve } from 'dns';

/**
 * Plugin responsible for lazy loading scrolling in order to load additional content.
 */
export default class ScrollPlugin extends BasePlugin {
  getOptsSchema(): IEnhancedJSONSchema {
    return {
      type: 'object',
      title: 'Scroll Plugin',
      description: 'responsible for lazy loading scrolling in order to load additional content.',
      properties: {
        enabled: {
          type: 'boolean',
          default: false,
        },
        runInTab: {
          type: 'boolean',
          const: true,
        },
        lazyLoading: {
          type: 'boolean',
          const: true,
        },
        delay: {
          type: 'number',
          default: '1000',
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
      required: [ 'runInTab', 'lazyLoading', 'enabled', 'delay', 'timeout', 'maxScrollNo' ],
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

  timeoutId: number;
  observer: MutationObserver;
  scrollNo: number;

  test(resource: IResource) {
    const scrollNotExceeded = this.opts.maxScrollNo >= 0 ? (resource.temp.scrollNo || 0) < this.opts.maxScrollNo : true;
    return (/html/i).test(resource.mediaType) && this.opts.enabled && scrollNotExceeded;
  }

  async apply(site: ISite, resource: IResource) {
    await new Promise(resolve => setTimeout(() => resolve(), this.opts.delay));

    return new Promise(resolve => {
      // if content is added, return true
      this.listenToDOMChanges(resolve, resource);

      // if no content is added till timeout, return null
      this.timeoutId = window.setTimeout(
        () => {
          this.observer.disconnect();
          resolve(null);
        },
        this.opts.timeout,
      );

      // actual scrolling action
      window.scrollTo(0, document.body.scrollHeight);
    });
  }

  listenToDOMChanges(resolve: (val: object) => void, resource: IResource) {
    // create observer linked to the callback function
    this.observer = new MutationObserver((mutationsList, observer) => {
      for (let i = 0; i < mutationsList.length; i += 1) {
        // we only care if new nodes have been added
        if (mutationsList[i].type === 'childList') {
          observer.disconnect();
          window.clearTimeout(this.timeoutId);
          resolve({ temp: { scrollNo: (resource.temp.scrollNo || 0) + 1 } });
          break;
        }
      }
    });

    // start observing document.body
    this.observer.observe(document.body, { attributes: true, childList: true, subtree: true });
  }
}
