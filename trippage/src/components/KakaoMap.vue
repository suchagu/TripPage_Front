<template>
  <div class="map-wrapper">
    <h3 class="map-title">📍 구미/경북 주요 관광 및 맛집 거점 지도</h3>
    <div id="map-container" ref="mapContainer"></div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';

const mapContainer = ref(null);
let mapInstance = null;

// 지도에 핀을 꽂을 구미 지역 주요 명소 리스트
const localPlaces = ref([
  { name: '금오산 도립공원', address: '경상북도 구미시 금오산상가길 419' },
  { name: '구미시청', address: '경상북도 구미시 송정대로 55' },
  { name: '구미역', address: '경상북도 구미시 구미중앙로 76' },
  { name: '인동도시숲', address: '경상북도 구미시 인의동 1003' }
]);

onMounted(() => {
  // 💡 비동기 로딩 방어막: 카카오 라이브러리가 완전히 브라우저에 올라올 때까지 대기
  const checkKakaoLoad = () => {
    if (
      window.kakao && 
      window.kakao.maps && 
      window.kakao.maps.LatLng && 
      window.kakao.maps.Map && 
      window.kakao.maps.services
    ) {
      // 모든 파일이 로드 완료되었다면 지도 초기화 실행
      initMap();
    } else {
      // 로드 전이라면 100ms(0.1초) 대기 후 재귀 호출
      setTimeout(checkKakaoLoad, 100);
    }
  };

  checkKakaoLoad();
});

const initMap = () => {
  if (!mapContainer.value) return;

  try {
    // 1. 지도 옵션 설정 (중심 좌표: 구미시청 부근)
    const options = {
      center: new kakao.maps.LatLng(36.119485, 128.344435),
      level: 7 // 지도 확대 정도
    };

    // 2. 지도 인스턴스 생성
    mapInstance = new kakao.maps.Map(mapContainer.value, options);

    // 3. 주소를 위도/경도로 바꿔주는 Geocoder 생성
    const geocoder = new kakao.maps.services.Geocoder();

    // 4. 주소 목록을 돌며 지도 위에 핀(마커) 생성
    localPlaces.value.forEach((place) => {
      // 주소가 유효하지 않은 항목은 사전에 안전하게 패스 (에러 방지)
      if (!place || !place.address || typeof place.address !== 'string' || place.address.trim() === '') {
        return; 
      }

      geocoder.addressSearch(place.address.trim(), (result, status) => {
        if (status === kakao.maps.services.Status.OK) {
          const coords = new kakao.maps.LatLng(result[0].y, result[0].x);

          // 마커 찍기
          const marker = new kakao.maps.Marker({
            map: mapInstance,
            position: coords
          });

          // 마우스 올렸을 때 표시할 정보창(인포윈도우) 구성
          const shortenedAddress = place.address.split(' ').slice(0, 3).join(' ');
          const infowindow = new kakao.maps.InfoWindow({
            content: `
              <div style="padding:8px; min-width:150px; font-size:13px; text-align:center; color:#333; line-height: 1.4;">
                <strong style="color:#2b6cb0;">${place.name}</strong><br/>
                <span style="font-size:11px; color:#666; display:inline-block; margin-top:4px;">${shortenedAddress}</span>
              </div>
            `
          });

          // 마우스 오버 / 아웃 이벤트 등록
          kakao.maps.event.addListener(marker, 'mouseover', () => {
            infowindow.open(mapInstance, marker);
          });
          kakao.maps.event.addListener(marker, 'mouseout', () => {
            infowindow.close();
          });
        }
      });
    });
  } catch (err) {
    console.error("지도 초기화 과정 내부 치명적 에러:", err);
  }
};
</script>

<style scoped>
.map-wrapper {
  margin: 2rem 0;
  padding: 1.5rem;
  background: #ffffff;
  border-radius: 16px;
  border: 1px solid #edf2f7;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.03);
}
.map-title {
  font-size: 1.25rem;
  font-weight: 700;
  margin-bottom: 1rem;
  color: #2d3748;
}
#map-container {
  width: 100%;
  height: 480px; /* 지도의 높이 설정 */
  border-radius: 12px;
  border: 1px solid #e2e8f0;
}
</style>