
import { BasePlugin, IResource, IEnhancedJSONSchema } from 'get-set-fetch-extension-commons';

export default class ExtractTitlePlugin extends BasePlugin {
  getOptsSchema(): IEnhancedJSONSchema {
    return {
      title: 'Extract Title Plugin',
      description: 'responsible for extracting the title of the current html page.',
      type: 'object',
      properties: {
        runInTab: {
          type: 'boolean',
          const: true,
        },
      },
      required: [ 'runInTab' ],
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
