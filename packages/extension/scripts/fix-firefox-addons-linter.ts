import fs from 'fs';
import path, { join } from 'path';

/*
This is required due to https://addons.mozilla.org/ currently having issues 
linting ES modules if import/export is not declared at the beginning of the file
see https://github.com/mozilla/addons-linter/issues/2137
*/

function writeWorkaroundExportOnFirstLine(filePath) {
  console.log(`appending to ${filePath}`)
  const data = fs.readFileSync(filePath);
  const fd = fs.openSync(filePath, 'w+')
  const insert = Buffer.from("// fix ff addons linter, see https://github.com/mozilla/addons-linter/issues/2137 \nexport let _addons_linter_workaround = 1; \n\n")
  fs.writeSync(fd, insert, 0, insert.length, 0)
  fs.writeSync(fd, data, 0, data.length, insert.length)
  fs.close(fd, (err) => {
    if (err) throw err;
  });
}
// 1. plugin list
const pluginDir = path.join(process.cwd(), 'dist/background/plugins');
const pluginFiles = fs.readdirSync(pluginDir, { withFileTypes: true }).filter(pluginFile => pluginFile.isFile());

pluginFiles.forEach(pluginFile => {
  if (/.+\.js$/.test(pluginFile.name)) {
    writeWorkaroundExportOnFirstLine(join(pluginDir, pluginFile.name));
  }
});

// 2. scenario list
const scenarioRootDir = path.join(process.cwd(), 'dist/scenarios');
const scenarioDirs = fs.readdirSync(scenarioRootDir, { withFileTypes: true }).filter(scenarioDir => scenarioDir.isDirectory());

scenarioDirs.forEach(scenarioDir => {
  const scenarioPkg = JSON.parse(fs.readFileSync(join(scenarioRootDir, scenarioDir.name, "package.json")).toString());
  const scenarioMainFilePath = join(scenarioRootDir, scenarioDir.name, scenarioPkg.main);
  writeWorkaroundExportOnFirstLine(scenarioMainFilePath);
})