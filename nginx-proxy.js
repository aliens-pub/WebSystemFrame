#!/usr/bin/env node
/**
 * Nginx 대체 프록시 서버 (Port 5500)
 * 운영 배포를 대비한 프록시 설정
 */

const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');

const app = express();
const PORT = 5500;

// 로깅
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${req.method} ${req.url}`);
  next();
});

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    port: PORT,
    services: {
      frontend: 'http://localhost:5173',
      backend: 'http://localhost:8000'
    },
    timestamp: new Date().toISOString()
  });
});

// Backend API 프록시 - /api/*로 더 구체적으로 매칭
app.use('/api/*', createProxyMiddleware({
  target: 'http://localhost:8000',
  changeOrigin: true,
  // pathRewrite 없이 원본 경로 그대로 전달
  onProxyReq: (proxyReq, req, res) => {
    console.log(`🔀 Proxying API: ${req.method} ${req.originalUrl} → http://localhost:8000${req.originalUrl}`);
  },
  onError: (err, req, res) => {
    console.error('🔴 Backend Error:', err.message);
    if (!res.headersSent) {
      res.status(502).json({
        error: 'Backend service unavailable',
        message: 'Django server (port 8000) is not responding'
      });
    }
  }
}));

// Frontend 프록시
app.use('/', (req, res, next) => {
  // API 요청이 아닌 경우에만 Frontend로 프록시
  if (!req.path.startsWith('/api')) {
    console.log(`🔀 Proxying Frontend: ${req.method} ${req.url} → http://localhost:5173${req.url}`);
  }
  next();
}, createProxyMiddleware({
  target: 'http://localhost:5173',
  changeOrigin: true,
  ws: true, // WebSocket support for HMR
  onError: (err, req, res) => {
    console.error('🔴 Frontend Error:', err.message);
    if (!res.headersSent) {
      res.status(502).send(`
        <html>
          <head><title>Service Unavailable</title></head>
          <body>
            <h1>Frontend Service Unavailable</h1>
            <p>Vite server (port 5173) is not responding</p>
            <p><a href="/health">Check service status</a></p>
          </body>
        </html>
      `);
    }
  }
}));

const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`
🌐 Nginx 대체 프록시 서버 시작
==========================================
📍 통합 접속: http://localhost:${PORT}
📍 상태 확인: http://localhost:${PORT}/health
==========================================
🔄 라우팅 규칙:
   /api/*  → Django Backend  (8000)
   /*      → React Frontend  (5173)
==========================================
  `);
});

// WebSocket support
server.on('upgrade', (request, socket, head) => {
  console.log('🔌 WebSocket upgrade for:', request.url);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down proxy server...');
  server.close(() => {
    console.log('✅ Proxy server closed');
    process.exit(0);
  });
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Received SIGTERM, shutting down...');
  server.close(() => {
    console.log('✅ Proxy server closed');
    process.exit(0);
  });
});

module.exports = app;