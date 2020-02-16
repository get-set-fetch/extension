import { BasePlugin, IEnhancedJSONSchema } from 'get-set-fetch-extension-commons';

/**
 * Plugin responsible for updating a resource after crawling it.
 */
export default class UpdateResourcePlugin extends BasePlugin {
  getOptsSchema(): IEnhancedJSONSchema {
    return {
      type: 'object',
      title: 'Update Resource Plugin',
      description: 'responsible for updating a resource at storage level after scraping it.',
    };
  }

  test() {
    return true;
  }

  apply(site, resource) {
    return resource.update();
  }
}
