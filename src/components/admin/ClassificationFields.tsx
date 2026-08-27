'use client'

import { useState } from 'react'
import { Select } from '@/components/Select'
import { Territory, SkillTrack, ContentFormat } from '@/types'

const MAX_SKILL_TRACKS = 2

interface Props {
  territories: Territory[]
  skillTracks: SkillTrack[]
  contentFormats: ContentFormat[]
  defaultTerritoryId?: string | null
  defaultContentFormatId?: string | null
  defaultSkillTrackIds?: string[]
  hint?: string
}

/**
 * Território, tipo de conteúdo e trilhas — classificação editorial, separada
 * do mecanismo de renderização (lesson_type/content_type não são tocados
 * aqui). Reaproveitada por AulaForm e ProductForm (produto avulso).
 */
export function ClassificationFields({
  territories,
  skillTracks,
  contentFormats,
  defaultTerritoryId,
  defaultContentFormatId,
  defaultSkillTrackIds = [],
  hint,
}: Props) {
  const [selectedTracks, setSelectedTracks] = useState<string[]>(defaultSkillTrackIds)

  function toggleTrack(id: string) {
    setSelectedTracks(prev => {
      if (prev.includes(id)) return prev.filter(x => x !== id)
      if (prev.length >= MAX_SKILL_TRACKS) return prev
      return [...prev, id]
    })
  }

  return (
    <div className="space-y-4 p-4 rounded-xl border border-dashed border-gray-200 dark:border-[#2a2f45]">
      <div>
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Classificação</p>
        {hint && <p className="text-xs text-gray-400 mt-0.5">{hint}</p>}
      </div>

      <div className="flex flex-wrap gap-4">
        <div className="flex-1 min-w-[180px]">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Território <span className="text-gray-400 font-normal text-xs">(opcional)</span>
          </label>
          <Select name="territory_id" defaultValue={defaultTerritoryId ?? ''}>
            <option value="">Nenhum</option>
            {territories.map(t => (
              <option key={t.id} value={t.id}>{t.title}</option>
            ))}
          </Select>
        </div>

        <div className="flex-1 min-w-[180px]">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Tipo de conteúdo <span className="text-gray-400 font-normal text-xs">(opcional)</span>
          </label>
          <Select name="content_format_id" defaultValue={defaultContentFormatId ?? ''}>
            <option value="">Nenhum</option>
            {contentFormats.map(f => (
              <option key={f.id} value={f.id}>{f.title}</option>
            ))}
          </Select>
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label className="block text-sm font-medium text-gray-700">
            Trilhas de habilidade <span className="text-gray-400 font-normal text-xs">(até {MAX_SKILL_TRACKS})</span>
          </label>
          <span className="text-xs text-gray-400">{selectedTracks.length}/{MAX_SKILL_TRACKS} selecionadas</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {skillTracks.map(track => {
            const checked = selectedTracks.includes(track.id)
            const disabled = !checked && selectedTracks.length >= MAX_SKILL_TRACKS
            return (
              <label
                key={track.id}
                className={`px-3 py-1.5 rounded-full border text-sm transition select-none ${
                  checked
                    ? 'bg-brand-bg border-brand-border text-brand-text cursor-pointer'
                    : disabled
                      ? 'border-gray-100 dark:border-[#232945] text-gray-300 dark:text-gray-600 cursor-not-allowed'
                      : 'border-gray-200 dark:border-[#2a2f45] text-gray-600 dark:text-gray-300 hover:border-gray-300 dark:hover:border-[#374151] cursor-pointer'
                }`}
              >
                <input
                  type="checkbox"
                  name="skill_track_ids"
                  value={track.id}
                  checked={checked}
                  disabled={disabled}
                  onChange={() => toggleTrack(track.id)}
                  className="sr-only"
                />
                {track.title}
              </label>
            )
          })}
        </div>
      </div>
    </div>
  )
}
