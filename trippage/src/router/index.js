import { createRouter, createWebHistory } from 'vue-router';
import HomeView from '../views/HomeView.vue';
import PostListView from '../views/PostListView.vue';
import PostDetailView from '../views/PostDetailView.vue';
import PostCreateView from '../views/PostCreateView.vue';

const routes = [
  { path: '/', name: 'Home', component: HomeView },
  { path: '/posts', name: 'PostList', component: PostListView },
  { path: '/posts/:id', name: 'PostDetail', component: PostDetailView, props: true },
  { path: '/posts/write', name: 'PostCreate', component: PostCreateView },
  { path: '/posts/:id/edit', name: 'PostEdit', component: PostCreateView, props: true }
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

export default router;

