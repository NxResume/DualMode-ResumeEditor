<script setup lang="ts">
import { defaultKeymap } from '@codemirror/commands'
import { markdown } from '@codemirror/lang-markdown'
import { EditorState } from '@codemirror/state'
import { EditorView, keymap } from '@codemirror/view'

const props = defineProps<{
  modelValue: string
  mode: 'source' | 'mixed'
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void
}>()

const editorRef = ref<HTMLElement>()
let view: EditorView

onMounted(() => {
  if (!editorRef.value)
    return

  const state = EditorState.create({
    doc: props.modelValue,
    extensions: [
      keymap.of(defaultKeymap as any),
      markdown(),
      EditorView.lineWrapping,
      EditorView.updateListener.of((update) => {
        if (update.docChanged) {
          emit('update:modelValue', update.state.doc.toString())
        }
      }),
    ],
  })

  view = new EditorView({
    state,
    parent: editorRef.value,
  })
})

watch(() => props.modelValue, (newValue) => {
  if (view && newValue !== view.state.doc.toString()) {
    view.dispatch({
      changes: {
        from: 0,
        to: view.state.doc.length,
        insert: newValue,
      },
    })
  }
})

onUnmounted(() => {
  view?.destroy()
})
</script>

<template>
  <div ref="editorRef" class="h-full" />
</template>
