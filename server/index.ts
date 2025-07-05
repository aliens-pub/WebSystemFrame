import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { readFileSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

// Serve static files
app.use('/node_modules', express.static(path.join(__dirname, '../node_modules')));
app.use('/client', express.static(path.join(__dirname, '../client')));
app.use('/shared', express.static(path.join(__dirname, '../shared')));

// Handle TypeScript files by transforming them
app.get('/src/*.tsx?', async (req, res) => {
  try {
    const filePath = path.join(__dirname, '../client', req.path);
    const content = readFileSync(filePath, 'utf-8');
    
    // Simple TypeScript to JavaScript transformation
    const jsContent = content
      .replace(/import\s+.*?\s+from\s+['"]@\/(.+?)['"]/g, 'import $1 from "/src/$1"')
      .replace(/import\s+.*?\s+from\s+['"]@shared\/(.+?)['"]/g, 'import $1 from "/shared/$1"')
      .replace(/export\s+interface\s+.*?\{[^}]*\}/gs, '')
      .replace(/:\s*\w+(\[\])?/g, '')
      .replace(/\?:/g, ':')
      .replace(/as\s+\w+/g, '');
    
    res.setHeader('Content-Type', 'application/javascript');
    res.send(jsContent);
  } catch (error) {
    console.error('TypeScript transformation error:', error);
    res.status(500).send('TypeScript transformation failed');
  }
});

// Main HTML page
app.get('*', (req, res) => {
  const html = `
<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>한국어 웹 애플리케이션</title>
  <style>
    body {
      margin: 0;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen',
        'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue',
        sans-serif;
      -webkit-font-smoothing: antialiased;
      -moz-osx-font-smoothing: grayscale;
    }
    
    #root {
      height: 100vh;
    }
    
    .login-container {
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      background-color: #f5f5f5;
    }
    
    .login-form {
      background: white;
      padding: 2rem;
      border-radius: 8px;
      box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
      width: 100%;
      max-width: 400px;
    }
    
    .login-form h1 {
      text-align: center;
      margin-bottom: 1.5rem;
      color: #333;
    }
    
    .form-group {
      margin-bottom: 1rem;
    }
    
    .form-group label {
      display: block;
      margin-bottom: 0.5rem;
      font-weight: 500;
      color: #555;
    }
    
    .form-group input {
      width: 100%;
      padding: 0.75rem;
      border: 1px solid #ddd;
      border-radius: 4px;
      font-size: 1rem;
      box-sizing: border-box;
    }
    
    .form-group input:focus {
      outline: none;
      border-color: #007bff;
    }
    
    .login-button {
      width: 100%;
      padding: 0.75rem;
      background-color: #007bff;
      color: white;
      border: none;
      border-radius: 4px;
      font-size: 1rem;
      cursor: pointer;
      transition: background-color 0.2s;
    }
    
    .login-button:hover {
      background-color: #0056b3;
    }
    
    .app-container {
      display: flex;
      flex-direction: column;
      height: 100vh;
    }
    
    .header {
      background-color: #343a40;
      color: white;
      padding: 1rem;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    
    .nav-menu {
      display: flex;
      gap: 1rem;
    }
    
    .nav-button {
      background: none;
      border: none;
      color: white;
      cursor: pointer;
      padding: 0.5rem 1rem;
      border-radius: 4px;
      transition: background-color 0.2s;
    }
    
    .nav-button:hover {
      background-color: #495057;
    }
    
    .nav-button.active {
      background-color: #007bff;
    }
    
    .user-info {
      display: flex;
      align-items: center;
      gap: 1rem;
    }
    
    .main-content {
      flex: 1;
      padding: 2rem;
      background-color: #f8f9fa;
    }
    
    .dashboard {
      max-width: 1200px;
      margin: 0 auto;
    }
    
    .dashboard h1 {
      margin-bottom: 2rem;
      color: #333;
    }
    
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 1rem;
      margin-bottom: 2rem;
    }
    
    .stat-card {
      background: white;
      padding: 1.5rem;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }
    
    .stat-card h3 {
      margin: 0 0 0.5rem 0;
      color: #666;
      font-size: 0.9rem;
      font-weight: 500;
    }
    
    .stat-card .value {
      font-size: 2rem;
      font-weight: bold;
      color: #333;
    }
    
    .menu-page {
      max-width: 800px;
      margin: 0 auto;
    }
    
    .menu-page h1 {
      margin-bottom: 1rem;
      color: #333;
    }
    
    .menu-page p {
      color: #666;
      line-height: 1.6;
    }
    
    .admin-panel {
      background: white;
      padding: 2rem;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }
    
    .admin-panel h2 {
      margin-bottom: 1rem;
      color: #333;
    }
    
    .access-denied {
      text-align: center;
      padding: 2rem;
      color: #dc3545;
    }
    
    .logout-button {
      background: #dc3545;
      color: white;
      border: none;
      padding: 0.5rem 1rem;
      border-radius: 4px;
      cursor: pointer;
    }
    
    .logout-button:hover {
      background: #c82333;
    }
  </style>
</head>
<body>
  <div id="root">
    <div class="login-container" id="loginContainer">
      <div class="login-form">
        <h1>로그인</h1>
        <form id="loginForm">
          <div class="form-group">
            <label for="username">사용자명</label>
            <input type="text" id="username" required>
          </div>
          <div class="form-group">
            <label for="password">비밀번호</label>
            <input type="password" id="password" required>
          </div>
          <button type="submit" class="login-button">로그인</button>
        </form>
      </div>
    </div>
    
    <div class="app-container" id="appContainer" style="display: none;">
      <div class="header">
        <div class="nav-menu">
          <button class="nav-button active" onclick="showPage('dashboard')">대시보드</button>
          <button class="nav-button" onclick="showPage('menu1')">메뉴1</button>
          <button class="nav-button" onclick="showPage('menu2')">메뉴2</button>
          <button class="nav-button" onclick="showPage('menu3')">메뉴3</button>
          <button class="nav-button" onclick="showPage('menu4')" id="menu4Button">메뉴4</button>
        </div>
        <div class="user-info">
          <span id="userGreeting"></span>
          <button class="logout-button" onclick="logout()">로그아웃</button>
        </div>
      </div>
      
      <div class="main-content">
        <div id="dashboard" class="dashboard">
          <h1>대시보드</h1>
          <div class="stats-grid">
            <div class="stat-card">
              <h3>총 사용자</h3>
              <div class="value">1,234</div>
            </div>
            <div class="stat-card">
              <h3>활성 세션</h3>
              <div class="value">56</div>
            </div>
            <div class="stat-card">
              <h3>시스템 상태</h3>
              <div class="value">정상</div>
            </div>
          </div>
          <div class="admin-panel" id="adminPanel" style="display: none;">
            <h2>관리자 패널</h2>
            <p>사용자 역할 관리 기능을 여기에 구현할 수 있습니다.</p>
          </div>
        </div>
        
        <div id="menu1" style="display: none;">
          <div class="menu-page">
            <h1>메뉴 1</h1>
            <p>메뉴 1의 내용이 여기에 표시됩니다.</p>
          </div>
        </div>
        
        <div id="menu2" style="display: none;">
          <div class="menu-page">
            <h1>메뉴 2</h1>
            <p>메뉴 2의 내용이 여기에 표시됩니다.</p>
          </div>
        </div>
        
        <div id="menu3" style="display: none;">
          <div class="menu-page">
            <h1>메뉴 3</h1>
            <p>메뉴 3의 내용이 여기에 표시됩니다.</p>
          </div>
        </div>
        
        <div id="menu4" style="display: none;">
          <div class="menu-page">
            <h1>메뉴 4</h1>
            <div id="menu4Content">
              <p>메뉴 4의 내용이 여기에 표시됩니다.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>

  <script>
    // Mock authentication and user management
    let currentUser = null;
    
    // Mock users database
    const users = {
      'admin': { username: 'admin', password: '1234', role: 'MANAGER' },
      'user': { username: 'user', password: '1234', role: 'ENGINEER' }
    };
    
    // Login form handler
    document.getElementById('loginForm').addEventListener('submit', function(e) {
      e.preventDefault();
      const username = document.getElementById('username').value;
      const password = document.getElementById('password').value;
      
      if (users[username] && users[username].password === password) {
        currentUser = users[username];
        showApp();
      } else {
        alert('잘못된 사용자명 또는 비밀번호입니다.');
      }
    });
    
    function showApp() {
      document.getElementById('loginContainer').style.display = 'none';
      document.getElementById('appContainer').style.display = 'flex';
      
      // Update user greeting
      document.getElementById('userGreeting').textContent = currentUser.username + '님 안녕하세요!';
      
      // Show/hide Menu4 and Admin Panel based on role
      const menu4Button = document.getElementById('menu4Button');
      const adminPanel = document.getElementById('adminPanel');
      
      if (currentUser.role === 'MANAGER') {
        menu4Button.style.display = 'block';
        adminPanel.style.display = 'block';
      } else {
        menu4Button.style.display = 'none';
        adminPanel.style.display = 'none';
      }
      
      showPage('dashboard');
    }
    
    function showPage(pageId) {
      // Hide all pages
      const pages = ['dashboard', 'menu1', 'menu2', 'menu3', 'menu4'];
      pages.forEach(page => {
        document.getElementById(page).style.display = 'none';
      });
      
      // Remove active class from all buttons
      document.querySelectorAll('.nav-button').forEach(button => {
        button.classList.remove('active');
      });
      
      // Check access for Menu4
      if (pageId === 'menu4' && currentUser.role !== 'MANAGER') {
        document.getElementById('menu4Content').innerHTML = 
          '<div class="access-denied"><h2>접근 거부</h2><p>이 페이지에 접근할 권한이 없습니다.</p></div>';
      }
      
      // Show selected page
      document.getElementById(pageId).style.display = 'block';
      
      // Add active class to clicked button
      event.target.classList.add('active');
    }
    
    function logout() {
      currentUser = null;
      document.getElementById('loginContainer').style.display = 'flex';
      document.getElementById('appContainer').style.display = 'none';
      document.getElementById('username').value = '';
      document.getElementById('password').value = '';
    }
  </script>
</body>
</html>
  `;
  
  res.send(html);
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`한국어 웹 애플리케이션이 http://0.0.0.0:${PORT} 에서 실행 중입니다`);
  console.log(`호스트 제한 없이 모든 연결을 허용합니다`);
});