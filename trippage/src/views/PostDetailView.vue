<template>
  <div class="detail-container" v-if="post">
    <div class="detail-header">
      <span class="category-badge">{{ post.category }}</span>
      <h2>{{ post.title }}</h2>
      <div class="post-meta">
        <span>작성자: <strong>{{ post.author }}</strong></span> | 
        <span>{{ new Date(post.created_at).toLocaleString() }}</span>
      </div>
    </div>
    
    <div class="detail-content">
      {{ post.content }}
    </div>

    <div class="detail-actions">
      <button class="btn-list" @click="$router.push('/posts')">목록으로</button>
      <div class="auth-actions">
        <button class="btn-edit" @click="openAuthModal('edit')">수정</button>
        <button class="btn-delete" @click="openAuthModal('delete')">삭제</button>
      </div>
    </div>

    <div class="modal" v-if="showModal">
      <div class="modal-content">
        <h3>🔑 권한 확인</h3>
        <p>게시글 작성 시 등록한 비밀번호를 입력하세요.</p>
        <input v-model="passwordInput" type="password" placeholder="비밀번호 입력" @keyup.enter="confirmAction" />
        <div class="modal-buttons">
          <button @click="closeModal" class="btn-cancel">취소</button>
          <button @click="confirmAction" class="btn-confirm">확인</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import axios from 'axios';

const route = useRoute();
const router = useRouter();
const API_BASE = import.meta.env.VITE_API_BASE_URL;

const post = ref(null);
const showModal = ref(false);
const passwordInput = ref('');
const currentAction = ref(''); // 'edit' 또는 'delete' 임시 저장

const fetchPostDetail = async () => {
  try {
    const response = await axios.get(`${API_BASE}/api/posts/${route.params.id}`);
    post.value = response.data;
  } catch (error) {
    alert("존재하지 않는 게시글이거나 서버 오류입니다.");
    router.push('/posts');
  }
};

const openAuthModal = (actionMode) => {
  currentAction.value = actionMode;
  passwordInput.value = '';
  showModal.value = true;
};

const closeModal = () => {
  showModal.value = false;
};

const confirmAction = async () => {
  if (!passwordInput.value) return alert("비밀번호를 입력해주세요.");
  
  try {
    // 1단계: API 스펙의 독립 모듈인 비밀번호 검증 API 호출 (/api/posts/{id}/verify)
    const verifyRes = await axios.post(`${API_BASE}/api/posts/${route.params.id}/verify`, {
      password: passwordInput.value
    });

    if (verifyRes.data === true) {
      showModal.value = false;
      if (currentAction.value === 'edit') {
        // 수정 화면으로 라우팅 (수정 폼 내 이중 검증용 패스워드 활용 전략)
        router.push(`/posts/${route.params.id}/edit`);
      } else if (currentAction.value === 'delete') {
        // 실제 삭제 요청 실행
        if (confirm("정말 이 글을 삭제하시겠습니까?")) {
          await axios.delete(`${API_BASE}/api/posts/${route.params.id}`, {
            data: { password: passwordInput.value }
          });
          alert("삭제되었습니다.");
          router.push('/posts');
        }
      }
    } else {
      alert("비밀번호가 올바르지 않습니다.");
    }
  } catch (error) {
    alert("인증 또는 삭제 처리 중 문제가 발생했습니다.");
  }
};

onMounted(fetchPostDetail);
</script>

<style scoped>
.detail-container { max-width: 800px; margin: 0 auto; background: white; padding: 2.5rem; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.05); }
.category-badge { background: #ebf8ff; color: #2b6cb0; font-size: 0.85rem; padding: 0.2rem 0.6rem; border-radius: 4px; font-weight: bold; }
.detail-header { border-bottom: 2px solid var(--border-color); padding-bottom: 1rem; margin-bottom: 2rem; }
.post-meta { color: #718096; font-size: 0.9rem; margin-top: 0.5rem; }
.detail-content { min-height: 250px; line-height: 1.7; font-size: 1.1rem; white-space: pre-wrap; }
.detail-actions { display: flex; justify-content: space-between; border-top: 1px solid var(--border-color); padding-top: 1.5rem; margin-top: 2rem; }
.btn-list { background: #cbd5e0; border: none; padding: 0.6rem 1.2rem; border-radius: 4px; cursor: pointer; }
.auth-actions { display: flex; gap: 0.5rem; }
.btn-edit { background: var(--primary-color); color: white; border: none; padding: 0.6rem 1.2rem; border-radius: 4px; cursor: pointer; }
.btn-delete { background: #e53e3e; color: white; border: none; padding: 0.6rem 1.2rem; border-radius: 4px; cursor: pointer; }

/* 모달 기본 스타일 */
.modal { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); display: flex; justify-content: center; align-items: center; z-index: 1000; }
.modal-content { background: white; padding: 2rem; border-radius: 8px; text-align: center; max-width: 400px; width: 100%; }
.modal-content input { width: 90%; padding: 0.7rem; margin: 1rem 0; border: 1px solid var(--border-color); border-radius: 4px; }
.modal-buttons { display: flex; justify-content: center; gap: 1rem; }
</style>