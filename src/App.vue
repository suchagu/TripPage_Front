<template>
  <div id="app">
    <header class="main-header">
      <nav class="nav-container">
        <router-link to="/" class="logo">LocalHub <span>구미/경북</span></router-link>
        <div class="nav-links">
          <router-link to="/">홈</router-link>
          <router-link to="/posts">익명 게시판</router-link>
        </div>
      </nav>
    </header>

    <main class="main-content">
      <router-view />
    </main>

    <ChatBot />
  </div>
</template>

<script setup>
import ChatBot from './components/ChatBot.vue';
</script>

<style>
/* 간단하고 깔끔한 글로벌 스타일 정의 */
:root {
  --primary-color: #2b6cb0;
  --bg-color: #f7fafc;
  --border-color: #e2e8f0;
}
body {
  margin: 0;
  font-family: 'Noto Sans KR', sans-serif;
  background-color: var(--bg-color);
  color: #2d3748;
}
.main-header {
  background-color: #fff;
  border-bottom: 1px solid var(--border-color);
  position: sticky;
  top: 0;
  z-index: 100;
}
.nav-container {
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 2rem;
}
.logo {
  font-size: 1.5rem;
  font-weight: bold;
  text-decoration: none;
  color: var(--primary-color);
}
.logo span {
  font-size: 0.9rem;
  color: #718096;
  margin-left: 0.5rem;
}
.nav-links a {
  margin-left: 1.5rem;
  text-decoration: none;
  color: #4a5568;
  font-weight: 500;
}
.nav-links a.router-link-active {
  color: var(--primary-color);
  font-weight: bold;
}
.main-content {
  max-width: 1200px;
  margin: 2rem auto;
  padding: 0 2rem;
  min-height: calc(100vh - 160px);
}
</style>