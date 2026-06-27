import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  // Implementado na Fase 5
  return NextResponse.json({ received: true })
}
