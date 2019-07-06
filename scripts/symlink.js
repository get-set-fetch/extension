const path = require('path');
const shell = require('shelljs');

const pkgFiles = shell.find('./packages').filter(function(file) { return file.match(/package.json$/); });
const pkgDirs = pkgFiles.map(pkgFile => path.dirname(pkgFile)).filter(pkgDir => !/(node_modules|dist|test)/.test(pkgDir));


pkgDirs.forEach(pkgDir => {
  const rootNodeModulesPath = path.join(process.cwd(), 'node_modules');
  const pkgNodeModulesPath = path.join(process.cwd(), pkgDir, 'node_modules');

  console.log(`re-linking ${pkgNodeModulesPath}`)
  shell.rm('-rf', pkgNodeModulesPath);
  shell.ln('-sf', rootNodeModulesPath, pkgNodeModulesPath);
})
