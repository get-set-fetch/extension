const path = require('path');
const shell = require('shelljs');

const action = process.argv[2];

const pkgFiles = shell.find('./packages').filter(function(file) { return file.match(/package.json$/); });
const pkgDirs = pkgFiles.map(pkgFile => path.dirname(pkgFile)).filter(pkgDir => !/(node_modules|dist\/|test\/)/.test(pkgDir));

pkgDirs.forEach(pkgDir => {
  const rootNodeModulesPath = path.join(process.cwd(), 'node_modules');
  const pkgNodeModulesPath = path.join(process.cwd(), pkgDir, 'node_modules');

  switch (action) {
    case "create":
      console.log(`linking ${pkgNodeModulesPath}`)
      shell.ln('-sf', rootNodeModulesPath, pkgNodeModulesPath);
      break;
    case "delete":
      console.log(`removing ${pkgNodeModulesPath}`)
      shell.rm('-rf', pkgNodeModulesPath);
      break;
    default:
      console.log(`action not recognized: ${action}`)
  }
})
