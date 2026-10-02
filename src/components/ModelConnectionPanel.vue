<script setup>
import { useModelConnection } from '../useModelConnection'
import { MODEL_PRESETS } from '../model-presets'

const props = defineProps({
  transport: { type: Object, required: true },
  projectId: { type: [Number, String], default: undefined },
  initialValue: { type: Object, default: () => ({}) },
  title: { type: String, default: '模型接入' }
})
const emit = defineEmits(['saved', 'tested', 'error'])
const { config, state, selectedModel, modelOptions, thinkingOptions, tokenOptions, recommendedTokens, effectiveTokens, discover, saveAndTest } = useModelConnection(props)

async function refreshCatalog() {
  try { await discover() } catch (error) { emit('error', error) }
}
async function save() {
  try { const model = await saveAndTest(); emit('saved', model); emit('tested', model) } catch (error) { emit('error', error) }
}
</script>

<template>
  <section class="rml-panel" aria-label="模型接入配置">
    <header class="rml-heading"><div><span class="rml-kicker">MODEL CONNECTION</span><h2>{{ title }}</h2><p>配置服务后读取模型目录，并统一控制思考强度和输出预算。</p></div><span class="rml-status" :data-status="state.status">{{ state.status === 'pending' ? '处理中…' : state.status === 'success' ? '已连接' : state.status === 'error' ? '需要检查' : '未测试' }}</span></header>
    <div class="rml-grid">
      <label>模型名称<select v-model="config.modelName"><option v-for="item in MODEL_PRESETS" :key="item.name" :value="item.name">{{ item.name }}</option></select></label>
      <label>服务类型<select v-model="config.provider"><option value="openai_compatible">OpenAI 兼容</option><option value="mock">Mock 演示</option></select></label>
      <label class="rml-span-2">模型服务地址<input v-model="config.baseUrl" placeholder="https://api.deepseek.com" inputmode="url"></label>
      <label class="rml-span-2">访问密钥<input v-model="config.apiKey" type="password" placeholder="仅用于本次保存，建议由后端加密保存" autocomplete="off"></label>
      <label>模型标识<select v-model="config.modelId"><option v-for="item in modelOptions" :key="item.id" :value="item.id">{{ item.name }} · {{ item.id }}</option></select></label>
      <label>输出令牌上限<select v-model="config.tokenBudget"><option value="auto">自动推荐 · {{ recommendedTokens.toLocaleString() }}</option><option v-for="item in tokenOptions" :key="item.value" :value="String(item.value)">{{ item.label }}</option></select><small>当前生效：{{ effectiveTokens.toLocaleString() }}</small></label>
    </div>
    <div class="rml-thinking"><div class="rml-thinking-head"><label for="rml-thinking-range">思考模式</label><strong>{{ thinkingOptions.find((item) => item.id === config.thinking)?.label }}</strong></div><input id="rml-thinking-range" :value="thinkingOptions.findIndex((item) => item.id === config.thinking)" type="range" min="0" :max="Math.max(0, thinkingOptions.length - 1)" step="1" list="rml-thinking-ticks" @input="config.thinking = thinkingOptions[Number($event.target.value)]?.id || 'none'"><datalist id="rml-thinking-ticks"><option v-for="(item, index) in thinkingOptions" :key="item.id" :value="index" :label="item.label"></option></datalist><div class="rml-ticks"><span v-for="item in thinkingOptions" :key="item.id" :class="{active: item.id === config.thinking}">{{ item.label }}</span></div><p>{{ thinkingOptions.find((item) => item.id === config.thinking)?.hint }}</p></div>
    <footer class="rml-actions"><button type="button" class="rml-secondary" :disabled="state.status === 'pending'" @click="refreshCatalog">{{ state.status === 'pending' ? '读取中…' : '刷新可用模型' }}</button><button type="button" class="rml-primary" :disabled="state.status === 'pending'" @click="save">{{ state.status === 'pending' ? '保存中…' : '保存并测试连接' }}</button><span v-if="state.message" class="rml-message" :data-status="state.status" role="status">{{ state.message }}</span></footer>
  </section>
</template>
