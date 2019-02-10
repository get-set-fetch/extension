/*
 * Support for getting the SystemJS registry
 */
(function() {
    const systemJSPrototype = System.constructor.prototype;

    systemJSPrototype.getRegistry = function() {
      const registryProp = Object.getOwnPropertySymbols(System)[0];
      return System[registryProp];
    };

})();