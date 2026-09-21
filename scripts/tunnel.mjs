import { startTunnel } from 'untun';

async function launch() {
  while (true) {
    try {
      console.log('Estableciendo conexión con Cloudflare Tunnel...');
      const tunnel = await startTunnel({ port: 3001 });
      const url = await tunnel.getURL();
      console.log('\n========================================');
      console.log('TU ENLACE PÚBLICO ACTIVO ES:');
      console.log(url);
      console.log('========================================\n');

      // Keep running unless process exits
      await new Promise((resolve, reject) => {
        process.on('SIGINT', resolve);
        process.on('SIGTERM', resolve);
      });
      break;
    } catch (err) {
      console.warn('Reconectando túnel en 3 segundos...', err.message);
      await new Promise(r => setTimeout(r, 3000));
    }
  }
}

launch().catch(console.error);
