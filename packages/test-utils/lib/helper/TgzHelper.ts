import fs from 'fs';
import path from 'path';
import zlib from 'zlib';
import tar from 'tar-fs';

export default class TgzHelper {
  static async tgz(npmPkgParentPath, tgzPath, tgzName) {
    // STEP 1 : tar the npm package
    await new Promise(resolve => {
      const out = fs.createWriteStream(path.join(tgzPath, `${tgzName}.tar`));
      out.on('finish', () => {
        resolve();
      });

      tar
        .pack(path.join(npmPkgParentPath), { entries: [ 'package' ] })
        .pipe(out);
    });

    // STEP 2: zip the npm package
    await new Promise(resolve => {
      const inp = fs.createReadStream(path.join(tgzPath, `${tgzName}.tar`));
      const out = fs.createWriteStream(path.join(tgzPath, `${tgzName}.tgz`));
      out.on('finish', () => {
        resolve();
      });

      inp.pipe(zlib.createGzip()).pipe(out);
    });
  }
}
