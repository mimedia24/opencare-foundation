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

export default function TransparencyPage({ API }) {
  const apiBase = API || import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'

  const [expenses, setExpenses] = useState([])
  const [loading, setLoading] = useState(false)
  const [selectedImage, setSelectedImage] = useState('')
  const [selectedExpense, setSelectedExpense] = useState(null)
  const [filters, setFilters] = useState({
    search: '',
    category: 'all',
    project: 'all',
  })

  const categories = useMemo(() => {
    const uniqueCategories = new Set()

    expenses.forEach((expense) => {
      if (expense.category) {
        uniqueCategories.add(expense.category)
      }
    })

    return Array.from(uniqueCategories).sort()
  }, [expenses])

  const projects = useMemo(() => {
    const uniqueProjects = new Set()

    expenses.forEach((expense) => {
      const projectName = expense.projectTitle || expense.project?.title || ''

      if (projectName) {
        uniqueProjects.add(projectName)
      }
    })

    return Array.from(uniqueProjects).sort()
  }, [expenses])

  const filteredExpenses = useMemo(() => {
    return expenses.filter((expense) => {
      const projectName = expense.projectTitle || expense.project?.title || ''

      const searchText = `${expense.title || ''} ${expense.category || ''} ${
        expense.description || ''
      } ${projectName}`.toLowerCase()

      const matchSearch = filters.search.trim()
        ? searchText.includes(filters.search.trim().toLowerCase())
        : true

      const matchCategory =
        filters.category === 'all' ? true : expense.category === filters.category

      const matchProject = filters.project === 'all' ? true : projectName === filters.project

      return matchSearch && matchCategory && matchProject
    })
  }, [expenses, filters])

  const summary = useMemo(() => {
    const totalExpense = filteredExpenses.reduce(
      (sum, expense) => sum + Number(expense.amount || 0),
      0
    )

    const proofCount = filteredExpenses.filter(
      (expense) => expense.proofImage || expense.proofLink
    ).length

    return {
      totalExpense,
      totalRecords: filteredExpenses.length,
      proofCount,
      categoryCount: categories.length,
    }
  }, [filteredExpenses, categories])

  const categorySummary = useMemo(() => {
    const map = new Map()

    filteredExpenses.forEach((expense) => {
      const category = expense.category || 'General Expense'

      if (!map.has(category)) {
        map.set(category, {
          name: category,
          amount: 0,
          count: 0,
        })
      }

      const current = map.get(category)
      current.amount += Number(expense.amount || 0)
      current.count += 1
    })

    return Array.from(map.values()).sort((a, b) => b.amount - a.amount)
  }, [filteredExpenses])

  const loadExpenses = async () => {
    try {
      setLoading(true)

      const res = await fetch(`${apiBase}/api/expenses`)
      const data = await res.json()

      if (!res.ok) {
        throw new Error(data?.message || 'Failed to load transparency data.')
      }

      setExpenses(Array.isArray(data?.expenses) ? data.expenses : [])
    } catch (error) {
      alert(error.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadExpenses()
  }, [apiBase])

  const handleFilterChange = (e) => {
    const { name, value } = e.target

    setFilters((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const clearFilters = () => {
    setFilters({
      search: '',
      category: 'all',
      project: 'all',
    })
  }

  const goToDonate = () => {
    window.history.pushState({}, '', '/donate')
    window.dispatchEvent(new PopStateEvent('popstate'))
  }

  return (
    <section className="min-h-screen bg-[#eef4ff] px-4 pb-28 pt-5 text-slate-950 sm:px-5 md:px-6">
      {selectedImage && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/80 p-4">
          <div className="relative w-full max-w-4xl overflow-hidden rounded-[28px] bg-white p-3 shadow-2xl sm:rounded-[30px] sm:p-4">
            <button
              type="button"
              onClick={() => setSelectedImage('')}
              className="absolute right-4 top-4 z-10 grid h-10 w-10 place-items-center rounded-full bg-slate-950 text-white shadow-lg"
            >
              ×
            </button>

            <img
              src={selectedImage}
              alt="Expense proof"
              className="max-h-[78vh] w-full rounded-[20px] object-contain sm:rounded-[22px]"
            />
          </div>
        </div>
      )}

      {selectedExpense && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/75 p-4">
          <div className="relative max-h-[90vh] w-full max-w-3xl overflow-auto rounded-[32px] bg-white p-4 shadow-2xl sm:p-5">
            <button
              type="button"
              onClick={() => setSelectedExpense(null)}
              className="absolute right-4 top-4 z-10 grid h-10 w-10 place-items-center rounded-full bg-slate-950 text-white shadow-lg"
            >
              ×
            </button>

            <div className="overflow-hidden rounded-[26px] bg-slate-100">
              {selectedExpense.proofImage ? (
                <img
                  src={makeImageUrl(apiBase, selectedExpense.proofImage)}
                  alt={selectedExpense.title}
                  className="h-60 w-full object-cover sm:h-80"
                />
              ) : (
                <div className="grid h-60 w-full place-items-center bg-gradient-to-br from-rose-600 to-orange-500 text-4xl font-black text-white sm:h-80">
                  OCF
                </div>
              )}
            </div>

            <div className="mt-5">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-rose-50 px-4 py-2 text-xs font-black text-rose-700">
                  {selectedExpense.category || 'General Expense'}
                </span>

                <span className="rounded-full bg-blue-50 px-4 py-2 text-xs font-black text-blue-700">
                  {selectedExpense.projectTitle ||
                    selectedExpense.project?.title ||
                    'General Fund'}
                </span>
              </div>

              <h2 className="mt-4 text-3xl font-black tracking-[-0.04em] text-slate-950 sm:text-4xl">
                {selectedExpense.title}
              </h2>

              <p className="mt-3 text-sm font-semibold leading-7 text-slate-500">
                {selectedExpense.description || 'No description added.'}
              </p>

              <div className="mt-5 grid gap-3 sm:grid-cols-3">
                <div className="rounded-2xl bg-rose-50 p-4">
                  <p className="text-[10px] font-black uppercase tracking-[0.16em] text-rose-500">
                    Amount
                  </p>
                  <p className="mt-2 text-lg font-black text-rose-700">
                    {money(selectedExpense.amount)}
                  </p>
                </div>

                <div className="rounded-2xl bg-blue-50 p-4">
                  <p className="text-[10px] font-black uppercase tracking-[0.16em] text-blue-500">
                    Expense Date
                  </p>
                  <p className="mt-2 text-lg font-black text-blue-700">
                    {formatDate(selectedExpense.expenseDate)}
                  </p>
                </div>

                <div className="rounded-2xl bg-slate-50 p-4">
                  <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">
                    Status
                  </p>
                  <p className="mt-2 text-lg font-black capitalize text-slate-950">
                    {selectedExpense.status || 'published'}
                  </p>
                </div>
              </div>

              <div className="mt-5 grid gap-2 sm:grid-cols-2">
                {selectedExpense.proofImage && (
                  <button
                    type="button"
                    onClick={() =>
                      setSelectedImage(makeImageUrl(apiBase, selectedExpense.proofImage))
                    }
                    className="h-12 rounded-2xl bg-slate-950 px-4 text-sm font-black text-white shadow-lg transition hover:-translate-y-1"
                  >
                    View Proof Image
                  </button>
                )}

                {selectedExpense.proofLink && (
                  <a
                    href={selectedExpense.proofLink}
                    target="_blank"
                    rel="noreferrer"
                    className="grid h-12 place-items-center rounded-2xl bg-blue-600 px-4 text-sm font-black text-white shadow-lg transition hover:-translate-y-1"
                  >
                    Open Proof Link
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="relative overflow-hidden rounded-[32px] bg-[radial-gradient(circle_at_85%_20%,rgba(251,113,133,0.40),transparent_28%),linear-gradient(135deg,#020617,#7f1d1d_45%,#e11d48)] p-5 text-white shadow-[0_22px_55px_rgba(225,29,72,0.20)] sm:p-7 md:p-8">
        <div className="absolute -right-20 -top-20 h-72 w-72 rounded-full bg-white/10 blur-3xl motion-safe:animate-pulse" />
        <div className="absolute -bottom-24 left-10 h-72 w-72 rounded-full bg-orange-400/20 blur-3xl" />

        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-[10px] font-black uppercase tracking-[0.22em] text-rose-100 backdrop-blur-xl">
            Transparency Records
          </div>

          <h1 className="mt-6 max-w-3xl text-[40px] font-black leading-[0.92] tracking-[-0.06em] sm:text-6xl">
            Public Expense Transparency
          </h1>

          <p className="mt-4 max-w-2xl text-sm font-semibold leading-7 text-rose-100/85">
            View how foundation funds are spent with title, amount, category, project and proof
            information.
          </p>

          <div className="mt-7 grid grid-cols-3 gap-2 sm:max-w-2xl sm:gap-3">
            <div className="rounded-2xl border border-white/15 bg-white/10 p-3 backdrop-blur-xl">
              <p className="text-lg font-black sm:text-2xl">{summary.totalRecords}</p>
              <p className="text-[10px] font-bold text-rose-100">Records</p>
            </div>

            <div className="rounded-2xl border border-white/15 bg-white/10 p-3 backdrop-blur-xl">
              <p className="truncate text-lg font-black sm:text-2xl">
                {money(summary.totalExpense)}
              </p>
              <p className="text-[10px] font-bold text-rose-100">Expense</p>
            </div>

            <div className="rounded-2xl border border-white/15 bg-white/10 p-3 backdrop-blur-xl">
              <p className="text-lg font-black sm:text-2xl">{summary.proofCount}</p>
              <p className="text-[10px] font-bold text-rose-100">Proofs</p>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-4 rounded-[28px] border border-rose-100 bg-white p-4 shadow-[0_14px_35px_rgba(15,23,42,0.06)]">
        <div className="grid gap-3 lg:grid-cols-[1fr_190px_190px_auto_auto]">
          <input
            type="text"
            name="search"
            placeholder="Search expense, category or project"
            value={filters.search}
            onChange={handleFilterChange}
            className="h-12 rounded-2xl border border-rose-100 bg-slate-50 px-4 text-sm font-bold outline-none transition focus:border-rose-500 focus:ring-4 focus:ring-rose-100"
          />

          <select
            name="category"
            value={filters.category}
            onChange={handleFilterChange}
            className="h-12 rounded-2xl border border-rose-100 bg-slate-50 px-4 text-sm font-bold outline-none transition focus:border-rose-500 focus:ring-4 focus:ring-rose-100"
          >
            <option value="all">All category</option>
            {categories.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>

          <select
            name="project"
            value={filters.project}
            onChange={handleFilterChange}
            className="h-12 rounded-2xl border border-rose-100 bg-slate-50 px-4 text-sm font-bold outline-none transition focus:border-rose-500 focus:ring-4 focus:ring-rose-100"
          >
            <option value="all">All project</option>
            {projects.map((project) => (
              <option key={project} value={project}>
                {project}
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={clearFilters}
            className="h-12 rounded-2xl bg-slate-100 px-5 text-sm font-black text-slate-700 transition hover:-translate-y-1 hover:bg-slate-200"
          >
            Clear
          </button>

          <button
            type="button"
            onClick={loadExpenses}
            disabled={loading}
            className="h-12 rounded-2xl bg-slate-950 px-5 text-sm font-black text-white shadow-lg transition hover:-translate-y-1 disabled:opacity-60"
          >
            {loading ? 'Loading...' : 'Refresh'}
          </button>
        </div>
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-[1fr_330px]">
        <div className="grid gap-4 sm:grid-cols-2">
          {loading ? (
            <div className="rounded-[28px] bg-white p-6 text-center text-sm font-bold text-slate-500 shadow-sm sm:col-span-2">
              Loading transparency data...
            </div>
          ) : filteredExpenses.length === 0 ? (
            <div className="rounded-[28px] bg-white p-6 text-center text-sm font-bold text-slate-500 shadow-sm sm:col-span-2">
              No expense record found.
            </div>
          ) : (
            filteredExpenses.map((expense) => {
              const imageUrl = makeImageUrl(apiBase, expense.proofImage)

              return (
                <article
                  key={expense._id || expense.id}
                  className="group overflow-hidden rounded-[30px] border border-rose-100 bg-white shadow-[0_16px_40px_rgba(15,23,42,0.06)] transition duration-500 hover:-translate-y-2 hover:shadow-[0_24px_65px_rgba(225,29,72,0.14)]"
                >
                  <button
                    type="button"
                    onClick={() => setSelectedExpense(expense)}
                    className="relative block h-44 w-full overflow-hidden bg-slate-100"
                  >
                    {imageUrl ? (
                      <img
                        src={imageUrl}
                        alt={expense.title}
                        className="h-full w-full object-cover transition duration-700 group-hover:scale-110"
                      />
                    ) : (
                      <div className="grid h-full w-full place-items-center bg-gradient-to-br from-rose-600 to-orange-500 text-4xl font-black text-white">
                        OCF
                      </div>
                    )}

                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/65 via-transparent to-transparent" />

                    <div className="absolute left-4 top-4 flex flex-wrap gap-2">
                      <span className="rounded-full bg-white/90 px-3 py-1 text-[10px] font-black text-rose-700 backdrop-blur">
                        {expense.category || 'General Expense'}
                      </span>
                    </div>

                    <div className="absolute bottom-4 left-4 right-4 text-left">
                      <h3 className="line-clamp-2 text-xl font-black leading-tight text-white">
                        {expense.title}
                      </h3>

                      <p className="mt-1 text-xs font-bold text-rose-100">
                        {formatDate(expense.expenseDate)}
                      </p>
                    </div>
                  </button>

                  <div className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-[0.16em] text-rose-500">
                          Amount
                        </p>

                        <h3 className="mt-1 text-2xl font-black text-slate-950">
                          {money(expense.amount)}
                        </h3>
                      </div>

                      <span className="rounded-full bg-blue-50 px-3 py-2 text-[10px] font-black text-blue-700">
                        {expense.projectTitle || expense.project?.title || 'General'}
                      </span>
                    </div>

                    <p className="mt-3 line-clamp-2 min-h-10 text-sm font-semibold leading-5 text-slate-500">
                      {expense.description || 'No description added.'}
                    </p>

                    <div className="mt-4 grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setSelectedExpense(expense)}
                        className="h-11 rounded-2xl bg-slate-100 px-4 text-xs font-black text-slate-700 transition hover:-translate-y-1 hover:bg-slate-200"
                      >
                        Details
                      </button>

                      {imageUrl ? (
                        <button
                          type="button"
                          onClick={() => setSelectedImage(imageUrl)}
                          className="h-11 rounded-2xl bg-gradient-to-r from-rose-600 to-orange-500 px-4 text-xs font-black text-white shadow-lg transition hover:-translate-y-1"
                        >
                          Proof
                        </button>
                      ) : expense.proofLink ? (
                        <a
                          href={expense.proofLink}
                          target="_blank"
                          rel="noreferrer"
                          className="grid h-11 place-items-center rounded-2xl bg-gradient-to-r from-rose-600 to-orange-500 px-4 text-xs font-black text-white shadow-lg transition hover:-translate-y-1"
                        >
                          Proof Link
                        </a>
                      ) : (
                        <button
                          type="button"
                          disabled
                          className="h-11 rounded-2xl bg-slate-100 px-4 text-xs font-black text-slate-400"
                        >
                          No Proof
                        </button>
                      )}
                    </div>
                  </div>
                </article>
              )
            })
          )}
        </div>

        <aside className="grid content-start gap-4">
          <div className="rounded-[32px] border border-rose-100 bg-white p-5 shadow-[0_16px_40px_rgba(15,23,42,0.06)]">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-rose-600">
              Category Summary
            </p>

            <h3 className="mt-2 text-2xl font-black text-slate-950">
              Expense Breakdown
            </h3>

            <div className="mt-5 grid gap-3">
              {categorySummary.length === 0 ? (
                <div className="rounded-2xl bg-slate-50 p-4 text-center text-sm font-bold text-slate-500">
                  No category summary found.
                </div>
              ) : (
                categorySummary.slice(0, 8).map((item) => (
                  <div
                    key={item.name}
                    className="flex items-center justify-between gap-3 rounded-2xl bg-slate-50 p-4"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-black text-slate-950">{item.name}</p>
                      <p className="mt-1 text-xs font-bold text-slate-500">
                        {item.count} records
                      </p>
                    </div>

                    <p className="shrink-0 text-sm font-black text-rose-700">
                      {money(item.amount)}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="rounded-[32px] border border-blue-100 bg-white p-5 text-center shadow-[0_16px_40px_rgba(15,23,42,0.06)]">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-600">
              Want to Help?
            </p>

            <h3 className="mt-2 text-xl font-black text-slate-950">
              Support Foundation Work
            </h3>

            <p className="mt-2 text-sm font-semibold leading-6 text-slate-500">
              Your donation helps continue the foundation activities shown in this transparency
              section.
            </p>

            <button
              type="button"
              onClick={goToDonate}
              className="mt-4 h-11 w-full rounded-2xl bg-gradient-to-r from-blue-600 to-cyan-500 px-4 text-xs font-black text-white shadow-lg transition hover:-translate-y-1"
            >
              Donate Now
            </button>
          </div>
        </aside>
      </div>
    </section>
  )
}