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
      properties: {
        maxResources: {
          type: 'number',
          default: '100',
          description: 'Maximum number of resources to be scraped.',
        },
      },
      required: [ 'maxResources' ],
    };
  }

  opts: {
    maxResources: number;
  };

  test(resource: IResource&IdbResource) {
    // only save new urls if there's something to save
    return resource.urlsToAdd && resource.urlsToAdd.length > 0;
  }

  apply(site: ISite&IdbSite, resource) {
    const maxAllowedResourceNo = this.opts.maxResources - site.resourcesNo;

    if (maxAllowedResourceNo > 0) {
      const resourcesToInsert = resource.urlsToAdd.slice(0, maxAllowedResourceNo);

      // eslint-disable-next-line no-param-reassign
      site.resourcesNo += resourcesToInsert.length;

      return site.saveResources(resourcesToInsert, resource.depth + 1);
    }

    return null;
  }
}
