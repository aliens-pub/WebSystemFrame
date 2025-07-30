# 구글 OAuth2.0 로그인 연동 가이드

## 1. 전제 조건
- 구글 개발자 콘솔에서 OAuth 클라이언트 ID와 시크릿 발급 완료
- 승인된 리디렉션 URI 설정: `https://your-replit-domain.replit.dev/auth/google/callback`

## 2. 환경 변수 설정

프로젝트의 환경 변수에 다음 값들을 추가하세요:
```
GOOGLE_CLIENT_ID=your_google_client_id_here
GOOGLE_CLIENT_SECRET=your_google_client_secret_here
```

## 3. 백엔드 구글 OAuth 설정

### 3.1 서버 라우트 수정 (server/routes.ts)

기존 `registerRoutes` 함수에 구글 OAuth 라우트를 추가:

```typescript
import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';

// 구글 OAuth 전략 설정
passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID!,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
  callbackURL: "/auth/google/callback"
}, async (accessToken, refreshToken, profile, done) => {
  try {
    // 구글 프로필 정보로 사용자 찾기 또는 생성
    let user = await storage.getUserByEmail(profile.emails?.[0]?.value);
    
    if (!user) {
      // 새 사용자 생성
      user = await storage.createUser({
        username: `google_${profile.id}`,
        email: profile.emails?.[0]?.value || '',
        role: 'EMPLOYEE',
        department: 'GENERAL',
        employee_number: `GOOGLE_${Date.now()}`
      });
    }
    
    return done(null, user);
  } catch (error) {
    return done(error, null);
  }
}));

// 구글 OAuth 라우트 추가
app.get('/auth/google',
  passport.authenticate('google', { scope: ['profile', 'email'] })
);

app.get('/auth/google/callback',
  passport.authenticate('google', { failureRedirect: '/' }),
  (req, res) => {
    // 성공적으로 인증되면 기존 로그인 페이지로 리다이렉트
    res.redirect('/');
  }
);
```

### 3.2 스토리지 인터페이스 확장 (server/storage.ts)

`IStorage` 인터페이스에 이메일로 사용자 찾기 메서드 추가:

```typescript
export interface IStorage {
  // 기존 메서드들...
  getUserByEmail(email: string): Promise<User | undefined>;
}

// DatabaseStorage 클래스에 구현 추가
export class DatabaseStorage implements IStorage {
  // 기존 메서드들...
  
  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }
}
```

### 3.3 스키마 수정 (shared/schema.ts)

users 테이블에 email 필드가 없다면 추가:

```typescript
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: varchar("username", { length: 255 }).notNull().unique(),
  email: varchar("email", { length: 255 }).unique(), // 이 필드 추가
  role: varchar("role", { length: 50 }).notNull().default("EMPLOYEE"),
  department: varchar("department", { length: 100 }).notNull(),
  employee_number: varchar("employee_number", { length: 50 }).notNull().unique(),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow(),
});
```

## 4. 프론트엔드 구글 로그인 버튼 추가

### 4.1 LoginModal 컴포넌트 수정 (client/src/components/LoginModal.tsx)

기존 로그인 폼 아래에 구글 로그인 버튼 추가:

```tsx
// import 추가
import { FcGoogle } from "react-icons/fc";

// 기존 로그인 폼 아래에 추가
<div className="mt-6">
  <div className="relative">
    <div className="absolute inset-0 flex items-center">
      <div className="w-full border-t border-gray-300" />
    </div>
    <div className="relative flex justify-center text-sm">
      <span className="px-2 bg-white text-gray-500">또는</span>
    </div>
  </div>

  <div className="mt-6">
    <Button
      type="button"
      variant="outline"
      className="w-full"
      onClick={() => {
        window.location.href = '/auth/google';
      }}
    >
      <FcGoogle className="mr-2 h-4 w-4" />
      구글로 로그인
    </Button>
  </div>
</div>
```

## 5. 데이터베이스 마이그레이션

스키마 변경 후 데이터베이스 업데이트:

```bash
npm run db:push
```

## 6. 세션 설정 확인

### 6.1 Express 세션 미들웨어 설정 (server/routes.ts)

```typescript
import session from 'express-session';

// 세션 미들웨어 추가 (이미 있다면 확인만)
app.use(session({
  secret: process.env.SESSION_SECRET || 'your-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    maxAge: 24 * 60 * 60 * 1000 // 24시간
  }
}));

// Passport 초기화
app.use(passport.initialize());
app.use(passport.session());

// 세션 직렬화/역직렬화
passport.serializeUser((user: any, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id: number, done) => {
  try {
    const user = await storage.getUser(id);
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});
```

## 7. 테스트 및 확인

1. 서버 재시작
2. 브라우저에서 로그인 페이지 접속
3. "구글로 로그인" 버튼 클릭
4. 구글 로그인 완료 후 기존 로그인 페이지로 리다이렉트 확인
5. 사용자 인증 상태 확인

## 8. 주의사항

- 구글 개발자 콘솔에서 리디렉션 URI를 정확히 설정해야 함
- 프로덕션 배포 시에는 배포된 도메인도 리디렉션 URI에 추가
- 환경 변수가 올바르게 설정되었는지 확인
- HTTPS 환경에서만 정상 작동 (Replit은 기본적으로 HTTPS 제공)

## 9. 에러 해결

### 일반적인 오류들:
- `redirect_uri_mismatch`: 구글 콘솔의 리디렉션 URI 설정 확인
- `invalid_client`: 클라이언트 ID/시크릿 확인
- `unauthorized_client`: OAuth 동의 화면 설정 확인

### 디버깅 팁:
- 브라우저 개발자 도구의 네트워크 탭에서 요청 확인
- 서버 콘솔 로그 확인
- 환경 변수 출력으로 값 확인 (시크릿 제외)