import { BannerForm } from '../BannerForm'

export default function NovoBannerPage() {
  return (
    <div className="max-w-xl">
      <h1 className="text-xl font-bold text-gray-900 mb-6">Novo banner</h1>
      <BannerForm banner={null} />
    </div>
  )
}
