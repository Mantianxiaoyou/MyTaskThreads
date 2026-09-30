import { ref } from 'vue'

// 任务列表拖动换位：由握把发起拖动，落到目标项的上半 / 下半表示插到它前面 / 后面。
// 状态留在调用方组件里：TaskCard 每个卡片一份；mini 小窗整个列表共用一份，用 id 区分。
export function useTaskDrag (reorder) {
  const draggingId = ref('')
  const overId = ref('')
  const overPos = ref('')

  function onDragStart (e, id) {
    draggingId.value = id
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', id)
    // 拖动时用的幽灵图：整张卡片 / 整行，而不是那个小握把
    const box = e.currentTarget.closest('[data-drag-item]')
    if (box) e.dataTransfer.setDragImage(box, 24, 16)
  }

  function onDragEnd () {
    draggingId.value = ''
    overId.value = ''
    overPos.value = ''
  }

  function onDragOver (e, id) {
    e.preventDefault()
    if (draggingId.value === id) return // 拖到自己身上不显示插入线
    e.dataTransfer.dropEffect = 'move'
    const rect = e.currentTarget.getBoundingClientRect()
    overId.value = id
    overPos.value = e.clientY < rect.top + rect.height / 2 ? 'before' : 'after'
  }

  function onDragLeave (id) {
    if (overId.value === id) {
      overId.value = ''
      overPos.value = ''
    }
  }

  function onDrop (e, id) {
    e.preventDefault()
    const fromId = e.dataTransfer.getData('text/plain') || draggingId.value
    const position = overPos.value || 'before'
    onDragEnd()
    if (!fromId || fromId === id) return
    reorder(fromId, id, position)
  }

  return { draggingId, overId, overPos, onDragStart, onDragEnd, onDragOver, onDragLeave, onDrop }
}
