/** "há X min/h/dias" — tempo relativo pro lado do membro (registro de atividade do admin tem o seu próprio, em @/lib/activity-labels, com redação mais terça). */
export function timeAgo(date: string): string {
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000)
  if (seconds < 60) return 'agora mesmo'
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `há ${minutes} min`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `há ${hours}h`
  const days = Math.floor(hours / 24)
  if (days < 30) return `há ${days} dia${days > 1 ? 's' : ''}`
  const months = Math.floor(days / 30)
  return `há ${months} ${months > 1 ? 'meses' : 'mês'}`
}
