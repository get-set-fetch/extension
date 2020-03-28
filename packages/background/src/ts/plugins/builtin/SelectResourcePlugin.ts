import { BasePlugin, IResource, IEnhancedJSONSchema, ISite } from 'get-set-fetch-extension-commons';

/**
 * Plugin responsible for selecting a resource to crawl from the current site.
 */
export default class SelectResourcePlugin extends BasePlugin {
  getOptsSchema(): IEnhancedJSONSchema {
    return {
      type: 'object',
      title: 'Select Resource Plugin',
      description: 'responsible for selecting a resource to scrape from the current site / project.',
      properties: {
        frequency: {
          type: 'number',
          const: '-1',
          description: 'How often a resource should be re-crawled (hours), enter -1 to never re-crawl.',
        },
        delay: {
          type: 'number',
          default: '1000',
          description: 'Delay in miliseconds between fetching two consecutive resources.',
        },
      },
      required: [ 'frequency', 'delay' ],
    };
  }

  opts: {
    frequency: number;
    delay: number;
  };

  // only retrieve a new resource when one hasn't already been selected
  test(site: ISite, resource: IResource) {
    return resource === null;
  }

  async apply(site: ISite) {
    await new Promise(resolve => setTimeout(resolve, this.opts.delay));
    return site.getResourceToCrawl(this.opts.frequency);
  }
}
