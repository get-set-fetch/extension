import SchemaHelper from '../../schema/SchemaHelper';
import { IPlugin, IResource, ISite } from 'get-set-fetch';

export default class ExtractTitlePlugin implements IPlugin {
  opts: {
    runInTab: boolean
  };

  constructor(opts) {
    this.opts = SchemaHelper.instantiate(ExtractTitlePlugin.OPTS_SCHEMA, opts);
  }

  static get OPTS_SCHEMA() {
    return {
      $id: 'https://getsetfetch.org/extract-url-plugin.schema.json',
      $schema: 'http://json-schema.org/draft-07/schema#',
      title: 'ExtractTitlePlugin',
      type: 'object',
      properties: {
        runInTab: {
          type: 'boolean',
          default: true
        }
      }
    };
  }

  test(resource: IResource) {
    return resource.mediaType.indexOf('html') !== -1;
  }

  apply(site: ISite, resource: IResource) {
    return {
      info : {
        title: document.title
      }
    };
  }
}
