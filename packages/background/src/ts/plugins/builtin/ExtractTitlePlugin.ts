
import { BasePlugin, IResource, IEnhancedJSONSchema, ISite } from 'get-set-fetch-extension-commons';

export default class ExtractTitlePlugin extends BasePlugin {
  getOptsSchema(): IEnhancedJSONSchema {
    return {
      title: 'Extract Title Plugin',
      description: 'responsible for extracting the title of the current html page.',
      type: 'object',
      properties: {
        domRead: {
          type: 'boolean',
          const: true,
        },
      },
    };
  }

  opts: {
    domRead: boolean;
  };

  test(site: ISite, resource: IResource) {
    // only extract title of a currently crawled resource
    if (!resource || !resource.crawlInProgress) return false;

    return (/html/i).test(resource.mediaType);
  }

  apply() {
    return {
      content: {
        title: document.title,
      },
    };
  }
}
