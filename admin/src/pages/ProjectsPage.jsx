import { useEffect, useMemo, useState } from 'react'
import {
  CalendarDays,
  CheckCircle2,
  Edit3,
  Eye,
  FolderKanban,
  Image as ImageIcon,
  MapPin,
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
  if (!date) return 'Not set'

  const parsedDate = new Date(date)

  if (Number.isNaN(parsedDate.getTime())) {
    return 'Not set'
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

const emptyForm = {
  title: '',
  category: 'General',
  targetAmount: '',
  collectedAmount: '',
  shortDescription: '',
  description: '',
  location: '',
  status: 'active',
  featured: false,
  startDate: '',
  endDate: '',
  coverImage: null,
}

export default function ProjectsPage({ API, token }) {
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(false)
  const [formLoading, setFormLoading] = useState(false)
  const [actionLoadingId, setActionLoadingId] = useState('')
  const [editingProjectId, setEditingProjectId] = useState('')
  const [selectedImage, setSelectedImage] = useState('')
  const [form, setForm] = useState(emptyForm)

  const [filters, setFilters] = useState({
    search: '',
    status: 'all',
    category: '',
  })

  const totals = useMemo(() => {
    return {
      total: projects.length,
      active: projects.filter((item) => item.status === 'active').length,
      paused: projects.filter((item) => item.status === 'paused').length,
      completed: projects.filter((item) => item.status === 'completed').length,
      targetAmount: projects.reduce((sum, item) => sum + Number(item.targetAmount || 0), 0),
      collectedAmount: projects.reduce((sum, item) => sum + Number(item.collectedAmount || 0), 0),
    }
  }, [projects])

  const buildQuery = () => {
    const params = new URLSearchParams()

    if (filters.search.trim()) params.append('search', filters.search.trim())
    if (filters.status !== 'all') params.append('status', filters.status)
    if (filters.category.trim()) params.append('category', filters.category.trim())

    return params.toString()
  }

  const loadProjects = async () => {
    if (!token) return

    try {
      setLoading(true)

      const query = buildQuery()

      const res = await fetch(`${API}/api/projects/admin/all${query ? `?${query}` : ''}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data?.message || 'Failed to load projects.')
      }

      setProjects(Array.isArray(data?.projects) ? data.projects : [])
    } catch (error) {
      alert(error.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadProjects()
  }, [API, token])

  const handleFilterChange = (e) => {
    const { name, value } = e.target

    setFilters((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleFormChange = (e) => {
    const { name, value, type, checked, files } = e.target

    if (type === 'file') {
      setForm((prev) => ({
        ...prev,
        [name]: files?.[0] || null,
      }))

      return
    }

    setForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }))
  }

  const resetForm = () => {
    setEditingProjectId('')
    setForm(emptyForm)
  }

  const startEdit = (project) => {
    setEditingProjectId(project._id)

    setForm({
      title: project.title || '',
      category: project.category || 'General',
      targetAmount: project.targetAmount || '',
      collectedAmount: project.collectedAmount || '',
      shortDescription: project.shortDescription || '',
      description: project.description || '',
      location: project.location || '',
      status: project.status || 'active',
      featured: Boolean(project.featured),
      startDate: getDateInputValue(project.startDate),
      endDate: getDateInputValue(project.endDate),
      coverImage: null,
    })

    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    })
  }

  const submitProject = async (e) => {
    e.preventDefault()

    if (!token) {
      alert('Please login first.')
      return
    }

    if (!form.title.trim() || form.targetAmount === '') {
      alert('Project title and target amount are required.')
      return
    }

    try {
      setFormLoading(true)

      const formData = new FormData()

      formData.append('title', form.title)
      formData.append('category', form.category)
      formData.append('targetAmount', form.targetAmount)
      formData.append('collectedAmount', form.collectedAmount || 0)
      formData.append('shortDescription', form.shortDescription)
      formData.append('description', form.description)
      formData.append('location', form.location)
      formData.append('status', form.status)
      formData.append('featured', form.featured ? 'true' : 'false')
      formData.append('startDate', form.startDate)
      formData.append('endDate', form.endDate)

      if (form.coverImage) {
        formData.append('coverImage', form.coverImage)
      }

      const url = editingProjectId
        ? `${API}/api/projects/admin/${editingProjectId}`
        : `${API}/api/projects/admin/create`

      const res = await fetch(url, {
        method: editingProjectId ? 'PUT' : 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data?.message || 'Project save failed.')
      }

      alert(data.message || 'Project saved successfully.')
      resetForm()
      await loadProjects()
    } catch (error) {
      alert(error.message)
    } finally {
      setFormLoading(false)
    }
  }

  const updateProjectStatus = async (projectId, status) => {
    if (!token) {
      alert('Please login first.')
      return
    }

    try {
      setActionLoadingId(`status-${projectId}`)

      const res = await fetch(`${API}/api/projects/admin/${projectId}/status`, {
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
        throw new Error(data?.message || 'Status update failed.')
      }

      await loadProjects()
    } catch (error) {
      alert(error.message)
    } finally {
      setActionLoadingId('')
    }
  }

  const deleteProject = async (projectId) => {
    if (!token) {
      alert('Please login first.')
      return
    }

    const confirmed = window.confirm('Delete this project permanently?')

    if (!confirmed) return

    try {
      setActionLoadingId(`delete-${projectId}`)

      const res = await fetch(`${API}/api/projects/admin/${projectId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data?.message || 'Project delete failed.')
      }

      alert(data.message || 'Project deleted successfully.')
      await loadProjects()
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
              alt="Project"
              className="max-h-[80vh] w-full rounded-[20px] object-contain"
            />
          </div>
        </div>
      )}

      <div className="rounded-[28px] border border-blue-100 bg-white p-4 shadow-[0_14px_35px_rgba(15,23,42,0.06)] sm:rounded-[34px] sm:p-5">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="text-[9px] font-black uppercase tracking-[0.18em] text-blue-500 sm:text-[11px]">
              Project Management
            </p>

            <h2 className="mt-1 text-2xl font-black text-slate-950 sm:mt-2 sm:text-3xl">
              Projects Control
            </h2>

            <p className="mt-2 text-xs font-semibold text-slate-500 sm:text-sm">
              Create, edit, pause, complete and manage foundation donation projects.
            </p>
          </div>

          <button
            type="button"
            onClick={loadProjects}
            disabled={loading}
            className="flex h-11 items-center justify-center gap-2 rounded-2xl bg-blue-600 px-4 text-sm font-black text-white shadow-lg disabled:opacity-60"
          >
            <RefreshCcw size={16} className={loading ? 'animate-spin' : ''} />
            {loading ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
          <div className="rounded-2xl bg-slate-50 p-3 text-center">
            <p className="text-xl font-black text-slate-950">{totals.total}</p>
            <p className="text-[10px] font-bold text-slate-500">Projects</p>
          </div>

          <div className="rounded-2xl bg-emerald-50 p-3 text-center">
            <p className="text-xl font-black text-emerald-700">{totals.active}</p>
            <p className="text-[10px] font-bold text-emerald-600">Active</p>
          </div>

          <div className="rounded-2xl bg-amber-50 p-3 text-center">
            <p className="text-xl font-black text-amber-700">{totals.paused}</p>
            <p className="text-[10px] font-bold text-amber-600">Paused</p>
          </div>

          <div className="rounded-2xl bg-blue-50 p-3 text-center">
            <p className="text-xl font-black text-blue-700">{totals.completed}</p>
            <p className="text-[10px] font-bold text-blue-600">Completed</p>
          </div>

          <div className="rounded-2xl bg-violet-50 p-3 text-center lg:col-span-1">
            <p className="truncate text-lg font-black text-violet-700">{money(totals.targetAmount)}</p>
            <p className="text-[10px] font-bold text-violet-600">Target</p>
          </div>

          <div className="rounded-2xl bg-cyan-50 p-3 text-center lg:col-span-1">
            <p className="truncate text-lg font-black text-cyan-700">
              {money(totals.collectedAmount)}
            </p>
            <p className="text-[10px] font-bold text-cyan-600">Collected</p>
          </div>
        </div>
      </div>

      <form
        onSubmit={submitProject}
        className="rounded-[28px] border border-blue-100 bg-white p-4 shadow-[0_14px_35px_rgba(15,23,42,0.06)] sm:rounded-[34px] sm:p-5"
      >
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-[9px] font-black uppercase tracking-[0.18em] text-blue-500">
              {editingProjectId ? 'Edit Project' : 'Create Project'}
            </p>

            <h3 className="mt-1 text-xl font-black text-slate-950">
              {editingProjectId ? 'Update Project Information' : 'Add New Project'}
            </h3>
          </div>

          {editingProjectId && (
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
            name="title"
            placeholder="Project title"
            value={form.title}
            onChange={handleFormChange}
            className="h-12 rounded-2xl border border-blue-100 bg-slate-50 px-4 text-sm font-bold outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
          />

          <input
            type="text"
            name="category"
            placeholder="Category"
            value={form.category}
            onChange={handleFormChange}
            className="h-12 rounded-2xl border border-blue-100 bg-slate-50 px-4 text-sm font-bold outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
          />

          <input
            type="number"
            name="targetAmount"
            placeholder="Target amount"
            value={form.targetAmount}
            onChange={handleFormChange}
            className="h-12 rounded-2xl border border-blue-100 bg-slate-50 px-4 text-sm font-bold outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
          />

          <input
            type="number"
            name="collectedAmount"
            placeholder="Collected amount"
            value={form.collectedAmount}
            onChange={handleFormChange}
            className="h-12 rounded-2xl border border-blue-100 bg-slate-50 px-4 text-sm font-bold outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
          />

          <input
            type="text"
            name="location"
            placeholder="Location"
            value={form.location}
            onChange={handleFormChange}
            className="h-12 rounded-2xl border border-blue-100 bg-slate-50 px-4 text-sm font-bold outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
          />

          <select
            name="status"
            value={form.status}
            onChange={handleFormChange}
            className="h-12 rounded-2xl border border-blue-100 bg-slate-50 px-4 text-sm font-bold outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
          >
            <option value="active">Active</option>
            <option value="paused">Paused</option>
            <option value="completed">Completed</option>
          </select>

          <input
            type="date"
            name="startDate"
            value={form.startDate}
            onChange={handleFormChange}
            className="h-12 rounded-2xl border border-blue-100 bg-slate-50 px-4 text-sm font-bold outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
          />

          <input
            type="date"
            name="endDate"
            value={form.endDate}
            onChange={handleFormChange}
            className="h-12 rounded-2xl border border-blue-100 bg-slate-50 px-4 text-sm font-bold outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
          />

          <input
            type="text"
            name="shortDescription"
            placeholder="Short description"
            value={form.shortDescription}
            onChange={handleFormChange}
            className="h-12 rounded-2xl border border-blue-100 bg-slate-50 px-4 text-sm font-bold outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 md:col-span-2"
          />

          <textarea
            name="description"
            placeholder="Full description"
            value={form.description}
            onChange={handleFormChange}
            rows="4"
            className="rounded-2xl border border-blue-100 bg-slate-50 px-4 py-3 text-sm font-bold outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 md:col-span-2"
          />

          <label className="flex cursor-pointer items-center justify-center gap-2 rounded-2xl border border-dashed border-blue-200 bg-blue-50 px-4 py-4 text-sm font-black text-blue-700 md:col-span-2">
            <ImageIcon size={18} />
            {form.coverImage ? form.coverImage.name : 'Upload project cover image'}
            <input
              type="file"
              name="coverImage"
              accept="image/*"
              onChange={handleFormChange}
              className="hidden"
            />
          </label>

          <label className="flex items-center gap-3 rounded-2xl bg-slate-50 px-4 py-4 text-sm font-black text-slate-700 md:col-span-2">
            <input
              type="checkbox"
              name="featured"
              checked={form.featured}
              onChange={handleFormChange}
              className="h-5 w-5 rounded border-slate-300"
            />
            Featured project
          </label>
        </div>

        <button
          type="submit"
          disabled={formLoading}
          className="mt-5 flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-blue-600 to-cyan-500 text-sm font-black text-white shadow-lg disabled:opacity-60"
        >
          {editingProjectId ? <CheckCircle2 size={17} /> : <Plus size={17} />}
          {formLoading
            ? 'Saving...'
            : editingProjectId
              ? 'Update Project'
              : 'Create Project'}
        </button>
      </form>

      <div className="rounded-[28px] border border-blue-100 bg-white p-4 shadow-[0_14px_35px_rgba(15,23,42,0.06)] sm:rounded-[34px] sm:p-5">
        <form
          onSubmit={(e) => {
            e.preventDefault()
            loadProjects()
          }}
          className="grid gap-3 rounded-[24px] border border-slate-200 bg-slate-50 p-3 md:grid-cols-[1fr_150px_160px_auto]"
        >
          <div className="relative">
            <Search
              size={17}
              className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
            />

            <input
              type="text"
              name="search"
              placeholder="Search title, category, location"
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
            <option value="paused">Paused</option>
            <option value="completed">Completed</option>
          </select>

          <input
            type="text"
            name="category"
            placeholder="Category"
            value={filters.category}
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
              Loading projects...
            </div>
          ) : projects.length === 0 ? (
            <div className="rounded-2xl bg-slate-50 p-6 text-center text-sm font-bold text-slate-500">
              No project found.
            </div>
          ) : (
            projects.map((project) => (
              <div
                key={project._id}
                className="grid gap-4 rounded-[26px] border border-blue-100 bg-gradient-to-br from-white to-blue-50 p-4 shadow-sm xl:grid-cols-[220px_1fr_220px]"
              >
                <button
                  type="button"
                  onClick={() => project.coverImage && setSelectedImage(project.coverImage)}
                  className="relative h-44 overflow-hidden rounded-[24px] bg-blue-100"
                >
                  {project.coverImage ? (
                    <img
                      src={project.coverImage}
                      alt={project.title}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="grid h-full w-full place-items-center text-blue-500">
                      <FolderKanban size={36} />
                    </div>
                  )}

                  {project.coverImage && (
                    <span className="absolute bottom-3 right-3 grid h-9 w-9 place-items-center rounded-full bg-slate-950/80 text-white">
                      <Eye size={16} />
                    </span>
                  )}
                </button>

                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-xl font-black text-slate-950">{project.title}</h3>

                    <span
                      className={`rounded-full px-3 py-1 text-xs font-black capitalize ${
                        project.status === 'active'
                          ? 'bg-emerald-50 text-emerald-700'
                          : project.status === 'completed'
                            ? 'bg-blue-50 text-blue-700'
                            : 'bg-amber-50 text-amber-700'
                      }`}
                    >
                      {project.status}
                    </span>

                    {project.featured && (
                      <span className="rounded-full bg-violet-50 px-3 py-1 text-xs font-black text-violet-700">
                        Featured
                      </span>
                    )}
                  </div>

                  <p className="mt-2 text-sm font-bold text-slate-500">
                    {project.shortDescription || 'No short description added.'}
                  </p>

                  <div className="mt-4 grid gap-3 sm:grid-cols-3">
                    <div className="rounded-2xl bg-white p-3">
                      <p className="text-[9px] font-black uppercase tracking-[0.16em] text-blue-400">
                        Target
                      </p>
                      <p className="mt-1 text-sm font-black">{money(project.targetAmount)}</p>
                    </div>

                    <div className="rounded-2xl bg-white p-3">
                      <p className="text-[9px] font-black uppercase tracking-[0.16em] text-emerald-500">
                        Collected
                      </p>
                      <p className="mt-1 text-sm font-black">{money(project.collectedAmount)}</p>
                    </div>

                    <div className="rounded-2xl bg-white p-3">
                      <p className="text-[9px] font-black uppercase tracking-[0.16em] text-rose-400">
                        Remaining
                      </p>
                      <p className="mt-1 text-sm font-black">{money(project.remainingAmount)}</p>
                    </div>
                  </div>

                  <div className="mt-4">
                    <div className="flex items-center justify-between text-xs font-black text-slate-600">
                      <span>Progress</span>
                      <span>{project.progressPercent || 0}%</span>
                    </div>

                    <div className="mt-2 h-3 overflow-hidden rounded-full bg-slate-200">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-blue-600 to-cyan-500"
                        style={{ width: `${project.progressPercent || 0}%` }}
                      />
                    </div>
                  </div>

                  <div className="mt-4 grid gap-2 text-xs font-bold text-slate-600 sm:grid-cols-3">
                    <p className="flex items-center gap-2">
                      <MapPin size={15} />
                      {project.location || 'No location'}
                    </p>

                    <p className="flex items-center gap-2">
                      <CalendarDays size={15} />
                      {formatDate(project.startDate)}
                    </p>

                    <p className="flex items-center gap-2">
                      <CalendarDays size={15} />
                      {formatDate(project.endDate)}
                    </p>
                  </div>
                </div>

                <div className="grid content-start gap-2 rounded-[24px] bg-white p-3">
                  <select
                    value={project.status}
                    onChange={(e) => updateProjectStatus(project._id, e.target.value)}
                    disabled={actionLoadingId === `status-${project._id}`}
                    className="h-10 rounded-2xl border border-slate-200 px-3 text-xs font-black outline-none"
                  >
                    <option value="active">Active</option>
                    <option value="paused">Paused</option>
                    <option value="completed">Completed</option>
                  </select>

                  <button
                    type="button"
                    onClick={() => startEdit(project)}
                    className="flex h-10 items-center justify-center gap-2 rounded-2xl bg-blue-50 px-3 text-xs font-black text-blue-700 hover:bg-blue-100"
                  >
                    <Edit3 size={15} />
                    Edit Project
                  </button>

                  <button
                    type="button"
                    onClick={() => deleteProject(project._id)}
                    disabled={actionLoadingId === `delete-${project._id}`}
                    className="flex h-10 items-center justify-center gap-2 rounded-2xl bg-rose-600 px-3 text-xs font-black text-white hover:bg-rose-700 disabled:opacity-60"
                  >
                    <Trash2 size={15} />
                    Delete Project
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