import { BasePlugin, ISite, IResource, IEnhancedJSONSchema } from 'get-set-fetch-extension-commons';
import IdbSite from '../../storage/IdbSite';
import IdbResource from '../../storage/IdbResource';

/**
 * Plugin responsible for saving new resources within the current site.
 */
export default class InsertResourcesPlugin extends BasePlugin {
  getOptsSchema(): IEnhancedJSONSchema {
    return {
      type: 'object',
      title: 'Insert Resources Plugin',
      description: 'responsible for saving new resources within the current site / project.',
    };
  }

  opts: {
    maxResources: number;
  };

  test(site: ISite, resource: IResource & IdbResource) {
    // only save new urls of a currently crawled resource
    if (!resource || !resource.crawlInProgress) return false;

    // only save new urls if there's something to save
    return resource.urlsToAdd && resource.urlsToAdd.length > 0;
  }

  apply(site: ISite & IdbSite, resource) {
    return site.saveResources(resource.urlsToAdd, resource.depth + 1);
  }
}
