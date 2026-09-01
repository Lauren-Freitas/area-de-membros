import { Button } from '@/components/Button'
import { CompleteButton } from '@/components/CompleteButton'

interface Props {
  completed: boolean
  onComplete: () => Promise<unknown>
  onIncomplete: () => Promise<unknown>
  pendingLabel?: string
  doneLabel?: string
  prevHref?: string | null
  nextHref?: string | null
  /**
   * Quando não há próxima aula (fim do módulo) mas existe um curso pra
   * voltar, oferece essa continuação em vez de deixar a linha vazia ou um
   * botão "Próxima aula" sem destino. Omitir em conteúdo sem curso
   * (produto sem módulos) -- lá não existe pra onde "voltar".
   */
  courseFallbackHref?: string | null
}

/**
 * Bloco único de conclusão + continuidade (Etapa 7) -- a principal ação
 * pós-consumo, logo após o conteúdo, antes de comentários/avaliação.
 * Reaproveitado por /produto/[id] (conteúdo sem módulos) e
 * /produto/[id]/aula/[aulaId], pra não ter dois padrões pra mesma coisa.
 */
export function LessonCompletionActions({
  completed, onComplete, onIncomplete, pendingLabel, doneLabel, prevHref, nextHref, courseFallbackHref,
}: Props) {
  const showNav = Boolean(prevHref || nextHref || courseFallbackHref)

  return (
    <div className="flex flex-col gap-3">
      <CompleteButton
        completed={completed}
        onComplete={onComplete}
        onIncomplete={onIncomplete}
        pendingLabel={pendingLabel}
        doneLabel={doneLabel}
        fullWidth={!showNav}
      />

      {showNav && (
        <div className="flex items-center gap-2">
          {prevHref && (
            <Button href={prevHref} variant="secondary">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
              Anterior
            </Button>
          )}
          {nextHref ? (
            <Button href={nextHref} className="flex-1">
              Próxima aula
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </Button>
          ) : courseFallbackHref ? (
            <Button href={courseFallbackHref} className="flex-1">
              Voltar ao curso
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </Button>
          ) : null}
        </div>
      )}
    </div>
  )
}
