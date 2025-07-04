import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('Vite 개발 서버를 시작합니다...');

// Run vite directly from the root directory with proper configuration
const viteProcess = spawn('npx', [
  'vite', 
  '--config', 
  path.join(__dirname, '../vite.config.ts'),
  '--host', 
  '0.0.0.0', 
  '--port', 
  '5000'
], {
  cwd: path.join(__dirname, '../'),
  stdio: 'inherit',
  env: {
    ...process.env,
    NODE_ENV: 'development'
  }
});

viteProcess.on('error', (error) => {
  console.error('Vite 서버 시작 실패:', error);
});

viteProcess.on('close', (code) => {
  console.log(`Vite 서버가 코드 ${code}로 종료되었습니다`);
});

// 우아한 종료 처리
process.on('SIGTERM', () => {
  viteProcess.kill();
});

process.on('SIGINT', () => {
  viteProcess.kill();
});