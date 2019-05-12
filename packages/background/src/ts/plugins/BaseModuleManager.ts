import { IModuleDefinition } from 'get-set-fetch-extension-commons';

export default class BaseModuleManager {
  static getFileContent(fileEntry: FileEntry): Promise<string> {
    return new Promise(resolve => {
      fileEntry.file(pluginFile => {
        const fileReader = new FileReader();
        fileReader.onloadend = () => resolve(fileReader.result as string);
        fileReader.readAsText(pluginFile);
      });
    });
  }

  static getModulesContent(relativeDir: string): Promise<IModuleDefinition[]> {
    return new Promise((resolve, reject) => {
      let modules: IModuleDefinition[] = [];

      chrome.runtime.getPackageDirectoryEntry(root => {
        root.getDirectory(relativeDir, { create: false }, modulesDir => {
          const reader = modulesDir.createReader();
          // assume there are just a dozen plugins,
          // otherwise a loop mechanism should be implemented in order to call readEntries multiple times
          reader.readEntries(
            async (moduleFileEntries: FileEntry[]) => {
              modules = await Promise.all(
                moduleFileEntries.map(async moduleFileEntry => {
                  const code = await BaseModuleManager.getFileContent(moduleFileEntry);
                  const name = moduleFileEntry.name.match(/^(\w+).js$/)[1];
                  const moduleDef: IModuleDefinition = { name, code };
                  return moduleDef;
                }),
              );

              resolve(modules);
            },
            err => {
              reject(err);
            },
          );
        });
      });
    });
  }
}
