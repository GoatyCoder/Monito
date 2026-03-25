const { spawn } = require('child_process');
const path = require('path');

const args = process.argv.slice(2);
const schemaArg = args.findIndex(arg => arg.startsWith('--schema='));
const schemaPath = schemaArg >= 0 ? args[schemaArg].split('=')[1] : 'prisma/schema.prisma';

const prismaBin = path.join(__dirname, 'node_modules/prisma/build/index.js');

const child = spawn(process.execPath, [prismaBin, 'generate', `--schema=${schemaPath}`], {
  env: { ...process.env, PNPM_SKIP_POSTINSTALL_GENERATE: 'true' },
  stdio: 'inherit',
});

child.on('exit', (code) => process.exit(code ?? 0));
