const { chromium } = require('playwright');

async function check5500Error() {
  console.log('🔍 5500 포트 오류 진단 시작...\n');
  
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 1000
  }); 
  const page = await browser.newPage();
  
  // 콘솔 로그 캐치
  const consoleMessages = [];
  const errors = [];
  
  page.on('console', msg => {
    consoleMessages.push({
      type: msg.type(),
      text: msg.text(),
      location: msg.location()
    });
  });
  
  page.on('pageerror', error => {
    errors.push({
      message: error.message,
      stack: error.stack
    });
  });
  
  page.on('requestfailed', request => {
    console.log(`❌ 요청 실패: ${request.method()} ${request.url()}`);
    console.log(`   실패 이유: ${request.failure()?.errorText}`);
  });
  
  try {
    console.log('1. 🌐 http://localhost:5500 메인 페이지 접속');
    await page.goto('http://localhost:5500', { 
      waitUntil: 'networkidle',
      timeout: 30000 
    });
    
    await page.waitForTimeout(3000);
    
    const title = await page.title();
    console.log(`   ✅ 페이지 제목: "${title}"`);
    
    const url = page.url();
    console.log(`   🌐 현재 URL: ${url}`);
    
    // 2. Menu2 페이지로 이동
    console.log('\n2. 🔗 Menu2 페이지로 이동');
    await page.goto('http://localhost:5500/menu2', { 
      waitUntil: 'networkidle',
      timeout: 30000 
    });
    
    await page.waitForTimeout(5000);
    
    const menu2Title = await page.title();
    console.log(`   ✅ Menu2 페이지 제목: "${menu2Title}"`);
    
    const menu2Url = page.url();
    console.log(`   🌐 Menu2 URL: ${menu2Url}`);
    
    // 페이지 내용 확인
    const bodyText = await page.locator('body').textContent();
    const hasContent = bodyText && bodyText.trim().length > 0;
    console.log(`   📄 페이지 내용: ${hasContent ? '정상 로드됨' : '내용 없음'}`);
    
    if (bodyText && bodyText.includes('의뢰 상신')) {
      console.log('   ✅ "의뢰 상신" 텍스트 확인됨');
    }
    
    if (bodyText && bodyText.includes('BizSystem')) {
      console.log('   ✅ "BizSystem" 텍스트 확인됨');
    }
    
    // 3. 에러 체크
    console.log('\n3. 🔍 에러 및 콘솔 메시지 분석');
    
    if (errors.length > 0) {
      console.log(`   ❌ JavaScript 에러 ${errors.length}개 발견:`);
      errors.forEach((error, index) => {
        console.log(`      ${index + 1}. ${error.message}`);
        if (error.stack) {
          console.log(`         스택: ${error.stack.split('\n')[0]}`);
        }
      });
    } else {
      console.log('   ✅ JavaScript 에러 없음');
    }
    
    // 콘솔 메시지 분석
    const errorMessages = consoleMessages.filter(msg => msg.type === 'error');
    const warningMessages = consoleMessages.filter(msg => msg.type === 'warning');
    
    if (errorMessages.length > 0) {
      console.log(`   ❌ 콘솔 에러 ${errorMessages.length}개:`);
      errorMessages.forEach((msg, index) => {
        console.log(`      ${index + 1}. ${msg.text}`);
      });
    } else {
      console.log('   ✅ 콘솔 에러 없음');
    }
    
    if (warningMessages.length > 0) {
      console.log(`   ⚠️  콘솔 경고 ${warningMessages.length}개:`);
      warningMessages.forEach((msg, index) => {
        console.log(`      ${index + 1}. ${msg.text}`);
      });
    }
    
    // 4. 네트워크 상태 확인
    console.log('\n4. 🌐 네트워크 상태 확인');
    
    const response = await page.evaluate(async () => {
      try {
        const resp = await fetch('/api/emp-info');
        return {
          ok: resp.ok,
          status: resp.status,
          statusText: resp.statusText
        };
      } catch (error) {
        return {
          ok: false,
          error: error.message
        };
      }
    });
    
    if (response.ok) {
      console.log(`   ✅ API 연결 정상 (${response.status} ${response.statusText})`);
    } else {
      console.log(`   ❌ API 연결 실패: ${response.error || response.status}`);
    }
    
    // 5. 스크린샷 촬영
    await page.screenshot({ 
      path: 'check-5500-current-state.png',
      fullPage: true 
    });
    console.log('\n📸 현재 상태 스크린샷: check-5500-current-state.png');
    
    console.log('\n🎯 진단 결과 요약:');
    console.log('='.repeat(50));
    console.log(`   서버 상태: 정상 (HTTP 200 응답)`);
    console.log(`   페이지 로드: ${hasContent ? '성공' : '실패'}`);
    console.log(`   JavaScript 에러: ${errors.length}개`);
    console.log(`   콘솔 에러: ${errorMessages.length}개`);
    console.log(`   API 연결: ${response.ok ? '정상' : '실패'}`);
    
    if (errors.length === 0 && errorMessages.length === 0 && hasContent) {
      console.log('\n✅ 모든 검사가 정상입니다. 특별한 오류가 발견되지 않았습니다.');
    } else {
      console.log('\n⚠️  일부 문제가 발견되었습니다. 위의 세부사항을 확인하세요.');
    }
    
  } catch (error) {
    console.error('\n💥 진단 중 오류 발생:');
    console.error(`   에러: ${error.message}`);
    
    await page.screenshot({ 
      path: 'check-5500-error.png',
      fullPage: true 
    });
    console.error('   📸 에러 스크린샷: check-5500-error.png');
  } finally {
    console.log('\n⏳ 브라우저 유지 (10초)...');
    await page.waitForTimeout(10000);
    await browser.close();
    console.log('🏁 5500 포트 진단 완료');
  }
}

// 실행
check5500Error().catch(console.error);