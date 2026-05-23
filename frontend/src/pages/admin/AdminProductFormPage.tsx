import { cloneElement, useEffect, useId, useState, type ReactElement } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { getCategories, getProductBySku } from '../../services/api/catalog'
import { createAdminProduct, updateAdminProduct } from '../../services/api/admin'
import type { Category } from '../../types'

interface FormState {
  sku: string
  name: string
  category_id: string
  cas_number: string
  description: string
  unit: string
  price: string
  stock: string
  requires_special_handling: boolean
  is_active: boolean
  sds: File | null
}

const empty: FormState = {
  sku: '',
  name: '',
  category_id: '',
  cas_number: '',
  description: '',
  unit: 'L',
  price: '',
  stock: '0',
  requires_special_handling: false,
  is_active: true,
  sds: null,
}

export default function AdminProductFormPage() {
  const { sku } = useParams<{ sku: string }>()
  const navigate = useNavigate()
  const isEdit = Boolean(sku)

  const [form, setForm] = useState<FormState>(empty)
  const [productId, setProductId] = useState<number | null>(null)
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(isEdit)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({})

  useEffect(() => {
    getCategories().then(({ data }) => setCategories(data)).catch(() => { /* no bloquea el form */ })
  }, [])

  useEffect(() => {
    if (!sku) return
    setLoading(true)
    getProductBySku(sku)
      .then(({ data }) => {
        setProductId(data.id)
        setForm({
          sku: data.sku,
          name: data.name,
          category_id: data.category_id?.toString() ?? '',
          cas_number: data.cas_number ?? '',
          description: data.description ?? '',
          unit: data.unit,
          price: data.price.toString(),
          stock: data.stock.toString(),
          requires_special_handling: data.requires_special_handling,
          is_active: data.is_active,
          sds: null,
        })
      })
      .catch(() => setError('No se pudo cargar el producto.'))
      .finally(() => setLoading(false))
  }, [sku])

  const update = <K extends keyof FormState>(k: K, v: FormState[K]) => setForm((f) => ({ ...f, [k]: v }))

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setFieldErrors({})
    setSaving(true)

    const fd = new FormData()
    fd.append('sku', form.sku)
    fd.append('name', form.name)
    if (form.category_id) fd.append('category_id', form.category_id)
    if (form.cas_number) fd.append('cas_number', form.cas_number)
    if (form.description) fd.append('description', form.description)
    fd.append('unit', form.unit)
    fd.append('price', form.price)
    fd.append('stock', form.stock)
    fd.append('requires_special_handling', form.requires_special_handling ? '1' : '0')
    fd.append('is_active', form.is_active ? '1' : '0')
    if (form.sds) fd.append('sds', form.sds)
    // Laravel form spoofing para multipart en updates
    if (isEdit) fd.append('_method', 'PUT')

    try {
      if (isEdit && productId) {
        await updateAdminProduct(productId, fd)
      } else {
        await createAdminProduct(fd)
      }
      navigate('/admin/products')
    } catch (err: unknown) {
      const r = (err as { response?: { data?: { message?: string; errors?: Record<string, string[]> } } })?.response?.data
      setFieldErrors(r?.errors ?? {})
      setError(r?.message ?? 'Error al guardar el producto.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-10">
        <div className="bg-white rounded-2xl border border-dust-200 p-8 animate-pulse h-96" />
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-10">
      <button
        onClick={() => navigate('/admin/products')}
        className="text-sm text-pine-500 hover:text-pine-700 hover:underline mb-6 inline-flex items-center gap-1"
      >
        ← Volver a productos
      </button>

      <h1 className="text-2xl font-bold text-gunmetal-800 mb-1">
        {isEdit ? 'Editar producto' : 'Nuevo producto'}
      </h1>
      <p className="text-sm text-gunmetal-400 mb-6">
        {isEdit ? 'Modifica los datos del producto del catálogo.' : 'Completa los datos del nuevo producto químico.'}
      </p>

      {error && (
        <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-100 text-red-700 text-sm">{error}</div>
      )}

      <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-dust-200 p-6 space-y-4">
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="SKU" required error={fieldErrors.sku?.[0]}>
            <input
              type="text"
              value={form.sku}
              onChange={(e) => update('sku', e.target.value.toUpperCase())}
              disabled={isEdit}
              required
              maxLength={50}
              className="w-full bg-dust-50 border border-dust-300 rounded-lg px-3 py-2 text-sm font-mono uppercase text-gunmetal-800 focus:border-pine-400 focus:ring-2 focus:ring-pine-400/30 focus:bg-white transition disabled:opacity-60 disabled:cursor-not-allowed"
            />
          </Field>

          <Field label="Categoría" error={fieldErrors.category_id?.[0]}>
            <select
              value={form.category_id}
              onChange={(e) => update('category_id', e.target.value)}
              className="w-full bg-dust-50 border border-dust-300 rounded-lg px-3 py-2 text-sm text-gunmetal-800 focus:border-pine-400 focus:ring-2 focus:ring-pine-400/30 focus:bg-white transition"
            >
              <option value="">— Sin categoría —</option>
              {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </Field>
        </div>

        <Field label="Nombre" required error={fieldErrors.name?.[0]}>
          <input
            type="text"
            value={form.name}
            onChange={(e) => update('name', e.target.value)}
            required
            maxLength={255}
            className="w-full bg-dust-50 border border-dust-300 rounded-lg px-3 py-2 text-sm text-gunmetal-800 focus:border-pine-400 focus:ring-2 focus:ring-pine-400/30 focus:bg-white transition"
          />
        </Field>

        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="Número CAS" error={fieldErrors.cas_number?.[0]}>
            <input
              type="text"
              value={form.cas_number}
              onChange={(e) => update('cas_number', e.target.value)}
              maxLength={20}
              placeholder="ej. 67-64-1"
              className="w-full bg-dust-50 border border-dust-300 rounded-lg px-3 py-2 text-sm font-mono text-gunmetal-800 placeholder:text-gunmetal-300 focus:border-pine-400 focus:ring-2 focus:ring-pine-400/30 focus:bg-white transition"
            />
          </Field>

          <Field label="Unidad" required error={fieldErrors.unit?.[0]}>
            <input
              type="text"
              value={form.unit}
              onChange={(e) => update('unit', e.target.value)}
              required
              maxLength={30}
              placeholder="L, kg, m³…"
              className="w-full bg-dust-50 border border-dust-300 rounded-lg px-3 py-2 text-sm text-gunmetal-800 placeholder:text-gunmetal-300 focus:border-pine-400 focus:ring-2 focus:ring-pine-400/30 focus:bg-white transition"
            />
          </Field>
        </div>

        <Field label="Descripción" error={fieldErrors.description?.[0]}>
          <textarea
            value={form.description}
            onChange={(e) => update('description', e.target.value)}
            rows={3}
            className="w-full bg-dust-50 border border-dust-300 rounded-lg px-3 py-2 text-sm text-gunmetal-800 placeholder:text-gunmetal-300 focus:border-pine-400 focus:ring-2 focus:ring-pine-400/30 focus:bg-white transition resize-none"
          />
        </Field>

        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="Precio (COP)" required error={fieldErrors.price?.[0]}>
            <input
              type="number"
              value={form.price}
              onChange={(e) => update('price', e.target.value)}
              required
              min="0"
              step="0.01"
              className="w-full bg-dust-50 border border-dust-300 rounded-lg px-3 py-2 text-sm text-gunmetal-800 focus:border-pine-400 focus:ring-2 focus:ring-pine-400/30 focus:bg-white transition"
            />
          </Field>

          <Field label="Stock" required error={fieldErrors.stock?.[0]}>
            <input
              type="number"
              value={form.stock}
              onChange={(e) => update('stock', e.target.value)}
              required
              min="0"
              className="w-full bg-dust-50 border border-dust-300 rounded-lg px-3 py-2 text-sm text-gunmetal-800 focus:border-pine-400 focus:ring-2 focus:ring-pine-400/30 focus:bg-white transition"
            />
          </Field>
        </div>

        <Field label="Hoja de seguridad (SDS) — PDF" error={fieldErrors.sds?.[0]}>
          <input
            type="file"
            accept="application/pdf"
            onChange={(e) => update('sds', e.target.files?.[0] ?? null)}
            className="w-full text-sm text-gunmetal-700 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:bg-gunmetal-600 file:text-dust-50 file:font-medium hover:file:bg-gunmetal-700 file:cursor-pointer file:transition"
          />
        </Field>

        <div className="flex flex-col gap-2 pt-2">
          <label className="inline-flex items-center gap-2 text-sm text-gunmetal-700 cursor-pointer">
            <input
              type="checkbox"
              checked={form.requires_special_handling}
              onChange={(e) => update('requires_special_handling', e.target.checked)}
              className="accent-gold-400"
            />
            Requiere manejo especial
          </label>
          <label className="inline-flex items-center gap-2 text-sm text-gunmetal-700 cursor-pointer">
            <input
              type="checkbox"
              checked={form.is_active}
              onChange={(e) => update('is_active', e.target.checked)}
              className="accent-pine-400"
            />
            Activo en el catálogo
          </label>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-dust-200">
          <button
            type="button"
            onClick={() => navigate('/admin/products')}
            className="px-4 py-2 text-sm border border-dust-300 rounded-lg text-gunmetal-700 hover:bg-dust-100 transition"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={saving}
            className="px-5 py-2 bg-gold-400 hover:bg-gold-500 text-gunmetal-800 rounded-lg text-sm font-semibold transition shadow-sm disabled:opacity-60"
          >
            {saving ? 'Guardando…' : isEdit ? 'Guardar cambios' : 'Crear producto'}
          </button>
        </div>
      </form>
    </div>
  )
}

function Field({
  label,
  required,
  error,
  children,
}: {
  label: string
  required?: boolean
  error?: string
  children: ReactElement<{ id?: string }>
}) {
  const generatedId = useId()
  const inputId = children.props.id ?? generatedId
  // Asociamos label↔input por htmlFor para accesibilidad real (y getByLabel en tests).
  const labelled = cloneElement(children, { id: inputId })
  return (
    <div>
      <label htmlFor={inputId} className="block text-sm font-medium text-gunmetal-700 mb-1.5">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {labelled}
      {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
    </div>
  )
}
