import fs from 'fs';
import path from 'path';

fs.writeFileSync(
  './test/resources/firefox/profile/user.js',
  `
user_pref("network.socket.forcePort", "443=8443;80=8080")
user_pref("network.dns.forceResolve", "localhost")
  `,
);
