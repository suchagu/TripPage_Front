<template>
  <div class="home-container">
    <div class="hero-banner">
      <h1>Welcome to LocalHub Gumi</h1>
      <p>공공데이터를 기반으로 투명하게 소통하는 구미/경북 익명 정보 허브</p>
    </div>
    
    <div class="menu-grid">
      <div class="menu-card" @click="$router.push('/posts')">
        <h3>📢 커뮤니티 공간</h3>
        <p>로그인 없이 자유롭게 지역 축제, 맛집, 핫플레이스 정보를 나누어 보세요.</p>
      </div>
      <div class="menu-card highlighted">
        <h3>🤖 상시 대기 AI 비서</h3>
        <p>우측 하단의 챗봇 위젯을 통해 구미/경북 추천 투어 코스를 자연어로 질의하세요.</p>
      </div>
    </div>

    <div class="map-section">
      <KakaoMap />
    </div>
  </div>
</template>

<script setup>
// 기존의 @ 대신 상대 경로(../)를 사용하여 컴포넌트를 직접 찾아가도록 수정합니다.
import KakaoMap from '../components/KakaoMap.vue';
</script>

<style scoped>
.hero-banner { background: linear-gradient(135deg, #2b6cb0 0%, #4299e1 100%); color: white; padding: 4rem 2rem; text-align: center; border-radius: 8px; margin-bottom: 2rem; }
.hero-banner h1 { margin: 0 0 1rem 0; font-size: 2.5rem; }
.menu-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; margin-bottom: 2rem; } /* 아래 여백 추가 */
.menu-card { background: white; padding: 2rem; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.05); cursor: pointer; transition: transform 0.2s; }
.menu-card:hover { transform: translateY(-4px); }
.menu-card.highlighted { border-left: 4px solid var(--primary-color); }

/* 💡 3. 지도가 들어갈 구역의 스타일을 깔끔하게 잡아줍니다 */
.map-section {
  margin-top: 2rem;
}
</style>