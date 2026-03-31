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

    <div v-if="sessionId" class="flex flex-col h-[700px] bg-slate-50/50">
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
              <div v-if="m.role !== 'user'" class="bubble-actions">
                <el-button-group>
                  <el-tooltip
                    effect="dark"
                    content="复制最终版本"
                    placement="top"
                    :show-after="500"
                  >
                    <el-button
                      size="small"
                      link
                      :disabled="isWorking"
                      @click="handleCopy(m, mode)"
                    >
                      <template #icon>
                        <el-icon><Copy /></el-icon>
                      </template>
                    </el-button>
                  </el-tooltip>
                </el-button-group>
              </div>
              <template v-for="(part, pIdx) in m.parts" :key="pIdx">
                <div v-if="part.type === 'text'" class="markdown-body" v-html="m.role !== 'user' ? renderMarkdown(part.text) : part.text">
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
            :loading="isWorking"
            :autosize="{ minRows: 1, maxRows: 6 }"
            placeholder="粘贴内容或输入指令..."
            resize="none"
            class="ai-textarea"
            @keydown.enter.prevent="handleSend"
          />
          <div class="flex justify-end mt-1">
            <el-button 
              v-if="isWorking" 
              type="warning" 
              circle 
              @click="chat.stop()"
            >
              <Square :size="14" />
            </el-button>
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
import { Send, Bot, User, Loader2, Eraser, Sparkles, Square, Copy, Check } from "lucide-vue-next";
import type { UIMessage } from "ai";
import MarkdownIt from "markdown-it";
import { useChatStore } from "../../stores/chatStore"

interface Props {
  mode: 'polish' | 'translate' | 'general';
  title?: string;
  sessionId: string;
}

const props = defineProps<Props>();
const chatStore = useChatStore();

// 初始化 AI SDK 6.x 实例
const chat = new Chat({
  messages: (chatStore.sessions.find(s => s.id === props.sessionId)?.messages || []) as UIMessage[]
});

// 状态判断：基于 6.x 的 status 字段
const isWorking = computed(() => chat.status !== 'ready');

const input = ref("");
const scrollContainer = ref<any>(null);

const handleSend = async () => {
  const text = input.value.trim();
  if (!text || isWorking.value) return;
  // 如果是当前会话的第一条消息，更新 Store 里的标题
  if (chat.messages.length === 0) {
    chatStore.updateTitleFromMessage(chatStore.currentSessionId, input.value);
  }
  try {
    input.value = "";
    await chat.sendMessage(
      { text },
      { body: { mode: props.mode } } );
  } catch (e) {
    // 发送失败，还原消息
    input.value = text;
    console.error("AI 发送异常:", e);
  }
};

watch(
  () => chat.messages, 
  () => {
    nextTick(() => {
      const container = scrollContainer.value?.$el?.querySelector('.el-scrollbar__wrap');
      if (container) {
        container.scrollTo({
          top: container.scrollHeight,
          behavior: 'smooth'
        });
      }
    });
  }, 
  { deep: true }
);

// 核心同步逻辑：监听消息变化
watch(
  () => chat.messages, 
  (newVal) => {
    if (newVal && newVal.length > 0) {
      // 1. 同步消息数组到本地存储
      chatStore.updateSessionMessages(props.sessionId, newVal);
      
      // 2. 如果是第一条用户消息，尝试更新标题
      const firstUserMsg = newVal.find(m => m.role === 'user');
      if (firstUserMsg) {
        chatStore.updateTitleFromMessage(props.sessionId, firstUserMsg.parts);
      }
    }
  }, 
  { deep: true }
);

const clearChat = () => { 
  chat.messages = [];
};

const md = new MarkdownIt({
  html: true,    // 允许 HTML 标签，这样才能渲染 del/ins
  linkify: true,
  breaks: true
})

const renderMarkdown = (content: string) => {
  return md.render(content)
}


const getMessageText = (m: any) => {
  if (!m) return '';
  // 优先处理 parts 数组
  if (Array.isArray(m.parts)) {
    return m.parts.map(p => typeof p === 'string' ? p : p.text || '').join('');
  }
  return m.content || '';
};

const getCleanText = (text: string) => {
  if (!text) return '';

  // 1. 先把可能存在的转义字符还原回来，确保正则能匹配到标签
  let decoded = text
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"');

  // 2. 执行清洗：删除 <del> 内容，保留 <ins> 内容
  let clean = decoded
    .replace(/<del>([\s\S]*?)<\/del>/g, '')  // 移除删除线内容
    .replace(/<ins>([\s\S]*?)<\/ins>/g, '$1') // 提取新增内容
    .replace(/<[^>]*>?/gm, '');              // 过滤掉所有残余标签

  // 3. 移除 Markdown 的加粗、斜体符号（可选，让粘贴出的文字更纯净）
  clean = clean.replace(/[*_~`#]/g, '');

  return clean.trim();
};

// 一键复制功能
const handleCopy = async (text: string, mode: string) => {
  const rawText = getMessageText(text);
  console.log(rawText, getCleanText(rawText))

  const final = mode === 'polish' ? getCleanText(rawText): rawText;
  if (!final) {
    ElMessage.warning('内容尚未生成完毕');
    return;
  }
  try {
    await navigator.clipboard.writeText(final);
    ElMessage({
      message: mode === 'polish' ? '已复制润色后的纯净版本': '已复制翻译结果',
      type: 'success',
      plain: true,
    });
  } catch (err) {
    ElMessage.error('复制失败，请手动选择');
  }
};

onMounted(() => {
  if (!chatStore.currentSessionId) {
    chatStore.createNewSession(props.mode);
  } else {
    // 如果有，加载历史消息到 Chat 实例（取决于你 SDK 的加载方式）
    const current = chatStore.sessions.find(s => s.id === chatStore.currentSessionId);
    if (current) {
        // 这里的逻辑根据你具体的 Chat 实例初始化方式调整
        // chat.setMessages(current.messages);
    }
  }
});
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

:deep(.markdown-body) {
  word-break: break-word;
  font-size: 14px;
  line-height: 1.6;
}
:deep(.markdown-body :not(:first-child p)) {
  margin-top: 8px;
}
:deep(.markdown-body code) {
  background-color: #f1f5f9;
  padding: 2px 4px;
  border-radius: 4px;
  font-family: monospace;
}
:deep(.markdown-body ul) {
  padding-left: 20px;
  list-style-type: disc;
}

/* 润色模式下的差异显示样式 */

/* 删除的内容：红色背景，带删除线 */
:deep(del) {
  background-color: #fee2e2; /* 浅红色 */
  color: #b91c1c;           /* 深红色文字 */
  text-decoration: line-through;
  padding: 0 2px;
  border-radius: 2px;
  margin: 0 1px;
}

/* 新增的内容：绿色背景，下划线或加粗 */
:deep(ins) {
  background-color: #dcfce7; /* 浅绿色 */
  color: #15803d;           /* 深绿色文字 */
  text-decoration: none;
  font-weight: 600;
  padding: 0 2px;
  border-radius: 2px;
  margin: 0 1px;
}

.msg-bubble {
  position: relative; /* 必须，为了让工具栏绝对定位 */
}

/* 工具栏容器 */
.bubble-actions {
  position: absolute;
  top: 4px;
  right: 12px;
  opacity: 0;
  transform: translateY(4px);
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  background-color: rgba(255, 255, 255, 0.9);
  border-radius: 6px;
  padding: 2px 4px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  backdrop-filter: blur(4px);
  z-index: 10;
}

/* 鼠标悬停气泡时显示工具栏 */
.msg-bubble:hover .bubble-actions {
  opacity: 1;
  transform: translateY(0);
}

/* 修正 Markdown 渲染后的 p 标签边距
:deep(.markdown-body p:first-child) {
  margin-top: 0;
} */

.action-btn {
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #64748b;
  cursor: pointer;
  box-shadow: 0 2px 4px rgba(0,0,0,0.05);
  transition: all 0.2s;
}
.action-btn:hover {
  color: #4f46e5;
  border-color: #c7d2fe;
  background-color: #f8fafc;
}
</style>