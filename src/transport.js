export function createApiTransport({ basePath = '/api', fetchImpl = globalThis.fetch, getHeaders = () => ({}) } = {}) {
  if (!fetchImpl) throw new Error('需要提供 fetch 实现')
  const request = async (path, options = {}) => {
    const headers = options.body instanceof FormData ? {} : { 'Content-Type': 'application/json' }
    const response = await fetchImpl(`${basePath}${path}`, { ...options, headers: { ...headers, ...getHeaders() } })
    if (!response.ok) {
      const body = await response.json().catch(() => null)
      throw new Error(typeof body?.detail === 'string' ? body.detail : `请求失败（HTTP ${response.status}）`)
    }
    return response.json()
  }
  return {
    discover: ({ projectId, baseUrl, apiKey, provider }) => request('/models/discover', { method: 'POST', body: JSON.stringify({ project_id: projectId, base_url: baseUrl, api_key: apiKey, provider }) }),
    save: ({ projectId, ...payload }) => request('/models', { method: 'POST', body: JSON.stringify({ project_id: projectId, ...payload }) }),
    update: ({ id, ...payload }) => request(`/models/${id}`, { method: 'PUT', body: JSON.stringify(payload) }),
    health: ({ id }) => request(`/models/${id}/health`, { method: 'POST' })
  }
}
