import { GsfProvider } from './background-bundle';
import Logger from './logger/Logger';

const Log = Logger.getLogger('background-main');

/*
register GsfProvider at window level, required for:
  - accessing IndexedDB from SystemJS IdbFetchPlugin
  - accessing plugin module content from GsfProvider.UserPlugins.availablePlugins
*/
window.GsfProvider = GsfProvider;

function getPluginContent(pluginFileEntry) {
  return new Promise((resolve) => {
    pluginFileEntry.file((pluginFile) => {
      const fileReader = new FileReader();
      fileReader.onloadend = () => resolve(fileReader.result);
      fileReader.readAsText(pluginFile);
    });
  });
}

function getPlugins() {
  return new Promise((resolve) => {
    const plugins = [];
    chrome.runtime.getPackageDirectoryEntry((root) => {
      root.getDirectory('background/plugins', { create: false }, (pluginsDir) => {
        const reader = pluginsDir.createReader();
        // assume there are just a dozen plugins,
        // otherwise a loop mechanism should be implemented in order to call readEntries multiple times
        reader.readEntries(
          async (pluginFileEntries) => {
            for (let i = 0; i < pluginFileEntries.length; i += 1) {
              // ignore systemjs config plugins
              // eslint-disable-next-line no-continue
              if (pluginFileEntries[i].fullPath.indexOf('systemjs') !== -1) continue;
              const pluginContent = await getPluginContent(pluginFileEntries[i]);
              const pluginName = pluginFileEntries[i].name.match(/^(\w+).js$/)[1];
              plugins.push(new GsfProvider.UserPlugin(pluginName, pluginContent));
            }
            resolve(plugins);
          },
          (err) => {
            console.log(err);
          },
        );
      });
    });
  });
}

SystemJS.config({
  map: {
    idb: './plugins/systemjs/IdbFetchPlugin.js',
    'plugin-babel': './plugins/systemjs/plugin-babel.js',
    'systemjs-babel-build': './plugins/systemjs/systemjs-babel-browser.js',
  },
  transpiler: 'plugin-babel',
  meta: {
    '*.js': {
      babelOptions: {
        // extension run in browsers having ES2015 and stage 1-3 support, disable ES2015, stage 1-3 feature transpilation
        es2015: false,
        stage1: false,
        stage2: false,
        stage3: false,
      },
    },
  },
});

(async () => {
  await GsfProvider.init();

  // 1.1 populate settings - logLevel - if not present
  const storedSettings = await GsfProvider.Setting.getAll();
  let logLevel = storedSettings.find(setting => setting.key === 'logLevel');
  if (!logLevel) {
    logLevel = new GsfProvider.Setting('logLevel', 3);
    await logLevel.save();
  }
  Logger.setLogLevel(logLevel.val);


  // 2.1. make sure all builtin plugins are present in db
  const builtinPlugins = await getPlugins();

  for (let i = 0; i < builtinPlugins.length; i += 1) {
    const storedPlugin = await GsfProvider.UserPlugin.get(builtinPlugins[i].name);
    if (!storedPlugin) {
      Log.info(`Saving plugin ${builtinPlugins[i].name} to database`);
      await builtinPlugins[i].save();
      Log.info(`Saving plugin ${builtinPlugins[i].name} to database DONE`);
    }
  }

  // 2.2. import via SystemJS all available plugins: builtin and user defined ones
  const availablePlugins = await GsfProvider.UserPlugin.getAll();
  for (let i = 0; i < availablePlugins.length; i += 1) {
    Log.info(`SystemJS importing plugin ${availablePlugins[i].name}`);
    await SystemJS.import(`${availablePlugins[i].name}!idb`);
    Log.info(`SystemJS importing plugin ${availablePlugins[i].name} DONE`);
  }
})();

