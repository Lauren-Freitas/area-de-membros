import { NextResponse } from 'next/server'

/**
 * Envelope de resposta único pra toda a API v1 — nunca mensagem de erro
 * solta, sempre {success, data} ou {success, error:{code, message}}. Um
 * código de erro é o que permite uma automação decidir programaticamente
 * o que fazer (retry, alertar, ignorar) em vez de fazer match de string.
 */
export type ApiErrorCode =
  | 'VALIDATION_ERROR'
  | 'UNAUTHORIZED'
  | 'MEMBER_NOT_FOUND'
  | 'PRODUCT_NOT_FOUND'
  | 'ACCESS_NOT_FOUND'
  | 'CERTIFICATE_NOT_FOUND'
  | 'INVITE_NOT_FOUND'
  | 'WEBHOOK_DELIVERY_FAILED'
  | 'INTERNAL_ERROR'

export function apiSuccess<T>(data: T, status = 200) {
  return NextResponse.json({ success: true, data }, { status })
}

export function apiError(code: ApiErrorCode, message: string, status: number) {
  return NextResponse.json({ success: false, error: { code, message } }, { status })
}

export const Errors = {
  unauthorized: () => apiError('UNAUTHORIZED', 'Chave de API ausente ou inválida.', 401),
  validation: (message: string) => apiError('VALIDATION_ERROR', message, 400),
  memberNotFound: () => apiError('MEMBER_NOT_FOUND', 'Membro não encontrado.', 404),
  productNotFound: () => apiError('PRODUCT_NOT_FOUND', 'Produto não encontrado.', 404),
  accessNotFound: () => apiError('ACCESS_NOT_FOUND', 'Acesso não encontrado.', 404),
  certificateNotFound: () => apiError('CERTIFICATE_NOT_FOUND', 'Certificado não encontrado.', 404),
  inviteNotFound: () => apiError('INVITE_NOT_FOUND', 'Convite não encontrado.', 404),
  internal: (message: string) => apiError('INTERNAL_ERROR', message, 500),
}
