import { IResource } from 'get-set-fetch';
import JSZip from 'jszip/dist/jszip';

export default class ExportHelper {
  static export(resources: IResource[], opts): Promise<object> {
    return new Promise(async (resolve, reject) => {
      const zip = new JSZip();

      resources.forEach(resource => {
        if (resource.blob) {
          const name = resource.url.substr(-10);
          zip.file(name, resource.blob);
        }
      });

      zip.file('Hello.txt', 'Hello World\n');
      const content = await zip.generateAsync({
        type:'blob',
        compression: 'STORE'
      });

      resolve({ url: URL.createObjectURL(content) });
    });
  }

}