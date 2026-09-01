'use client'

import { useActionState, useState } from 'react'
import { updateMemberPassword } from '@/lib/actions/member'
import { Input } from '@/components/Input'
import { Button } from '@/components/Button'

export function SenhaForm() {
  const [passwordState, passwordAction, passwordPending] = useActionState(updateMemberPassword, undefined)
  const [passwordFormKey, setPasswordFormKey] = useState(0)

  function handlePasswordCancel() {
    setPasswordFormKey(k => k + 1)
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-card rounded-2xl border border-gray-100 dark:border-[#1e2030] p-6">
        <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-1">Alteração de senha</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-5">
          Para alterar sua senha, informe a senha atual e depois a nova senha desejada.
        </p>

        <form key={passwordFormKey} action={passwordAction} className="space-y-4">
          {passwordState?.error && (
            <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800 text-sm text-red-700 dark:text-red-400">
              {passwordState.error}
            </div>
          )}
          {passwordState?.success && (
            <div className="p-3 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-100 dark:border-green-800 text-sm text-green-700 dark:text-green-400">
              Senha alterada com sucesso!
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Senha atual</label>
            <Input
              name="current_password"
              type="password"
              autoComplete="current-password"
              required
              placeholder="••••••••"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Nova senha</label>
              <Input
                name="new_password"
                type="password"
                autoComplete="new-password"
                required
                minLength={8}
                placeholder="Mínimo 8 caracteres"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Confirmar nova senha</label>
              <Input
                name="confirm_password"
                type="password"
                autoComplete="new-password"
                required
                minLength={8}
                placeholder="Repita a nova senha"
              />
            </div>
          </div>

          <div className="flex items-center gap-3 pt-1">
            <Button type="submit" disabled={passwordPending}>
              {passwordPending ? 'Alterando...' : 'Atualizar senha'}
            </Button>
            <Button type="button" variant="secondary" onClick={handlePasswordCancel}>
              Cancelar
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
