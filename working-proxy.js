#!/usr/bin/env node
/**
 * 간단하고 확실한 프록시 서버
 * Port 5500에서 작동
 */

const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');

const app = express();
const PORT = 5500;

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

// API 프록시 설정 (더 구체적으로)
app.use('/api*', createProxyMiddleware({
  target: 'http://localhost:8000',
  changeOrigin: true,
  logLevel: 'debug',
  onProxyReq: (proxyReq, req, res) => {
    console.log('🔀 Proxying to Django:', req.method, req.originalUrl, '→', `http://localhost:8000${req.originalUrl}`);
  },
  onProxyRes: (proxyRes, req, res) => {
    console.log('✅ Django response:', proxyRes.statusCode, req.originalUrl);
  },
  onError: (err, req, res) => {
    console.error('🔴 Django proxy error:', err.message);
    if (!res.headersSent) {
      res.status(502).json({ error: 'Django server connection failed' });
    }
  }
}));

// 다른 모든 요청은 Frontend로
app.use('*', createProxyMiddleware({
  target: 'http://localhost:5173',
  changeOrigin: true,
  ws: true,
  onProxyReq: (proxyReq, req, res) => {
    console.log('🔀 Proxying to Frontend:', req.method, req.originalUrl);
  },
  onError: (err, req, res) => {
    console.error('🔴 Frontend proxy error:', err.message);
    if (!res.headersSent) {
      res.status(502).send('<h1>Frontend server connection failed</h1>');
    }
  }
}));

// 서버 시작
const server = app.listen(PORT, () => {
  console.log(`\n🚀 Working Proxy Server running on port ${PORT}`);
  console.log(`📍 Access: http://localhost:${PORT}`);
  console.log(`🔀 API routes: /api/* → Django :8000`);
  console.log(`🔀 Frontend routes: /* → Vite :5173\n`);
});

// WebSocket 지원
server.on('upgrade', (request, socket, head) => {
  console.log('WebSocket upgrade:', request.url);
});

// 종료 처리
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down proxy server...');
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});