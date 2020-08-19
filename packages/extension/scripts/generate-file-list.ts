import fs from 'fs';
import path, { join } from 'path';

/*
This is required as Firefox can't access filesystem like chrome does via browser.runtime.getPackageDirectoryEntry.
Extension will fetch the file list for plugins and scenarios and afterwards the actual files.
*/

// 1. plugin list
const pluginDir = path.join(process.cwd(), 'dist/background/plugins');
const pluginFiles = fs.readdirSync(pluginDir, { withFileTypes: true }).filter(pluginFile => pluginFile.isFile());

fs.writeFileSync(
  join(process.cwd(), 'dist/background/plugins/plugin-list.json'),
  JSON.stringify(
    pluginFiles.map(pluginFile => pluginFile.name.match(/^(\w+).js$/)[1]),
  ),
);

// 2. scenario list
const scenarioRootDir = path.join(process.cwd(), 'dist/scenarios');
const scenarioDirs = fs.readdirSync(scenarioRootDir, { withFileTypes: true }).filter(scenarioDir => scenarioDir.isDirectory());

fs.writeFileSync(
  join(process.cwd(), 'dist/scenarios/scenario-list.json'),
  JSON.stringify(
    scenarioDirs.map(scenarioDir => scenarioDir.name),
  ),
);
