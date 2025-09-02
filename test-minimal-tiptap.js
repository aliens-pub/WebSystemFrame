const { chromium } = require('playwright');

async function testMinimalTiptap() {
  console.log('🚀 최소 Tiptap 에디터 테스트 시작...\n');
  
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 300
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

    // 2. Tiptap 에디터 요소들 찾기
    console.log('\n2. 🔍 Tiptap 에디터 요소 찾기');
    
    // "Test Tiptap Editor" 텍스트 찾기
    const testEditorHeading = await page.locator('text=Test Tiptap Editor');
    if (await testEditorHeading.isVisible()) {
      console.log('   ✅ Test Tiptap Editor 제목 발견됨');
      
      // ProseMirror 에디터 찾기
      const editor = await page.locator('.ProseMirror');
      if (await editor.isVisible()) {
        console.log('   ✅ ProseMirror 에디터 요소 발견됨');
        
        // 에디터에 포커스하고 텍스트 입력
        await editor.click();
        await page.waitForTimeout(500);
        
        const testText = '최소 Tiptap 에디터 테스트 성공!';
        await page.keyboard.type(testText);
        await page.waitForTimeout(1000);
        
        // 입력된 텍스트 확인
        const editorContent = await editor.textContent();
        if (editorContent && editorContent.includes('테스트 성공')) {
          console.log('   ✅ 텍스트 입력 성공');
          console.log(`   📝 입력된 내용: ${editorContent.slice(0, 50)}...`);
        } else {
          console.log('   ⚠️  텍스트 입력 확인되지 않음');
        }
        
      } else {
        console.log('   ❌ ProseMirror 에디터 요소를 찾을 수 없음');
      }
      
    } else {
      console.log('   ❌ Test Tiptap Editor 제목을 찾을 수 없음');
      
      // 페이지의 모든 텍스트 확인
      const pageContent = await page.textContent('body');
      console.log('   📋 페이지 내용 일부:', pageContent?.slice(0, 200) + '...');
    }

    // 3. 대안으로 일반 에디터 요소 찾기
    console.log('\n3. 🔍 대안 에디터 요소 찾기');
    
    // 모든 에디터 관련 요소들 찾기
    const allEditors = await page.locator('div[contenteditable], textarea, .ProseMirror, [role="textbox"]').count();
    console.log(`   📊 발견된 편집 가능한 요소들: ${allEditors}개`);
    
    if (allEditors > 0) {
      const firstEditor = await page.locator('div[contenteditable], textarea, .ProseMirror, [role="textbox"]').first();
      if (await firstEditor.isVisible()) {
        console.log('   ✅ 편집 가능한 요소 발견됨');
        
        try {
          await firstEditor.click();
          await page.keyboard.type('대안 테스트 텍스트');
          console.log('   ✅ 대안 요소에 텍스트 입력 성공');
        } catch (error) {
          console.log('   ⚠️  대안 요소에 텍스트 입력 실패');
        }
      }
    }

    // 4. 최종 결과
    console.log('\n🎉 최소 Tiptap 테스트 결과:');
    console.log('='.repeat(50));
    console.log('✅ Menu2 페이지 로드 성공');
    
    const proseMirrorExists = await page.locator('.ProseMirror').isVisible();
    const testEditorExists = await page.locator('text=Test Tiptap Editor').isVisible();
    
    if (proseMirrorExists && testEditorExists) {
      console.log('✅ Tiptap 에디터 정상 로드됨');
      console.log('✅ ProseMirror 에디터 활성화됨');
    } else if (proseMirrorExists) {
      console.log('⚠️  ProseMirror 에디터는 있으나 TestTiptapEditor 없음');
    } else {
      console.log('❌ Tiptap 에디터 로드 실패');
    }
    console.log('='.repeat(50));
    
  } catch (error) {
    console.error('\n❌ 테스트 중 오류 발생:');
    console.error(`   에러: ${error.message}`);
    
    // 에러 스크린샷
    await page.screenshot({ path: 'test-minimal-tiptap-error.png' });
    console.error('   📸 에러 스크린샷: test-minimal-tiptap-error.png');
  } finally {
    console.log('\n⏳ 결과 확인을 위해 5초 대기...');
    await page.waitForTimeout(5000);
    await browser.close();
    console.log('🏁 최소 Tiptap 테스트 완료');
  }
}

// 실행
testMinimalTiptap().catch(console.error);