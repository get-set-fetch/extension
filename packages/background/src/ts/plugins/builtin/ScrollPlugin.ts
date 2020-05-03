import { BasePlugin, IEnhancedJSONSchema, ISite, IResource } from 'get-set-fetch-extension-commons';

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
        domRead: {
          type: 'boolean',
          const: true,
        },
        domWrite: {
          type: 'boolean',
          const: true,
        },
        delay: {
          type: 'integer',
          default: '1000',
          description: 'Maximum waiting time (miliseconds) for DOM changes.',
        },
        timeout: {
          type: 'integer',
          default: '2000',
          description: 'Maximum waiting time (miliseconds) for DOM changes.',
        },
        maxScrollNo: {
          type: 'integer',
          default: '-1',
          description: 'Number of maximum scroll operations. -1 scrolls till no new content is added to the page',
        },
      },
      required: [ 'enabled', 'delay', 'timeout', 'maxScrollNo' ],
    };
  }

  static scrollNo: number = 0;

  opts: {
    domRead: boolean;
    enabled: boolean;
    timeout: number;
    delay: number;
    maxScrollNo: number;
  };

  timeoutId: number;
  observer: MutationObserver;


  test(site: ISite, resource: IResource) {
    if (!this.opts.enabled) return false;

    // only apply the plugin (and generate a new resource) based on an already crawled resource
    if (!resource || resource.crawlInProgress) return false;

    const scrollNotExceeded = this.opts.maxScrollNo >= 0 ? ScrollPlugin.scrollNo < this.opts.maxScrollNo : true;
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
          resolve({
            actions: [ `scroll#${ScrollPlugin.scrollNo += 1}` ],
          });
          break;
        }
      }
    });

    // start observing document.body
    this.observer.observe(document.body, { attributes: true, childList: true, subtree: true });
  }
}
