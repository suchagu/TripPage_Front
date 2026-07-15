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

    <div class="map-container-wrapper">
      <div id="map-container" ref="mapContainer"></div>

      <div class="side-detail-panel" v-if="selectedPlace">
        <div class="panel-image-wrapper">
          <img class="panel-img" :src="selectedPlace.image_url || selectedPlace.imageUrl || 'https://placehold.co/400x250?text=No+Image'" :alt="selectedPlace.title" />
          <span class="panel-badge">{{ selectedPlace.content_type || '정보' }}</span>
          <button class="panel-close-btn" @click="closeDetail" title="닫기">×</button>
        </div>
        <div class="panel-body">
          <h4 class="panel-title">{{ selectedPlace.title }}</h4>
          <p class="panel-address">{{ selectedPlace.address }}</p>
          <div class="panel-description">
            <p>💡 선택하신 장소의 상세 정보입니다. 실시간 도로명 주소 위치로 지도가 이동되었습니다.</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import axios from 'axios';

const mapContainer = ref(null);
let mapInstance = null;
const loading = ref(false);

const allPlaces = ref([]);
const currentMarkers = ref([]);
const currentCategory = ref('ALL');

// 💡 현재 사용자가 마커를 클릭해 선택한 장소 정보를 저장하는 반응형 상태 변수
const selectedPlace = ref(null);

// 카테고리 자동 추출 목록
const categoryList = computed(() => {
  const list = [{ label: '전체', value: 'ALL' }];
  if (!allPlaces.value || allPlaces.value.length === 0) return list;

  const types = allPlaces.value
    .map(place => place.content_type || place.content_Type || place.contentType)
    .filter(type => type && type.trim() !== '');

  const uniqueTypes = [...new Set(types)];
  uniqueTypes.forEach(type => {
    list.push({ label: type, value: type });
  });

  return list;
});

const fetchPlacesFromBackend = async () => {
  loading.value = true;
  try {
    const response = await axios.get('https://localhub-backend-dev.onrender.com/api/data/places');
    allPlaces.value = response.data.places || response.data || [];
  } catch (error) {
    console.error("백엔드 데이터를 가져오지 못했습니다. 임시 기본값으로 대체합니다:", error);
    allPlaces.value = [
      { 
        title: '금오산 도립공원', 
        address: '경상북도 구미시 금오산상가길 419', 
        content_type: '관광지',
        image_url: 'https://images.unsplash.com/photo-1501854140801-50d01698950b?auto=format&fit=crop&w=400&q=80' 
      },
      { 
        title: '구미시청', 
        address: '경상북도 구미시 송정대로 55', 
        content_type: '관광지',
        image_url: 'https://images.unsplash.com/photo-1577083552431-6e5fd01aa342?auto=format&fit=crop&w=400&q=80' 
      },
      { 
        title: '구미역 맛집거리', 
        address: '경상북도 구미시 구미중앙로 76', 
        content_type: '맛집',
        image_url: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=400&q=80' 
      }
    ];
  } finally {
    loading.value = false;
  }
};

onMounted(async () => {
  await fetchPlacesFromBackend();

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
      center: new maps.LatLng(36.119485, 128.344435),
      level: 7
    };

    mapInstance = new maps.Map(mapContainer.value, options);
    updateMarkers(); 
  } catch (err) {
    console.error("지도 초기화 과정 중 에러 발생:", err);
  }
};

const updateMarkers = () => {
  if (!mapInstance) return;
  const { maps } = window.kakao;

  // 기존 마커 삭제 및 선택창 초기화
  currentMarkers.value.forEach(marker => marker.setMap(null));
  currentMarkers.value = [];
  selectedPlace.value = null;

  const filteredPlaces = allPlaces.value.filter(place => {
    if (currentCategory.value === 'ALL') return true;
    const type = place.content_type || place.content_Type || place.contentType;
    return type === currentCategory.value;
  });

  const geocoder = new maps.services.Geocoder();

  filteredPlaces.forEach((place) => {
    if (!place || !place.address || typeof place.address !== 'string' || place.address.trim() === '') {
      return; 
    }

    geocoder.addressSearch(place.address.trim(), (result, status) => {
      if (status === maps.services.Status.OK) {
        const coords = new maps.LatLng(result[0].y, result[0].x);

        const marker = new maps.Marker({
          map: mapInstance,
          position: coords
        });

        currentMarkers.value.push(marker);

        // 💡 마커 클릭 시, 지도 위에 팝업을 띄우는 대신 우측 상태창(selectedPlace)에 장소 할당
        maps.event.addListener(marker, 'click', () => {
          selectedPlace.value = place;
          
          // 조금 더 왼쪽으로 지도를 옮겨 팝업과 겹치지 않게 조절 가능 (여기선 중심 이동)
          mapInstance.panTo(coords);
        });
      }
    });
  });
};

// 상세창 닫기 함수
const closeDetail = () => {
  selectedPlace.value = null;
};

const changeCategory = (categoryValue) => {
  currentCategory.value = categoryValue;
  updateMarkers();
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

/* 지도와 사이드 패널을 감싸는 상대 위치 영역 */
.map-container-wrapper {
  position: relative;
  width: 100%;
  height: 550px; /* 상세창 크기를 확보하기 위해 높이를 조금 늘림 */
  border-radius: 12px;
  overflow: hidden;
  border: 1px solid #e2e8f0;
}

#map-container {
  width: 100%;
  height: 100%;
}

/* 💡 화면의 약 4분의 1(280px ~ 300px)을 차지하는 우측 고정 상세 패널 */
.side-detail-panel {
  position: absolute;
  top: 15px;
  right: 15px;
  bottom: 15px;
  width: 28% ; /* 전체 지도 너비의 약 1/4 이상을 차지하도록 설정 */
  min-width: 260px;
  max-width: 340px;
  background: #ffffff;
  border-radius: 14px;
  box-shadow: -5px 0 25px rgba(0, 0, 0, 0.15), 0 5px 10px rgba(0, 0, 0, 0.05);
  z-index: 10;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  animation: slideIn 0.3s ease-out;
}

@keyframes slideIn {
  from { transform: translateX(30px); opacity: 0; }
  to { transform: translateX(0); opacity: 1; }
}

.panel-image-wrapper {
  position: relative;
  width: 100%;
  height: 160px;
  background-color: #f7fafc;
}
.panel-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.panel-badge {
  position: absolute;
  top: 12px;
  left: 12px;
  font-size: 0.75rem;
  font-weight: 700;
  color: #ffffff;
  background: #2b6cb0;
  padding: 4px 10px;
  border-radius: 50px;
}
.panel-close-btn {
  position: absolute;
  top: 10px;
  right: 10px;
  background: rgba(255, 255, 255, 0.9);
  border: none;
  font-size: 1.35rem;
  font-weight: bold;
  color: #2d3748;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 5px rgba(0,0,0,0.2);
  transition: all 0.2s;
}
.panel-close-btn:hover {
  background: #ffffff;
  transform: scale(1.05);
}

.panel-body {
  padding: 16px;
  text-align: left;
  display: flex;
  flex-direction: column;
  flex: 1;
  overflow-y: auto; /* 내용이 너무 많으면 스크롤 생성 */
}
.panel-title {
  font-size: 1.15rem;
  font-weight: 800;
  color: #1a202c;
  margin: 0 0 8px 0;
  line-height: 1.4;
}
.panel-address {
  font-size: 0.85rem;
  color: #4a5568;
  margin: 0 0 16px 0;
  line-height: 1.5;
  background: #f7fafc;
  padding: 8px 12px;
  border-radius: 6px;
  border: 1px solid #edf2f7;
}
.panel-description {
  font-size: 0.8rem;
  color: #718096;
  line-height: 1.6;
  border-top: 1px dashed #e2e8f0;
  padding-top: 12px;
}
</style>