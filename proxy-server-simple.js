#!/usr/bin/env node
/**
 * 간단한 프록시 서버 (Port 5500)
 * Frontend(5173)와 Backend(8000)를 통합 서비스
 */

const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');

const app = express();
const PORT = 5500;

// 기본 미들웨어
app.use(express.json());

// 로깅 미들웨어
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} ${req.method} ${req.url}`);
  next();
});

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    port: PORT,
    timestamp: new Date().toISOString()
  });
});

// API 프록시 (Django Backend)
const apiProxy = createProxyMiddleware({
  target: 'http://localhost:8000',
  changeOrigin: true,
  logLevel: 'debug',
  onError: (err, req, res) => {
    console.error('🔴 API Proxy Error:', err.message);
    if (!res.headersSent) {
      res.status(502).json({ error: 'Backend connection failed' });
    }
  },
  onProxyReq: (proxyReq, req, res) => {
    console.log('🔀 API Proxy:', req.method, req.url, '→', `${proxyReq.protocol}//${proxyReq.getHeader('host')}${proxyReq.path}`);
  },
  onProxyRes: (proxyRes, req, res) => {
    console.log('✅ API Response:', proxyRes.statusCode, req.url);
  }
});

app.use('/api/*', apiProxy);
app.use('/api', apiProxy);

// 모든 다른 요청을 Frontend로 프록시
app.use('*', createProxyMiddleware({
  target: 'http://localhost:5173',
  changeOrigin: true,
  ws: true,
  logLevel: 'debug',
  onError: (err, req, res) => {
    console.error('Frontend Proxy Error:', err.message);
    res.status(502).send('<h1>Frontend connection failed</h1><p>Make sure Vite server is running on port 5173</p>');
  },
  onProxyReq: (proxyReq, req, res) => {
    console.log('→ Frontend:', req.method, req.url);
  }
}));

// 서버 시작
const server = app.listen(PORT, () => {
  console.log(`\n🚀 Simple Proxy Server running on port ${PORT}`);
  console.log(`📍 Access: http://localhost:${PORT}`);
  console.log(`🔀 Routes: /api/* → :8000, /* → :5173\n`);
});

// WebSocket 지원
server.on('upgrade', (request, socket, head) => {
  console.log('WebSocket upgrade:', request.url);
});

process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down proxy server...');
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});