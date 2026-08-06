#!/usr/bin/env node
/**
 * Gera public/postman-collection.json a partir de public/openapi.json.
 * O OpenAPI é a fonte de verdade — este script só traduz o formato, nunca
 * mantém uma lista de endpoints paralela. Rodar de novo depois de editar
 * o spec: `node scripts/generate-postman.js`.
 */
const fs = require('fs')
const path = require('path')

const specPath = path.join(__dirname, '..', 'public', 'openapi.json')
const outPath = path.join(__dirname, '..', 'public', 'postman-collection.json')
const spec = JSON.parse(fs.readFileSync(specPath, 'utf-8'))

function exampleForSchema(schema) {
  if (!schema?.properties) return {}
  const required = new Set(schema.required ?? [])
  const example = {}
  for (const [key, field] of Object.entries(schema.properties)) {
    if (!required.has(key)) continue
    if (field.type === 'string' && field.format === 'uuid') example[key] = 'uuid-aqui'
    else if (field.type === 'string') example[key] = 'valor'
    else if (field.type === 'boolean') example[key] = true
    else if (field.type === 'array') example[key] = []
    else example[key] = null
  }
  return example
}

function toPostmanItem(rawPath, method, op) {
  const fullPath = `/api/v1${rawPath}`
  const segments = fullPath.split('/').filter(Boolean)
  const item = {
    name: op.summary ?? `${method.toUpperCase()} ${fullPath}`,
    request: {
      method: method.toUpperCase(),
      header: [{ key: 'Content-Type', value: 'application/json' }],
      url: {
        raw: `{{baseUrl}}${fullPath}`,
        host: ['{{baseUrl}}'],
        path: segments,
      },
      description: op.description ?? '',
    },
  }

  const bodySchema = op.requestBody?.content?.['application/json']?.schema
  if (bodySchema) {
    item.request.body = {
      mode: 'raw',
      raw: JSON.stringify(exampleForSchema(bodySchema), null, 2),
      options: { raw: { language: 'json' } },
    }
  }

  return item
}

const folders = new Map()
for (const [rawPath, methods] of Object.entries(spec.paths)) {
  for (const [method, op] of Object.entries(methods)) {
    const tag = op.tags?.[0] ?? 'Outros'
    if (!folders.has(tag)) folders.set(tag, [])
    folders.get(tag).push(toPostmanItem(rawPath, method, op))
  }
}

const collection = {
  info: {
    name: spec.info.title,
    description: spec.info.description,
    schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json',
  },
  auth: {
    type: 'apikey',
    apikey: [
      { key: 'key', value: 'x-api-key', type: 'string' },
      { key: 'value', value: '{{apiKey}}', type: 'string' },
      { key: 'in', value: 'header', type: 'string' },
    ],
  },
  variable: [
    { key: 'baseUrl', value: 'https://membros.thiagocantalovo.com/api/v1' },
    { key: 'apiKey', value: '' },
  ],
  item: Array.from(folders.entries()).map(([name, item]) => ({ name, item })),
}

fs.writeFileSync(outPath, JSON.stringify(collection, null, 2))
console.log(`Coleção Postman gerada em ${path.relative(process.cwd(), outPath)} (${folders.size} pastas, ${[...folders.values()].flat().length} requests)`)
