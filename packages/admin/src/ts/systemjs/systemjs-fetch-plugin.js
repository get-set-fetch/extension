// patch for systemjs/src/extras/transform.js
// https://github.com/systemjs/systemjs/commits/3.0/README.md

/*
 * Support for a "transform" loader interface
 */
(function () {
    const systemJSPrototype = System.constructor.prototype;
  
    const instantiate = systemJSPrototype.instantiate;
    systemJSPrototype.instantiate = function (url, parent) {
      if (url.slice(-5) === '.wasm')
        return instantiate.call(this, url, parent);
  
      const loader = this;
      const fetchPromise = typeof loader.fetch === "function" ?
        loader.fetch.call(this, url, { credentials: 'same-origin' })
        :
        fetch(url, { credentials: 'same-origin' })
        .then(function (res) {
          if (!res.ok)
            throw new Error('Fetch error: ' + res.status + ' ' + res.statusText + (parent ? ' loading from ' + parent : ''));
          return res.text();
        });

      return fetchPromise
      .then(function (source) {
        return loader.transform.call(this, url, source);
      })
      .then(function (source) {
        (0, eval)(source + '\n//# sourceURL=' + url);
        return loader.getRegister();
      });
    };
  
    // Hookable transform function!
    systemJSPrototype.transform = function (_id, source) {
      return source;
    };

    // Hookable fetch function!
    systemJSPrototype.fetch = function (url, init) {
        console.log("builtin fetch " + url)
        return fetch(url, init);
    };
  })();