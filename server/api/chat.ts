// createOpenAICompatible 专门为兼容 OpenAI 协议的第三方服务设计，会直接走 /v1/chat/completions，不会尝试 Responses API。
import { createOpenAICompatible } from '@ai-sdk/openai-compatible';
import { streamText, UIMessage, convertToModelMessages } from 'ai';

const SYSTEM_PROMPTS = {
    // 润色功能增强，配合前端样式展示新增/修改/删除了哪些
    polish: `你是一个专业的文案润色专家。请优化用户输入的文本，使其表达更专业、自然、有吸引力，同时纠正语法和错别字。在修改过程中遵循以下规则：
        1. 对用户输入的文本进行专业润色。
        2. **必须**使用以下标记显示修改：
        - 使用 <del>被删掉的词</del> 标记删除或替换的内容。
        - 使用 <ins>新增的词</ins> 标记新添加的内容。
        3. 如果修改较多，请在修改后的文本下方增加一个【修改说明】板块。
        4. 保持段落结构不变。`,
    translate: "你是一个精通多国语言的专业翻译官。请将用户输入的文本准确、优雅地翻译成目标语言（默认中英互译）。",
    general: "你是一个全能的 AI 智能助手，请用专业、友好的语气回答用户的问题。"
  };

export default defineEventHandler(async (event) => {
    
    try {
        const { messages, mode = 'general' } = await readBody(event);
        
        // 根据 mode 获取对应的提示词，如果 mode 不存在则使用 general
        const systemPrompt = SYSTEM_PROMPTS[mode as keyof typeof SYSTEM_PROMPTS] || SYSTEM_PROMPTS.general;

        console.log(`[AI Request] Mode: ${mode}`);

        const config = useRuntimeConfig(event);
        const deepseek = createOpenAICompatible({
            name: 'deepseek',
            apiKey: config.deepseekApiKey || process.env.DEEPSEEK_API_KEY,
            baseURL: 'https://api.deepseek.com/v1',
        });

        // 在调用 streamText 之前处理消息
        const allMessages = await convertToModelMessages(messages);

        // 只取最近的 10 条对话记录作为上下文，加上当前的 System Prompt
        const contextMessages = allMessages.slice(-10);

        const result = streamText({
            model: deepseek('deepseek-chat'), 
            system: systemPrompt,
            messages: contextMessages
        });
      
        return result.toUIMessageStreamResponse();
    } catch(e) {

    }
    
});