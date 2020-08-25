import path from 'path';
import { TgzHelper } from 'get-set-fetch-extension-test-utils';

// tar and zip the npm package
const npmPkgParentPath = path.join(process.cwd(), 'test', 'resources', 'sites', 'registry.npmjs.org', 'extract-html-headings', '-');
const tgzPath = path.join(process.cwd(), 'test', 'resources', 'sites', 'registry.npmjs.org', 'extract-html-headings', '-');
const tgzName = 'extract-html-headings-0.1.5';
TgzHelper.tgz(npmPkgParentPath, tgzPath, tgzName);
