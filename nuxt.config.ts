export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  runtimeConfig: {
    deepseekApiKey: process.env.DEEPSEEK_API_KEY,
  },
  modules: ['@element-plus/nuxt', '@nuxtjs/tailwindcss', '@vueuse/nuxt', '@pinia/nuxt', '@pinia-plugin-persistedstate/nuxt'],
  // 显式指定，确保插件正常初始化
  piniaPersistedstate: {
    storage: 'localStorage'
  },
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