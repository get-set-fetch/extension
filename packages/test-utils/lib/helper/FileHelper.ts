import { join } from 'path';
import shell from 'shelljs';

export default class FileHelper {
  static emptyDir(dir: string, ignore: RegExp = /^.gitkeep$/) {
    const files = shell.find(dir).filter(file => !file.match(ignore));
    files.forEach(file => shell.rm('-rf', join(dir, file)));
  }
}
