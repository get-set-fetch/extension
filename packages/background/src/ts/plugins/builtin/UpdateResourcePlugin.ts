import { BasePlugin, IEnhancedJSONSchema } from 'get-set-fetch-extension-commons';

/**
 * Plugin responsible for updating a resource after crawling it.
 */
export default class UpdateResourcePlugin extends BasePlugin {
  getMetaSchema(): IEnhancedJSONSchema {
    return {
      type: 'object',
      properties: {
        name: {
          type: 'string',
          const: 'UpdateResourcePlugin',
          description: 'responsible for updating a resource at storage level after scraping it.',
        },
      },
    };
  }

  getOptsSchema(): IEnhancedJSONSchema {
    return {};
  }

  test() {
    return true;
  }

  apply(site, resource) {
    return resource.update();
  }
}
