export default async function AdminProdutoEditPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  return (
    <div>
      <h1>Editar Produto {id}</h1>
    </div>
  )
}
