import express from 'express';
import { createServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  
  // Create Vite server in middleware mode with custom configuration
  const vite = await createServer({
    server: { 
      middlewareMode: true,
      hmr: {
        port: 5001 // Use different port for HMR
      }
    },
    appType: 'spa',
    root: path.join(__dirname, '../client'),
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '../client/src'),
        '@shared': path.resolve(__dirname, '../shared'),
        '@assets': path.resolve(__dirname, '../attached_assets'),
      },
    },
    // Override server configuration to allow all hosts
    configFile: false, // Don't use vite.config.ts
    plugins: [
      (await import('@vitejs/plugin-react')).default()
    ]
  });

  // Use vite's connect instance as middleware
  app.use(vite.middlewares);

  const PORT = process.env.PORT || 5000;
  
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`한국어 웹 애플리케이션이 http://0.0.0.0:${PORT} 에서 실행 중입니다`);
    console.log(`모든 호스트 연결이 허용됩니다`);
  });
}

startServer().catch(console.error);