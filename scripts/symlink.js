const path = require('path');
const shell = require('shelljs');

const action = process.argv[2];

const pkgFiles = shell.find('./packages').filter(function(file) { return file.match(/package.json$/); });
const pkgDirs = pkgFiles.map(pkgFile => path.dirname(pkgFile)).filter(pkgDir => !/(node_modules|dist\/|test\/)/.test(pkgDir));

pkgDirs.forEach(pkgDir => {
  const rootNodeModulesPath = path.join(process.cwd(), 'node_modules');
  const pkgNodeModulesPath = path.join(process.cwd(), pkgDir, 'node_modules');

  const rootLintPath = path.join(process.cwd(), '.eslintrc.json');
  const pkgLintPath =  path.join(process.cwd(), pkgDir, '.eslintrc.json');

  switch (action) {
    case "create":
      console.log(`linking ${pkgNodeModulesPath}`)
      shell.ln('-sf', rootNodeModulesPath, pkgNodeModulesPath);
      shell.ln('-sf', rootLintPath, pkgLintPath);
      break;
    case "delete":
      console.log(`removing ${pkgNodeModulesPath}`)
      shell.rm('-rf', pkgNodeModulesPath);
      shell.rm('-rf', pkgLintPath);
      break;
    default:
      console.log(`action not recognized: ${action}`)
  }
})
