const shell = require('shelljs');
const pkgVersion = process.env[ 'npm_package_version' ];
shell.exec(`shx sed -i s/{GSF_VERSION}/${pkgVersion}/ dist/manifest.json`);