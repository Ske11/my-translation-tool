<template>
  <el-card class="window-container" :body-style="{ padding: '0px' }">
    <template #header>
      <div class="flex items-center justify-between px-1">
        <div class="flex items-center gap-2">
          <div class="header-icon-box">
            <Sparkles :size="15" />
          </div>
          <span class="font-bold text-slate-700 text-sm">{{ title || 'AI Assistant' }}</span>
          <el-tag size="small" effect="dark" class="rounded-md scale-90">{{ mode }}</el-tag>
        </div>
        <el-button link @click="clearChat" class="text-slate-400 hover:text-red-500">
          <Eraser :size="14" class="mr-1" /> 重置
        </el-button>
      </div>
    </template>

    <div class="flex flex-col h-[600px] bg-slate-50/50">
      <el-scrollbar ref="scrollContainer" class="flex-1">
        <div class="p-5 flex flex-col gap-6">
          
          <div v-if="chat.messages.length === 0" class="empty-placeholder">
            <Bot :size="40" class="opacity-10 mb-3" />
            <p class="text-xs text-slate-400 tracking-wider">READY TO HELP YOUR {{ mode.toUpperCase() }}</p>
          </div>

          <div 
            v-for="(m, index) in chat.messages" :key="m.id || index"
            :class="['flex gap-3', m.role === 'user' ? 'flex-row-reverse' : '']"
          >
            <div :class="['avatar-frame', m.role === 'user' ? 'is-user' : 'is-ai']">
              <User v-if="m.role === 'user'" :size="14" />
              <Bot v-else :size="14" />
            </div>

            <div :class="['msg-bubble', m.role === 'user' ? 'bubble-user' : 'bubble-ai']">
              <template v-for="(part, pIdx) in m.parts" :key="pIdx">
                <div v-if="part.type === 'text'" class="whitespace-pre-wrap break-words">
                  {{ part.text }}
                </div>
              </template>
            </div>
          </div>

          <div  v-if="chat.status === 'submitted'" class="flex gap-3">
            <div class="avatar-frame is-ai loading-pulse">
              <Loader2 :size="14" class="animate-spin" />
            </div>
            <div class="msg-bubble bubble-ai is-loading-text">
              AI 正在响应...
            </div>
          </div>
        </div>
      </el-scrollbar>

      <div class="p-4 bg-white border-t border-slate-100">
        <div class="input-container-box">
          <el-input
            v-model="input"
            type="textarea"
            :autosize="{ minRows: 1, maxRows: 6 }"
            placeholder="粘贴内容或输入指令..."
            resize="none"
            class="ai-textarea"
            @keydown.enter.prevent="handleSend"
          />
          <div class="flex justify-end mt-1">
            <el-button 
              type="primary" 
              circle
              :disabled="!input.trim() || isWorking"
              @click="handleSend"
            >
              <Send v-if="!isWorking" :size="16" />
              <Loader2 v-else :size="16" class="animate-spin" />
            </el-button>
          </div>
        </div>
      </div>
    </div>
  </el-card>
</template>

<script setup lang="ts">
import { Chat } from "@ai-sdk/vue";
import { ref, watch, nextTick, computed } from "vue";
import { Send, Bot, User, Loader2, Eraser, Sparkles } from "lucide-vue-next";
import type { UIMessage } from "ai";

interface Props {
  mode: 'polish' | 'translate' | 'general';
  title?: string;
}

const props = defineProps<Props>();

// 初始化 AI SDK 6.x 实例
const chat = new Chat({
  messages: [] as UIMessage[]
});

// 状态判断：基于 6.x 的 status 字段
const isWorking = computed(() => chat.status !== 'ready');

const input = ref("");
const scrollContainer = ref<any>(null);

const handleSend = async () => {
  const text = input.value.trim();
  if (!text || isWorking.value) return;
  try {
    await chat.sendMessage(
      { text },
      { body: { mode: props.mode } } );
    input.value = ""; 
  } catch (e) {
    console.error("AI 发送异常:", e);
  }
};

// 自动滚动逻辑
watch(() => chat.messages.length, () => {
  nextTick(() => {
    if (scrollContainer.value?.wrapRef) {
      const inner = scrollContainer.value.wrapRef;
      inner.scrollTo({ top: inner.scrollHeight, behavior: 'smooth' });
    }
  });
}, { deep: true });

const clearChat = () => { chat.messages = []; };
</script>

<style scoped>
/* --- 原生 CSS：处理类名超过 7 个或需要精细控制的样式 --- */

.window-container {
  border-radius: 20px;
  border: none;
  overflow: hidden;
  box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.05);
}

.header-icon-box {
  width: 28px;
  height: 28px;
  background-color: #4f46e5;
  color: white;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 6px -1px rgba(79, 70, 229, 0.2);
}

.empty-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  margin-top: 100px;
  animation: fadeIn 0.6s ease-out;
}

/* 头像框架 */
.avatar-frame {
  width: 34px;
  height: 34px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: transform 0.2s ease;
}
.avatar-frame.is-user {
  background-color: #1e293b;
  color: #ffffff;
}
.avatar-frame.is-ai {
  background-color: #ffffff;
  border: 1px solid #e2e8f0;
  color: #6366f1;
}

/* 消息气泡 */
.msg-bubble {
  max-width: 82%;
  padding: 10px 16px;
  font-size: 14px;
  line-height: 1.6;
  box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
}
.bubble-user {
  background-color: #4f46e5;
  color: #ffffff;
  border-radius: 16px 2px 16px 16px;
}
.bubble-ai {
  background-color: #ffffff;
  color: #334155;
  border: 1px solid #f1f5f9;
  border-radius: 2px 16px 16px 16px;
}
.is-loading-text {
  color: #94a3b8;
  font-size: 12px;
  border-style: dashed;
}

/* 输入区域外壳 */
.input-container-box {
  background-color: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 14px;
  padding: 8px;
  transition: all 0.2s ease;
}
.input-container-box:focus-within {
  background-color: #ffffff;
  border-color: #c7d2fe;
  box-shadow: 0 0 0 4px rgba(99, 102, 241, 0.05);
}

/* 动画 */
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

.loading-pulse {
  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}
@keyframes pulse {
  50% { opacity: .5; }
}

/* Element Plus 样式覆盖 */
:deep(.ai-textarea .el-textarea__inner) {
  background: transparent;
  border: none;
  box-shadow: none;
  padding: 8px;
  font-size: 14px;
  color: #475569;
}
:deep(.el-card__header) {
  background: #ffffff;
  border-bottom: 1px solid #f8fafc;
  padding: 12px 20px;
}
</style>