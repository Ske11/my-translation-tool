<template>
  <div class="app-wrapper">
    <aside class="sidebar">
      <div class="logo-area">
        <div class="logo-icon">
          <Cpu :size="20" />
        </div>
        <span class="logo-text">NuxtAI</span>
      </div>

      <nav class="nav-menu">
        <button 
          v-for="(config, key) in modeConfigs" 
          :key="key"
          :class="['nav-item', activeMode === key ? 'is-active' : '']"
          @click="changeMode(key)"
        >
          <component :is="config.icon" :size="18" />
          <span>{{ key === 'polish' ? '润色' : key === 'translate' ? '翻译' : '对话' }}</span>
        </button>
      </nav>

      <div class="sidebar-footer">
        <el-button link class="footer-icon">
          <Settings :size="18" />
        </el-button>
      </div>
    </aside>

    <main class="main-content">
      <div class="content-container">
        <AiChatWindow 
          :key="activeMode"
          :mode="activeMode" 
          :title="modeConfigs[activeMode].title" 
        />
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { 
  MagnetIcon, 
  Languages, 
  MessageSquare, 
  Settings,
  Cpu
} from 'lucide-vue-next';

// 当前选中的模式
const activeMode = ref<'polish' | 'translate' | 'general'>('polish');

// 模式配置表
const modeConfigs = {
  polish: { title: 'AI 文案润色专家', icon: MagnetIcon, color: '#6366f1' },
  translate: { title: 'AI 极速翻译官', icon: Languages, color: '#10b981' },
  general: { title: 'AI 智能助手', icon: MessageSquare, color: '#334155' }
};

const changeMode = (mode: any) => {
  activeMode.value = mode;
};
</script>


<style scoped>
.app-wrapper {
  display: flex;
  height: 100vh;
  width: 100vw;
  background-color: #f1f5f9;
  overflow: hidden;
}

/* 侧边栏样式 */
.sidebar {
  width: 80px;
  background-color: #ffffff;
  border-right: 1px solid #e2e8f0;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20px 0;
  z-index: 10;
}

.logo-area {
  margin-bottom: 40px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.logo-icon {
  width: 40px;
  height: 40px;
  background: linear-gradient(135deg, #6366f1 0%, #a855f7 100%);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
}

.logo-text {
  font-size: 10px;
  font-weight: 800;
  color: #64748b;
  letter-spacing: 0.05em;
}

.nav-menu {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.nav-item {
  width: 50px;
  height: 50px;
  border-radius: 14px;
  border: none;
  background: transparent;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: #94a3b8;
  transition: all 0.2s ease;
  gap: 4px;
}

.nav-item span {
  font-size: 10px;
  font-weight: 500;
}

.nav-item:hover {
  background-color: #f8fafc;
  color: #6366f1;
}

.nav-item.is-active {
  background-color: #eff6ff;
  color: #4f46e5;
  box-shadow: 0 4px 6px -1px rgba(79, 70, 229, 0.1);
}

.sidebar-footer {
  padding-top: 20px;
  border-top: 1px solid #f1f5f9;
  color: #94a3b8;
}

/* 内容区样式 */
.main-content {
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 40px;
  position: relative;
}

.content-container {
  width: 100%;
  max-width: 900px;
  height: 100%;
  max-height: 800px;
}

/* 装饰性背景 */
.main-content::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-image: radial-gradient(#cbd5e1 1px, transparent 1px);
  background-size: 30px 30px;
  opacity: 0.3;
  pointer-events: none;
}
</style>