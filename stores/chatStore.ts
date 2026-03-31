import { defineStore } from "pinia";

export const useChatStore = defineStore('chat', {
  state: () => ({
    sessions: [] as any[],
    currentSessionId: '',
  }),

  getters: {
    // 🔥 核心：根据模式过滤历史列表
    filteredSessions: (state) => (mode: string) => {
      return state.sessions.filter(s => s.mode === mode);
    },
    // 获取当前选中的会话对象
    currentSession: (state) => {
      return state.sessions.find(s => s.id === state.currentSessionId);
    }
  },

  actions: {
    // 创建会话时强制绑定模式
    createNewSession(mode: 'polish' | 'translate' | 'general') {
      const id = Date.now().toString();
      const titles = {
        polish: '新润色任务',
        translate: '新翻译任务',
        general: '新对话'
      };

      const newSession = {
        id,
        mode, // 👈 标记模式
        title: titles[mode],
        messages: [],
        createdAt: Date.now(),
      };

      this.sessions.unshift(newSession);
      this.currentSessionId = id;
      return newSession;
    },

    // 自动更新标题：取第一条用户消息
    updateTitleFromMessage(sessionId: string, firstMsg: string) {
      const session = this.sessions.find(s => s.id === sessionId);
      if (session && session.title.includes('新')) {
        session.title = firstMsg.slice(0, 12) + (firstMsg.length > 12 ? '...' : '');
      }
    },

    updateSessionMessages(sessionId: string, messages: any[]) {
      console.log("uodated")
      const session = this.sessions.find(s => s.id === sessionId);
      if (session) {
        // 使用序列化副本，避免 Vue 响应式对象的引用冲突
        session.messages = JSON.parse(JSON.stringify(messages));
      }
    },

    deleteSession(id: string) {
      this.sessions = this.sessions.filter(s => s.id !== id);
      if (this.currentSessionId === id) this.currentSessionId = '';
    }
  },
  persist: {
    key: 'nuxt-ai-chat-v1', // 换一个全新的 Key，防止旧数据污染
    storage: persistedState.localStorage,
  }
});