import { SchemaHelper, IPlugin, ISite, IResource } from 'get-set-fetch-extension-commons';

export default class ImageFilterPlugin implements IPlugin {
  opts: {
    runInTab: boolean
  };

  constructor(opts) {
    this.opts = SchemaHelper.instantiate(ImageFilterPlugin.OPTS_SCHEMA, opts);
  }

  static get OPTS_SCHEMA() {
    return {
      $id: 'https://getsetfetch.org/extract-url-plugin.schema.json',
      $schema: 'http://json-schema.org/draft-07/schema#',
      title: 'ImageFilterPlugin',
      type: 'object',
      properties: {
        runInTab: {
          type: 'boolean',
          default: false
        }
      }
    };
  }

  test(resource: IResource) {
    return resource.mediaType.indexOf('image') !== -1;
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
            name: resource.url.split('/').pop().split('#')[0].split('?')[0]
          }
        });
      };
      img.onerror = () => reject('could not load image: ' + img.src);
      img.src = window.URL.createObjectURL(resource.blob);
    });
  }
}
