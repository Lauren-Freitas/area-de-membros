export default function AdminProdutoEditPage({ params }: { params: { id: string } }) {
  return (
    <div>
      <h1>Editar Produto {params.id}</h1>
    </div>
  )
}
