import { createAdminClient } from '@/lib/supabase/admin'
import { deleteCertificate } from '@/lib/actions/admin'

export default async function CertificadosAdminPage() {
  const adminClient = createAdminClient()
  const { data: certs } = await adminClient
    .from('certificates')
    .select('id, issued_at, user_id, product_id, profiles(name, email), products(title)')
    .order('issued_at', { ascending: false })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Certificados emitidos</h1>
        <p className="text-sm text-gray-500 mt-0.5">{certs?.length ?? 0} certificado{certs?.length !== 1 ? 's' : ''} emitido{certs?.length !== 1 ? 's' : ''}.</p>
      </div>

      {!certs?.length ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-gray-200 text-gray-400 text-sm">
          Nenhum certificado emitido ainda.
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-xs text-gray-400 uppercase tracking-wider">
                <th className="text-left px-5 py-3 font-medium">Membro</th>
                <th className="text-left px-5 py-3 font-medium">Produto</th>
                <th className="text-left px-5 py-3 font-medium">Emitido em</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {certs.map((cert) => {
                const profile = Array.isArray(cert.profiles) ? cert.profiles[0] : cert.profiles
                const product = Array.isArray(cert.products) ? cert.products[0] : cert.products
                return (
                  <tr key={cert.id} className="hover:bg-gray-50 transition">
                    <td className="px-5 py-3">
                      <p className="font-medium text-gray-900">{profile?.name ?? '—'}</p>
                      <p className="text-xs text-gray-400">{profile?.email}</p>
                    </td>
                    <td className="px-5 py-3 text-gray-700">{product?.title ?? '—'}</td>
                    <td className="px-5 py-3 text-gray-400">
                      {new Date(cert.issued_at).toLocaleDateString('pt-BR', {
                        day: 'numeric', month: 'short', year: 'numeric'
                      })}
                    </td>
                    <td className="px-5 py-3 text-right">
                      <div className="flex items-center justify-end gap-3">
                        <span className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-medium" style={{ backgroundColor: '#f5efe3', color: '#7a5c10' }}>
                          Emitido
                        </span>
                        <form action={async () => { 'use server'; await deleteCertificate(cert.id) }}>
                          <button type="submit" className="text-xs font-medium text-red-400 hover:text-red-600 px-3 py-1.5 rounded-lg border border-red-100 hover:bg-red-50 transition">
                            Revogar
                          </button>
                        </form>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
