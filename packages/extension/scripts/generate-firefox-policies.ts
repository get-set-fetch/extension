import fs from 'fs';
import path from 'path';

const ffRevisionPath = path.join(process.cwd(), 'node_modules', 'puppeteer', 'firefox-revision.json');
const { executablePath } = JSON.parse(fs.readFileSync(ffRevisionPath).toString());

const ffRootDir = path.dirname(executablePath);
const ffDistribDir = path.join(ffRootDir, "distribution");

if (!fs.existsSync(ffDistribDir)){
  fs.mkdirSync(ffDistribDir);
}

const policiesPath = path.join(ffDistribDir, "policies.json");
const pemCaPath = path.join(process.cwd(), 'test', 'resources', 'security', 'ca', 'ca-public-key-cert.pem');

fs.writeFileSync(
  policiesPath,
  `
  {
    "policies": {
      "Certificates": {
        "Install": ["${pemCaPath}"]
      }
    }
  }
  `,
);



