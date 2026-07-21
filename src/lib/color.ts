/** Utilitários pequenos de cor — sem dependência externa — pra derivar tons a partir de uma cor base. */

export function hexToHsl(hex: string): { h: number; s: number; l: number } {
  const clean = hex.replace('#', '')
  const r = parseInt(clean.slice(0, 2), 16) / 255
  const g = parseInt(clean.slice(2, 4), 16) / 255
  const b = parseInt(clean.slice(4, 6), 16) / 255
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  const l = (max + min) / 2
  let h = 0
  let s = 0
  const d = max - min
  if (d !== 0) {
    s = d / (1 - Math.abs(2 * l - 1))
    switch (max) {
      case r: h = ((g - b) / d) % 6; break
      case g: h = (b - r) / d + 2; break
      default: h = (r - g) / d + 4
    }
    h *= 60
    if (h < 0) h += 360
  }
  return { h, s: s * 100, l: l * 100 }
}

export function hslToHex(h: number, s: number, l: number): string {
  const sat = Math.max(0, Math.min(100, s)) / 100
  const light = Math.max(0, Math.min(100, l)) / 100
  const c = (1 - Math.abs(2 * light - 1)) * sat
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1))
  const m = light - c / 2
  let r = 0, g = 0, b = 0
  if (h < 60) { r = c; g = x; b = 0 }
  else if (h < 120) { r = x; g = c; b = 0 }
  else if (h < 180) { r = 0; g = c; b = x }
  else if (h < 240) { r = 0; g = x; b = c }
  else if (h < 300) { r = c; g = 0; b = x }
  else { r = x; g = 0; b = c }
  const toHex = (v: number) => Math.round((v + m) * 255).toString(16).padStart(2, '0')
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`
}

/** Reaplica a mesma matiz da cor base, com outra luminosidade e (opcionalmente) saturação escalada. */
export function withLightness(hex: string, lightness: number, saturationScale = 1): string {
  if (!/^#[0-9a-fA-F]{6}$/.test(hex)) return hex
  const { h, s } = hexToHsl(hex)
  return hslToHex(h, s * saturationScale, lightness)
}

export interface BrandTokens {
  bg: string
  border: string
  text: string
}

/** Deriva fundo-tint / borda-tint / texto-legível a partir da cor primária, um conjunto pra cada modo. */
export function deriveBrandTokens(primaryHex: string): { light: BrandTokens; dark: BrandTokens } {
  return {
    light: {
      bg: withLightness(primaryHex, 94, 0.65),
      border: withLightness(primaryHex, 78, 0.75),
      text: withLightness(primaryHex, 28, 1.15),
    },
    dark: {
      bg: withLightness(primaryHex, 10, 0.65),
      border: withLightness(primaryHex, 20, 0.6),
      text: withLightness(primaryHex, 80, 0.75),
    },
  }
}
