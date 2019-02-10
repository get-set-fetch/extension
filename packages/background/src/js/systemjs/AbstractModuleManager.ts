import GsfProvider from '../storage/GsfProvider';
import { System } from 'systemjs';
import Logger from '../logger/Logger';
import { BaseNamedEntity } from 'get-set-fetch';

declare const SystemJS: System;
const Log = Logger.getLogger('PluginManager');

export default abstract class AbstractModuleManager {
  static getModuleContent(fileEntry: FileEntry): Promise<string> {
    return new Promise((resolve) => {
      fileEntry.file((pluginFile) => {
        const fileReader = new FileReader();
        fileReader.onloadend = () => resolve(fileReader.result as string);
        fileReader.readAsText(pluginFile);
      });
    });
  }

  static getModulesContent(relativeDir: string): Promise<Map<string, string>> {
    return new Promise((resolve, reject) => {
      const modules: Map<string, string> = new Map<string, string>();

      chrome.runtime.getPackageDirectoryEntry((root) => {
        root.getDirectory(relativeDir, { create: false }, (modulesDir) => {
          const reader = modulesDir.createReader();
          // assume there are just a dozen plugins,
          // otherwise a loop mechanism should be implemented in order to call readEntries multiple times
          reader.readEntries(
            async (moduleFileEntries: FileEntry[]) => {
              for (let i = 0; i < moduleFileEntries.length; i += 1) {
              // ignore systemjs config plugins
                if (moduleFileEntries[i].fullPath.indexOf('systemjs') !== -1) continue;
                const moduleContent = await AbstractModuleManager.getModuleContent(moduleFileEntries[i]);
                const moduleName = moduleFileEntries[i].name.match(/^(\w+).js$/)[1];
                modules.set(moduleName, moduleContent);
              }
              resolve(modules);
            },
            (err) => {
              reject(err);
            }
          );
        });
      });
    });
  }

  static async persistModules(modules: Map<string, string>) {
    for (const [moduleName, moduleContent] of modules.entries()) {
      const storedModule = await this.getStoredModule(moduleName);
      if (!storedModule) {
        const newModule: BaseNamedEntity = this.instantiateModule({
          name: moduleName,
          content: moduleContent
        });
        Log.info(`Saving module ${newModule.name} to database`);
        await newModule.save();
        Log.info(`Saving module ${newModule.name} to database DONE`);
      }
    }
  }

  static getStoredModule(moduleName): Promise<BaseNamedEntity> {
    return GsfProvider.Plugin.get(moduleName);
  }

  static getStoredModules(): Promise<BaseNamedEntity[]> {
    return GsfProvider.Plugin.getAll();
  }

  static instantiateModule(data): BaseNamedEntity {
    return new GsfProvider.Plugin({ name: data.name,  code: data.content });
  }

  static async importModules() {
    const availableModules: BaseNamedEntity[] = await this.getStoredModules();
    for (let i = 0; i < availableModules.length; i += 1) {
      Log.info(`SystemJS importing module ${availableModules[i].name}`);
      await SystemJS.import(`${availableModules[i].name}!idb`);
      Log.info(`SystemJS importing module ${availableModules[i].name} DONE`);
    }
  }
}
