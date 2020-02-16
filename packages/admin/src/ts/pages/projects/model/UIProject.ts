import { IProjectStorage, IPluginOpts, INpmPackage } from 'get-set-fetch-extension-commons';

interface IUIPluginDefinitions {
  [key: string]: IPluginOpts;
}

export interface IProjectUIStorage {
  id: number;
  name: string;
  description: string;
  url: string;
  scenarioPkg: INpmPackage;
  plugins: IUIPluginDefinitions;
}

export function convertToProjectUIStorage(projectStorage: Partial<IProjectStorage>): IProjectUIStorage {
  const projectUIStorage: IProjectUIStorage = (
    ({ id, name, description, url, scenario }) => ({ id, name, description, url, scenarioPkg: { name: scenario }, plugins: {} })
  )(projectStorage);

  /*
  convert plugins from array to object so that we can render each one with its declared schema
  each plugin has its own schema with its fields, validation and default values
  using schema array items doesn't allow us to differentiate between plugin entries
  */
  if (projectStorage.plugins) {
    projectStorage.plugins.forEach(pluginDef => {
      projectUIStorage.plugins[pluginDef.name] = pluginDef.opts;
    });
  }

  return projectUIStorage;
}

export function convertToProjectStorage(projectUIStorage: IProjectUIStorage): IProjectStorage {
  const projectStorage: IProjectStorage = (
    ({ id, name, description, url, scenarioPkg }) => ({ id, name, description, url, scenario: scenarioPkg.name, plugins: [] })
  )(projectUIStorage);

  projectStorage.scenario = projectUIStorage.scenarioPkg.name;

  projectStorage.plugins = Object.getOwnPropertyNames(projectUIStorage.plugins).map(pluginName => ({
    name: pluginName,
    opts: projectUIStorage.plugins[pluginName],
  }));


  return projectStorage;
}
