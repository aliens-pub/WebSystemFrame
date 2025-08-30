#!/usr/bin/env node
/**
 * Nginx 대체용 Node.js 프록시 서버
 * Port 5500에서 Frontend(5173)와 Backend(8000)를 통합 서비스
 * 운영 배포를 대비한 프록시 설정
 */

const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const cors = require('cors');
const compression = require('compression');

const app = express();
const PORT = 5500;

// 미들웨어 설정
app.use(compression()); // Gzip 압축
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 보안 헤더
app.use((req, res, next) => {
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  next();
});

// CORS 설정
app.use('/api/*', cors({
  origin: ['http://localhost:5500', 'http://localhost:5173', 'http://localhost:3000'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Accept', 'Authorization', 'Cache-Control', 'Content-Type', 'DNT', 'If-Modified-Since', 'Keep-Alive', 'Origin', 'User-Agent', 'X-Requested-With'],
  credentials: true
}));

// API 프록시 설정 (Django Backend) - 간단한 방식으로 변경
const apiProxy = createProxyMiddleware({
  target: 'http://localhost:8000',
  changeOrigin: true,
  timeout: 30000,
  proxyTimeout: 30000,
  logLevel: 'info',
  onError: (err, req, res) => {
    console.error('🔴 API Proxy Error:', err.message);
    if (!res.headersSent) {
      res.status(502).json({
        error: 'Backend API 서버 연결 실패',
        message: 'Django 서버가 실행 중인지 확인해주세요 (Port 8000)',
        timestamp: new Date().toISOString()
      });
    }
  },
  onProxyReq: (proxyReq, req, res) => {
    console.log('🔀 API Proxy:', req.method, req.originalUrl, '→', `http://localhost:8000${req.originalUrl}`);
  },
  onProxyRes: (proxyRes, req, res) => {
    // API 응답 로깅
    console.log('✅ API Response:', req.method, req.originalUrl, '→', proxyRes.statusCode);
    
    // CORS 헤더 추가 (Django에서 설정되지 않은 경우 대비)
    proxyRes.headers['Access-Control-Allow-Origin'] = req.get('Origin') || '*';
    proxyRes.headers['Access-Control-Allow-Credentials'] = 'true';
  }
});

// Frontend 프록시 설정 (Vite React)
const frontendProxy = createProxyMiddleware({
  target: 'http://localhost:5173',
  changeOrigin: true,
  ws: true, // WebSocket 지원 (HMR용)
  timeout: 30000,
  proxyTimeout: 30000,
  logLevel: 'info',
  onError: (err, req, res) => {
    console.error('🔴 Frontend Proxy Error:', err.message);
    res.status(502).send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>서버 연결 오류</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 50px; text-align: center; }
          .error { color: #e74c3c; }
          .info { color: #3498db; margin-top: 20px; }
        </style>
      </head>
      <body>
        <h1 class="error">Frontend 서버 연결 실패</h1>
        <p>Vite 개발 서버가 실행 중인지 확인해주세요 (Port 5173)</p>
        <div class="info">
          <h3>서버 상태 확인:</h3>
          <p>• Frontend: <a href="http://localhost:5173" target="_blank">http://localhost:5173</a></p>
          <p>• Backend: <a href="http://localhost:8000" target="_blank">http://localhost:8000</a></p>
        </div>
        <p><small>오류 시간: ${new Date().toLocaleString()}</small></p>
      </body>
      </html>
    `);
  },
  onProxyReq: (proxyReq, req, res) => {
    // 개발 환경에서는 캐시 비활성화
    proxyReq.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    proxyReq.setHeader('Pragma', 'no-cache');
    proxyReq.setHeader('Expires', '0');
  },
  onProxyRes: (proxyRes, req, res) => {
    // SPA 라우팅을 위한 헤더 설정
    if (req.url === '/' || req.url.startsWith('/menu') || req.url.startsWith('/admin')) {
      proxyRes.headers['Cache-Control'] = 'no-cache, no-store, must-revalidate';
    }
  }
});

// Health check 엔드포인트
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    proxy: 'Node.js Express',
    port: PORT,
    timestamp: new Date().toISOString(),
    services: {
      frontend: 'http://localhost:5173',
      backend: 'http://localhost:8000'
    }
  });
});

// 서버 상태 확인 엔드포인트
app.get('/status', async (req, res) => {
  const checkService = (url) => {
    return new Promise((resolve) => {
      const http = require('http');
      const options = new URL(url);
      const request = http.get(options, (response) => {
        resolve({ url, status: 'OK', code: response.statusCode });
      });
      request.on('error', (err) => {
        resolve({ url, status: 'ERROR', error: err.message });
      });
      request.setTimeout(5000, () => {
        request.destroy();
        resolve({ url, status: 'TIMEOUT' });
      });
    });
  };

  const [frontendStatus, backendStatus] = await Promise.all([
    checkService('http://localhost:5173'),
    checkService('http://localhost:8000')
  ]);

  res.json({
    proxy: {
      status: 'OK',
      port: PORT
    },
    services: {
      frontend: frontendStatus,
      backend: backendStatus
    },
    timestamp: new Date().toISOString()
  });
});

// API 요청 먼저 처리 (더 구체적인 패턴 매칭)
app.use('/api/*', apiProxy);
app.use('/api', apiProxy);

// 나머지 모든 요청을 Frontend로 프록시 (API가 아닌 경우만)
app.use((req, res, next) => {
  if (req.path.startsWith('/api/')) {
    return next('route'); // API 요청은 이미 처리되었으므로 건너뜀
  }
  frontendProxy(req, res, next);
});

// 에러 핸들러
app.use((err, req, res, next) => {
  console.error('🔴 Server Error:', err);
  res.status(500).json({
    error: '서버 내부 오류',
    message: err.message,
    timestamp: new Date().toISOString()
  });
});

// 서버 시작
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log('🚀 Nginx 대체 프록시 서버 시작됨!');
  console.log('==========================================');
  console.log(`📍 통합 서비스: http://localhost:${PORT}`);
  console.log('📍 상태 확인:   http://localhost:5500/status');
  console.log('📍 Health:     http://localhost:5500/health');
  console.log('==========================================');
  console.log('🔀 프록시 라우팅:');
  console.log('   /api/*   → http://localhost:8000 (Django)');
  console.log('   /*       → http://localhost:5173 (Vite)');
  console.log('==========================================');
  console.log('⚠️  서버를 중지하려면 Ctrl+C를 누르세요');
});

// WebSocket 프록시 설정 (Vite HMR 지원)
server.on('upgrade', (request, socket, head) => {
  console.log('🔌 WebSocket 연결:', request.url);
  frontendProxy.upgrade(request, socket, head);
});

// 종료 처리
process.on('SIGINT', () => {
  console.log('\n🛑 프록시 서버 종료 중...');
  server.close(() => {
    console.log('✅ 프록시 서버가 정상적으로 종료되었습니다.');
    process.exit(0);
  });
});

process.on('SIGTERM', () => {
  console.log('\n🛑 프록시 서버 종료 중...');
  server.close(() => {
    console.log('✅ 프록시 서버가 정상적으로 종료되었습니다.');
    process.exit(0);
  });
});

module.exports = app;