<template>
  <div class="map-wrapper">
    <div class="map-header">
      <h3 class="map-title">📍 구미/경북 실시간 지역 정보 지도</h3>
      <span v-if="loading" class="loading-badge">데이터 불러오는 중...</span>
    </div>

    <div class="category-tabs" v-if="categoryList.length > 1">
      <button 
        v-for="tab in categoryList" 
        :key="tab.value" 
        :class="['tab-btn', { active: currentCategory === tab.value }]"
        @click="changeCategory(tab.value)"
      >
        {{ tab.label }}
      </button>
    </div>

    <div id="map-container" ref="mapContainer"></div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'; // 💡 동적 탭 관리를 위해 computed 임포트
import axios from 'axios';

const mapContainer = ref(null);
let mapInstance = null;
const loading = ref(false);

// 💡 [에러 해결 1] 백엔드에서 받아온 전체 장소 원본 데이터를 영구 보존할 반응형 배열
const allPlaces = ref([]);

// 💡 [에러 해결 2] 지도 위에 생성된 카카오 마커 객체들을 저장할 배열 (카테고리 이동 시 기존 마커 삭제용)
const currentMarkers = ref([]);

// 현재 활성화된 카테고리 (기본값 'ALL')
const currentCategory = ref('ALL');

// 💡 [핵심 기능] 데이터에 담겨오는 content_type에 따라 동적으로 카테고리 탭 추출
const categoryList = computed(() => {
  const list = [{ label: '전체', value: 'ALL' }];
  
  if (!allPlaces.value || allPlaces.value.length === 0) return list;

  // 1. place 데이터에서 content_type만 맵핑하고, 빈 값이거나 null 인 것 필터링
  const types = allPlaces.value
    .map(place => place.content_type)
    .filter(type => type && type.trim() !== '');

  // 2. Set 객체를 이용해 중복 제거 (예: ['관광지', '관광지', '맛집'] -> ['관광지', '맛집'])
  const uniqueTypes = [...new Set(types)];

  // 3. 버튼 리스트 포맷에 맞게 데이터 파싱하여 추가
  uniqueTypes.forEach(type => {
    list.push({
      label: type, 
      value: type  
    });
  });

  return list;
});

// 백엔드 서버에서 장소(공공데이터) 목록을 가져오는 함수
const fetchPlacesFromBackend = async () => {
  loading.value = true;
  try {
    const response = await axios.get('https://localhub-backend-dev.onrender.com/api/data/places');
    
    // 💡 받아온 모든 데이터를 변형 없이 원본 상태로 보관합니다.
    allPlaces.value = response.data.places || response.data || [];
    //console.log("백엔드 첫번째 장소 데이터 구조:", allPlaces.value[0]);
  } catch (error) {
    console.error("백엔드 데이터를 가져오지 못했습니다. 임시 기본값으로 대체합니다:", error);
    // 폴백(Fallback) 안전장치: 다양한 content_type을 임베딩한 임시 더미 데이터 구성
    allPlaces.value = [
      { title: '금오산 도립공원', address: '경상북도 구미시 금오산상가길 419', content_type: '관광지' },
      { title: '구미시청', address: '경상북도 구미시 송정대로 55', content_type: '관광지' },
      { title: '구미역 맛집거리', address: '경상북도 구미시 구미중앙로 76', content_type: '맛집' },
      { title: '인동도시숲 예쁜카페', address: '경상북도 구미시 인의동 1003', content_type: '카페' }
    ];
  } finally {
    loading.value = false;
  }
};

onMounted(async () => {
  // 1. 데이터를 먼저 가지고 오고 난 뒤에 지도를 그립니다.
  await fetchPlacesFromBackend();

  // 2. 카카오 지도 라이브러리가 로드되었는지 최종 확인
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

    mapInstance = new maps.Map(mapContainer.value, options);
    
    // 💡 최초 로딩 시 지도 위에 마커들을 출력합니다.
    updateMarkers();
  } catch (err) {
    console.error("지도 초기화 과정 중 에러 발생:", err);
  }
};

// 💡 [에러 해결 3] 동적 카테고리 필터링 마커를 갱신하는 코어 함수
const updateMarkers = () => {
  if (!mapInstance) return;
  const { maps } = window.kakao;

  // ① 지도 위에 이미 그려져 있는 이전 마커들을 싹 다 지워서 잔상을 제거합니다.
  currentMarkers.value.forEach(marker => marker.setMap(null));
  currentMarkers.value = []; // 관리 배열 청소

  // ② 전체 데이터(allPlaces) 중 현재 탭 카테고리와 일치하는 장소만 분리합니다.
  const filteredPlaces = allPlaces.value.filter(place => {
    if (currentCategory.value === 'ALL') return true;
    return place.content_type === currentCategory.value;
  });

  const geocoder = new maps.services.Geocoder();

  // ③ 필터링된 장소들만 반복하며 마커를 다시 생성합니다.
  filteredPlaces.forEach((place) => {
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

        // 생성한 마커 인스턴스를 보관해 둡니다 (나중에 카테고리가 바뀔 때 지울 목적)
        currentMarkers.value.push(marker);

        // 정보창(InfoWindow) 구성
        const shortenedAddress = place.address.split(' ').slice(0, 3).join(' ');
        const infowindow = new maps.InfoWindow({
          content: `
            <div style="padding:8px; min-width:150px; font-size:13px; text-align:center; color:#333; line-height: 1.4;">
              <span style="font-size:10px; background:#edf2f7; padding:2px 5px; border-radius:3px; color:#4a5568;">${place.content_type || '정보'}</span><br/>
              <strong style="color:#2b6cb0; display:inline-block; margin-top:4px;">${place.title}</strong><br/>
              <span style="font-size:11px; color:#666; display:inline-block; margin-top:2px;">${shortenedAddress}</span>
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
};

// 💡 [에러 해결 4] 탭을 눌렀을 때 실행되는 컨트롤러 함수
const changeCategory = (categoryValue) => {
  currentCategory.value = categoryValue; // 1. 현재 선택 카테고리값 갱신
  updateMarkers(); // 2. 바뀐 데이터로 마커 다시 그리기 지시
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

/* 💡 카테고리 탭 스타일 코드 */
.category-tabs {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1.2rem;
  flex-wrap: wrap;
}
.tab-btn {
  background: #f7fafc;
  border: 1px solid #e2e8f0;
  padding: 0.5rem 1rem;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
  font-size: 0.9rem;
  color: #4a5568;
  transition: all 0.2s ease;
}
.tab-btn:hover {
  background: #edf2f7;
}
.tab-btn.active {
  background: #2b6cb0;
  color: #ffffff;
  border-color: #2b6cb0;
}

#map-container {
  width: 100%;
  height: 480px;
  border-radius: 12px;
  border: 1px solid #e2e8f0;
}
</style>