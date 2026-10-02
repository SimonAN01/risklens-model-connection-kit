export const PLATFORM_OUTPUT_LIMIT = 32768

export const THINKING_LEVELS = [
  { id: 'none', label: '关闭思考', hint: '直接生成代码，响应更快。' },
  { id: 'low', label: '轻度思考', hint: '适合简单代码任务，兼顾速度。' },
  { id: 'high', label: '标准思考', hint: '适合常规算法和代码分析任务。' },
  { id: 'max', label: '深度思考', hint: '适合复杂问题，耗时和令牌用量更高。' }
]

export const MODEL_PRESETS = [
  {
    name: 'DeepSeek',
    provider: 'openai_compatible',
    baseUrl: 'https://api.deepseek.com',
    models: [
      { id: 'deepseek-flash', name: 'DeepSeek-V4.1-Flash', maxOutputTokens: 32768, thinking: ['none', 'low', 'high', 'max'] },
      { id: 'deepseek-v4-pro', name: 'DeepSeek-V4-Pro', maxOutputTokens: 32768, thinking: ['none', 'low', 'high', 'max'] }
    ]
  },
  {
    name: '演示模型 · SecureCoder',
    provider: 'mock',
    baseUrl: '',
    models: [{ id: 'securecoder-demo', name: 'SecureCoder', maxOutputTokens: 8192, thinking: ['none', 'low'] }]
  },
  {
    name: '演示模型 · OpenCoder',
    provider: 'mock',
    baseUrl: '',
    models: [{ id: 'opencoder-demo', name: 'OpenCoder', maxOutputTokens: 8192, thinking: ['none', 'low'] }]
  }
]

export const TOKEN_PRESETS = [
  { value: 1024, label: '1,024 · 简短函数' },
  { value: 2048, label: '2,048 · 简单代码任务' },
  { value: 4096, label: '4,096 · 常规函数与算法' },
  { value: 8192, label: '8,192 · 常规代码评估' },
  { value: 16384, label: '16,384 · 标准思考与复杂代码' },
  { value: 32768, label: '32,768 · 深度思考与长代码' }
]

export function availableTokenPresets(modelLimit) {
  const limit = Number.isInteger(modelLimit) && modelLimit > 0
    ? Math.min(modelLimit, PLATFORM_OUTPUT_LIMIT)
    : PLATFORM_OUTPUT_LIMIT
  const options = TOKEN_PRESETS.filter((item) => item.value <= limit)
  return options.length ? options : [{ value: limit, label: `${limit.toLocaleString('en-US')} · 当前模型上限` }]
}

export function recommendedTokenBudget(level, modelLimit) {
  const target = level === 'max' ? 32768 : level === 'high' ? 16384 : 8192
  const options = availableTokenPresets(modelLimit)
  return options.filter((item) => item.value <= target).at(-1)?.value ?? options[0].value
}

export function resolveTokenBudget(selection, level, modelLimit) {
  const options = availableTokenPresets(modelLimit)
  return selection !== 'auto' && options.some((item) => item.value === Number(selection))
    ? Number(selection)
    : recommendedTokenBudget(level, modelLimit)
}

export function normalizeCatalog(items = []) {
  return items.map((item) => ({
    id: item.id || item.model_name,
    name: item.name || item.id || item.model_name,
    maxOutputTokens: item.max_output_tokens || item.maxOutputTokens || PLATFORM_OUTPUT_LIMIT,
    thinking: item.effort?.supported_levels || item.thinking || ['none', 'low', 'high', 'max']
  })).filter((item) => item.id)
}
