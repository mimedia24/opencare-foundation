import { useEffect, useMemo, useState } from 'react'
import {
  Activity,
  BadgeCheck,
  CheckCircle2,
  Edit3,
  Hash,
  Plus,
  RefreshCcw,
  Search,
  Trash2,
  XCircle,
} from 'lucide-react'

const emptyForm = {
  name: '',
  description: '',
  status: 'active',
  sortOrder: '',
}

export default function CategoriesPage({ API, token }) {
  const [categories, setCategories] = useState([])
  const [summary, setSummary] = useState({
    total: 0,
    active: 0,
    inactive: 0,
  })

  const [loading, setLoading] = useState(false)
  const [formLoading, setFormLoading] = useState(false)
  const [actionLoadingId, setActionLoadingId] = useState('')
  const [editingCategoryId, setEditingCategoryId] = useState('')
  const [form, setForm] = useState(emptyForm)

  const [filters, setFilters] = useState({
    search: '',
    status: 'all',
  })

  const sortedCategories = useMemo(() => {
    return [...categories].sort((a, b) => {
      const sortA = Number(a.sortOrder || 0)
      const sortB = Number(b.sortOrder || 0)

      if (sortA !== sortB) return sortA - sortB

      return String(a.name || '').localeCompare(String(b.name || ''))
    })
  }, [categories])

  const buildQuery = () => {
    const params = new URLSearchParams()

    if (filters.search.trim()) params.append('search', filters.search.trim())
    if (filters.status !== 'all') params.append('status', filters.status)

    return params.toString()
  }

  const loadCategories = async () => {
    if (!token) return

    try {
      setLoading(true)

      const query = buildQuery()

      const res = await fetch(`${API}/api/categories/admin/all${query ? `?${query}` : ''}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data?.message || 'Failed to load categories.')
      }

      setCategories(Array.isArray(data?.categories) ? data.categories : [])
      setSummary(data?.summary || {})
    } catch (error) {
      alert(error.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadCategories()
  }, [API, token])

  const handleFilterChange = (e) => {
    const { name, value } = e.target

    setFilters((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleFormChange = (e) => {
    const { name, value } = e.target

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const resetForm = () => {
    setEditingCategoryId('')
    setForm(emptyForm)
  }

  const startEdit = (category) => {
    setEditingCategoryId(category._id)

    setForm({
      name: category.name || '',
      description: category.description || '',
      status: category.status || 'active',
      sortOrder: category.sortOrder || '',
    })

    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    })
  }

  const submitCategory = async (e) => {
    e.preventDefault()

    if (!token) {
      alert('Please login first.')
      return
    }

    if (!form.name.trim()) {
      alert('Category name is required.')
      return
    }

    try {
      setFormLoading(true)

      const url = editingCategoryId
        ? `${API}/api/categories/admin/${editingCategoryId}`
        : `${API}/api/categories/admin/create`

      const res = await fetch(url, {
        method: editingCategoryId ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: form.name,
          description: form.description,
          status: form.status,
          sortOrder: form.sortOrder,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data?.message || 'Category save failed.')
      }

      alert(data.message || 'Category saved successfully.')
      resetForm()
      await loadCategories()
    } catch (error) {
      alert(error.message)
    } finally {
      setFormLoading(false)
    }
  }

  const seedDefaultCategories = async () => {
    if (!token) {
      alert('Please login first.')
      return
    }

    const confirmed = window.confirm('Create default fund categories?')

    if (!confirmed) return

    try {
      setActionLoadingId('seed')

      const res = await fetch(`${API}/api/categories/admin/seed`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data?.message || 'Default category creation failed.')
      }

      alert(data.message || 'Default categories created successfully.')
      await loadCategories()
    } catch (error) {
      alert(error.message)
    } finally {
      setActionLoadingId('')
    }
  }

  const updateCategoryStatus = async (categoryId, status) => {
    if (!token) {
      alert('Please login first.')
      return
    }

    try {
      setActionLoadingId(`status-${categoryId}`)

      const res = await fetch(`${API}/api/categories/admin/${categoryId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          status,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data?.message || 'Category status update failed.')
      }

      await loadCategories()
    } catch (error) {
      alert(error.message)
    } finally {
      setActionLoadingId('')
    }
  }

  const deleteCategory = async (categoryId) => {
    if (!token) {
      alert('Please login first.')
      return
    }

    const confirmed = window.confirm('Delete this category permanently?')

    if (!confirmed) return

    try {
      setActionLoadingId(`delete-${categoryId}`)

      const res = await fetch(`${API}/api/categories/admin/${categoryId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data?.message || 'Category delete failed.')
      }

      alert(data.message || 'Category deleted successfully.')
      await loadCategories()
    } catch (error) {
      alert(error.message)
    } finally {
      setActionLoadingId('')
    }
  }

  return (
    <section className="mt-4 grid gap-4">
      <div className="rounded-[28px] border border-cyan-100 bg-white p-4 shadow-[0_14px_35px_rgba(15,23,42,0.06)] sm:rounded-[34px] sm:p-5">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="text-[9px] font-black uppercase tracking-[0.18em] text-cyan-500 sm:text-[11px]">
              Fund Category Management
            </p>

            <h2 className="mt-1 text-2xl font-black text-slate-950 sm:mt-2 sm:text-3xl">
              Categories Control
            </h2>

            <p className="mt-2 text-xs font-semibold text-slate-500 sm:text-sm">
              Create, edit, activate and manage donation fund categories.
            </p>
          </div>

          <div className="grid gap-2 sm:grid-cols-2">
            <button
              type="button"
              onClick={seedDefaultCategories}
              disabled={actionLoadingId === 'seed'}
              className="flex h-11 items-center justify-center gap-2 rounded-2xl bg-slate-950 px-4 text-sm font-black text-white shadow-lg disabled:opacity-60"
            >
              <Plus size={16} />
              {actionLoadingId === 'seed' ? 'Creating...' : 'Default'}
            </button>

            <button
              type="button"
              onClick={loadCategories}
              disabled={loading}
              className="flex h-11 items-center justify-center gap-2 rounded-2xl bg-cyan-600 px-4 text-sm font-black text-white shadow-lg disabled:opacity-60"
            >
              <RefreshCcw size={16} className={loading ? 'animate-spin' : ''} />
              {loading ? 'Refreshing...' : 'Refresh'}
            </button>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-3 gap-2">
          <div className="rounded-2xl bg-slate-50 p-3 text-center">
            <p className="text-xl font-black text-slate-950">
              {summary.total || categories.length}
            </p>
            <p className="text-[10px] font-bold text-slate-500">Total</p>
          </div>

          <div className="rounded-2xl bg-emerald-50 p-3 text-center">
            <p className="text-xl font-black text-emerald-700">{summary.active || 0}</p>
            <p className="text-[10px] font-bold text-emerald-600">Active</p>
          </div>

          <div className="rounded-2xl bg-rose-50 p-3 text-center">
            <p className="text-xl font-black text-rose-700">{summary.inactive || 0}</p>
            <p className="text-[10px] font-bold text-rose-600">Inactive</p>
          </div>
        </div>
      </div>

      <form
        onSubmit={submitCategory}
        className="rounded-[28px] border border-cyan-100 bg-white p-4 shadow-[0_14px_35px_rgba(15,23,42,0.06)] sm:rounded-[34px] sm:p-5"
      >
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-[9px] font-black uppercase tracking-[0.18em] text-cyan-500">
              {editingCategoryId ? 'Edit Category' : 'Create Category'}
            </p>

            <h3 className="mt-1 text-xl font-black text-slate-950">
              {editingCategoryId ? 'Update Category Information' : 'Add New Fund Category'}
            </h3>
          </div>

          {editingCategoryId && (
            <button
              type="button"
              onClick={resetForm}
              className="h-10 rounded-2xl bg-slate-100 px-4 text-xs font-black text-slate-700"
            >
              Cancel Edit
            </button>
          )}
        </div>

        <div className="mt-5 grid gap-3 md:grid-cols-2">
          <input
            type="text"
            name="name"
            placeholder="Category name"
            value={form.name}
            onChange={handleFormChange}
            className="h-12 rounded-2xl border border-cyan-100 bg-slate-50 px-4 text-sm font-bold outline-none focus:border-cyan-500 focus:ring-4 focus:ring-cyan-100"
          />

          <input
            type="number"
            name="sortOrder"
            placeholder="Sort order"
            value={form.sortOrder}
            onChange={handleFormChange}
            className="h-12 rounded-2xl border border-cyan-100 bg-slate-50 px-4 text-sm font-bold outline-none focus:border-cyan-500 focus:ring-4 focus:ring-cyan-100"
          />

          <select
            name="status"
            value={form.status}
            onChange={handleFormChange}
            className="h-12 rounded-2xl border border-cyan-100 bg-slate-50 px-4 text-sm font-bold outline-none focus:border-cyan-500 focus:ring-4 focus:ring-cyan-100 md:col-span-2"
          >
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>

          <textarea
            name="description"
            placeholder="Category description"
            value={form.description}
            onChange={handleFormChange}
            rows="4"
            className="rounded-2xl border border-cyan-100 bg-slate-50 px-4 py-3 text-sm font-bold outline-none focus:border-cyan-500 focus:ring-4 focus:ring-cyan-100 md:col-span-2"
          />
        </div>

        <button
          type="submit"
          disabled={formLoading}
          className="mt-5 flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-cyan-600 to-blue-500 text-sm font-black text-white shadow-lg disabled:opacity-60"
        >
          {editingCategoryId ? <CheckCircle2 size={17} /> : <Plus size={17} />}
          {formLoading
            ? 'Saving...'
            : editingCategoryId
              ? 'Update Category'
              : 'Create Category'}
        </button>
      </form>

      <div className="rounded-[28px] border border-cyan-100 bg-white p-4 shadow-[0_14px_35px_rgba(15,23,42,0.06)] sm:rounded-[34px] sm:p-5">
        <form
          onSubmit={(e) => {
            e.preventDefault()
            loadCategories()
          }}
          className="grid gap-3 rounded-[24px] border border-slate-200 bg-slate-50 p-3 md:grid-cols-[1fr_160px_auto]"
        >
          <div className="relative">
            <Search
              size={17}
              className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
            />

            <input
              type="text"
              name="search"
              placeholder="Search category name, slug, description"
              value={filters.search}
              onChange={handleFilterChange}
              className="h-12 w-full rounded-2xl border border-slate-200 bg-white pl-11 pr-4 text-sm font-bold outline-none"
            />
          </div>

          <select
            name="status"
            value={filters.status}
            onChange={handleFilterChange}
            className="h-12 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-bold outline-none"
          >
            <option value="all">All status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>

          <button
            type="submit"
            disabled={loading}
            className="h-12 rounded-2xl bg-slate-950 px-5 text-sm font-black text-white disabled:opacity-60"
          >
            Search
          </button>
        </form>

        <div className="mt-5 grid gap-4">
          {loading ? (
            <div className="rounded-2xl bg-slate-50 p-6 text-center text-sm font-bold text-slate-500">
              Loading categories...
            </div>
          ) : sortedCategories.length === 0 ? (
            <div className="rounded-2xl bg-slate-50 p-6 text-center text-sm font-bold text-slate-500">
              No category found.
            </div>
          ) : (
            sortedCategories.map((category) => (
              <div
                key={category._id}
                className="grid gap-4 rounded-[26px] border border-cyan-100 bg-gradient-to-br from-white to-cyan-50 p-4 shadow-sm lg:grid-cols-[1fr_230px]"
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="grid h-12 w-12 place-items-center rounded-2xl bg-cyan-600 text-white">
                      <Hash size={20} />
                    </div>

                    <div className="min-w-0">
                      <h3 className="truncate text-lg font-black text-slate-950 sm:text-xl">
                        {category.name}
                      </h3>

                      <p className="truncate text-xs font-bold text-slate-500">
                        /{category.slug}
                      </p>
                    </div>

                    <span
                      className={`rounded-full px-3 py-1 text-xs font-black capitalize ${
                        category.status === 'active'
                          ? 'bg-emerald-50 text-emerald-700'
                          : 'bg-rose-50 text-rose-700'
                      }`}
                    >
                      {category.status}
                    </span>
                  </div>

                  <div className="mt-4 grid gap-3 md:grid-cols-3">
                    <div className="rounded-2xl bg-white p-3">
                      <p className="text-[9px] font-black uppercase tracking-[0.16em] text-cyan-400">
                        Sort Order
                      </p>
                      <p className="mt-1 text-sm font-black">
                        {Number(category.sortOrder || 0)}
                      </p>
                    </div>

                    <div className="rounded-2xl bg-white p-3">
                      <p className="text-[9px] font-black uppercase tracking-[0.16em] text-blue-400">
                        Status
                      </p>
                      <p className="mt-1 text-sm font-black capitalize">
                        {category.status}
                      </p>
                    </div>

                    <div className="rounded-2xl bg-white p-3">
                      <p className="text-[9px] font-black uppercase tracking-[0.16em] text-violet-400">
                        Created
                      </p>
                      <p className="mt-1 text-sm font-black">
                        {category.createdAt
                          ? new Date(category.createdAt).toLocaleDateString('en-GB')
                          : 'Not found'}
                      </p>
                    </div>
                  </div>

                  {category.description && (
                    <div className="mt-4 rounded-2xl border border-cyan-100 bg-white/80 p-3">
                      <p className="text-xs font-bold leading-5 text-slate-600">
                        {category.description}
                      </p>
                    </div>
                  )}
                </div>

                <div className="grid content-start gap-2 rounded-[24px] bg-white p-3">
                  <select
                    value={category.status}
                    onChange={(e) => updateCategoryStatus(category._id, e.target.value)}
                    disabled={actionLoadingId === `status-${category._id}`}
                    className="h-10 rounded-2xl border border-slate-200 px-3 text-xs font-black outline-none"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>

                  <button
                    type="button"
                    onClick={() => startEdit(category)}
                    className="flex h-10 items-center justify-center gap-2 rounded-2xl bg-blue-50 px-3 text-xs font-black text-blue-700 hover:bg-blue-100"
                  >
                    <Edit3 size={15} />
                    Edit
                  </button>

                  <button
                    type="button"
                    onClick={() => deleteCategory(category._id)}
                    disabled={actionLoadingId === `delete-${category._id}`}
                    className="flex h-10 items-center justify-center gap-2 rounded-2xl bg-slate-950 px-3 text-xs font-black text-white hover:bg-slate-800 disabled:opacity-60"
                  >
                    <Trash2 size={15} />
                    Delete
                  </button>

                  {category.status === 'active' ? (
                    <div className="flex items-center justify-center gap-2 rounded-2xl bg-emerald-50 px-3 py-3 text-xs font-black text-emerald-700">
                      <BadgeCheck size={15} />
                      Active
                    </div>
                  ) : (
                    <div className="flex items-center justify-center gap-2 rounded-2xl bg-rose-50 px-3 py-3 text-xs font-black text-rose-700">
                      <XCircle size={15} />
                      Inactive
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </section>
  )
}