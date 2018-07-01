import GsfProvider from './GsfProvider';
import ExtensionPluginManager from './plugins/ExtensionPluginManager';

GsfProvider.init();
ExtensionPluginManager.registerDefaults();
ExtensionPluginManager.registerOptionals();

