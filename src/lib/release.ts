import { ModuleReleaseType } from '@/types'

interface ComputeReleaseStateParams {
  releaseType: ModuleReleaseType
  releaseAfterDays: number | null
  releaseAt: string | null
  accessDurationDays?: number | null
  grantedAt: string | null
  now?: Date
}

interface ReleaseState {
  isReleased: boolean
  releaseDate: Date | null
  isExpired: boolean
}

/**
 * Calcula se um módulo/aula já está liberado pra um membro específico, e se
 * já expirou (quando há um limite de duração contado a partir da própria liberação).
 */
export function computeReleaseState({
  releaseType,
  releaseAfterDays,
  releaseAt,
  accessDurationDays,
  grantedAt,
  now = new Date(),
}: ComputeReleaseStateParams): ReleaseState {
  let releaseDate: Date | null

  if (releaseType === 'date') {
    releaseDate = releaseAt ? new Date(releaseAt) : null
  } else if (releaseType === 'days_after') {
    if (!grantedAt) {
      releaseDate = null
    } else {
      releaseDate = new Date(grantedAt)
      releaseDate.setDate(releaseDate.getDate() + (releaseAfterDays ?? 0))
    }
  } else {
    releaseDate = grantedAt ? new Date(grantedAt) : now
  }

  const isReleased = releaseDate != null && releaseDate.getTime() <= now.getTime()

  let isExpired = false
  if (isReleased && accessDurationDays != null && releaseDate) {
    const expiryDate = new Date(releaseDate)
    expiryDate.setDate(expiryDate.getDate() + accessDurationDays)
    isExpired = expiryDate.getTime() <= now.getTime()
  }

  return { isReleased, releaseDate, isExpired }
}
