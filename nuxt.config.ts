export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  runtimeConfig: {
    deepseekApiKey: process.env.DEEPSEEK_API_KEY,
  },
  modules: ['@element-plus/nuxt', '@nuxtjs/tailwindcss', '@vueuse/nuxt'],
  elementPlus: {
    importStyle: 'css',
  },
  build: {
    transpile: ['element-plus'],
  },
  vite: {
    optimizeDeps: {
      include: [
        'dayjs',
        'lucide-vue-next',
        '@ai-sdk/vue',
        'markdown-it',
      ],
    },
  },
})