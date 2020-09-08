const shell = require('shelljs');

const pkgVersion = process.env.npm_package_version.replace(/-rc.+/, "");

shell.sed("-i", '{GSF_VERSION}', pkgVersion, 'dist/manifest.json');
shell.sed("-i", '{GSF_VERSION}', pkgVersion, 'dist/admin/admin.js');
