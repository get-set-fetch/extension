import { ISite, IResource, IEnhancedJSONSchema } from 'get-set-fetch-extension-commons';
import { BasePlugin } from 'get-set-fetch-extension-commons/lib/plugin';

export default class ImageFilterPlugin extends BasePlugin {
  getMetaSchema(): IEnhancedJSONSchema {
    return {
      type: 'object',
      properties: {
        name: {
          type: 'string',
          const: 'ImageFilterPlugin',
          description: 'responsible for resolving width and height for image type resources.',
        },
      },
    };
  }

  getOptsSchema() {
    return {
      type: 'object',
      properties: {
        runInTab: {
          type: 'boolean',
          default: false,
        },
      },
    } as IEnhancedJSONSchema;
  }

  opts: {
    runInTab: boolean;
  };

  test(resource: IResource) {
    return (/image/i).test(resource.mediaType);
  }

  apply(site: ISite, resource: IResource) {
    return new Promise((resolve, reject) => {
      const img = document.createElement('img');
      img.onload = (evt: Event) => {
        window.URL.revokeObjectURL(img.src);
        resolve({
          info: {
            width: img.naturalWidth,
            height: img.naturalHeight,
            name: resource.url.split('/').pop().split('#')[0].split('?')[0],
          },
        });
      };
      img.onerror = () => reject(new Error(`could not load image: ${img.src}`));
      img.src = window.URL.createObjectURL(resource.blob);
    });
  }
}
