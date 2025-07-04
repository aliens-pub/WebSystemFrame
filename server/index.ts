import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// In development mode, start the Vite dev server
if (process.env.NODE_ENV === 'development') {
  console.log('Starting Vite dev server...');
  
  const viteProcess = spawn('npx', ['vite', '--host', '0.0.0.0', '--port', '5000'], {
    cwd: path.join(__dirname, '../'),
    stdio: 'inherit'
  });
  
  viteProcess.on('error', (error) => {
    console.error('Failed to start Vite dev server:', error);
  });
  
  viteProcess.on('close', (code) => {
    console.log(`Vite dev server exited with code ${code}`);
  });
  
  // Handle graceful shutdown
  process.on('SIGTERM', () => {
    viteProcess.kill();
  });
  
  process.on('SIGINT', () => {
    viteProcess.kill();
  });
} else {
  // In production mode, start a simple Express server
  console.log('Production mode not configured for this frontend-only application');
}