<template>
  <div class="chatbot-wrapper">
    <button class="chatbot-toggle-btn" @click="toggleChat">
      <span v-if="!isOpen">💬 LocalHub 봇</span>
      <span v-else>❌ 닫기</span>
    </button>

    <div class="chat-window" v-if="isOpen">
      <div class="chat-header">
        <h4>🤖 구미/경북 스마트 안내원</h4>
      </div>
      
      <div class="chat-body" ref="chatBody">
        <div v-for="(msg, idx) in messages" :key="idx" :class="['chat-bubble', msg.sender]">
          <p>{{ msg.text }}</p>
        </div>
        <div v-if="isLoading" class="chat-bubble bot loading">
          <p>답변을 생각하고 있어요...</p>
        </div>
      </div>

      <div class="chat-footer">
        <input 
          v-model="inputMsg" 
          type="text" 
          placeholder="구미 축제나 맛집에 대해 물어보세요!" 
          @keyup.enter="sendMessage"
          :disabled="isLoading"
        />
        <button @click="sendMessage" :disabled="isLoading">전송</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, nextTick } from 'vue';
import axios from 'axios';

const isOpen = ref(false);
const isLoading = ref(false);
const inputMsg = ref('');
const chatBody = ref(null);
const API_BASE = import.meta.env.VITE_API_BASE_URL;

const messages = ref([
  { sender: 'bot', text: '안녕하세요! 공공데이터 기반 구미/경북 가이드 LocalHub 챗봇입니다. 어떤 정보가 필요하신가요?' }
]);

const toggleChat = () => {
  isOpen.value = !isOpen.value;
  if(isOpen.value) scrollBottom();
};

const scrollBottom = async () => {
  await nextTick();
  if (chatBody.value) {
    chatBody.value.scrollTop = chatBody.value.scrollHeight;
  }
};

const sendMessage = async () => {
  if (!inputMsg.value.trim() || isLoading.value) return;

  const userText = inputMsg.value;
  messages.value.push({ sender: 'user', text: userText });
  inputMsg.value = '';
  isLoading.value = true;
  scrollBottom();

  try {
    // OpenAI API를 프록시 서빙하는 백엔드 API 엔드포인트 연동
    const response = await axios.post(`${API_BASE}/api/chat`, {
      message: userText
    });
    messages.value.push({ sender: 'bot', text: response.data.answer || response.data });
  } catch (error) {
    messages.value.push({ sender: 'bot', text: '죄송합니다. 서버 통신 중 오류가 발생했습니다.' });
  } finally {
    isLoading.value = false;
    scrollBottom();
  }
};
</script>

<style scoped>
.chatbot-wrapper { position: fixed; bottom: 30px; right: 30px; z-index: 9999; }
.chatbot-toggle-btn { background: #2b6cb0; color: white; border: none; padding: 1rem 1.5rem; border-radius: 50px; font-weight: bold; cursor: pointer; box-shadow: 0 4px 10px rgba(0,0,0,0.2); }
.chat-window { position: absolute; bottom: 70px; right: 0; width: 360px; height: 500px; background: white; border-radius: 12px; box-shadow: 0 5px 20px rgba(0,0,0,0.15); display: flex; flex-direction: column; overflow: hidden; }
.chat-header { background: #2b6cb0; color: white; padding: 1rem; }
.chat-header h4 { margin: 0; }
.chat-body { flex: 1; padding: 1rem; overflow-y: auto; background: #f7fafc; display: flex; flex-direction: column; gap: 0.8rem; }
.chat-bubble { 
  max-width: 80%; 
  padding: 0.7rem 1rem; 
  border-radius: 8px; 
  font-size: 0.95rem; 
  line-height: 1.4; 

  /* 💡 긴 텍스트를 영역 내에서 알아서 내려가도록 해주는 속성 추가 */
  white-space: pre-wrap;     /* 백엔드 답변 내의 개행문자(\n)도 정상적으로 줄바꿈하여 보여줍니다. */
  word-break: break-all;     /* 긴 주소 링크(URL)나 영어 단어가 들어와도 잘리지 않고 알아서 밑으로 내립니다. */
  overflow-wrap: break-word; /* 텍스트가 박스 한계치에 다다르면 단어 단위로 줄을 넘깁니다. */
}

/* 💡 <p> 태그의 브라우저 기본 위아래 마진(여백)을 제거하고 영역 안에서 예쁘게 정렬합니다. */
.chat-bubble p {
  margin: 0;
  word-break: break-all;
  white-space: pre-wrap;
}
.chat-bubble.bot { background: white; align-self: flex-start; border: 1px solid #e2e8f0; }
.chat-bubble.user { background: #bee3f8; color: #2b6cb0; align-self: flex-end; }
.chat-bubble.loading { color: #a0aec0; font-style: italic; }
.chat-footer { display: flex; border-top: 1px solid #e2e8f0; padding: 0.5rem; background: white; }
.chat-footer input { flex: 1; border: none; padding: 0.6rem; font-size: 0.95rem; outline: none; }
.chat-footer button { background: #2b6cb0; color: white; border: none; padding: 0.6rem 1rem; border-radius: 4px; cursor: pointer; }
</style>