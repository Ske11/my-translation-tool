<template>
  <div v-if="isReady" class="flex h-screen w-screen bg-slate-50 overflow-hidden font-sans">
    <aside :class="[sidebarClass, isCollapsed ? 'w-20' : 'w-64']">
      <div class="absolute -right-3 top-10 z-30">
        <el-button circle size="small" class="!shadow-sm !border-slate-200 !bg-white" @click="isCollapsed = !isCollapsed">
          <el-icon :class="['transition-transform', isCollapsed ? '' : 'rotate-180']">
            <ChevronRight :size="14" />
          </el-icon>
        </el-button>
      </div>

      <div class="p-5 flex items-center gap-3 overflow-hidden whitespace-nowrap">
        <div class="min-w-[40px] h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center text-white shadow-md">
          <Cpu :size="22" />
        </div>
        <span v-show="!isCollapsed" class="text-xl font-bold text-slate-800 tracking-tight">NuxtAI</span>
      </div>

      <div class="px-3 mb-6">
        <p v-show="!isCollapsed" class="px-3 mb-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">功能模式</p>
        <div class="flex flex-col gap-1.5">
          <el-tooltip v-for="(config, key) in modeConfigs" :key="key" :content="config.label" placement="right" :disabled="!isCollapsed">
            <el-button
              :type="activeMode === key ? 'primary' : 'default'"
              :class="getMenuItemClass(key)"
              @click="changeMode(key)"
            >
              <el-icon :size="20"><component :is="config.icon" /></el-icon>
              <span v-show="!isCollapsed" class="ml-3 font-medium">{{ config.label }}</span>
            </el-button>
          </el-tooltip>
        </div>
      </div>

      <div class="flex-1 overflow-hidden flex flex-col px-3 mt-2">
        <div v-show="!isCollapsed" class="flex items-center justify-between px-3 mb-2">
          <p class="text-[10px] font-bold text-slate-400 uppercase tracking-widest">最近记录</p>
          <el-button link @click="handleNewChat"><el-icon><Plus :size="14" /></el-icon></el-button>
        </div>

        <el-scrollbar>
          <div v-if="!isCollapsed" class="flex flex-col gap-1 pr-2">
            <div 
              v-for="session in chatStore.filteredSessions(activeMode)" 
              :key="session.id"
              @click="chatStore.currentSessionId = session.id"
              :class="getHistoryItemClass(session.id)"
            >
              <div class="flex items-center gap-2 truncate">
                <el-icon :size="16" class="opacity-70"><MessageSquare /></el-icon>
                <span v-show="!isCollapsed" class="truncate text-sm">{{ session.title }}</span>
              </div>
              </div>
          </div>
        </el-scrollbar>
      </div>

      <div class="p-3 border-t border-slate-100">
        <el-button link :class="['!w-full !text-slate-500 hover:!bg-slate-100 !h-10 !border-none', isCollapsed ? '!justify-center' : '!justify-start !px-3']">
          <el-icon :size="20"><Settings /></el-icon>
          <span v-show="!isCollapsed" class="ml-3 text-sm font-medium">设置中心</span>
        </el-button>
      </div>
    </aside>

    <main class="flex-1 flex flex-col items-center justify-center p-4 lg:p-8 relative bg-grid transition-all duration-300">
      <div class="w-full max-w-5xl h-full flex flex-col relative z-10">
        <AiChatWindow :key="chatStore.currentSessionId" :mode="activeMode" :title="modeConfigs[activeMode].title" :session-id="chatStore.currentSessionId" />
      </div>
    </main>
  </div>
  <div v-else class="h-screen w-screen flex items-center justify-center bg-slate-50">
    <el-icon class="animate-spin text-indigo-500" :size="32"><Loading /></el-icon>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { MagnetIcon, Languages, MessageSquare, Settings, Cpu, Plus, Trash2, ChevronRight } from 'lucide-vue-next';
import { useChatStore } from '~~/stores/chatStore';

const chatStore = useChatStore();
const isReady = ref(false); // 标记客户端是否就绪--用于恢复数据
const isCollapsed = ref(false);
const activeMode = ref<'polish' | 'translate' | 'general'>('polish');

const modeConfigs = {
  polish: { label: '文本润色', title: 'AI 文案润色专家', icon: MagnetIcon },
  translate: { label: '智能翻译', title: 'AI 极速翻译官', icon: Languages },
  general: { label: '自由对话', title: 'AI 智能助手', icon: MessageSquare }
};

// App.vue 中的切换逻辑
const changeMode = (mode: 'polish' | 'translate' | 'general') => {
  activeMode.value = mode;
  
  // 查找该模式下的历史记录
  const sessions = chatStore.filteredSessions(mode);
  
  if (sessions.length > 0) {
    // 如果有历史，选中最近的一条
    chatStore.currentSessionId = sessions[0].id;
  } else {
    // 如果没历史，自动创建一个新的
    chatStore.createNewSession(mode);
  }
};

// --- 样式提取常量 ---
const sidebarClass = "bg-white border-r border-slate-200 flex flex-col z-20 transition-all duration-300 ease-in-out relative";

const getMenuItemClass = (key: string) => [
  "!border-none !transition-all !duration-200 !m-0",
  isCollapsed.value ? "!w-12 !h-12 !p-0 !mx-auto" : "!w-full !justify-start !px-3 !py-5",
  activeMode.value === key ? "!bg-indigo-50 !text-indigo-600" : "!bg-transparent !text-slate-600 hover:!bg-slate-100"
];

const getHistoryItemClass = (id: string) => [
  "group flex items-center justify-between rounded-lg cursor-pointer transition-all h-10 text-slate-500 hover:bg-slate-100/80",
  isCollapsed.value ? "justify-center" : "px-3",
  chatStore.currentSessionId === id ? "bg-indigo-50/50 text-indigo-700 font-medium" : ""
];

const handleNewChat = () => chatStore.createNewSession(activeMode.value);

onMounted(() => {
  // 1. 此时 Pinia 已经完成了从 localStorage 的数据恢复
  // 2. 检查是否有历史记录
  if (chatStore.sessions.length > 0) {
    // 如果有记录，恢复到最近一个会话的模式
    const lastSession = chatStore.sessions.find(s => s.id === chatStore.currentSessionId) 
                     || chatStore.sessions[0];
    
    chatStore.currentSessionId = lastSession.id;
    activeMode.value = lastSession.mode;
  } else {
    // 彻底没记录，才创建新的
    chatStore.createNewSession(activeMode.value);
  }
  
  // 3. 标记就绪，允许渲染界面
  isReady.value = true;
});
</script>

<style scoped>
.bg-grid {
  background-image: radial-gradient(#cbd5e1 1px, transparent 1px);
  background-size: 30px 30px;
  background-position: center;
}
</style>