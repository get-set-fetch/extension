
import { SchemaHelper, IPlugin, IResource } from 'get-set-fetch-extension-commons';

export default class ExtractTitlePlugin implements IPlugin {
  opts: {
    runInTab: boolean;
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
          default: true,
        },
      },
    };
  }

  test(resource: IResource) {
    return resource.mediaType.indexOf('html') !== -1;
  }

  apply() {
    return {
      info: {
        title: document.title,
      },
    };
  }
}
