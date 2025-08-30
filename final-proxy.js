#!/usr/bin/env node
/**
 * 최종 프록시 서버 - 조건부 라우팅 방식
 */

const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');

const app = express();
const PORT = 5500;

// 로깅
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
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

// Django API 프록시 미들웨어
const apiProxy = createProxyMiddleware({
  target: 'http://localhost:8000',
  changeOrigin: true,
  onProxyReq: (proxyReq, req, res) => {
    console.log(`🔀 [API] ${req.method} ${req.originalUrl} → http://localhost:8000${req.originalUrl}`);
  },
  onProxyRes: (proxyRes, req, res) => {
    console.log(`✅ [API] Response ${proxyRes.statusCode} for ${req.originalUrl}`);
  },
  onError: (err, req, res) => {
    console.error(`🔴 [API] Error: ${err.message}`);
    if (!res.headersSent) {
      res.status(502).json({ error: 'API server error', message: err.message });
    }
  }
});

// Frontend 프록시 미들웨어
const frontendProxy = createProxyMiddleware({
  target: 'http://localhost:5174',
  changeOrigin: true,
  ws: true,
  onProxyReq: (proxyReq, req, res) => {
    console.log(`🔀 [FRONTEND] ${req.method} ${req.originalUrl} → http://localhost:5174${req.originalUrl}`);
  },
  onError: (err, req, res) => {
    console.error(`🔴 [FRONTEND] Error: ${err.message}`);
    if (!res.headersSent) {
      res.status(502).send('<h1>Frontend server error</h1>');
    }
  }
});

// 라우팅 로직 - API 요청 우선 처리
app.use((req, res, next) => {
  if (req.path.startsWith('/api/') || req.path === '/api') {
    return apiProxy(req, res, next);
  } else {
    return frontendProxy(req, res, next);
  }
});

// 서버 시작
const server = app.listen(PORT, () => {
  console.log(`\n🚀 Final Proxy Server Started`);
  console.log(`==========================================`);
  console.log(`📍 URL: http://localhost:${PORT}`);
  console.log(`🔀 /api/* → Django :8000`);
  console.log(`🔀 /*     → Vite :5174`);
  console.log(`==========================================\n`);
});

// WebSocket 지원
server.on('upgrade', (request, socket, head) => {
  console.log('🔌 WebSocket upgrade:', request.url);
  frontendProxy.upgrade(request, socket, head);
});

// 종료 처리
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down...');
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});