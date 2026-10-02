<script setup>
import { ModelConnectionPanel, createApiTransport } from '@risklens/model-connection-kit'

const transport = createApiTransport({
  basePath: '/api',
  getHeaders: () => ({ Authorization: `Bearer ${localStorage.getItem('token') || ''}` })
})
function onSaved(model) { console.log('saved model', model) }
</script>

<template>
  <ModelConnectionPanel :transport="transport" :project-id="3" @saved="onSaved" />
</template>
