exports.fetch = function(url) {
  const pluginName = url.address.substring(url.address.lastIndexOf('/') + 1);

  return new Promise(async (resolve) => {
    const plugin = await global.GsfProvider.UserPlugin.get(pluginName);
    /*
    the entire module definition (including dependencies) without the module export statement
    will be used to load all required definitions in crawledPage
    this is used for the plugins running in the target page and not inside the browser extension
    */
    global.GsfProvider.UserPlugin.modules[pluginName] = plugin.code.replace(/^export.*$/m, '');
    resolve(plugin.code);
  });
};
