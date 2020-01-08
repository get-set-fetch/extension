import { BasePlugin, IResource, IEnhancedJSONSchema } from 'get-set-fetch-extension-commons';

/**
 * Plugin responsible for selecting a resource to crawl from the current site.
 */
export default class SelectResourcePlugin extends BasePlugin {
  getMetaSchema(): IEnhancedJSONSchema {
    return {
      type: 'object',
      properties: {
        name: {
          type: 'string',
          const: 'SelectResourcePlugin',
          description: 'responsible for selecting a resource to scrape from the current site / project.',
        },
      },
    };
  }

  getOptsSchema(): IEnhancedJSONSchema {
    return {
      type: 'object',
      properties: {
        frequency: {
          type: 'number',
          default: '-1',
          description: 'How often a resource should be re-crawled (hours), enter -1 to never re-crawl.',
        },
        delay: {
          type: 'number',
          default: '1000',
          description: 'Delay in miliseconds between fetching two consecutive resources.',
        },
      },
    };
  }

  opts: {
    frequency: number;
    delay: number;
  };

  // only retrieve a new resource when one hasn't already been selected
  test(resource: IResource) {
    return resource === null;
  }

  async apply(site) {
    await new Promise(resolve => setTimeout(resolve, this.opts.delay));
    return site.getResourceToCrawl(this.opts.frequency);
  }
}
