'use server'
import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'

export async function saveAppearance(formData: FormData) {
  const adminClient = createAdminClient()
  const fields = ['platform_name', 'primary_color', 'welcome_message', 'support_whatsapp', 'support_email']

  for (const key of fields) {
    const value = (formData.get(key) as string).trim()
    await adminClient.from('site_config').upsert({ key, value }, { onConflict: 'key' })
  }

  revalidatePath('/')
  revalidatePath('/dashboard')
  revalidatePath('/admin/aparencia')
}
