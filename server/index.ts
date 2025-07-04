import { createServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startViteServer() {
  try {
    const server = await createServer({
      configFile: path.join(__dirname, '../vite.config.ts'),
      server: {
        host: '0.0.0.0',
        port: 5000,
        strictPort: true
      }
    });

    await server.listen();
    console.log('Vite dev server running on http://0.0.0.0:5000');
    
    // Handle graceful shutdown
    process.on('SIGTERM', async () => {
      await server.close();
    });
    
    process.on('SIGINT', async () => {
      await server.close();
    });
  } catch (error) {
    console.error('Failed to start Vite server:', error);
    process.exit(1);
  }
}

if (process.env.NODE_ENV === 'development') {
  startViteServer();
} else {
  console.log('Production mode not configured for this frontend-only application');
}