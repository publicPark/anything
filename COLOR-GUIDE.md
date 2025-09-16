# 색상 관리 가이드

## 🎨 색상 변경 방법

### 1. CSS 변수로 변경 (추천)
`src/app/globals.css` 파일의 `:root` 섹션에서 색상을 변경하세요:

```css
:root {
  /* Primary Color - Kuko 색상 팔레트 */
  --primary-500: #727372; /* Kuko-1: 기본 primary 색상 */
  --primary-600: #262626; /* Kuko-4: 호버 색상 */
  --primary-700: #262626; /* Kuko-4: 활성 색상 */
  --primary-100: #F2F2F2; /* Kuko-3: 배경 색상 */
  
  /* 상태별 색상 */
  --success-100: #d1fae5; /* 성공 배경 */
  --success-600: #059669; /* 성공 텍스트 */
  --success-800: #065f46; /* 성공 진한 텍스트 */
  
  --error-100: #fee2e2; /* 오류 배경 */
  --error-600: #dc2626; /* 오류 텍스트 */
  --error-800: #991b1b; /* 오류 진한 텍스트 */
  
  --warning-100: #fef3c7; /* 경고 배경 */
  --warning-600: #d97706; /* 경고 텍스트 */
  --warning-800: #92400e; /* 경고 진한 텍스트 */
  
  --info-100: #dbeafe; /* 정보 배경 */
  --info-600: #2563eb; /* 정보 텍스트 */
  --info-800: #1e40af; /* 정보 진한 텍스트 */
}
```

### 2. Tailwind 설정으로 변경
`tailwind.config.js` 파일에서 색상을 변경하세요:

```javascript
colors: {
  primary: {
    500: '#3b82f6', // 기본 색상
    600: '#2563eb', // 호버 색상
    700: '#1d4ed8', // 활성 색상
    100: '#dbeafe', // 배경 색상
  }
}
```

## 🌈 색상 팔레트

### Kuko 팔레트 (현재 - 자연스러운 그라데이션)
```css
--primary-500: #727372; /* Kuko-1: 메인 회색 */
--primary-600: #4A4A4A; /* 진한 회색 */
--primary-700: #262626; /* Kuko-4: 진한 회색 */
--primary-100: #F2F2F2; /* Kuko-3: 매우 연한 회색 */
--primary-200: #E5E5E5; /* 연한 회색 */
--primary-400: #9A9A9A; /* 중간 회색 */
```

### 파란색 팔레트
```css
--primary-500: #3b82f6;
--primary-600: #2563eb;
--primary-700: #1d4ed8;
--primary-100: #dbeafe;
```

### 초록색
```css
--primary-500: #10b981;
--primary-600: #059669;
--primary-700: #047857;
--primary-100: #d1fae5;
```

### 보라색
```css
--primary-500: #8b5cf6;
--primary-600: #7c3aed;
--primary-700: #6d28d9;
--primary-100: #ede9fe;
```

### 빨간색
```css
--primary-500: #ef4444;
--primary-600: #dc2626;
--primary-700: #b91c1c;
--primary-100: #fee2e2;
```

### 에메랄드
```css
--primary-500: #06b6d4;
--primary-600: #0891b2;
--primary-700: #0e7490;
--primary-100: #cffafe;
```

## 📝 사용법

색상을 변경한 후:
1. 개발 서버를 재시작하세요: `npm run dev`
2. 브라우저에서 변경사항을 확인하세요
3. 모든 버튼과 링크가 새로운 색상으로 변경됩니다

## 🎯 적용되는 요소들

### Primary 색상
- 로그인 버튼
- 프로필 수정 버튼
- 네비게이션 활성 상태
- 폼 포커스 상태

### Success 색상
- 성공 메시지
- 완료 알림

### Error 색상
- 오류 메시지
- 로그아웃 버튼
- 관리자 권한 배지

### Info 색상
- 프리미엄 사용자 권한 배지

### Warning 색상
- 경고 메시지 (향후 사용)
