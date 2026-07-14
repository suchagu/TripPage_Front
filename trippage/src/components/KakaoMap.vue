<template>
  <div class="map-wrapper">
    <div class="map-header">
      <h3 class="map-title">📍 구미/경북 실시간 지역 정보 지도</h3>
      <span v-if="loading" class="loading-badge">데이터 불러오는 중...</span>
    </div>
    <div id="map-container" ref="mapContainer"></div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import axios from 'axios';

const mapContainer = ref(null);
let mapInstance = null;
const loading = ref(false);

// 백엔드에서 받아온 실제 장소 데이터를 담을 반응형 배열
const localPlaces = ref([]);

// 💡 1. 백엔드 서버에서 장소(공공데이터) 목록을 가져오는 함수
const fetchPlacesFromBackend = async () => {
  loading.value = true;
  try {
    // 백엔드 주소로 GET 요청을 보냅니다. (엔드포인트는 실제 백엔드 명세에 맞게 /api/places 등으로 조정하세요)
    const response = await axios.get('https://localhub-backend-dev.onrender.com/api/data/places');
    
    // 백엔드가 반환하는 데이터 구조에 맞춰 파싱합니다.
    // 예: { places: [...] } 구조인 경우 response.data.places, 바로 배열인 경우 response.data
    localPlaces.value = response.data.places || response.data || [];
  } catch (error) {
    console.error("백엔드 데이터를 가져오지 못했습니다. 임시 기본값으로 대체합니다:", error);
    // 폴백(Fallback) 안전장치: 서버 에러 시 보여줄 임시 데이터
    localPlaces.value = [
      { name: '금오산 도립공원', address: '경상북도 구미시 금오산상가길 419' },
      { name: '구미시청', address: '경상북도 구미시 송정대로 55' },
      { name: '구미역', address: '경상북도 구미시 구미중앙로 76' }
    ];
  } finally {
    loading.value = false;
  }
};

onMounted(async () => {
  // 2. 먼저 백엔드로부터 데이터를 받아옵니다.
  await fetchPlacesFromBackend();

  // 3. 카카오 SDK 로드 상태를 체크한 뒤 지도를 그립니다.
  const checkKakaoLoad = () => {
    if (
      window.kakao && 
      window.kakao.maps && 
      window.kakao.maps.LatLng && 
      window.kakao.maps.Map && 
      window.kakao.maps.services
    ) {
      initMap();
    } else {
      setTimeout(checkKakaoLoad, 100);
    }
  };

  checkKakaoLoad();
});

const initMap = () => {
  if (!mapContainer.value) return;

  try {
    const { maps } = window.kakao;

    const options = {
      center: new maps.LatLng(36.119485, 128.344435), // 기본 중심지 (구미시청)
      level: 7
    };

    // 지도 생성
    mapInstance = new maps.Map(mapContainer.value, options);
    const geocoder = new maps.services.Geocoder();

    // 4. 백엔드에서 받아온 데이터(localPlaces)를 기반으로 마커를 동적 생성합니다.
    localPlaces.value.forEach((place) => {
      // 데이터 검증: 장소명과 주소가 모두 유효해야 실행
      if (!place || !place.address || typeof place.address !== 'string' || place.address.trim() === '') {
        return; 
      }

      geocoder.addressSearch(place.address.trim(), (result, status) => {
        if (status === maps.services.Status.OK) {
          const coords = new maps.LatLng(result[0].y, result[0].x);

          // 마커 생성
          const marker = new maps.Marker({
            map: mapInstance,
            position: coords
          });

          // 상호명 및 주소 정보창 구성
          const shortenedAddress = place.address.split(' ').slice(0, 3).join(' ');
          const infowindow = new maps.InfoWindow({
            content: `
              <div style="padding:8px; min-width:150px; font-size:13px; text-align:center; color:#333; line-height: 1.4;">
                <strong style="color:#2b6cb0;">${place.name}</strong><br/>
                <span style="font-size:11px; color:#666; display:inline-block; margin-top:4px;">${shortenedAddress}</span>
              </div>
            `
          });

          // 마우스 오버/아웃 이벤트 바인딩
          maps.event.addListener(marker, 'mouseover', () => {
            infowindow.open(mapInstance, marker);
          });
          maps.event.addListener(marker, 'mouseout', () => {
            infowindow.close();
          });
        }
      });
    });
  } catch (err) {
    console.error("지도 마킹 과정 중 에러 발생:", err);
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
.map-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}
.map-title {
  font-size: 1.25rem;
  font-weight: 700;
  margin: 0;
  color: #2d3748;
}
.loading-badge {
  font-size: 0.85rem;
  background: #ebf8ff;
  color: #2b6cb0;
  padding: 0.25rem 0.6rem;
  border-radius: 50px;
  font-weight: 600;
}
#map-container {
  width: 100%;
  height: 480px;
  border-radius: 12px;
  border: 1px solid #e2e8f0;
}
</style>