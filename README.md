# `@risklens/model-connection-kit`

可复用的 Vue 3 模型接入组件和逻辑，抽取自 RiskLens 代码模型安全评估平台。它把模型服务配置、服务端模型目录、模型标识、思考模式、输出令牌档位、连接测试和保存状态统一成一个可复用模块。

## 能做什么

- 下拉选择模型名称：DeepSeek、演示模型 SecureCoder、演示模型 OpenCoder；
- 读取 OpenAI 兼容服务的 `/models` 目录，并将模型标识放入下拉框；
- 使用滑杆选择关闭、轻度、标准、深度思考；
- 根据思考强度和模型上限推荐输出令牌，并提供固定档位；
- 保存配置后执行真实连接测试，给出处理中、成功、失败状态；
- 通过 transport 适配器接入任意后端，不在组件内强制暴露 API 密钥；
- 组件自带响应式布局和可访问标签，桌面和手机均可使用。

## 安装

```bash
npm install @risklens/model-connection-kit vue
```

## 使用

```vue
<script setup>
import { ModelConnectionPanel, createApiTransport } from '@risklens/model-connection-kit'
import '@risklens/model-connection-kit/style.css'

const transport = createApiTransport({
  basePath: '/api',
  getHeaders: () => ({
    Authorization: `Bearer ${localStorage.getItem('token') || ''}`
  })
})
</script>

<template>
  <ModelConnectionPanel
    :transport="transport"
    :project-id="3"
    @saved="model => console.log('saved', model)"
  />
</template>
```

## 后端适配协议

组件不会直接把密钥写入浏览器存储。传入的 `transport` 至少实现以下方法：

```js
{
  discover({ projectId, baseUrl, apiKey, provider }) => Promise<{ models: Array }> ,
  save({ projectId, name, provider, base_url, model_name, api_key, options }) => Promise<Model>,
  health({ id }) => Promise<{ ok: boolean, model?: string }>
}
```

`createApiTransport()` 已适配 RiskLens 当前接口：

- `POST /api/models/discover`
- `POST /api/models`
- `PUT /api/models/:id`（更新已有模型）
- `POST /api/models/:id/health`

生产环境建议由后端加密保存密钥，前端只在本次保存时提交，不要把密钥写进 localStorage、URL、日志或 Git 仓库。

## 模型与思考模式

内置默认选项：

| 模型名称 | 模型标识 |
| --- | --- |
| DeepSeek | `deepseek-flash`、`deepseek-v4-pro` |
| 演示模型 · SecureCoder | `securecoder-demo` |
| 演示模型 · OpenCoder | `opencoder-demo` |

组件会优先使用后端返回的模型目录；目录不可用时回退到内置演示选项。模型返回自己的最大输出令牌上限后，令牌下拉选项会自动裁剪到平台上限 32,768。

## 本地开发

```bash
npm install
npm run check
npm run build
```

## 许可证

MIT
