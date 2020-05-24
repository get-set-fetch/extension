/* eslint-disable no-param-reassign */
import { BasePlugin, IEnhancedJSONSchema, ISite, IResource } from 'get-set-fetch-extension-commons';
import IdbResource from '../../storage/IdbResource';

/**
 * Plugin responsible for updating a resource after crawling it.
 */
export default class UpsertResourcePlugin extends BasePlugin {
  getOptsSchema(): IEnhancedJSONSchema {
    return {
      type: 'object',
      title: 'Upsert Resource Plugin',
      description: 'updates a static resource or inserts a dynamic one after scraping it.',
    };
  }

  test(site: ISite, resource: IResource) {
    // only update a currently crawled resource
    return resource && resource.crawlInProgress;
  }

  apply(site: ISite, resource: IdbResource) {
    // static resources have already been inserted in db via plugins like InsertResourcesPlugin in a previous crawl step, just do update
    if (resource.id) {
      return resource.update();
    }

    /*
    dynamic resources are found and scrapped on the fly starting from an already scrapped static resource,
    disable crawlInProgressFlag, set crawledAt date
    do save
    the site bloom filter is not updated, only static resources are filtered against it
    */
    resource.crawlInProgress = false;
    resource.crawledAt = new Date();
    return resource.save();
  }
}
