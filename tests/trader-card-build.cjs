// Isolated production artifacts keep local development's .next directory intact.
process.env.NODE_ENV = 'production';
const config = require('next/dist/server/config');
const load = config.default;
config.default = async (...args) => ({ ...await load(...args), distDir: 'out/card-export-build' });
require('next/dist/build').default(process.cwd()).catch(error => {
  console.error(error); process.exitCode = 1;
});
