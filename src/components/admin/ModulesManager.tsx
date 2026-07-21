'use client'

import { useState, useTransition } from 'react'
import {
  DndContext,
  DragOverlay,
  closestCorners,
  PointerSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragOverEvent,
  type DragEndEvent,
} from '@dnd-kit/core'
import { SortableContext, useSortable, verticalListSortingStrategy, arrayMove } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import Link from 'next/link'
import { reorderModulesAndLessons } from '@/lib/actions/admin'
import { DeleteModuleButton } from '@/components/admin/DeleteModuleButton'
import { DeleteLessonButton } from '@/components/admin/DeleteLessonButton'
import { Module, Lesson } from '@/types'

type ModuleWithLessons = Module & { lessons: Lesson[] }

const moduleKey = (id: string) => `module:${id}`
const lessonKey = (id: string) => `lesson:${id}`

const lessonTypeIcon: Record<string, string> = {
  video: '▶',
  text: '📝',
  file: '📄',
  link: '🔗',
}

export function ModulesManager({ productId, initialModules }: { productId: string; initialModules: ModuleWithLessons[] }) {
  const [modules, setModules] = useState(initialModules)
  const [prevInitialModules, setPrevInitialModules] = useState(initialModules)
  const [activeId, setActiveId] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const [saved, setSaved] = useState(false)

  // Ressincroniza com o servidor depois de criar/editar/excluir módulo ou aula
  // (essas ações disparam revalidatePath, que atualiza os props desta página).
  // Ajustado durante o render (não em efeito) pra evitar um passo de render extra.
  if (initialModules !== prevInitialModules) {
    setPrevInitialModules(initialModules)
    setModules(initialModules)
  }

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }))

  function findModuleIndexOfLesson(lessonId: string) {
    return modules.findIndex(m => m.lessons.some(l => l.id === lessonId))
  }

  function persist(current: ModuleWithLessons[]) {
    const modulesPayload = current.map((m, i) => ({ id: m.id, sort_order: i }))
    const lessonsPayload = current.flatMap(m => m.lessons.map((l, i) => ({ id: l.id, module_id: m.id, sort_order: i })))
    startTransition(async () => {
      await reorderModulesAndLessons(productId, modulesPayload, lessonsPayload)
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    })
  }

  function handleDragStart(event: DragStartEvent) {
    setActiveId(event.active.id as string)
  }

  function handleDragOver(event: DragOverEvent) {
    const { active, over } = event
    if (!over) return
    const activeIdStr = active.id as string
    const overIdStr = over.id as string
    if (!activeIdStr.startsWith('lesson:')) return

    const activeLessonId = activeIdStr.slice('lesson:'.length)
    const sourceModIdx = findModuleIndexOfLesson(activeLessonId)
    if (sourceModIdx === -1) return

    let destModIdx = -1
    let destLessonIdx = -1

    if (overIdStr.startsWith('lesson:')) {
      const overLessonId = overIdStr.slice('lesson:'.length)
      destModIdx = findModuleIndexOfLesson(overLessonId)
      if (destModIdx === -1) return
      destLessonIdx = modules[destModIdx].lessons.findIndex(l => l.id === overLessonId)
    } else if (overIdStr.startsWith('module:')) {
      const overModuleId = overIdStr.slice('module:'.length)
      destModIdx = modules.findIndex(m => m.id === overModuleId)
      if (destModIdx === -1) return
      destLessonIdx = modules[destModIdx].lessons.length
    } else {
      return
    }

    if (sourceModIdx === destModIdx) return

    setModules(prev => {
      const next = prev.map(m => ({ ...m, lessons: [...m.lessons] }))
      const removeIdx = next[sourceModIdx].lessons.findIndex(l => l.id === activeLessonId)
      const [moved] = next[sourceModIdx].lessons.splice(removeIdx, 1)
      next[destModIdx].lessons.splice(destLessonIdx, 0, moved)
      return next
    })
  }

  function handleDragEnd(event: DragEndEvent) {
    setActiveId(null)
    const { active, over } = event
    if (!over) return
    const activeIdStr = active.id as string
    const overIdStr = over.id as string

    if (activeIdStr.startsWith('module:')) {
      const activeModuleId = activeIdStr.slice('module:'.length)
      if (!overIdStr.startsWith('module:')) return
      const overModuleId = overIdStr.slice('module:'.length)
      if (activeModuleId === overModuleId) return
      const oldIndex = modules.findIndex(m => m.id === activeModuleId)
      const newIndex = modules.findIndex(m => m.id === overModuleId)
      const next = arrayMove(modules, oldIndex, newIndex)
      setModules(next)
      persist(next)
      return
    }

    if (activeIdStr.startsWith('lesson:')) {
      const activeLessonId = activeIdStr.slice('lesson:'.length)
      const modIdx = findModuleIndexOfLesson(activeLessonId)
      if (modIdx === -1) { persist(modules); return }

      let next = modules
      if (overIdStr.startsWith('lesson:')) {
        const overLessonId = overIdStr.slice('lesson:'.length)
        const overModIdx = findModuleIndexOfLesson(overLessonId)
        if (overModIdx === modIdx) {
          const oldIndex = modules[modIdx].lessons.findIndex(l => l.id === activeLessonId)
          const newIndex = modules[modIdx].lessons.findIndex(l => l.id === overLessonId)
          next = modules.map((m, i) => (i === modIdx ? { ...m, lessons: arrayMove(m.lessons, oldIndex, newIndex) } : m))
          setModules(next)
        }
      }
      persist(next)
    }
  }

  const activeLesson = activeId?.startsWith('lesson:')
    ? modules.flatMap(m => m.lessons).find(l => l.id === activeId!.slice('lesson:'.length))
    : null
  const activeModule = activeId?.startsWith('module:')
    ? modules.find(m => m.id === activeId!.slice('module:'.length))
    : null

  if (modules.length === 0) {
    return (
      <div className="bg-card rounded-2xl border border-dashed border-gray-200 p-8 text-center text-gray-400">
        <p className="font-medium">Nenhum módulo criado.</p>
        <p className="text-sm mt-1">Crie módulos para organizar as aulas deste produto.</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <div className="h-4">
        {isPending && <p className="text-xs text-gray-400">Salvando ordem...</p>}
        {saved && !isPending && <p className="text-xs text-emerald-600">Ordem salva.</p>}
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <SortableContext items={modules.map(m => moduleKey(m.id))} strategy={verticalListSortingStrategy}>
          <div className="space-y-3">
            {modules.map(mod => (
              <SortableModule key={mod.id} mod={mod} productId={productId} />
            ))}
          </div>
        </SortableContext>

        <DragOverlay>
          {activeLesson && (
            <div className="bg-card border border-gray-200 rounded-lg px-3 py-2 text-sm shadow-lg">{activeLesson.title}</div>
          )}
          {activeModule && (
            <div className="bg-card border border-gray-200 rounded-2xl px-4 py-3 text-sm font-semibold shadow-lg">{activeModule.title}</div>
          )}
        </DragOverlay>
      </DndContext>
    </div>
  )
}

function SortableModule({ mod, productId }: { mod: ModuleWithLessons; productId: string }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: moduleKey(mod.id) })
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.4 : 1 }
  const lessons = [...mod.lessons].sort((a, b) => a.sort_order - b.sort_order)

  return (
    <div ref={setNodeRef} style={style} className="bg-card rounded-2xl border border-gray-100 overflow-hidden">
      <div className="flex items-center gap-3 px-5 py-4">
        <span {...attributes} {...listeners} className="cursor-grab text-gray-300 hover:text-gray-500 shrink-0 text-lg" title="Arrastar módulo">☰</span>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-gray-900 text-sm">{mod.title}</p>
          {mod.description && <p className="text-xs text-gray-400 mt-0.5">{mod.description}</p>}
        </div>
        <span className="text-xs text-gray-400 shrink-0">
          {lessons.length} aula{lessons.length !== 1 ? 's' : ''}
        </span>
        <Link
          href={`/admin/produtos/${productId}/modulos/${mod.id}`}
          className="text-xs font-medium px-3 py-1.5 rounded-lg border transition hover:bg-gray-50 shrink-0"
          style={{ borderColor: 'var(--brand)', color: 'var(--brand-text)' }}
        >
          Editar
        </Link>
        <DeleteModuleButton moduleId={mod.id} productId={productId} moduleTitle={mod.title} />
      </div>

      <SortableContext items={lessons.map(l => lessonKey(l.id))} strategy={verticalListSortingStrategy}>
        <div className="border-t border-gray-50 px-5 py-3 space-y-1 min-h-[2.5rem]">
          {lessons.length === 0 ? (
            <p className="text-xs text-gray-300 py-2">Arraste uma aula pra cá</p>
          ) : (
            lessons.map(lesson => <SortableLesson key={lesson.id} lesson={lesson} moduleId={mod.id} productId={productId} />)
          )}
          <Link
            href={`/admin/produtos/${productId}/modulos/${mod.id}/aulas/novo`}
            className="block text-xs text-center py-2 mt-2 rounded-lg border border-dashed border-gray-200 text-gray-400 hover:text-gray-600 hover:border-gray-300 transition"
          >
            + Adicionar aula
          </Link>
        </div>
      </SortableContext>
    </div>
  )
}

function SortableLesson({ lesson, moduleId, productId }: { lesson: Lesson; moduleId: string; productId: string }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: lessonKey(lesson.id) })
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.4 : 1 }

  return (
    <div ref={setNodeRef} style={style} className="flex items-center gap-3 py-1.5 px-2 rounded-lg hover:bg-gray-50">
      <span {...attributes} {...listeners} className="cursor-grab text-gray-300 hover:text-gray-500 shrink-0" title="Arrastar aula">☰</span>
      <span className="text-xs text-gray-400 shrink-0">{lessonTypeIcon[lesson.lesson_type]}</span>
      <span className="text-sm text-gray-700 flex-1 min-w-0 truncate">{lesson.title}</span>
      {!lesson.is_published && <span className="text-[10px] bg-gray-100 text-gray-400 px-1.5 py-0.5 rounded shrink-0">Rascunho</span>}
      <Link
        href={`/admin/produtos/${productId}/modulos/${moduleId}/aulas/${lesson.id}`}
        className="text-xs font-medium px-3 py-1.5 rounded-lg border transition hover:bg-gray-50 shrink-0"
        style={{ borderColor: 'var(--brand)', color: 'var(--brand-text)' }}
      >
        Editar
      </Link>
      <DeleteLessonButton lessonId={lesson.id} moduleId={moduleId} productId={productId} lessonTitle={lesson.title} />
    </div>
  )
}
