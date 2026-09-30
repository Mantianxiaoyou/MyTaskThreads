<script setup>
import { ref, computed, watch } from 'vue'
import { useTaskStore } from '../stores/taskStore'
import { isoToLocal, localToIso } from '../utils/time'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  taskId: { type: String, default: null }
})
const emit = defineEmits(['update:modelValue', 'saved'])

const taskStore = useTaskStore()
const show = computed({
  get: () => props.modelValue,
  set: (v) => emit('update:modelValue', v)
})

const form = ref({
  title: '',
  description: '',
  category: '',
  tags: [],
  priority: 'medium',
  status: 'pending',
  progress: 0,
  plannedStart: '',
  dueTime: ''
})

const newTag = ref('')

watch(show, async (v) => {
  if (!v) return
  await taskStore.init()
  if (props.taskId) {
    const t = taskStore.tasks.find(x => x.id === props.taskId)
    if (t) {
      form.value = {
        title: t.title || '',
        description: t.description || '',
        category: t.category || taskStore.categories[0] || '',
        tags: [...(t.tags || [])],
        priority: t.priority || 'medium',
        status: t.status || 'pending',
        progress: t.progress || 0,
        plannedStart: isoToLocal(t.plannedStart),
        dueTime: isoToLocal(t.dueTime)
      }
    }
  } else {
    form.value = {
      title: '',
      description: '',
      category: taskStore.categories[0] || '',
      tags: [],
      priority: 'medium',
      status: 'pending',
      progress: 0,
      plannedStart: '',
      dueTime: ''
    }
  }
})

function addTag () {
  const t = newTag.value.trim()
  if (t && !form.value.tags.includes(t)) {
    form.value.tags.push(t)
    taskStore.addTag(t)
  }
  newTag.value = ''
}
function removeTag (t) {
  const i = form.value.tags.indexOf(t)
  if (i >= 0) form.value.tags.splice(i, 1)
}

const saving = ref(false)
const errMsg = ref('')

async function save () {
  // 标题必填校验
  const title = form.value.title.trim()
  if (!title) {
    errMsg.value = '请输入任务标题'
    return
  }
  errMsg.value = ''
  // 防止重复点击
  if (saving.value) return
  saving.value = true
  try {
    const payload = {
      title,
      description: form.value.description,
      category: form.value.category,
      tags: [...form.value.tags],
      priority: form.value.priority,
      status: form.value.status,
      progress: form.value.progress,
      plannedStart: localToIso(form.value.plannedStart),
      dueTime: localToIso(form.value.dueTime)
    }
    if (props.taskId) {
      await taskStore.update(props.taskId, payload)
    } else {
      await taskStore.create(payload)
    }
    show.value = false
    emit('saved')
  } catch (e) {
    errMsg.value = '保存失败：' + (e?.message || e)
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <transition name="slide">
    <div v-if="show" class="editor-overlay" @click.self="show = false">
      <div class="editor-panel">
        <div class="editor-header">
          <span>{{ taskId ? '编辑任务' : '新建任务' }}</span>
          <button class="close" @click="show = false">×</button>
        </div>
        <div class="editor-body">
          <label>标题</label>
          <input v-model="form.title" placeholder="任务标题" autofocus />

          <label>描述</label>
          <textarea v-model="form.description" rows="3" placeholder="可选描述"></textarea>

          <div class="row">
            <div class="col">
              <label>分类</label>
              <select v-model="form.category">
                <option v-for="c in taskStore.categories" :key="c" :value="c">{{ c }}</option>
              </select>
            </div>
            <div class="col">
              <label>优先级</label>
              <select v-model="form.priority">
                <option value="high">高</option>
                <option value="medium">中</option>
                <option value="low">低</option>
              </select>
            </div>
          </div>

          <div class="row">
            <div class="col">
              <label>计划开始</label>
              <input type="datetime-local" v-model="form.plannedStart" />
            </div>
            <div class="col">
              <label>截止时间</label>
              <input type="datetime-local" v-model="form.dueTime" />
            </div>
          </div>

          <label>标签</label>
          <div class="tags-input">
            <span v-for="t in form.tags" :key="t" class="tag">
              {{ t }}
              <span class="remove" @click="removeTag(t)">×</span>
            </span>
            <input
              v-model="newTag"
              placeholder="输入标签后回车"
              @keydown.enter.prevent="addTag"
            />
          </div>

          <label>进度：{{ form.progress }}%</label>
          <input type="range" min="0" max="100" v-model.number="form.progress" />
        </div>
        <div class="editor-footer">
          <div v-if="errMsg" class="err">{{ errMsg }}</div>
          <button @click="show = false" :disabled="saving">取消</button>
          <button class="primary" @click="save" :disabled="saving">{{ saving ? '保存中…' : '保存' }}</button>
        </div>
      </div>
    </div>
  </transition>
</template>

<style scoped>
.editor-overlay {
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(0, 0, 0, 0.3);
  display: flex;
  justify-content: flex-end;
  z-index: 100;
}
.editor-panel {
  width: 380px;
  height: 100%;
  background: var(--bg);
  display: flex;
  flex-direction: column;
  box-shadow: -2px 0 8px rgba(0, 0, 0, 0.1);
}
.editor-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 14px 18px;
  border-bottom: 1px solid var(--border);
  font-weight: 600;
}
.close {
  background: transparent;
  font-size: 20px;
  padding: 0 6px;
}
.editor-body {
  flex: 1;
  overflow-y: auto;
  padding: 14px 18px;
  display: flex;
  flex-direction: column;
}
.editor-body label {
  font-size: 12px;
  color: var(--fg-soft);
  margin: 8px 0 4px;
}
.editor-body input,
.editor-body textarea,
.editor-body select {
  width: 100%;
}
.row {
  display: flex;
  gap: 10px;
}
.col {
  flex: 1;
  display: flex;
  flex-direction: column;
}
.tags-input {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  align-items: center;
  padding: 4px;
  border: 1px solid var(--border);
  border-radius: 6px;
  background: var(--bg-soft);
}
.tags-input input {
  flex: 1;
  min-width: 100px;
  border: none;
  background: transparent;
}
.tag .remove {
  margin-left: 4px;
  cursor: pointer;
  opacity: 0.6;
}
.editor-footer {
  padding: 12px 18px;
  border-top: 1px solid var(--border);
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}
.slide-enter-active, .slide-leave-active {
  transition: opacity 0.2s;
}
.slide-enter-active .editor-panel,
.slide-leave-active .editor-panel {
  transition: transform 0.2s;
}
.slide-enter-from .editor-panel,
.slide-leave-to .editor-panel {
  transform: translateX(100%);
}
.err {
  color: var(--danger);
  font-size: 12px;
  margin-right: auto;
}
</style>
