import { IPlugin, SchemaHelper, ISite, IResource } from 'get-set-fetch-extension-commons';
import IdbSite from '../../storage/IdbSite';
import IdbResource from '../../storage/IdbResource';

/**
 * Plugin responsible for saving new resources within the current site.
 */
export default class InsertResourcePlugin implements IPlugin {
  opts: {
    maxResources: number;
  };

  static get OPTS_SCHEMA() {
    return {
      $id: 'https://getsetfetch.org/insert-resources-plugin.schema.json',
      $schema: 'http://json-schema.org/draft-07/schema#',
      title: 'InsertResourcePlugin',
      type: 'object',
      properties: {
        maxResources: {
          type: 'number',
          default: '100',
          help: 'Maximum number of resources to be crawled.',
        },
      },
    };
  }

  constructor(opts) {
    this.opts = SchemaHelper.instantiate(InsertResourcePlugin.OPTS_SCHEMA, opts);
  }

  test(resource: IResource&IdbResource) {
    // only save new urls if there's something to save
    return resource.urlsToAdd && resource.urlsToAdd.length > 0;
  }

  apply(site: ISite&IdbSite, resource) {
    const maxAllowedResourceNo = this.opts.maxResources - site.resourcesNo;

    if (maxAllowedResourceNo > 0) {
      const resourcesToInsert = resource.urlsToAdd.slice(0, maxAllowedResourceNo + 1);

      // eslint-disable-next-line no-param-reassign
      site.resourcesNo += resourcesToInsert.length;

      return site.saveResources(resourcesToInsert, resource.depth + 1);
    }

    return null;
  }
}
