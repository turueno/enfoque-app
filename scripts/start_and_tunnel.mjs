import { spawn } from 'child_process';
import { startTunnel } from 'untun';
import http from 'http';

function waitForServer(port, timeout = 30000) {
  const start = Date.now();
  return new Promise((resolve, reject) => {
    const check = () => {
      const req = http.get(`http://localhost:${port}`, (res) => {
        resolve();
      });
      req.on('error', () => {
        if (Date.now() - start > timeout) {
          reject(new Error('Timeout esperando a que Next.js inicie en el puerto ' + port));
        } else {
          setTimeout(check, 300);
        }
      });
    };
    check();
  });
}

async function main() {
  console.log('1. Iniciando servidor Next.js en puerto 3001...');
  const nextServer = spawn('npx', ['next', 'start', '-p', '3001'], {
    stdio: 'inherit',
    shell: true
  });

  nextServer.on('error', (err) => {
    console.error('Error en el servidor Next.js:', err);
  });

  await waitForServer(3001);
  console.log('✓ Servidor Next.js activo en http://localhost:3001');

  console.log('2. Conectando túnel seguro de Cloudflare...');
  const tunnel = await startTunnel({
    port: 3001,
    extraArgs: ['--no-autoupdate']
  });
  const url = await tunnel.getURL();

  console.log('\n======================================================');
  console.log('🚀 ENLACE PÚBLICO ACTIVO:');
  console.log(url);
  console.log('======================================================\n');
  console.log('Mantén esta ventana abierta mientras compartes el enlace.');

  const cleanup = () => {
    console.log('\nCerrando túnel y servidor...');
    try { nextServer.kill(); } catch (e) {}
    process.exit(0);
  };

  process.on('SIGINT', cleanup);
  process.on('SIGTERM', cleanup);
}

main().catch(console.error);
