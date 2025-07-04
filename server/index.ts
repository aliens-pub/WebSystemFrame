import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { readFileSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Set correct MIME types for JavaScript modules
app.use('/src', express.static(path.join(__dirname, '../client/src'), {
  setHeaders: (res, path) => {
    if (path.endsWith('.js') || path.endsWith('.jsx') || path.endsWith('.ts') || path.endsWith('.tsx')) {
      res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
    }
  }
}));

app.use('/node_modules', express.static(path.join(__dirname, '../node_modules'), {
  setHeaders: (res, path) => {
    if (path.endsWith('.js') || path.endsWith('.mjs')) {
      res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
    }
  }
}));

// Basic HTML template with JavaScript modules
app.get('*', (req, res) => {
  const html = `
<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>한국어 웹 애플리케이션</title>
  <script crossorigin src="https://unpkg.com/react@18/umd/react.development.js"></script>
  <script crossorigin src="https://unpkg.com/react-dom@18/umd/react-dom.development.js"></script>
  <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
  <style>
    body {
      margin: 0;
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    
    .container {
      background: white;
      padding: 40px;
      border-radius: 20px;
      box-shadow: 0 20px 40px rgba(0,0,0,0.1);
      text-align: center;
      max-width: 500px;
      width: 90%;
    }
    
    h1 {
      color: #333;
      margin-bottom: 20px;
      font-size: 2.5em;
    }
    
    p {
      color: #666;
      font-size: 1.2em;
      margin-bottom: 30px;
    }
    
    .nav-buttons {
      display: flex;
      gap: 15px;
      justify-content: center;
      flex-wrap: wrap;
      margin-bottom: 20px;
    }
    
    button {
      padding: 12px 24px;
      font-size: 16px;
      border: none;
      border-radius: 8px;
      cursor: pointer;
      transition: all 0.3s ease;
    }
    
    .login-btn {
      background: linear-gradient(45deg, #4CAF50, #45a049);
      color: white;
    }
    
    .menu-btn {
      background: linear-gradient(45deg, #2196F3, #0b7dda);
      color: white;
    }
    
    .admin-btn {
      background: linear-gradient(45deg, #ff9800, #f57c00);
      color: white;
    }
    
    button:hover {
      transform: translateY(-2px);
      box-shadow: 0 5px 15px rgba(0,0,0,0.2);
    }
    
    .status {
      margin-top: 20px;
      padding: 15px;
      border-radius: 8px;
      background: #e8f5e8;
      color: #2e7d32;
      font-weight: bold;
    }
  </style>
</head>
<body>
  <div id="root"></div>
  <script type="text/babel">
    const { useState, useEffect } = React;
    
    function App() {
      const [user, setUser] = useState(null);
      const [currentPage, setCurrentPage] = useState('home');
      
      useEffect(() => {
        const savedUser = localStorage.getItem('user');
        if (savedUser) {
          setUser(JSON.parse(savedUser));
        }
      }, []);
      
      const handleLogin = () => {
        const username = prompt('사용자명을 입력하세요:');
        if (username) {
          const userData = {
            username: username,
            role: username === 'admin' ? 'MANAGER' : 'ENGINEER'
          };
          setUser(userData);
          localStorage.setItem('user', JSON.stringify(userData));
          alert(\`\${username}님 안녕하세요!\`);
        }
      };
      
      const handleLogout = () => {
        setUser(null);
        localStorage.removeItem('user');
        setCurrentPage('home');
        alert('로그아웃되었습니다.');
      };
      
      const handleMenuClick = (menu) => {
        if (!user) {
          alert('로그인이 필요합니다.');
          return;
        }
        
        if (menu === 'Menu4' && user.role === 'ENGINEER') {
          alert('접근 권한이 없습니다. (관리자 전용)');
          return;
        }
        
        setCurrentPage(menu);
        alert(\`\${menu} 페이지로 이동합니다.\`);
      };
      
      const renderContent = () => {
        if (currentPage === 'admin') {
          return (
            <div>
              <h2>관리자 패널</h2>
              <p>사용자 역할 관리 기능</p>
              <button onClick={() => setCurrentPage('home')}>홈으로 돌아가기</button>
            </div>
          );
        }
        
        if (currentPage !== 'home') {
          return (
            <div>
              <h2>{currentPage}</h2>
              <p>{currentPage} 페이지 내용입니다.</p>
              <button onClick={() => setCurrentPage('home')}>홈으로 돌아가기</button>
            </div>
          );
        }
        
        return (
          <div>
            <h1>한국어 웹 애플리케이션</h1>
            <p>프론트엔드 전용 로그인 시스템</p>
            
            {user && (
              <div className="status">
                {user.username}님 안녕하세요! ({user.role})
              </div>
            )}
            
            <div className="nav-buttons">
              {!user ? (
                <button className="login-btn" onClick={handleLogin}>
                  로그인
                </button>
              ) : (
                <>
                  <button className="menu-btn" onClick={() => handleMenuClick('Menu1')}>
                    메뉴1
                  </button>
                  <button className="menu-btn" onClick={() => handleMenuClick('Menu2')}>
                    메뉴2
                  </button>
                  <button className="menu-btn" onClick={() => handleMenuClick('Menu3')}>
                    메뉴3
                  </button>
                  <button className="menu-btn" onClick={() => handleMenuClick('Menu4')}>
                    메뉴4
                  </button>
                  {user.role === 'MANAGER' && (
                    <button className="admin-btn" onClick={() => setCurrentPage('admin')}>
                      관리자 패널
                    </button>
                  )}
                  <button onClick={handleLogout}>
                    로그아웃
                  </button>
                </>
              )}
            </div>
          </div>
        );
      };
      
      return (
        <div className="container">
          {renderContent()}
        </div>
      );
    }
    
    ReactDOM.render(<App />, document.getElementById('root'));
  </script>
</body>
</html>
  `;
  
  res.send(html);
});

const PORT = Number(process.env.PORT) || 5000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`간단한 프론트엔드 서버가 http://0.0.0.0:${PORT} 에서 실행 중입니다`);
});