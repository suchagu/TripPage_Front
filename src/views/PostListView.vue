<template>
  <div class="post-list-container">
    <div class="page-header">
      <h2>구미/경북 권역 소통 게시판</h2>
      <router-link to="/posts/write" class="btn-primary">✏️ 글쓰기</router-link>
    </div>

    <div class="filter-bar">
      <input 
        v-model="searchQuery" 
        type="text" 
        placeholder="검색어를 입력하세요..." 
        @keyup.enter="fetchPosts(1)"
      />
      <button @click="fetchPosts(1)" class="btn-secondary">검색</button>
    </div>

    <table class="post-table">
      <thead>
        <tr>
          <th style="width: 10%">번호</th>
          <th style="width: 50%">제목</th>
          <th style="width: 15%">작성자</th>
          <th style="width: 25%">작성일시</th>
        </tr>
      </thead>
      <tbody>
        <tr v-if="posts.length === 0">
          <td colspan="4" class="no-data">등록된 게시글이 없습니다. 첫 글을 남겨보세요!</td>
        </tr>
        <tr v-for="post in posts" :key="post.id" @click="goToDetail(post.id)" class="clickable-row">
          <td>{{ post.id }}</td>
          <td class="text-left">{{ post.title }}</td>
          <td>{{ post.author }}</td>
          <td>{{ formatDate(post.created_at) }}</td>
        </tr>
      </tbody>
    </table>

    <div class="pagination" v-if="totalPages > 1">
      <button :disabled="currentPage === 1" @click="fetchPosts(currentPage - 1)">이전</button>
      <span>{{ currentPage }} / {{ totalPages }}</span>
      <button :disabled="currentPage === totalPages" @click="fetchPosts(currentPage + 1)">다음</button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import axios from 'axios';

const router = useRouter();
const API_BASE = import.meta.env.VITE_API_BASE_URL;

const posts = ref([]);
const currentPage = ref(1);
const totalPages = ref(1);
const searchQuery = ref('');
const limit = 10;

// 백엔드 API로부터 데이터 호출
const fetchPosts = async (page = 1) => {
  currentPage.value = page;
  try {
    const response = await axios.get(`${API_BASE}/api/posts`, {
      params: {
        page: page,
        limit: limit,
        category: '구미/경북',
        search: searchQuery.value // 백엔드 스펙에 맞춰 추가 구현 가능
      }
    });
    posts.value = response.data.posts || [];
    totalPages.value = response.data.total_pages || 1;
  } catch (error) {
    console.error("게시글 목록 로드 실패:", error);
  }
};

const goToDetail = (id) => {
  router.push(`/posts/${id}`);
};

const formatDate = (dateStr) => {
  if (!dateStr) return '-';
  const date = new Date(dateStr);
  return date.toLocaleString();
};

onMounted(() => {
  fetchPosts();
});
</script>

<style scoped>
.page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; }
.btn-primary { background-color: var(--primary-color); color: white; padding: 0.6rem 1.2rem; text-decoration: none; border-radius: 4px; font-weight: bold; }
.filter-bar { display: flex; gap: 0.5rem; margin-bottom: 1.5rem; }
.filter-bar input { flex: 1; padding: 0.6rem; border: 1px solid var(--border-color); border-radius: 4px; }
.btn-secondary { background-color: #718096; color: white; border: none; padding: 0.6rem 1.2rem; border-radius: 4px; cursor: pointer; }
.post-table { width: 100%; border-collapse: collapse; background: white; border-radius: 4px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
.post-table th, .post-table td { padding: 1rem; border-bottom: 1px solid var(--border-color); text-align: center; }
.post-table th { background-color: #edf2f7; font-weight: bold; }
.clickable-row { cursor: pointer; transition: background 0.2s; }
.clickable-row:hover { background-color: #f7fafc; }
.text-left { text-align: left; }
.no-data { padding: 3rem; color: #a0aec0; }
.pagination { display: flex; justify-content: center; align-items: center; gap: 1rem; margin-top: 1.5rem; }
.pagination button { padding: 0.4rem 0.8rem; border: 1px solid var(--border-color); background: white; cursor: pointer; }
.pagination button:disabled { opacity: 0.5; cursor: not-allowed; }
</style>