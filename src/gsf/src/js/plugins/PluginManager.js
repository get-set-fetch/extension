import ActiveTabHelper from '../helpers/ActiveTabHelper';
import Logger from '../logger/Logger';

const Log = Logger.getLogger('PluginManager');

class PluginManager {
  static get DEFAULT_PLUGINS() {
    return ['SelectResourcePlugin', 'ExtensionFetchPlugin', 'ExtractUrlPlugin', 'UpdateResourcePlugin', 'InsertResourcePlugin'];
    /*
      {
        name: 'SelectResourcePlugin',
        opts: {},
      },
      {
        name: 'ExtensionFetchPlugin',
        opts: {},
      },
      {
        name: 'ExtractUrlPlugin',
        opts: {
          runInTab: true,
        },
      },
      {
        name: 'UpdateResourcePlugin',
        opts: {},
      },
      {
        name: 'InsertResourcePlugin',
        opts: {},
      },
    ];
    */
  }

  static getDefaultPluginDefs() {
    const availablePluginDefs = this.getAvailablePluginDefs();
    return availablePluginDefs.filter(pluginDef => this.DEFAULT_PLUGINS.indexOf(pluginDef.name) !== -1);
  }

  static getAvailablePluginDefs() {
    // filter plugins so only those loaded from the db via IdbFetchPlugin qualify
    const pluginKeys = Array.from(System.registry.keys()).filter(key => key.match(/^.+!chrome-extension.+IdbFetchPlugin.js$/));
    return pluginKeys.map((pluginKey) => {
      const classDef = System.registry.get(pluginKey).default;

      // eslint-disable-next-line new-cap
      const pluginInstance = new (classDef)();

      // for each plugin, based on its instance, return its name and default options
      return {
        name: pluginInstance.constructor.name,
        opts: pluginInstance.opts || {},
        schema: pluginInstance.OPTS_SCHEMA,
      };
    });
  }

  /*
  static registerDefaultClassDefinitions() {
    PluginManager.classDefinitions = PluginManager.classDefinitions || {};
    this.registerClassDefinition(SelectResourcePlugin);
    this.registerClassDefinition(ExtensionFetchPlugin);
    this.registerClassDefinition(ExtractUrlPlugin);
    this.registerClassDefinition(UpdateResourcePlugin);
    this.registerClassDefinition(InsertResourcePlugin);
  }

  static registerClassDefinition(pluginDef) {
    const pluginInstance = new (pluginDef)();
    PluginManager.classDefinitions[pluginInstance.constructor.name] = pluginDef;
  }


  static instantiate_old(pluginDefinitions) {
    return pluginDefinitions.map(async (pluginDefinition) => {
      // attempt to get class definition from the already registered class definitions
      let classDef = PluginManager.classDefinitions[pluginDefinition.name];

      // attempt to load class definition from the db
      if (!classDef) {
        const dbPlugin = await IdbUserPlugin.get(pluginDefinition.name);
        // eslint-disable-next-line no-new-func
        const dynFunc = new Function(`return ( ${dbPlugin.code} )`);
        classDef = dynFunc();
      }

      // eslint-disable-next-line new-cap
      return new (classDef)(pluginDefinition.opts);
    });
  }
    */

  static instantiate(pluginDefinitions) {
    return pluginDefinitions.map((pluginDefinition) => {
      const pluginKey = Array.from(System.registry.keys()).find(key => key.indexOf(`/${pluginDefinition.name}!`) !== -1);
      Log.info(`Instantiating plugin ${pluginDefinition.name}`);
      if (pluginKey) {
        const classDef = System.registry.get(pluginKey).default;

        // eslint-disable-next-line new-cap
        return new (classDef)(pluginDefinition.opts);
      }

      // could not found corresponding plugin definition
      console.log(`pluginDefinition for ${pluginDefinition.name} not found`);
      return null;
    });
  }

  static async runInTab(tabId, plugin, site, resource) {
    let result = {};
    try {
      console.log('executing script in browser');

      /*
      load each class separately, some utility classes may have already been loaded by other already loaded modules
      if a class is already declared in the current tab, re-loading it fails with
      "Uncaught SyntaxError: Identifier 'ClassName' has already been declared at "
      but the other classes present in module will still load
      */
      const moduleContent = GsfProvider.UserPlugin.modules[plugin.constructor.name];
      // use negative lookahead (?!) to match anyting starting with a class definition but not containing another class definition
      const moduleClasses = moduleContent.match(/(class \w+ {([\s\S](?!(class \w+ {)))+)/gm);
      for (let i = 0; i < moduleClasses.length; i += 1) {
        await ActiveTabHelper.executeScript(tabId, { code: moduleClasses[i] });
      }

      // instantiate module with opts
      const pluginInstanceName = `inst${plugin.constructor.name}`;
      await ActiveTabHelper.executeScript(
        tabId,
        { code: `const ${pluginInstanceName} = new ${plugin.constructor.name}(${JSON.stringify(plugin.opts)})` },
      );

      // test if plugin is aplicable
      const isAplicable = await ActiveTabHelper.executeScript(
        tabId,
        { code: `${pluginInstanceName}.test(${JSON.stringify(site)}, ${JSON.stringify(resource)})` },
      );
      if (!isAplicable) return null;

      // apply plugin, the result will be merged at a higher level into the current resource
      result = await ActiveTabHelper.executeScript(
        tabId,
        { code: `${pluginInstanceName}.apply(${JSON.stringify(site)}, ${JSON.stringify(resource)})` },
      );
    }
    catch (err) {
      console.log(err);
      throw err;
    }

    return result;
  }
}

export default PluginManager;
