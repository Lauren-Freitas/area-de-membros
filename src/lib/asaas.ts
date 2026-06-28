const BASE_URL = 'https://www.asaas.com/api/v3'

async function asaasGet(path: string) {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { access_token: process.env.ASAAS_API_KEY! },
    cache: 'no-store',
  })
  if (!res.ok) throw new Error(`Asaas API ${path} → ${res.status}`)
  return res.json()
}

export async function getAsaasCustomer(customerId: string): Promise<{
  name: string
  email: string
  cpfCnpj: string | null
}> {
  return asaasGet(`/customers/${customerId}`)
}

export async function getAsaasPayment(paymentId: string): Promise<{
  id: string
  customer: string
  externalReference: string | null
  value: number
  status: string
}> {
  return asaasGet(`/payments/${paymentId}`)
}
