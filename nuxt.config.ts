// https://nuxt.com/docs/api/configuration/nuxt-config
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
  vite: {
    optimizeDeps: {
      include: [
        'dayjs/plugin/*.js',
        'lucide-vue-next',
      ]
    }
  }
})