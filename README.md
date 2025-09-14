# rofle

## 1. 프로젝트 시작하기

```
npm create vite@latest rofle -- --template react-swc-ts
cd rofle
npm install

npm install react-router-dom @types/react-router-dom

npm install -D tailwindcss@3.4.17 postcss autoprefixer
npx tailwindcss init -p

npm install @tanstack/react-query zustand

sudo apt update
sudo apt upgrade
sudo apt install postgresql postgresql-contrib

npm install prisma --save-dev
npx prisma init --datasource-provider postgresql
```

## 2. 다크모드 구현하기.

### 테마 상태 전역 관리(zustand - stores/theme.store.ts)

### 색상 팔레트 만들기(index.css)

### Tailwind 설정(tailwind.config.js)

### 상위컴포넌트에서 상태 관리하기(App.tsx) - DOM 제어 & 리렌더링 트리거링

## 3. 라우팅과 헤더 컴포넌트
