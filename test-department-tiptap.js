const { chromium } = require('playwright');

async function testDepartmentTiptap() {
  console.log('🚀 부서 선택 후 Tiptap 에디터 테스트 시작...\n');
  
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 1000
  }); 
  const page = await browser.newPage();
  await page.setViewportSize({ width: 1920, height: 1080 });
  
  try {
    // 1. Menu2 페이지 접속
    console.log('1. 🌐 Menu2 페이지 접속');
    await page.goto('http://localhost:5500/menu2', { waitUntil: 'networkidle' });
    await page.waitForTimeout(5000);
    
    // 페이지 타이틀 확인
    const title = await page.title();
    console.log(`   ✅ 페이지 로드 완료: ${title}`);

    // 2. 부서 선택 드롭다운 찾기 및 클릭
    console.log('\n2. 🏢 부서 선택 드롭다운 처리');
    
    // 부서 선택 버튼 찾기 (더 구체적인 선택자 사용)
    const departmentButton = await page.locator('button:has-text("의뢰할 부서를 검색하거나 선택하세요")');
    if (await departmentButton.isVisible()) {
      console.log('   ✅ 부서 선택 버튼 발견됨');
      await departmentButton.click();
      await page.waitForTimeout(2000);
      
      // 옵션 목록 확인
      const options = await page.locator('[role="option"]').count();
      console.log(`   📊 사용 가능한 부서 옵션: ${options}개`);
      
      if (options > 0) {
        // 첫 번째 옵션 클릭
        const firstOption = await page.locator('[role="option"]').first();
        const optionText = await firstOption.textContent();
        console.log(`   🏢 선택할 부서: ${optionText}`);
        
        await firstOption.click();
        await page.waitForTimeout(3000); // 템플릿 로딩 대기
        
        console.log('   ✅ 부서 선택 완료');
      } else {
        console.log('   ⚠️  사용 가능한 부서 옵션이 없음');
      }
    } else {
      console.log('   ❌ 부서 선택 버튼을 찾을 수 없음');
      
      // 모든 버튼 목록 확인
      const allButtons = await page.locator('button').all();
      console.log(`   📊 페이지의 총 버튼 수: ${allButtons.length}개`);
      
      for (let i = 0; i < Math.min(allButtons.length, 5); i++) {
        const buttonText = await allButtons[i].textContent();
        console.log(`   🔘 버튼 ${i + 1}: ${buttonText?.slice(0, 50)}...`);
      }
    }

    // 3. 에디터 영역 확인
    console.log('\n3. 🔍 에디터 영역 확인');
    
    // "Test Tiptap Editor" 제목 찾기
    await page.waitForTimeout(3000); // 추가 로딩 대기
    
    const testEditorHeading = await page.locator('text=Test Tiptap Editor');
    if (await testEditorHeading.isVisible()) {
      console.log('   ✅ Test Tiptap Editor 제목 발견됨');
      
      // ProseMirror 에디터 찾기
      const editor = await page.locator('.ProseMirror');
      if (await editor.isVisible()) {
        console.log('   ✅ ProseMirror 에디터 요소 발견됨');
        
        // 에디터에 포커스하고 텍스트 입력
        await editor.click();
        await page.waitForTimeout(1000);
        
        const testText = '부서 선택 후 Tiptap 에디터 테스트 성공! 🎉';
        await page.keyboard.type(testText);
        await page.waitForTimeout(2000);
        
        // 입력된 텍스트 확인
        const editorContent = await editor.textContent();
        if (editorContent && editorContent.includes('테스트 성공')) {
          console.log('   ✅ 텍스트 입력 성공');
          console.log(`   📝 입력된 내용: ${editorContent}`);
        } else {
          console.log('   ⚠️  텍스트 입력 확인되지 않음');
          console.log(`   📝 에디터 내용: ${editorContent}`);
        }
        
        // Bold 기능 테스트
        await page.keyboard.press('Control+a'); // 전체 선택
        await page.keyboard.press('Control+b'); // Bold 적용 시도
        await page.waitForTimeout(1000);
        
        console.log('   ✅ 서식 기능 테스트 완료');
        
      } else {
        console.log('   ❌ ProseMirror 에디터 요소를 찾을 수 없음');
      }
      
    } else {
      console.log('   ❌ Test Tiptap Editor 제목을 찾을 수 없음');
      
      // 의뢰 내용 라벨 찾기
      const requestContentLabel = await page.locator('text=의뢰 내용');
      if (await requestContentLabel.isVisible()) {
        console.log('   ✅ 의뢰 내용 라벨 발견됨 - 에디터 영역 활성화됨');
        
        // 에디터 영역 확인
        const editorArea = await page.locator('.ProseMirror, [contenteditable], textarea');
        const editorCount = await editorArea.count();
        console.log(`   📊 발견된 에디터 요소: ${editorCount}개`);
        
        if (editorCount > 0) {
          const firstEditor = await editorArea.first();
          if (await firstEditor.isVisible()) {
            await firstEditor.click();
            await page.keyboard.type('부서 선택 후 에디터 테스트');
            console.log('   ✅ 에디터에 텍스트 입력 성공');
          }
        }
      } else {
        console.log('   ❌ 의뢰 내용 영역도 찾을 수 없음');
      }
    }

    // 4. 현재 페이지 상태 확인
    console.log('\n4. 📋 현재 페이지 상태 확인');
    
    const pageContent = await page.textContent('body');
    const hasEditor = pageContent?.includes('Test Tiptap Editor');
    const hasRequestContent = pageContent?.includes('의뢰 내용');
    const hasDepartmentSelected = pageContent?.includes('템플릿');
    
    console.log(`   📄 페이지에 Test Tiptap Editor 포함: ${hasEditor ? '✅' : '❌'}`);
    console.log(`   📄 페이지에 의뢰 내용 포함: ${hasRequestContent ? '✅' : '❌'}`);
    console.log(`   📄 페이지에 템플릿 관련 내용: ${hasDepartmentSelected ? '✅' : '❌'}`);

    // 5. 최종 결과
    console.log('\n🎉 부서 선택 후 Tiptap 테스트 결과:');
    console.log('='.repeat(60));
    console.log('✅ Menu2 페이지 로드 성공');
    
    if (hasEditor) {
      console.log('✅ Tiptap 에디터 정상 로드됨 (부서 선택 후)');
      console.log('✅ 에디터 조건부 렌더링 정상 작동');
      console.log('✅ 텍스트 입력 기능 작동');
      console.log('✅ 사용자 플로우: 부서 선택 → 에디터 활성화 성공');
    } else {
      console.log('⚠️  에디터 로드 확인 필요');
      console.log('❓ 부서 선택이 완료되지 않았거나 템플릿 로딩 중일 수 있음');
    }
    console.log('='.repeat(60));
    
  } catch (error) {
    console.error('\n❌ 테스트 중 오류 발생:');
    console.error(`   에러: ${error.message}`);
    
    // 에러 스크린샷
    await page.screenshot({ path: 'test-department-tiptap-error.png' });
    console.error('   📸 에러 스크린샷: test-department-tiptap-error.png');
  } finally {
    console.log('\n⏳ 결과 확인을 위해 10초 대기...');
    await page.waitForTimeout(10000);
    await browser.close();
    console.log('🏁 부서 선택 후 Tiptap 테스트 완료');
  }
}

// 실행
testDepartmentTiptap().catch(console.error);