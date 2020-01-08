
import { BasePlugin, IResource, IEnhancedJSONSchema } from 'get-set-fetch-extension-commons';

export default class ExtractTitlePlugin extends BasePlugin {
  getMetaSchema(): IEnhancedJSONSchema {
    return {
      type: 'object',
      properties: {
        name: {
          type: 'string',
          const: 'ExtractTitlePlugin',
          description: 'responsible for extracting the title of the current html page.',
        },
      },
    };
  }

  getOptsSchema(): IEnhancedJSONSchema {
    return {
      $id: 'https://getsetfetch.org/extract-title-plugin.schema.json',
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

  opts: {
    runInTab: boolean;
  };

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
