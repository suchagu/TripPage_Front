<template>
  <div class="form-container">
    <h2>{{ isEditMode ? '게시글 수정' : '새 게시글 작성' }}</h2>
    <form @submit.prevent="handleSubmit">
      <div class="form-group">
        <label>작성자닉네임</label>
        <input v-model="form.author" type="text" placeholder="익명 닉네임 입력" :disabled="isEditMode" required />
      </div>

      <div class="form-group">
        <label>글 비밀번호</label>
        <input v-model="form.password" type="password" placeholder="수정/삭제용 비밀번호 입력" required />
      </div>

      <div class="form-group">
        <label>제목</label>
        <input v-model="form.title" type="text" placeholder="제목을 입력하세요" required />
      </div>

      <div class="form-group">
        <label>내용</label>
        <textarea v-model="form.content" rows="8" placeholder="구미/경북 권역의 유익한 정보를 공유해 주세요." required></textarea>
      </div>

      <div class="form-actions">
        <button type="button" class="btn-cancel" @click="$router.back()">취소</button>
        <button type="submit" class="btn-submit">{{ isEditMode ? '수정완료' : '등록하기' }}</button>
      </div>
    </form>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import axios from 'axios';

const route = useRoute();
const router = useRouter();
const API_BASE = import.meta.env.VITE_API_BASE_URL;

const isEditMode = computed(() => !!route.params.id);

const form = ref({
  title: '',
  content: '',
  author: '',
  password: '',
  category: '구미/경북'
});

// 수정 모드일 때 기존 데이터 불러오기
onMounted(async () => {
  if (isEditMode.value) {
    try {
      const response = await axios.get(`${API_BASE}/api/posts/${route.params.id}`);
      form.value.title = response.data.title;
      form.value.content = response.data.content;
      form.value.author = response.data.author;
    } catch (error) {
      alert("데이터를 가져오는 데 실패했습니다.");
      router.back();
    }
  }
});

const handleSubmit = async () => {
  // 1. 빈 값이 있는지 먼저 검사 (하나라도 비어있으면 백엔드에서 422 에러 발생)
  if (!form.value.title || !form.value.content || !form.value.author || !form.value.password) {
    alert("모든 항목을 입력해 주세요.");
    return;
  }

  // 2. 명세서(Body)에 적힌 딱 5개의 필드만 정확하게 객체로 빌드
  const postPayload = {
    title: form.value.title,
    content: form.value.content,
    author: form.value.author,
    password: form.value.password, // 평문 비밀번호 
    category: form.value.category || '구미/경북' // 누락 방지용 기본값 지정 
  };

  try {
    // 3. 백엔드로 데이터 전송
    const response = await axios.post(`${API_BASE}/api/posts`, postPayload);
    
    if (response.status === 201) { // 생성 성공 시 201 상태코드 반환 
      alert("게시글이 성공적으로 등록되었습니다!");
      router.push('/posts');
    }
  } catch (error) {
    console.error("등록 실패 로그:", error);
    console.log(`${API_BASE}`, error.response?.data);
    alert("서버 연결에 실패했거나 데이터 전송 오류가 발생했습니다.");
  }
};
</script>

<style scoped>
.form-container { max-width: 700px; margin: 0 auto; background: white; padding: 2rem; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.05); }
.form-group { display: flex; flex-direction: column; gap: 0.5rem; margin-bottom: 1.2rem; }
.form-group label { font-weight: bold; }
.form-group input, .form-group textarea { padding: 0.7rem; border: 1px solid var(--border-color); border-radius: 4px; font-size: 1rem; }
.form-actions { display: flex; justify-content: flex-end; gap: 1rem; margin-top: 1.5rem; }
.btn-cancel { background: #e2e8f0; border: none; padding: 0.7rem 1.5rem; border-radius: 4px; cursor: pointer; }
.btn-submit { background: var(--primary-color); color: white; border: none; padding: 0.7rem 1.5rem; border-radius: 4px; cursor: pointer; font-weight: bold; }
</style>