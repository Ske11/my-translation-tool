// createOpenAICompatible 专门为兼容 OpenAI 协议的第三方服务设计，会直接走 /v1/chat/completions，不会尝试 Responses API。
import { createOpenAICompatible } from '@ai-sdk/openai-compatible';
import { streamText, UIMessage, convertToModelMessages } from 'ai';

const SYSTEM_PROMPTS = {
    polish: "你是一个专业的文案润色专家。请优化用户输入的文本，使其表达更专业、自然、有吸引力，同时纠正语法和错别字。",
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

        const result = streamText({
            model: deepseek('deepseek-chat'), 
            system: systemPrompt,
            messages: await convertToModelMessages(messages),
        });
      
        return result.toUIMessageStreamResponse();
    } catch(e) {

    }
    
});