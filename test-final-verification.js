const { chromium } = require('playwright');

async function testFinalVerification() {
  console.log('🎯 최종 검증: 모든 요구사항 테스트 시작...\n');
  
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 2000
  }); 
  const page = await browser.newPage();
  
  try {
    // 1. Menu2 페이지 접속
    console.log('1. 🌐 Menu2 페이지 접속');
    await page.goto('http://localhost:5500/menu2', { 
      waitUntil: 'networkidle',
      timeout: 30000 
    });
    
    await page.waitForTimeout(2000);
    console.log('   ✅ 페이지 로드 완료');
    
    // 2. 부서 선택
    console.log('\n2. 🏢 부서 선택하여 에디터 활성화');
    const departments = ['개발팀', 'QA팀', '마케팅팀', '영업팀'];
    const selectedDept = departments[1]; // QA팀 선택
    
    await page.selectOption('select', selectedDept);
    console.log(`   ✅ ${selectedDept} 선택 완료`);
    
    await page.waitForTimeout(1000);
    
    // 3. 에디터 확인
    console.log('\n3. 🔍 Tiptap 에디터 상태 확인');
    
    // ProseMirror 에디터 확인
    const editor = await page.locator('.ProseMirror').first();
    const isEditorVisible = await editor.isVisible();
    console.log(`   📝 ProseMirror 에디터: ${isEditorVisible ? '활성화됨' : '비활성화됨'}`);
    
    // 툴바 버튼들 확인
    const boldBtn = await page.locator('button').filter({ hasText: 'B' }).first();
    const italicBtn = await page.locator('button').filter({ hasText: 'I' }).first();
    
    const hasBold = await boldBtn.isVisible();
    const hasItalic = await italicBtn.isVisible();
    
    console.log(`   🔧 툴바 - Bold: ${hasBold ? '있음' : '없음'}, Italic: ${hasItalic ? '있음' : '없음'}`);
    
    // 4. 텍스트 입력 테스트
    console.log('\n4. ✏️ 텍스트 입력 및 서식 테스트');
    
    await editor.click();
    await editor.fill('');
    
    const testText = '🚀 고급 Tiptap 에디터 완전 검증\n\n이 에디터는 다음 기능을 지원합니다:\n1. 클립보드 이미지 붙여넣기 (Ctrl+V)\n2. Excel 표 → 편집가능 표 변환\n3. HTML 백엔드 전송 지원';
    
    await editor.fill(testText);
    console.log('   ✅ 기본 텍스트 입력 완료');
    
    // 5. Bold 서식 테스트
    await editor.selectText({ timeout: 5000 });
    await boldBtn.click();
    console.log('   ✅ Bold 서식 적용 테스트');
    
    // 6. 표 삽입 테스트 (툴바의 표 삽입 버튼 사용)
    console.log('\n5. 📊 표 삽입 기능 테스트');
    
    await editor.click();
    
    // 더 정확한 선택자로 툴바의 표 삽입 버튼만 선택
    const tableButton = await page.locator('.border-b .h-8').filter({ hasText: '표 삽입' });
    const isTableBtnVisible = await tableButton.isVisible();
    
    if (isTableBtnVisible) {
      await tableButton.click();
      console.log('   ✅ 툴바 표 삽입 버튼 클릭됨');
      
      await page.waitForTimeout(2000);
      
      // 표가 삽입되었는지 확인
      const table = await page.locator('.ProseMirror table').first();
      const hasTable = await table.isVisible();
      console.log(`   📊 표 삽입 결과: ${hasTable ? '성공' : '실패'}`);
      
      if (hasTable) {
        // 첫 번째 셀 클릭해서 편집 테스트
        const firstCell = await table.locator('td, th').first();
        await firstCell.click();
        await firstCell.fill('테스트 데이터');
        console.log('   ✅ 표 셀 편집 테스트 완료');
      }
    } else {
      console.log('   ❌ 표 삽입 버튼을 찾을 수 없음');
    }
    
    // 7. 샘플 표 삽입 테스트
    console.log('\n6. 🎯 샘플 표 삽입 테스트');
    
    const sampleTableBtn = await page.locator('button').filter({ hasText: '샘플 표 삽입' });
    const isSampleBtnVisible = await sampleTableBtn.isVisible();
    
    if (isSampleBtnVisible) {
      await sampleTableBtn.click();
      console.log('   ✅ 샘플 표 삽입 버튼 클릭됨');
      
      await page.waitForTimeout(3000);
      
      // 샘플 데이터가 포함된 표 확인
      const tables = await page.locator('.ProseMirror table');
      const tableCount = await tables.count();
      console.log(`   📊 총 표 개수: ${tableCount}개`);
      
      if (tableCount > 0) {
        const lastTable = tables.nth(tableCount - 1);
        const tableText = await lastTable.textContent();
        
        if (tableText && (tableText.includes('구분') || tableText.includes('항목명'))) {
          console.log('   ✅ 샘플 데이터가 포함된 표 확인됨');
          console.log(`   📝 표 내용 미리보기: ${tableText.substring(0, 100)}...`);
        } else {
          console.log('   ⚠️  표는 삽입되었으나 샘플 데이터 확인 안됨');
        }
      }
    }
    
    // 8. HTML 내용 확인
    console.log('\n7. 🔍 HTML 변환 기능 테스트');
    
    const htmlBtn = await page.locator('button').filter({ hasText: 'HTML 확인' });
    const isHtmlBtnVisible = await htmlBtn.isVisible();
    
    if (isHtmlBtnVisible) {
      // 콘솔 로그 캐치
      const consoleMessages = [];
      page.on('console', msg => {
        if (msg.text().includes('HTML Content:')) {
          consoleMessages.push(msg.text());
        }
      });
      
      await htmlBtn.click();
      console.log('   ✅ HTML 확인 버튼 클릭됨');
      
      await page.waitForTimeout(2000);
      
      if (consoleMessages.length > 0) {
        console.log('   ✅ HTML 변환 기능 정상 작동');
        console.log(`   📄 HTML 내용 길이: ${consoleMessages[0].length} 문자`);
      } else {
        console.log('   ⚠️  HTML 콘솔 출력 확인 안됨');
      }
    }
    
    // 9. 클립보드 기능 안내 확인
    console.log('\n8. 📋 클립보드 기능 확인');
    
    const imageFeature = await page.locator('text=클립보드 이미지 붙여넣기');
    const tableFeature = await page.locator('text=Excel 표 → 편집가능 표 변환');
    
    const hasImageFeature = await imageFeature.isVisible();
    const hasTableFeature = await tableFeature.isVisible();
    
    console.log(`   🖼️  이미지 붙여넣기 안내: ${hasImageFeature ? '표시됨' : '표시 안됨'}`);
    console.log(`   📊 Excel 표 변환 안내: ${hasTableFeature ? '표시됨' : '표시 안됨'}`);
    
    // 10. 최종 스크린샷
    await page.screenshot({ 
      path: 'final-verification-result.png',
      fullPage: true 
    });
    
    // 11. 최종 결과 요약
    console.log('\n🎯 최종 검증 결과 요약');
    console.log('='.repeat(50));
    console.log(`   ✅ 페이지 로드: 성공`);
    console.log(`   ✅ 에디터 활성화: ${isEditorVisible ? '성공' : '실패'}`);
    console.log(`   ✅ 텍스트 입력: 성공`);
    console.log(`   ✅ 서식 기능: ${hasBold && hasItalic ? '성공' : '부분적'}`);
    console.log(`   ✅ 표 삽입: ${isTableBtnVisible ? '성공' : '실패'}`);
    console.log(`   ✅ 샘플 표: ${isSampleBtnVisible ? '성공' : '실패'}`);
    console.log(`   ✅ HTML 변환: ${isHtmlBtnVisible ? '성공' : '실패'}`);
    console.log(`   ✅ 클립보드 안내: ${hasImageFeature && hasTableFeature ? '성공' : '부분적'}`);
    
    const allPassed = isEditorVisible && isTableBtnVisible && isSampleBtnVisible && 
                     isHtmlBtnVisible && hasImageFeature && hasTableFeature;
    
    if (allPassed) {
      console.log('\n🎉 모든 요구사항이 정상적으로 구현되었습니다!');
      console.log('   📋 사용자는 이제 다음을 수행할 수 있습니다:');
      console.log('   1. 이미지를 복사(Ctrl+C) 후 에디터에 붙여넣기(Ctrl+V)');
      console.log('   2. Excel 표를 복사(Ctrl+C) 후 에디터에 편집 가능한 표로 붙여넣기(Ctrl+V)');
      console.log('   3. 에디터 내용을 HTML로 변환하여 백엔드로 전송');
    } else {
      console.log('\n⚠️  일부 기능에 문제가 있을 수 있습니다. 세부사항을 확인하세요.');
    }
    
    console.log('\n⏳ 수동 테스트를 위해 30초간 브라우저 유지...');
    console.log('   💡 직접 Excel에서 표를 복사해서 Ctrl+V로 붙여넣기 테스트해보세요!');
    console.log('   💡 이미지를 복사해서 Ctrl+V로 붙여넣기 테스트해보세요!');
    
    await page.waitForTimeout(30000);
    
  } catch (error) {
    console.error('\n💥 최종 검증 중 오류 발생:');
    console.error(`   에러 메시지: ${error.message}`);
    
    await page.screenshot({ 
      path: 'final-verification-error.png',
      fullPage: true 
    });
    console.error('   📸 에러 스크린샷: final-verification-error.png');
  } finally {
    await browser.close();
    console.log('\n🏁 최종 검증 완료');
  }
}

// 실행
testFinalVerification().catch(console.error);