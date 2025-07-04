#!/usr/bin/env node
import { spawn } from 'child_process';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import express from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..');

console.log('Starting Django + React development servers...');

// Start Django server
const djangoProcess = spawn('python3', ['start_django.py'], {
  cwd: rootDir,
  stdio: 'inherit',
  detached: false
});

// Start Vite server
const viteProcess = spawn('npx', ['vite', '--host', '0.0.0.0', '--port', '5173'], {
  cwd: rootDir,
  stdio: 'inherit',
  detached: false
});

// Wait for servers to start, then create proxy server
setTimeout(() => {
  const app = express();
  
  // Add body parsing middleware
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  
  // Manual proxy for API requests to preserve /api prefix
  app.use('/api/*', async (req, res) => {
    try {
      const targetUrl = `http://localhost:8000${req.originalUrl}`;
      console.log('Proxying request:', req.originalUrl, 'to', targetUrl);
      console.log('Request body:', req.body);
      
      const response = await fetch(targetUrl, {
        method: req.method,
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: req.method !== 'GET' && req.method !== 'HEAD' ? JSON.stringify(req.body) : undefined
      });
      
      const data = await response.text();
      res.status(response.status);
      res.set(Object.fromEntries(response.headers.entries()));
      res.send(data);
    } catch (error) {
      console.error('Proxy error:', error);
      res.status(500).json({ error: 'Proxy error' });
    }
  });
  
  // Proxy everything else to Vite
  app.use('/', createProxyMiddleware({
    target: 'http://localhost:5173',
    changeOrigin: true,
    ws: true,
  }));
  
  app.listen(5000, '0.0.0.0', () => {
    console.log('Proxy server running on port 5000');
  });
}, 5000);

// Handle process termination
process.on('SIGINT', () => {
  console.log('\nShutting down servers...');
  djangoProcess.kill('SIGTERM');
  viteProcess.kill('SIGTERM');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\nShutting down servers...');
  djangoProcess.kill('SIGTERM');
  viteProcess.kill('SIGTERM');
  process.exit(0);
});

// Handle Django process exit
djangoProcess.on('exit', (code) => {
  console.log(`Django server exited with code ${code}`);
  if (code !== 0) {
    console.error('Django server failed to start');
    viteProcess.kill('SIGTERM');
    process.exit(code || 1);
  }
});

// Handle Vite process exit
viteProcess.on('exit', (code) => {
  console.log(`Vite server exited with code ${code}`);
  if (code !== 0) {
    console.error('Vite server failed to start');
    djangoProcess.kill('SIGTERM');
    process.exit(code || 1);
  }
});

console.log('Both servers started successfully!');