import { useEffect, useMemo, useState } from 'react'

function money(amount) {
  return `BDT ${Number(amount || 0).toLocaleString('en-US')}`
}

function formatDate(date) {
  if (!date) return 'Not added'

  const parsedDate = new Date(date)

  if (Number.isNaN(parsedDate.getTime())) {
    return 'Not added'
  }

  return parsedDate.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

function makeImageUrl(apiBase, url) {
  if (!url) return ''

  if (
    String(url).startsWith('http://') ||
    String(url).startsWith('https://') ||
    String(url).startsWith('blob:') ||
    String(url).startsWith('data:')
  ) {
    return url
  }

  if (String(url).startsWith('/')) {
    return `${apiBase}${url}`
  }

  return `${apiBase}/${url}`
}

function getProgress(project) {
  if (typeof project.progressPercent === 'number') {
    return Math.min(Math.max(project.progressPercent, 0), 100)
  }

  const target = Number(project.targetAmount || 0)
  const collected = Number(project.collectedAmount || 0)

  if (target <= 0) return 0

  return Math.min(Math.round((collected / target) * 100), 100)
}

function getRemaining(project) {
  if (typeof project.remainingAmount === 'number') {
    return Math.max(project.remainingAmount, 0)
  }

  return Math.max(Number(project.targetAmount || 0) - Number(project.collectedAmount || 0), 0)
}

function statusClass(status) {
  if (status === 'completed') {
    return 'bg-emerald-500 text-white'
  }

  if (status === 'paused') {
    return 'bg-amber-500 text-white'
  }

  return 'bg-blue-600 text-white'
}

function statusPillClass(status) {
  if (status === 'completed') {
    return 'bg-emerald-50 text-emerald-700'
  }

  if (status === 'paused') {
    return 'bg-amber-50 text-amber-700'
  }

  return 'bg-blue-50 text-blue-700'
}

function ProjectDetailsModal({ API, project, onClose, onDonate }) {
  if (!project) return null

  const progress = getProgress(project)
  const imageUrl = makeImageUrl(API, project.coverImage)

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/75 p-3">
      <div className="relative max-h-[90vh] w-full max-w-4xl overflow-auto rounded-[26px] bg-white p-3 shadow-2xl sm:rounded-[32px] sm:p-5">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 z-10 grid h-9 w-9 place-items-center rounded-full bg-slate-950 text-white shadow-lg sm:h-10 sm:w-10"
        >
          ×
        </button>

        <div className="overflow-hidden rounded-[22px] bg-slate-100 sm:rounded-[26px]">
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={project.title}
              className="h-48 w-full object-cover sm:h-72 md:h-80"
            />
          ) : (
            <div className="grid h-48 w-full place-items-center bg-gradient-to-br from-blue-600 to-cyan-500 text-4xl font-black text-white sm:h-72 sm:text-5xl md:h-80">
              OCF
            </div>
          )}
        </div>

        <div className="mt-4 sm:mt-5">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-blue-50 px-3 py-1.5 text-[10px] font-black text-blue-700 sm:px-4 sm:py-2 sm:text-xs">
              {project.category || 'General'}
            </span>

            <span
              className={`rounded-full px-3 py-1.5 text-[10px] font-black capitalize sm:px-4 sm:py-2 sm:text-xs ${statusPillClass(
                project.status || 'active'
              )}`}
            >
              {project.status || 'active'}
            </span>
          </div>

          <h2 className="mt-3 text-2xl font-black tracking-[-0.04em] text-slate-950 sm:mt-4 sm:text-4xl">
            {project.title}
          </h2>

          <p className="mt-2 text-xs font-semibold leading-6 text-slate-500 sm:mt-3 sm:text-sm sm:leading-7">
            {project.description ||
              project.shortDescription ||
              'No project description added yet.'}
          </p>

          <div className="mt-4 grid grid-cols-3 gap-2 sm:mt-5 sm:gap-3">
            <div className="min-w-0 rounded-2xl bg-slate-50 p-3 sm:p-4">
              <p className="text-[8px] font-black uppercase tracking-[0.12em] text-slate-400 sm:text-[10px]">
                Target
              </p>
              <p className="mt-1 truncate text-[11px] font-black text-slate-950 sm:mt-2 sm:text-lg">
                {money(project.targetAmount)}
              </p>
            </div>

            <div className="min-w-0 rounded-2xl bg-emerald-50 p-3 sm:p-4">
              <p className="text-[8px] font-black uppercase tracking-[0.12em] text-emerald-500 sm:text-[10px]">
                Collected
              </p>
              <p className="mt-1 truncate text-[11px] font-black text-emerald-700 sm:mt-2 sm:text-lg">
                {money(project.collectedAmount)}
              </p>
            </div>

            <div className="min-w-0 rounded-2xl bg-rose-50 p-3 sm:p-4">
              <p className="text-[8px] font-black uppercase tracking-[0.12em] text-rose-500 sm:text-[10px]">
                Remaining
              </p>
              <p className="mt-1 truncate text-[11px] font-black text-rose-700 sm:mt-2 sm:text-lg">
                {money(getRemaining(project))}
              </p>
            </div>
          </div>

          <div className="mt-4 sm:mt-5">
            <div className="flex items-center justify-between text-[10px] font-black text-slate-500 sm:text-xs">
              <span>Progress</span>
              <span>{progress}%</span>
            </div>

            <div className="mt-2 h-3 overflow-hidden rounded-full bg-slate-100 sm:h-4">
              <div
                className="h-full rounded-full bg-gradient-to-r from-blue-600 to-cyan-400 transition-all duration-700"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {project.status !== 'completed' && (
            <button
              type="button"
              onClick={() => onDonate(project)}
              className="mt-5 h-12 w-full rounded-2xl bg-gradient-to-r from-blue-600 to-cyan-500 px-5 text-sm font-black text-white shadow-[0_18px_38px_rgba(37,99,235,0.25)] transition hover:-translate-y-1"
            >
              Donate to This Project
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

function ProjectCard({ API, project, onDetails, onDonate }) {
  const progress = getProgress(project)
  const remaining = getRemaining(project)
  const imageUrl = makeImageUrl(API, project.coverImage)
  const isCompleted = project.status === 'completed'

  return (
    <article className="group overflow-hidden rounded-[24px] border border-blue-100 bg-white shadow-[0_14px_34px_rgba(15,23,42,0.06)] transition duration-500 hover:-translate-y-1 hover:shadow-[0_22px_55px_rgba(37,99,235,0.14)] sm:rounded-[30px]">
      <button
        type="button"
        onClick={() => onDetails(project)}
        className="relative block h-40 w-full overflow-hidden bg-slate-100 sm:h-52"
      >
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={project.title}
            className="h-full w-full object-cover transition duration-700 group-hover:scale-110"
          />
        ) : (
          <div className="grid h-full w-full place-items-center bg-gradient-to-br from-blue-600 to-cyan-500 text-4xl font-black text-white">
            OCF
          </div>
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/75 via-slate-950/10 to-transparent" />

        <div className="absolute left-3 top-3 flex max-w-[calc(100%-24px)] flex-wrap gap-1.5 sm:left-4 sm:top-4 sm:gap-2">
          <span className="max-w-[120px] truncate rounded-full bg-white/90 px-2.5 py-1 text-[8px] font-black text-blue-700 backdrop-blur sm:max-w-[170px] sm:px-3 sm:text-[10px]">
            {project.category || 'General'}
          </span>

          <span
            className={`rounded-full px-2.5 py-1 text-[8px] font-black capitalize backdrop-blur sm:px-3 sm:text-[10px] ${statusClass(
              project.status || 'active'
            )}`}
          >
            {project.status || 'active'}
          </span>
        </div>

        <div className="absolute bottom-3 left-3 right-3 text-left sm:bottom-4 sm:left-4 sm:right-4">
          <h3 className="line-clamp-2 text-base font-black leading-tight text-white sm:text-xl">
            {project.title}
          </h3>

          <p className="mt-1 truncate text-[10px] font-bold text-blue-100 sm:text-xs">
            {project.location || 'Location not added'}
          </p>
        </div>
      </button>

      <div className="p-3 sm:p-4">
        <p className="line-clamp-2 min-h-9 text-xs font-semibold leading-5 text-slate-500 sm:min-h-10 sm:text-sm">
          {project.shortDescription || project.description || 'No short description added yet.'}
        </p>

        <div className="mt-3 grid grid-cols-3 gap-2 sm:mt-4">
          <div className="min-w-0 rounded-2xl bg-slate-50 p-2.5 sm:p-3">
            <p className="text-[7px] font-black uppercase text-slate-400 sm:text-[9px]">
              Target
            </p>
            <p className="mt-1 truncate text-[9px] font-black text-slate-950 sm:text-xs">
              {money(project.targetAmount)}
            </p>
          </div>

          <div className="min-w-0 rounded-2xl bg-emerald-50 p-2.5 sm:p-3">
            <p className="text-[7px] font-black uppercase text-emerald-500 sm:text-[9px]">
              Collected
            </p>
            <p className="mt-1 truncate text-[9px] font-black text-emerald-700 sm:text-xs">
              {money(project.collectedAmount)}
            </p>
          </div>

          <div className="min-w-0 rounded-2xl bg-rose-50 p-2.5 sm:p-3">
            <p className="text-[7px] font-black uppercase text-rose-500 sm:text-[9px]">
              Remaining
            </p>
            <p className="mt-1 truncate text-[9px] font-black text-rose-700 sm:text-xs">
              {money(remaining)}
            </p>
          </div>
        </div>

        <div className="mt-3 sm:mt-4">
          <div className="flex items-center justify-between text-[10px] font-black text-slate-500 sm:text-xs">
            <span>Progress</span>
            <span>{progress}%</span>
          </div>

          <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-slate-100 sm:h-3">
            <div
              className="h-full rounded-full bg-gradient-to-r from-blue-600 to-cyan-400 transition-all duration-700"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        <div className="mt-3 flex items-center justify-between gap-2 text-[9px] font-bold text-slate-400 sm:mt-4 sm:text-xs">
          <span className="truncate">Start: {formatDate(project.startDate)}</span>
          <span className="truncate">End: {formatDate(project.endDate)}</span>
        </div>

        <div className="mt-3 grid grid-cols-2 gap-2 sm:mt-4">
          <button
            type="button"
            onClick={() => onDetails(project)}
            className="h-10 rounded-2xl bg-slate-100 px-3 text-[11px] font-black text-slate-700 transition hover:-translate-y-1 hover:bg-slate-200 sm:h-11 sm:text-xs"
          >
            Details
          </button>

          <button
            type="button"
            onClick={() => onDonate(project)}
            disabled={isCompleted}
            className={`h-10 rounded-2xl px-3 text-[11px] font-black shadow-lg transition sm:h-11 sm:text-xs ${
              isCompleted
                ? 'cursor-not-allowed bg-slate-100 text-slate-400 shadow-none'
                : 'bg-gradient-to-r from-blue-600 to-cyan-500 text-white hover:-translate-y-1'
            }`}
          >
            {isCompleted ? 'Completed' : 'Donate'}
          </button>
        </div>
      </div>
    </article>
  )
}

function CompletedProjectCard({ API, project, onDetails }) {
  const imageUrl = makeImageUrl(API, project.coverImage)
  const progress = getProgress(project)

  return (
    <button
      type="button"
      onClick={() => onDetails(project)}
      className="group w-[72vw] min-w-[72vw] overflow-hidden rounded-[22px] border border-emerald-100 bg-white text-left shadow-[0_12px_30px_rgba(15,23,42,0.06)] transition hover:-translate-y-1 sm:w-[270px] sm:min-w-[270px] md:w-[300px] md:min-w-[300px]"
    >
      <div className="relative h-32 overflow-hidden bg-slate-100 sm:h-40">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={project.title}
            className="h-full w-full object-cover transition duration-700 group-hover:scale-110"
          />
        ) : (
          <div className="grid h-full w-full place-items-center bg-gradient-to-br from-emerald-600 to-cyan-500 text-3xl font-black text-white">
            OCF
          </div>
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/75 via-transparent to-transparent" />

        <span className="absolute left-3 top-3 rounded-full bg-emerald-500 px-3 py-1 text-[8px] font-black text-white">
          Completed
        </span>

        <div className="absolute bottom-3 left-3 right-3">
          <h4 className="line-clamp-2 text-sm font-black leading-tight text-white sm:text-lg">
            {project.title}
          </h4>

          <p className="mt-1 truncate text-[9px] font-bold text-emerald-50 sm:text-xs">
            {project.location || 'Location not added'}
          </p>
        </div>
      </div>

      <div className="p-3">
        <div className="grid grid-cols-2 gap-2">
          <div className="min-w-0 rounded-2xl bg-emerald-50 p-2">
            <p className="text-[7px] font-black uppercase text-emerald-500">Collected</p>
            <p className="mt-1 truncate text-[10px] font-black text-emerald-700">
              {money(project.collectedAmount)}
            </p>
          </div>

          <div className="min-w-0 rounded-2xl bg-slate-50 p-2">
            <p className="text-[7px] font-black uppercase text-slate-400">Progress</p>
            <p className="mt-1 truncate text-[10px] font-black text-slate-950">{progress}%</p>
          </div>
        </div>

        <p className="mt-3 text-[9px] font-black text-slate-400">Tap for details</p>
      </div>
    </button>
  )
}

export default function ProjectsPage({ API }) {
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(false)
  const [selectedProject, setSelectedProject] = useState(null)
  const [filters, setFilters] = useState({
    search: '',
    category: 'all',
    status: 'active',
  })

  const categories = useMemo(() => {
    const uniqueCategories = new Set()

    projects.forEach((project) => {
      if (project.category) {
        uniqueCategories.add(project.category)
      }
    })

    return Array.from(uniqueCategories).sort()
  }, [projects])

  const activeProjects = useMemo(() => {
    return projects.filter((project) => project.status === 'active' || !project.status)
  }, [projects])

  const completedProjects = useMemo(() => {
    return projects
      .filter((project) => project.status === 'completed')
      .sort((a, b) => new Date(b.updatedAt || b.endDate || 0) - new Date(a.updatedAt || a.endDate || 0))
      .slice(0, 8)
  }, [projects])

  const filteredProjects = useMemo(() => {
    return projects.filter((project) => {
      const searchText = `${project.title || ''} ${project.category || ''} ${
        project.location || ''
      } ${project.shortDescription || ''} ${project.description || ''}`.toLowerCase()

      const matchSearch = filters.search.trim()
        ? searchText.includes(filters.search.trim().toLowerCase())
        : true

      const matchCategory =
        filters.category === 'all' ? true : project.category === filters.category

      const matchStatus = filters.status === 'all' ? true : project.status === filters.status

      return matchSearch && matchCategory && matchStatus
    })
  }, [projects, filters])

  const summary = useMemo(() => {
    const baseProjects = filters.status === 'active' ? activeProjects : filteredProjects

    const totalTarget = baseProjects.reduce(
      (sum, project) => sum + Number(project.targetAmount || 0),
      0
    )

    const totalCollected = baseProjects.reduce(
      (sum, project) => sum + Number(project.collectedAmount || 0),
      0
    )

    const totalRemaining = Math.max(totalTarget - totalCollected, 0)

    return {
      totalTarget,
      totalCollected,
      totalRemaining,
      active: activeProjects.length,
      completed: completedProjects.length,
    }
  }, [activeProjects, completedProjects.length, filteredProjects, filters.status])

  const loadProjects = async () => {
    try {
      setLoading(true)

      const res = await fetch(`${API}/api/projects`)
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
  }, [API])

  const handleFilterChange = (e) => {
    const { name, value } = e.target

    setFilters((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const goToDonate = (project) => {
    if (project?.status === 'completed') return

    const projectId = project?._id || project?.id || project?.slug || ''

    const nextUrl = projectId
      ? `/donate?project=${encodeURIComponent(projectId)}`
      : '/donate'

    window.history.pushState({}, '', nextUrl)
    window.dispatchEvent(new PopStateEvent('popstate'))
  }

  return (
    <section className="min-h-screen overflow-x-hidden bg-[#eef4ff] px-2 pb-36 pt-3 text-slate-950 sm:px-5 md:px-6">
      <ProjectDetailsModal
        API={API}
        project={selectedProject}
        onClose={() => setSelectedProject(null)}
        onDonate={goToDonate}
      />

      <div className="relative overflow-hidden rounded-[24px] bg-[radial-gradient(circle_at_85%_20%,rgba(96,165,250,0.45),transparent_28%),linear-gradient(135deg,#020617,#172554_45%,#2563eb)] p-4 text-white shadow-[0_18px_45px_rgba(37,99,235,0.20)] sm:rounded-[32px] sm:p-7 md:p-8">
        <div className="absolute -right-16 -top-16 h-56 w-56 rounded-full bg-white/10 blur-3xl motion-safe:animate-pulse" />
        <div className="absolute -bottom-24 left-10 h-64 w-64 rounded-full bg-cyan-400/20 blur-3xl" />

        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-[8px] font-black uppercase tracking-[0.16em] text-blue-100 backdrop-blur-xl sm:px-4 sm:py-2 sm:text-[10px]">
            Open Care Foundation
          </div>

          <h1 className="mt-4 max-w-3xl text-[30px] font-black leading-[0.92] tracking-[-0.06em] sm:mt-6 sm:text-6xl">
            Support Real Projects
          </h1>

          <p className="mt-3 max-w-2xl text-[11px] font-semibold leading-5 text-blue-100/85 sm:mt-4 sm:text-sm sm:leading-7">
            Choose a project, see target, collected and remaining fund, then donate.
          </p>

          <div className="mt-5 grid grid-cols-3 gap-2 sm:mt-7 sm:max-w-2xl sm:gap-3">
            <div className="min-w-0 rounded-2xl border border-white/15 bg-white/10 p-2.5 backdrop-blur-xl sm:p-3">
              <p className="truncate text-lg font-black sm:text-2xl">{summary.active}</p>
              <p className="text-[8px] font-bold text-blue-100 sm:text-[10px]">Active</p>
            </div>

            <div className="min-w-0 rounded-2xl border border-white/15 bg-white/10 p-2.5 backdrop-blur-xl sm:p-3">
              <p className="truncate text-lg font-black sm:text-2xl">
                {money(summary.totalCollected)}
              </p>
              <p className="text-[8px] font-bold text-blue-100 sm:text-[10px]">Collected</p>
            </div>

            <div className="min-w-0 rounded-2xl border border-white/15 bg-white/10 p-2.5 backdrop-blur-xl sm:p-3">
              <p className="truncate text-lg font-black sm:text-2xl">
                {money(summary.totalRemaining)}
              </p>
              <p className="text-[8px] font-bold text-blue-100 sm:text-[10px]">Remaining</p>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-4 rounded-[24px] border border-blue-100 bg-white p-3 shadow-[0_14px_35px_rgba(15,23,42,0.06)] sm:rounded-[28px] sm:p-4">
        <div className="grid gap-2 md:grid-cols-[1fr_170px_150px_auto]">
          <input
            type="text"
            name="search"
            placeholder="Search project, category or location"
            value={filters.search}
            onChange={handleFilterChange}
            className="h-11 rounded-2xl border border-blue-100 bg-slate-50 px-4 text-xs font-bold outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100 sm:h-12 sm:text-sm"
          />

          <select
            name="category"
            value={filters.category}
            onChange={handleFilterChange}
            className="h-11 rounded-2xl border border-blue-100 bg-slate-50 px-4 text-xs font-bold outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100 sm:h-12 sm:text-sm"
          >
            <option value="all">All category</option>
            {categories.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>

          <select
            name="status"
            value={filters.status}
            onChange={handleFilterChange}
            className="h-11 rounded-2xl border border-blue-100 bg-slate-50 px-4 text-xs font-bold outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100 sm:h-12 sm:text-sm"
          >
            <option value="active">Active</option>
            <option value="completed">Completed</option>
            <option value="paused">Paused</option>
            <option value="all">All status</option>
          </select>

          <button
            type="button"
            onClick={loadProjects}
            disabled={loading}
            className="h-11 rounded-2xl bg-slate-950 px-5 text-xs font-black text-white shadow-lg transition hover:-translate-y-1 disabled:opacity-60 sm:h-12 sm:text-sm"
          >
            {loading ? 'Loading...' : 'Refresh'}
          </button>
        </div>
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {loading ? (
          <div className="rounded-[24px] bg-white p-6 text-center text-sm font-bold text-slate-500 shadow-sm sm:col-span-2 xl:col-span-3">
            Loading projects...
          </div>
        ) : filteredProjects.length === 0 ? (
          <div className="rounded-[24px] bg-white p-6 text-center text-sm font-bold text-slate-500 shadow-sm sm:col-span-2 xl:col-span-3">
            No project found.
          </div>
        ) : (
          filteredProjects.map((project) => (
            <ProjectCard
              key={project._id || project.slug}
              API={API}
              project={project}
              onDetails={setSelectedProject}
              onDonate={goToDonate}
            />
          ))
        )}
      </div>

      {completedProjects.length > 0 && (
        <div className="mt-7 rounded-[24px] border border-emerald-100 bg-white p-3 shadow-[0_14px_35px_rgba(15,23,42,0.06)] sm:rounded-[28px] sm:p-4">
          <div className="mb-3 flex items-center justify-between gap-2">
            <div className="min-w-0">
              <p className="text-[8px] font-black uppercase tracking-[0.18em] text-emerald-600 sm:text-[10px]">
                Recent Complete
              </p>
              <h2 className="truncate text-lg font-black tracking-[-0.04em] text-slate-950 sm:text-2xl">
                Recently Completed Projects
              </h2>
            </div>

            <button
              type="button"
              onClick={() =>
                setFilters((prev) => ({
                  ...prev,
                  status: 'completed',
                }))
              }
              className="shrink-0 rounded-full bg-emerald-50 px-3 py-1.5 text-[9px] font-black text-emerald-700"
            >
              View
            </button>
          </div>

          <div className="-mx-1 flex snap-x gap-3 overflow-x-auto px-1 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {completedProjects.map((project) => (
              <CompletedProjectCard
                key={project._id || project.slug}
                API={API}
                project={project}
                onDetails={setSelectedProject}
              />
            ))}
          </div>
        </div>
      )}
    </section>
  )
}