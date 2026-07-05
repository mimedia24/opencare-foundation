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
    const totalTarget = filteredProjects.reduce(
      (sum, project) => sum + Number(project.targetAmount || 0),
      0
    )

    const totalCollected = filteredProjects.reduce(
      (sum, project) => sum + Number(project.collectedAmount || 0),
      0
    )

    const totalRemaining = Math.max(totalTarget - totalCollected, 0)

    return {
      totalTarget,
      totalCollected,
      totalRemaining,
      active: projects.filter((project) => project.status === 'active').length,
      completed: projects.filter((project) => project.status === 'completed').length,
    }
  }, [projects, filteredProjects])

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
    const projectId = project?._id || project?.id || project?.slug || ''

    const nextUrl = projectId
      ? `/donate?project=${encodeURIComponent(projectId)}`
      : '/donate'

    window.history.pushState({}, '', nextUrl)
    window.dispatchEvent(new PopStateEvent('popstate'))
  }

  return (
    <section className="min-h-screen bg-[#eef4ff] px-4 pb-28 pt-5 text-slate-950 sm:px-5 md:px-6">
      {selectedProject && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/75 p-4">
          <div className="relative max-h-[90vh] w-full max-w-4xl overflow-auto rounded-[32px] bg-white p-4 shadow-2xl sm:p-5">
            <button
              type="button"
              onClick={() => setSelectedProject(null)}
              className="absolute right-4 top-4 z-10 grid h-10 w-10 place-items-center rounded-full bg-slate-950 text-white shadow-lg"
            >
              ×
            </button>

            <div className="overflow-hidden rounded-[26px] bg-slate-100">
              {selectedProject.coverImage ? (
                <img
                  src={selectedProject.coverImage}
                  alt={selectedProject.title}
                  className="h-64 w-full object-cover sm:h-80"
                />
              ) : (
                <div className="grid h-64 w-full place-items-center bg-gradient-to-br from-blue-600 to-cyan-500 text-5xl font-black text-white sm:h-80">
                  OCF
                </div>
              )}
            </div>

            <div className="mt-5">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-blue-50 px-4 py-2 text-xs font-black text-blue-700">
                  {selectedProject.category || 'General'}
                </span>

                <span
                  className={`rounded-full px-4 py-2 text-xs font-black capitalize ${
                    selectedProject.status === 'completed'
                      ? 'bg-emerald-50 text-emerald-700'
                      : selectedProject.status === 'paused'
                        ? 'bg-amber-50 text-amber-700'
                        : 'bg-cyan-50 text-cyan-700'
                  }`}
                >
                  {selectedProject.status || 'active'}
                </span>
              </div>

              <h2 className="mt-4 text-3xl font-black tracking-[-0.04em] text-slate-950 sm:text-4xl">
                {selectedProject.title}
              </h2>

              <p className="mt-3 text-sm font-semibold leading-7 text-slate-500">
                {selectedProject.description ||
                  selectedProject.shortDescription ||
                  'No project description added yet.'}
              </p>

              <div className="mt-5 grid gap-3 sm:grid-cols-3">
                <div className="rounded-2xl bg-slate-50 p-4">
                  <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">
                    Target
                  </p>
                  <p className="mt-2 text-lg font-black text-slate-950">
                    {money(selectedProject.targetAmount)}
                  </p>
                </div>

                <div className="rounded-2xl bg-emerald-50 p-4">
                  <p className="text-[10px] font-black uppercase tracking-[0.16em] text-emerald-500">
                    Collected
                  </p>
                  <p className="mt-2 text-lg font-black text-emerald-700">
                    {money(selectedProject.collectedAmount)}
                  </p>
                </div>

                <div className="rounded-2xl bg-rose-50 p-4">
                  <p className="text-[10px] font-black uppercase tracking-[0.16em] text-rose-500">
                    Remaining
                  </p>
                  <p className="mt-2 text-lg font-black text-rose-700">
                    {money(getRemaining(selectedProject))}
                  </p>
                </div>
              </div>

              <div className="mt-5">
                <div className="flex items-center justify-between text-xs font-black text-slate-500">
                  <span>Progress</span>
                  <span>{getProgress(selectedProject)}%</span>
                </div>

                <div className="mt-2 h-4 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-blue-600 to-cyan-400 transition-all duration-700"
                    style={{ width: `${getProgress(selectedProject)}%` }}
                  />
                </div>
              </div>

              <button
                type="button"
                onClick={() => goToDonate(selectedProject)}
                className="mt-6 h-13 w-full rounded-2xl bg-gradient-to-r from-blue-600 to-cyan-500 px-5 py-4 text-sm font-black text-white shadow-[0_18px_38px_rgba(37,99,235,0.25)] transition hover:-translate-y-1"
              >
                Donate to This Project
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="relative overflow-hidden rounded-[32px] bg-[radial-gradient(circle_at_85%_20%,rgba(96,165,250,0.45),transparent_28%),linear-gradient(135deg,#020617,#172554_45%,#2563eb)] p-5 text-white shadow-[0_22px_55px_rgba(37,99,235,0.20)] sm:p-7 md:p-8">
        <div className="absolute -right-20 -top-20 h-72 w-72 rounded-full bg-white/10 blur-3xl motion-safe:animate-pulse" />
        <div className="absolute -bottom-24 left-10 h-72 w-72 rounded-full bg-cyan-400/20 blur-3xl" />

        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-[10px] font-black uppercase tracking-[0.22em] text-blue-100 backdrop-blur-xl">
            Open Care Foundation
          </div>

          <h1 className="mt-6 max-w-3xl text-[40px] font-black leading-[0.92] tracking-[-0.06em] sm:text-6xl">
            Support Real Projects
          </h1>

          <p className="mt-4 max-w-2xl text-sm font-semibold leading-7 text-blue-100/85">
            Choose a project, see the target, collected amount and remaining fund, then donate with
            your transaction proof.
          </p>

          <div className="mt-7 grid grid-cols-3 gap-2 sm:max-w-2xl sm:gap-3">
            <div className="rounded-2xl border border-white/15 bg-white/10 p-3 backdrop-blur-xl">
              <p className="text-lg font-black sm:text-2xl">{filteredProjects.length}</p>
              <p className="text-[10px] font-bold text-blue-100">Projects</p>
            </div>

            <div className="rounded-2xl border border-white/15 bg-white/10 p-3 backdrop-blur-xl">
              <p className="truncate text-lg font-black sm:text-2xl">
                {money(summary.totalCollected)}
              </p>
              <p className="text-[10px] font-bold text-blue-100">Collected</p>
            </div>

            <div className="rounded-2xl border border-white/15 bg-white/10 p-3 backdrop-blur-xl">
              <p className="truncate text-lg font-black sm:text-2xl">
                {money(summary.totalRemaining)}
              </p>
              <p className="text-[10px] font-bold text-blue-100">Remaining</p>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-4 rounded-[28px] border border-blue-100 bg-white p-4 shadow-[0_14px_35px_rgba(15,23,42,0.06)]">
        <div className="grid gap-3 md:grid-cols-[1fr_170px_150px_auto]">
          <input
            type="text"
            name="search"
            placeholder="Search project, category or location"
            value={filters.search}
            onChange={handleFilterChange}
            className="h-12 rounded-2xl border border-blue-100 bg-slate-50 px-4 text-sm font-bold outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
          />

          <select
            name="category"
            value={filters.category}
            onChange={handleFilterChange}
            className="h-12 rounded-2xl border border-blue-100 bg-slate-50 px-4 text-sm font-bold outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
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
            className="h-12 rounded-2xl border border-blue-100 bg-slate-50 px-4 text-sm font-bold outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
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
            className="h-12 rounded-2xl bg-slate-950 px-5 text-sm font-black text-white shadow-lg transition hover:-translate-y-1 disabled:opacity-60"
          >
            {loading ? 'Loading...' : 'Refresh'}
          </button>
        </div>
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {loading ? (
          <div className="rounded-[28px] bg-white p-6 text-center text-sm font-bold text-slate-500 shadow-sm sm:col-span-2 xl:col-span-3">
            Loading projects...
          </div>
        ) : filteredProjects.length === 0 ? (
          <div className="rounded-[28px] bg-white p-6 text-center text-sm font-bold text-slate-500 shadow-sm sm:col-span-2 xl:col-span-3">
            No project found.
          </div>
        ) : (
          filteredProjects.map((project) => {
            const progress = getProgress(project)
            const remaining = getRemaining(project)

            return (
              <article
                key={project._id || project.slug}
                className="group overflow-hidden rounded-[30px] border border-blue-100 bg-white shadow-[0_16px_40px_rgba(15,23,42,0.06)] transition duration-500 hover:-translate-y-2 hover:shadow-[0_24px_65px_rgba(37,99,235,0.16)]"
              >
                <button
                  type="button"
                  onClick={() => setSelectedProject(project)}
                  className="relative block h-52 w-full overflow-hidden bg-slate-100"
                >
                  {project.coverImage ? (
                    <img
                      src={project.coverImage}
                      alt={project.title}
                      className="h-full w-full object-cover transition duration-700 group-hover:scale-110"
                    />
                  ) : (
                    <div className="grid h-full w-full place-items-center bg-gradient-to-br from-blue-600 to-cyan-500 text-4xl font-black text-white">
                      OCF
                    </div>
                  )}

                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/65 via-transparent to-transparent" />

                  <div className="absolute left-4 top-4 flex flex-wrap gap-2">
                    <span className="rounded-full bg-white/90 px-3 py-1 text-[10px] font-black text-blue-700 backdrop-blur">
                      {project.category || 'General'}
                    </span>

                    <span
                      className={`rounded-full px-3 py-1 text-[10px] font-black capitalize backdrop-blur ${
                        project.status === 'completed'
                          ? 'bg-emerald-500 text-white'
                          : project.status === 'paused'
                            ? 'bg-amber-500 text-white'
                            : 'bg-blue-600 text-white'
                      }`}
                    >
                      {project.status || 'active'}
                    </span>
                  </div>

                  <div className="absolute bottom-4 left-4 right-4 text-left">
                    <h3 className="line-clamp-2 text-xl font-black leading-tight text-white">
                      {project.title}
                    </h3>

                    <p className="mt-1 text-xs font-bold text-blue-100">
                      {project.location || 'Location not added'}
                    </p>
                  </div>
                </button>

                <div className="p-4">
                  <p className="line-clamp-2 min-h-10 text-sm font-semibold leading-5 text-slate-500">
                    {project.shortDescription ||
                      project.description ||
                      'No short description added yet.'}
                  </p>

                  <div className="mt-4 grid grid-cols-3 gap-2">
                    <div className="rounded-2xl bg-slate-50 p-3">
                      <p className="text-[9px] font-black uppercase text-slate-400">Target</p>
                      <p className="mt-1 truncate text-xs font-black text-slate-950">
                        {money(project.targetAmount)}
                      </p>
                    </div>

                    <div className="rounded-2xl bg-emerald-50 p-3">
                      <p className="text-[9px] font-black uppercase text-emerald-500">
                        Collected
                      </p>
                      <p className="mt-1 truncate text-xs font-black text-emerald-700">
                        {money(project.collectedAmount)}
                      </p>
                    </div>

                    <div className="rounded-2xl bg-rose-50 p-3">
                      <p className="text-[9px] font-black uppercase text-rose-500">
                        Remaining
                      </p>
                      <p className="mt-1 truncate text-xs font-black text-rose-700">
                        {money(remaining)}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4">
                    <div className="flex items-center justify-between text-xs font-black text-slate-500">
                      <span>Progress</span>
                      <span>{progress}%</span>
                    </div>

                    <div className="mt-2 h-3 overflow-hidden rounded-full bg-slate-100">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-blue-600 to-cyan-400 transition-all duration-700"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>

                  <div className="mt-4 flex items-center justify-between gap-3 text-xs font-bold text-slate-400">
                    <span>Start: {formatDate(project.startDate)}</span>
                    <span>End: {formatDate(project.endDate)}</span>
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setSelectedProject(project)}
                      className="h-11 rounded-2xl bg-slate-100 px-4 text-xs font-black text-slate-700 transition hover:-translate-y-1 hover:bg-slate-200"
                    >
                      Details
                    </button>

                    <button
                      type="button"
                      onClick={() => goToDonate(project)}
                      className="h-11 rounded-2xl bg-gradient-to-r from-blue-600 to-cyan-500 px-4 text-xs font-black text-white shadow-lg transition hover:-translate-y-1"
                    >
                      Donate
                    </button>
                  </div>
                </div>
              </article>
            )
          })
        )}
      </div>
    </section>
  )
}