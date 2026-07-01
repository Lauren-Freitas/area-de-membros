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
  id: string
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

export interface AsaasPayment {
  id: string
  customer: string
  description: string | null
  billingType: string
  value: number
  status: string
  dueDate: string
  paymentDate: string | null
  invoiceUrl: string | null
  bankSlipUrl: string | null
  externalReference: string | null
}

export interface AsaasSubscription {
  id: string
  customer: string
  description: string | null
  billingType: string
  value: number
  status: string
  nextDueDate: string | null
  cycle: string
  externalReference: string | null
}

export async function getCustomerPayments(customerId: string): Promise<AsaasPayment[]> {
  try {
    const data = await asaasGet(`/payments?customer=${customerId}&limit=50&offset=0`)
    return data?.data ?? []
  } catch {
    return []
  }
}

export async function getCustomerSubscriptions(customerId: string): Promise<AsaasSubscription[]> {
  try {
    const data = await asaasGet(`/subscriptions?customer=${customerId}&limit=20&offset=0`)
    return data?.data ?? []
  } catch {
    return []
  }
}

export async function findCustomerByEmail(email: string): Promise<{ id: string; name: string } | null> {
  try {
    const data = await asaasGet(`/customers?email=${encodeURIComponent(email)}&limit=1`)
    return data?.data?.[0] ?? null
  } catch {
    return null
  }
}
