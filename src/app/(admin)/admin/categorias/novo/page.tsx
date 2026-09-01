import { CategoryForm } from '../CategoryForm'

export default function NovaCategoriaPage() {
  return (
    <div className="max-w-xl">
      <h1 className="text-xl font-bold text-gray-900 mb-6">Nova categoria</h1>
      <CategoryForm category={null} />
    </div>
  )
}
