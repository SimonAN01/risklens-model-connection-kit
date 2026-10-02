import { computed, ref, watch } from 'vue'
import { availableTokenPresets, MODEL_PRESETS, normalizeCatalog, recommendedTokenBudget, resolveTokenBudget, THINKING_LEVELS } from './model-presets'

function presetFor(name) {
  return MODEL_PRESETS.find((item) => item.name === name) || MODEL_PRESETS[0]
}

export function useModelConnection({ transport, projectId, initialValue = {} } = {}) {
  const preset = presetFor(initialValue.modelName || 'DeepSeek')
  const config = ref({
    modelName: initialValue.modelName || preset.name,
    provider: initialValue.provider || preset.provider,
    baseUrl: initialValue.baseUrl ?? preset.baseUrl,
    apiKey: initialValue.apiKey || '',
    modelId: initialValue.modelId || preset.models[0].id,
    thinking: initialValue.thinking || 'high',
    tokenBudget: initialValue.tokenBudget || 'auto'
  })
  const catalog = ref([])
  const state = ref({ status: 'idle', message: '' })
  const savedModel = ref(null)

  const selectedPreset = computed(() => presetFor(config.value.modelName))
  const modelOptions = computed(() => catalog.value.length ? catalog.value : selectedPreset.value.models)
  const selectedModel = computed(() => modelOptions.value.find((item) => item.id === config.value.modelId) || modelOptions.value[0])
  const thinkingOptions = computed(() => {
    const supported = selectedModel.value?.thinking || ['none', 'low', 'high', 'max']
    return THINKING_LEVELS.filter((item) => supported.includes(item.id))
  })
  const tokenOptions = computed(() => availableTokenPresets(selectedModel.value?.maxOutputTokens))
  const recommendedTokens = computed(() => recommendedTokenBudget(config.value.thinking, selectedModel.value?.maxOutputTokens))
  const effectiveTokens = computed(() => resolveTokenBudget(config.value.tokenBudget, config.value.thinking, selectedModel.value?.maxOutputTokens))
  const isDeepSeek = computed(() => config.value.provider === 'openai_compatible' && /(^|\.)api\.deepseek\.com$/i.test(new URL(config.value.baseUrl || 'https://api.deepseek.com').hostname))

  watch(() => config.value.modelName, (name) => {
    const next = presetFor(name)
    config.value.provider = next.provider
    config.value.baseUrl = next.baseUrl
    if (!modelOptions.value.some((item) => item.id === config.value.modelId)) config.value.modelId = next.models[0].id
  })
  watch(() => selectedModel.value?.id, () => {
    if (!thinkingOptions.value.some((item) => item.id === config.value.thinking)) config.value.thinking = thinkingOptions.value.at(-1)?.id || 'none'
    if (config.value.tokenBudget !== 'auto' && !tokenOptions.value.some((item) => item.value === Number(config.value.tokenBudget))) config.value.tokenBudget = 'auto'
  })

  function payload() {
    return {
      name: config.value.modelName,
      provider: config.value.provider,
      base_url: config.value.baseUrl,
      model_name: config.value.modelId,
      api_key: config.value.apiKey,
      options: {
        temperature: 0,
        max_tokens: effectiveTokens.value,
        thinking: config.value.thinking === 'none' ? 'disabled' : 'enabled',
        reasoning_effort: config.value.thinking,
        timeout: 180,
        retries: 2
      }
    }
  }
  async function discover() {
    if (!transport?.discover) throw new Error('未配置 discover transport')
    state.value = { status: 'pending', message: '正在读取模型目录…' }
    try {
      const result = await transport.discover({ projectId, baseUrl: config.value.baseUrl, apiKey: config.value.apiKey, provider: config.value.provider })
      catalog.value = normalizeCatalog(result.models || result)
      if (catalog.value.length && !catalog.value.some((item) => item.id === config.value.modelId)) config.value.modelId = catalog.value[0].id
      state.value = { status: 'success', message: `已读取 ${catalog.value.length} 个模型` }
      return catalog.value
    } catch (error) {
      state.value = { status: 'error', message: error.message }
      throw error
    }
  }
  async function test(model = savedModel.value) {
    if (!transport?.health) throw new Error('未配置 health transport')
    if (!model?.id) throw new Error('请先保存模型配置')
    state.value = { status: 'pending', message: '正在测试连接…' }
    try {
      const result = await transport.health({ id: model.id })
      if (result?.ok === false) throw new Error(result.message || '模型服务未通过连接检查')
      state.value = { status: 'success', message: `连接成功：${result.model || config.value.modelId}` }
      return result
    } catch (error) {
      state.value = { status: 'error', message: `连接失败：${error.message}` }
      throw error
    }
  }
  async function saveAndTest() {
    if (!transport?.save) throw new Error('未配置 save transport')
    state.value = { status: 'pending', message: '正在保存配置…' }
    try {
      const existing = savedModel.value
      const result = existing?.id && transport.update
        ? await transport.update({ id: existing.id, ...payload() })
        : await transport.save({ projectId, ...payload() })
      savedModel.value = result
      config.value.apiKey = ''
      await test(result)
      return result
    } catch (error) {
      state.value = { status: 'error', message: error.message }
      throw error
    }
  }
  return { config, catalog, state, savedModel, selectedModel, modelOptions, thinkingOptions, tokenOptions, recommendedTokens, effectiveTokens, isDeepSeek, payload, discover, test, saveAndTest }
}
