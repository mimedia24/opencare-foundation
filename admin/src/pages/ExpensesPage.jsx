import { useEffect, useMemo, useState } from 'react'
import {
  Activity,
  CalendarDays,
  CheckCircle2,
  Edit3,
  ExternalLink,
  Eye,
  Image as ImageIcon,
  Plus,
  RefreshCcw,
  Search,
  Trash2,
  X,
} from 'lucide-react'

function money(amount) {
  return `BDT ${Number(amount || 0).toLocaleString('en-US')}`
}

function formatDate(date) {
  if (!date) return 'Not found'

  const parsedDate = new Date(date)

  if (Number.isNaN(parsedDate.getTime())) {
    return 'Not found'
  }

  return parsedDate.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

function getDateInputValue(date) {
  if (!date) return ''

  const parsedDate = new Date(date)

  if (Number.isNaN(parsedDate.getTime())) return ''

  return parsedDate.toISOString().slice(0, 10)
}

function normalize(value) {
  return String(value || '').trim().toLowerCase()
}

const emptyForm = {
  project: '',
  category: 'General Expense',
  title: '',
  amount: '',
  description: '',
  expenseDate: '',
  proofLink: '',
  status: 'published',
  proofImage: null,
}

export default function ExpensesPage({ API, token }) {
  const [expenses, setExpenses] = useState([])
  const [projects, setProjects] = useState([])
  const [categories, setCategories] = useState([])
  const [summary, setSummary] = useState({
    total: 0,
    published: 0,
    draft: 0,
    hidden: 0,
    totalAmount: 0,
    publishedAmount: 0,
  })

  const [loading, setLoading] = useState(false)
  const [formLoading, setFormLoading] = useState(false)
  const [actionLoadingId, setActionLoadingId] = useState('')
  const [editingExpenseId, setEditingExpenseId] = useState('')
  const [selectedImage, setSelectedImage] = useState('')
  const [form, setForm] = useState(emptyForm)

  const [filters, setFilters] = useState({
    search: '',
    status: 'all',
    project: '',
    category: '',
    dateFrom: '',
    dateTo: '',
  })

  const activeProjects = useMemo(() => {
    return projects.filter((project) => project.status === 'active' || !project.status)
  }, [projects])

  const cleanCategories = useMemo(() => {
    const seen = new Set()

    const list = categories.filter((category) => {
      const key = normalize(category.name || category.slug || category._id)

      if (!key || seen.has(key)) return false

      seen.add(key)
      return true
    })

    return list
  }, [categories])

  const categoryOptions = useMemo(() => {
    const base = cleanCategories.map((category) => category.name).filter(Boolean)

    const extra = [
      'General Expense',
      'Project Expense',
      'Zakat',
      'Medical Support',
      'Education',
      'Food Support',
      'Emergency Relief',
      'Orphan Support',
      'Operational Cost',
      'Administrative Cost',
    ]

    const seen = new Set()
    const finalList = []

    ;[...base, ...extra].forEach((item) => {
      const key = normalize(item)

      if (!key || seen.has(key)) return

      seen.add(key)
      finalList.push(item)
    })

    return finalList
  }, [cleanCategories])

  const selectedProject = useMemo(() => {
    if (!form.project) return null

    return projects.find((project) => String(project._id) === String(form.project)) || null
  }, [projects, form.project])

  const totals = useMemo(() => {
    return {
      totalAmount: expenses.reduce((sum, item) => sum + Number(item.amount || 0), 0),
      publishedAmount: expenses
        .filter((item) => item.status === 'published')
        .reduce((sum, item) => sum + Number(item.amount || 0), 0),
      draftAmount: expenses
        .filter((item) => item.status === 'draft')
        .reduce((sum, item) => sum + Number(item.amount || 0), 0),
      hiddenAmount: expenses
        .filter((item) => item.status === 'hidden')
        .reduce((sum, item) => sum + Number(item.amount || 0), 0),
    }
  }, [expenses])

  const buildQuery = () => {
    const params = new URLSearchParams()

    if (filters.search.trim()) params.append('search', filters.search.trim())
    if (filters.status !== 'all') params.append('status', filters.status)
    if (filters.project) params.append('project', filters.project)
    if (filters.category.trim()) params.append('category', filters.category.trim())
    if (filters.dateFrom) params.append('dateFrom', filters.dateFrom)
    if (filters.dateTo) params.append('dateTo', filters.dateTo)

    return params.toString()
  }

  const loadProjects = async () => {
    if (!token) return

    try {
      const res = await fetch(`${API}/api/projects/admin/all`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      const data = await res.json()

      if (res.ok) {
        setProjects(Array.isArray(data?.projects) ? data.projects : [])
      }
    } catch (error) {
      console.log(error.message)
    }
  }

  const loadCategories = async () => {
    if (!token) return

    try {
      const res = await fetch(`${API}/api/categories/admin/all`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      const data = await res.json()

      if (res.ok) {
        setCategories(Array.isArray(data?.categories) ? data.categories : [])
        return
      }

      const publicRes = await fetch(`${API}/api/categories`)
      const publicData = await publicRes.json()

      if (publicRes.ok) {
        setCategories(Array.isArray(publicData?.categories) ? publicData.categories : [])
      }
    } catch (error) {
      console.log(error.message)
    }
  }

  const loadExpenses = async () => {
    if (!token) return

    try {
      setLoading(true)

      const query = buildQuery()

      const res = await fetch(`${API}/api/expenses/admin/all${query ? `?${query}` : ''}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data?.message || 'Failed to load expenses.')
      }

      setExpenses(Array.isArray(data?.expenses) ? data.expenses : [])
      setSummary(data?.summary || {})
    } catch (error) {
      alert(error.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadProjects()
    loadCategories()
    loadExpenses()
  }, [API, token])

  const handleFilterChange = (e) => {
    const { name, value } = e.target

    setFilters((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleFormChange = (e) => {
    const { name, value, type, files } = e.target

    if (type === 'file') {
      setForm((prev) => ({
        ...prev,
        [name]: files?.[0] || null,
      }))

      return
    }

    if (name === 'project') {
      const project = projects.find((item) => String(item._id) === String(value))

      setForm((prev) => ({
        ...prev,
        project: value,
        category: project ? 'Project Expense' : prev.category || 'General Expense',
        title: project && !prev.title ? `${project.title} expense` : prev.title,
      }))

      return
    }

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const resetForm = () => {
    setEditingExpenseId('')
    setForm(emptyForm)
  }

  const startEdit = (expense) => {
    setEditingExpenseId(expense._id)

    setForm({
      project: expense.project?._id || expense.project || '',
      category: expense.category || 'General Expense',
      title: expense.title || '',
      amount: expense.amount || '',
      description: expense.description || '',
      expenseDate: getDateInputValue(expense.expenseDate),
      proofLink: expense.proofLink || '',
      status: expense.status || 'published',
      proofImage: null,
    })

    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    })
  }

  const submitExpense = async (e) => {
    e.preventDefault()

    if (!token) {
      alert('Please login first.')
      return
    }

    if (!form.title.trim() || form.amount === '') {
      alert('Expense title and amount are required.')
      return
    }

    if (!form.category.trim()) {
      alert('Please select an expense category.')
      return
    }

    try {
      setFormLoading(true)

      const formData = new FormData()

      formData.append('project', form.project)
      formData.append('category', form.category)
      formData.append('title', form.title)
      formData.append('amount', form.amount)
      formData.append('description', form.description)
      formData.append('expenseDate', form.expenseDate)
      formData.append('proofLink', form.proofLink)
      formData.append('status', form.status)

      if (form.proofImage) {
        formData.append('proofImage', form.proofImage)
      }

      const url = editingExpenseId
        ? `${API}/api/expenses/admin/${editingExpenseId}`
        : `${API}/api/expenses/admin/create`

      const res = await fetch(url, {
        method: editingExpenseId ? 'PUT' : 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data?.message || 'Expense save failed.')
      }

      alert(data.message || 'Expense saved successfully.')
      resetForm()
      await loadExpenses()
      await loadProjects()
      await loadCategories()
    } catch (error) {
      alert(error.message)
    } finally {
      setFormLoading(false)
    }
  }

  const updateExpenseStatus = async (expenseId, status) => {
    if (!token) {
      alert('Please login first.')
      return
    }

    try {
      setActionLoadingId(`status-${expenseId}`)

      const res = await fetch(`${API}/api/expenses/admin/${expenseId}/status`, {
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
        throw new Error(data?.message || 'Expense status update failed.')
      }

      await loadExpenses()
    } catch (error) {
      alert(error.message)
    } finally {
      setActionLoadingId('')
    }
  }

  const deleteExpense = async (expenseId) => {
    if (!token) {
      alert('Please login first.')
      return
    }

    const confirmed = window.confirm('Delete this expense permanently?')

    if (!confirmed) return

    try {
      setActionLoadingId(`delete-${expenseId}`)

      const res = await fetch(`${API}/api/expenses/admin/${expenseId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data?.message || 'Expense delete failed.')
      }

      alert(data.message || 'Expense deleted successfully.')
      await loadExpenses()
    } catch (error) {
      alert(error.message)
    } finally {
      setActionLoadingId('')
    }
  }

  return (
    <section className="mt-4 grid gap-4">
      {selectedImage && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/80 p-4">
          <div className="relative w-full max-w-4xl rounded-[28px] bg-white p-3 shadow-2xl">
            <button
              type="button"
              onClick={() => setSelectedImage('')}
              className="absolute right-4 top-4 z-10 grid h-10 w-10 place-items-center rounded-full bg-slate-950 text-white"
            >
              <X size={18} />
            </button>

            <img
              src={selectedImage}
              alt="Expense proof"
              className="max-h-[80vh] w-full rounded-[20px] object-contain"
            />
          </div>
        </div>
      )}

      <div className="rounded-[28px] border border-rose-100 bg-white p-4 shadow-[0_14px_35px_rgba(15,23,42,0.06)] sm:rounded-[34px] sm:p-5">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="text-[9px] font-black uppercase tracking-[0.18em] text-rose-500 sm:text-[11px]">
              Transparency Management
            </p>

            <h2 className="mt-1 text-2xl font-black text-slate-950 sm:mt-2 sm:text-3xl">
              Expenses Control
            </h2>

            <p className="mt-2 text-xs font-semibold text-slate-500 sm:text-sm">
              Add project-wise or fund/category-wise expense transparency records.
            </p>
          </div>

          <button
            type="button"
            onClick={loadExpenses}
            disabled={loading}
            className="flex h-11 items-center justify-center gap-2 rounded-2xl bg-rose-600 px-4 text-sm font-black text-white shadow-lg disabled:opacity-60"
          >
            <RefreshCcw size={16} className={loading ? 'animate-spin' : ''} />
            {loading ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-6">
          <div className="rounded-2xl bg-slate-50 p-3 text-center">
            <p className="text-xl font-black text-slate-950">{summary.total || expenses.length}</p>
            <p className="text-[10px] font-bold text-slate-500">Total</p>
          </div>

          <div className="rounded-2xl bg-emerald-50 p-3 text-center">
            <p className="text-xl font-black text-emerald-700">{summary.published || 0}</p>
            <p className="text-[10px] font-bold text-emerald-600">Published</p>
          </div>

          <div className="rounded-2xl bg-amber-50 p-3 text-center">
            <p className="text-xl font-black text-amber-700">{summary.draft || 0}</p>
            <p className="text-[10px] font-bold text-amber-600">Draft</p>
          </div>

          <div className="rounded-2xl bg-slate-100 p-3 text-center">
            <p className="text-xl font-black text-slate-700">{summary.hidden || 0}</p>
            <p className="text-[10px] font-bold text-slate-500">Hidden</p>
          </div>

          <div className="rounded-2xl bg-rose-50 p-3 text-center">
            <p className="truncate text-lg font-black text-rose-700">
              {money(summary.totalAmount || totals.totalAmount)}
            </p>
            <p className="text-[10px] font-bold text-rose-600">Total Amount</p>
          </div>

          <div className="rounded-2xl bg-cyan-50 p-3 text-center">
            <p className="truncate text-lg font-black text-cyan-700">
              {money(summary.publishedAmount || totals.publishedAmount)}
            </p>
            <p className="text-[10px] font-bold text-cyan-600">Public Amount</p>
          </div>
        </div>
      </div>

      <form
        onSubmit={submitExpense}
        className="rounded-[28px] border border-rose-100 bg-white p-4 shadow-[0_14px_35px_rgba(15,23,42,0.06)] sm:rounded-[34px] sm:p-5"
      >
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-[9px] font-black uppercase tracking-[0.18em] text-rose-500">
              {editingExpenseId ? 'Edit Expense' : 'Create Expense'}
            </p>

            <h3 className="mt-1 text-xl font-black text-slate-950">
              {editingExpenseId ? 'Update Expense Information' : 'Add New Expense'}
            </h3>
          </div>

          {editingExpenseId && (
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
          <div className="grid gap-2">
            <span className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">
              Project Expense Optional
            </span>

            <select
              name="project"
              value={form.project}
              onChange={handleFormChange}
              className="h-12 rounded-2xl border border-rose-100 bg-slate-50 px-4 text-sm font-bold outline-none focus:border-rose-500 focus:ring-4 focus:ring-rose-100"
            >
              <option value="">No project / Category expense</option>
              {activeProjects.map((project) => (
                <option key={project._id} value={project._id}>
                  {project.title}
                </option>
              ))}
            </select>
          </div>

          <div className="grid gap-2">
            <span className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">
              Expense Fund / Category
            </span>

            <select
              name="category"
              value={form.category}
              onChange={handleFormChange}
              className="h-12 rounded-2xl border border-rose-100 bg-slate-50 px-4 text-sm font-bold outline-none focus:border-rose-500 focus:ring-4 focus:ring-rose-100"
            >
              {categoryOptions.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </div>

          <input
            type="text"
            name="title"
            placeholder="Expense title"
            value={form.title}
            onChange={handleFormChange}
            className="h-12 rounded-2xl border border-rose-100 bg-slate-50 px-4 text-sm font-bold outline-none focus:border-rose-500 focus:ring-4 focus:ring-rose-100"
          />

          <input
            type="number"
            name="amount"
            placeholder="Amount"
            value={form.amount}
            onChange={handleFormChange}
            className="h-12 rounded-2xl border border-rose-100 bg-slate-50 px-4 text-sm font-bold outline-none focus:border-rose-500 focus:ring-4 focus:ring-rose-100"
          />

          <input
            type="date"
            name="expenseDate"
            value={form.expenseDate}
            onChange={handleFormChange}
            className="h-12 rounded-2xl border border-rose-100 bg-slate-50 px-4 text-sm font-bold outline-none focus:border-rose-500 focus:ring-4 focus:ring-rose-100"
          />

          <select
            name="status"
            value={form.status}
            onChange={handleFormChange}
            className="h-12 rounded-2xl border border-rose-100 bg-slate-50 px-4 text-sm font-bold outline-none focus:border-rose-500 focus:ring-4 focus:ring-rose-100"
          >
            <option value="published">Published</option>
            <option value="draft">Draft</option>
            <option value="hidden">Hidden</option>
          </select>

          <input
            type="text"
            name="proofLink"
            placeholder="Proof link optional"
            value={form.proofLink}
            onChange={handleFormChange}
            className="h-12 rounded-2xl border border-rose-100 bg-slate-50 px-4 text-sm font-bold outline-none focus:border-rose-500 focus:ring-4 focus:ring-rose-100 md:col-span-2"
          />

          <textarea
            name="description"
            placeholder="Expense description"
            value={form.description}
            onChange={handleFormChange}
            rows="4"
            className="rounded-2xl border border-rose-100 bg-slate-50 px-4 py-3 text-sm font-bold outline-none focus:border-rose-500 focus:ring-4 focus:ring-rose-100 md:col-span-2"
          />

          <label className="flex cursor-pointer items-center justify-center gap-2 rounded-2xl border border-dashed border-rose-200 bg-rose-50 px-4 py-4 text-sm font-black text-rose-700 md:col-span-2">
            <ImageIcon size={18} />
            {form.proofImage ? form.proofImage.name : 'Upload expense proof image'}
            <input
              type="file"
              name="proofImage"
              accept="image/*"
              onChange={handleFormChange}
              className="hidden"
            />
          </label>
        </div>

        {selectedProject && (
          <div className="mt-4 rounded-2xl border border-blue-100 bg-blue-50 p-4">
            <p className="text-[10px] font-black uppercase tracking-[0.16em] text-blue-700">
              Selected Project
            </p>
            <p className="mt-1 text-sm font-black text-slate-950">{selectedProject.title}</p>
            <p className="mt-2 text-xs font-bold text-slate-500">
              This expense will be recorded under this project and the selected expense category.
            </p>
          </div>
        )}

        <button
          type="submit"
          disabled={formLoading}
          className="mt-5 flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-rose-600 to-orange-500 text-sm font-black text-white shadow-lg disabled:opacity-60"
        >
          {editingExpenseId ? <CheckCircle2 size={17} /> : <Plus size={17} />}
          {formLoading
            ? 'Saving...'
            : editingExpenseId
              ? 'Update Expense'
              : 'Create Expense'}
        </button>
      </form>

      <div className="rounded-[28px] border border-rose-100 bg-white p-4 shadow-[0_14px_35px_rgba(15,23,42,0.06)] sm:rounded-[34px] sm:p-5">
        <form
          onSubmit={(e) => {
            e.preventDefault()
            loadExpenses()
          }}
          className="grid gap-3 rounded-[24px] border border-slate-200 bg-slate-50 p-3 md:grid-cols-[1fr_150px_190px_190px] xl:grid-cols-[1fr_140px_220px_190px_150px_150px_auto]"
        >
          <div className="relative">
            <Search
              size={17}
              className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
            />

            <input
              type="text"
              name="search"
              placeholder="Search title, category, project"
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
            <option value="published">Published</option>
            <option value="draft">Draft</option>
            <option value="hidden">Hidden</option>
          </select>

          <select
            name="project"
            value={filters.project}
            onChange={handleFilterChange}
            className="h-12 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-bold outline-none"
          >
            <option value="">All projects</option>
            {projects.map((project) => (
              <option key={project._id} value={project._id}>
                {project.title}
              </option>
            ))}
          </select>

          <select
            name="category"
            value={filters.category}
            onChange={handleFilterChange}
            className="h-12 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-bold outline-none"
          >
            <option value="">All categories</option>
            {categoryOptions.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>

          <input
            type="date"
            name="dateFrom"
            value={filters.dateFrom}
            onChange={handleFilterChange}
            className="h-12 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-bold outline-none"
          />

          <input
            type="date"
            name="dateTo"
            value={filters.dateTo}
            onChange={handleFilterChange}
            className="h-12 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-bold outline-none"
          />

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
              Loading expenses...
            </div>
          ) : expenses.length === 0 ? (
            <div className="rounded-2xl bg-slate-50 p-6 text-center text-sm font-bold text-slate-500">
              No expense found.
            </div>
          ) : (
            expenses.map((expense) => (
              <div
                key={expense._id}
                className="grid gap-4 rounded-[26px] border border-rose-100 bg-gradient-to-br from-white to-rose-50 p-4 shadow-sm xl:grid-cols-[110px_1fr_230px]"
              >
                <button
                  type="button"
                  onClick={() => expense.proofImage && setSelectedImage(expense.proofImage)}
                  className="relative h-24 w-24 overflow-hidden rounded-[24px] bg-rose-100 shadow-lg"
                >
                  {expense.proofImage ? (
                    <img
                      src={expense.proofImage}
                      alt="Expense proof"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="grid h-full w-full place-items-center text-rose-600">
                      <Activity size={32} />
                    </div>
                  )}

                  {expense.proofImage && (
                    <span className="absolute bottom-2 right-2 grid h-8 w-8 place-items-center rounded-full bg-slate-950/80 text-white">
                      <Eye size={15} />
                    </span>
                  )}
                </button>

                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-lg font-black text-slate-950 sm:text-xl">
                      {expense.title}
                    </h3>

                    <span
                      className={`rounded-full px-3 py-1 text-xs font-black capitalize ${
                        expense.status === 'published'
                          ? 'bg-emerald-50 text-emerald-700'
                          : expense.status === 'draft'
                            ? 'bg-amber-50 text-amber-700'
                            : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {expense.status}
                    </span>
                  </div>

                  <div className="mt-3 grid gap-2 text-xs font-bold text-slate-600 sm:grid-cols-2 lg:grid-cols-3">
                    <p className="flex items-center gap-2">
                      <Activity size={15} />
                      {money(expense.amount)}
                    </p>

                    <p className="flex items-center gap-2">
                      <CalendarDays size={15} />
                      {formatDate(expense.expenseDate)}
                    </p>

                    <p className="flex items-center gap-2">
                      <Activity size={15} />
                      {expense.category || 'General Expense'}
                    </p>
                  </div>

                  <div className="mt-4 grid gap-3 md:grid-cols-3">
                    <div className="rounded-2xl bg-white p-3">
                      <p className="text-[9px] font-black uppercase tracking-[0.16em] text-rose-400">
                        Project
                      </p>
                      <p className="mt-1 truncate text-sm font-black">
                        {expense.projectTitle || expense.project?.title || 'No project'}
                      </p>
                    </div>

                    <div className="rounded-2xl bg-white p-3">
                      <p className="text-[9px] font-black uppercase tracking-[0.16em] text-blue-400">
                        Category / Fund
                      </p>
                      <p className="mt-1 truncate text-sm font-black">
                        {expense.category || 'General Expense'}
                      </p>
                    </div>

                    <div className="rounded-2xl bg-white p-3">
                      <p className="text-[9px] font-black uppercase tracking-[0.16em] text-violet-400">
                        Proof Link
                      </p>
                      {expense.proofLink ? (
                        <a
                          href={expense.proofLink}
                          target="_blank"
                          rel="noreferrer"
                          className="mt-1 flex items-center gap-1 truncate text-sm font-black text-blue-600"
                        >
                          Open <ExternalLink size={13} />
                        </a>
                      ) : (
                        <p className="mt-1 truncate text-sm font-black">Not added</p>
                      )}
                    </div>
                  </div>

                  {expense.description && (
                    <div className="mt-4 rounded-2xl border border-rose-100 bg-white/80 p-3">
                      <p className="text-xs font-bold leading-5 text-slate-600">
                        {expense.description}
                      </p>
                    </div>
                  )}
                </div>

                <div className="grid content-start gap-2 rounded-[24px] bg-white p-3">
                  <select
                    value={expense.status}
                    onChange={(e) => updateExpenseStatus(expense._id, e.target.value)}
                    disabled={actionLoadingId === `status-${expense._id}`}
                    className="h-10 rounded-2xl border border-slate-200 px-3 text-xs font-black outline-none"
                  >
                    <option value="published">Published</option>
                    <option value="draft">Draft</option>
                    <option value="hidden">Hidden</option>
                  </select>

                  <button
                    type="button"
                    onClick={() => startEdit(expense)}
                    className="flex h-10 items-center justify-center gap-2 rounded-2xl bg-blue-50 px-3 text-xs font-black text-blue-700 hover:bg-blue-100"
                  >
                    <Edit3 size={15} />
                    Edit
                  </button>

                  <button
                    type="button"
                    onClick={() => deleteExpense(expense._id)}
                    disabled={actionLoadingId === `delete-${expense._id}`}
                    className="flex h-10 items-center justify-center gap-2 rounded-2xl bg-slate-950 px-3 text-xs font-black text-white hover:bg-slate-800 disabled:opacity-60"
                  >
                    <Trash2 size={15} />
                    Delete
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </section>
  )
}