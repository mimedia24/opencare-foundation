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

function hasProject(expense) {
  const projectName = expense.projectTitle || expense.project?.title || ''
  return Boolean(projectName && projectName !== 'No project' && projectName !== 'General Fund')
}

export default function TransparencyPage({ API }) {
  const apiBase = API || import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'

  const [expenses, setExpenses] = useState([])
  const [loading, setLoading] = useState(false)
  const [selectedImage, setSelectedImage] = useState('')
  const [selectedExpense, setSelectedExpense] = useState(null)
  const [search, setSearch] = useState('')

  const filteredExpenses = useMemo(() => {
    const keyword = search.trim().toLowerCase()

    const filtered = expenses.filter((expense) => {
      const projectName = expense.projectTitle || expense.project?.title || ''
      const categoryName = expense.category || ''
      const title = expense.title || ''
      const description = expense.description || ''

      const searchText = `${title} ${categoryName} ${projectName} ${description}`.toLowerCase()

      return keyword ? searchText.includes(keyword) : true
    })

    return filtered.slice(0, 10)
  }, [expenses, search])

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

  return (
    <section className="min-h-screen bg-[#eef4ff] px-3 pb-28 pt-4 text-slate-950 sm:px-5 md:px-6">
      {selectedImage && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/80 p-4">
          <div className="relative w-full max-w-4xl overflow-hidden rounded-[24px] bg-white p-3 shadow-2xl sm:rounded-[30px] sm:p-4">
            <button
              type="button"
              onClick={() => setSelectedImage('')}
              className="absolute right-4 top-4 z-10 grid h-9 w-9 place-items-center rounded-full bg-slate-950 text-white shadow-lg"
            >
              ×
            </button>

            <img
              src={selectedImage}
              alt="Expense proof"
              className="max-h-[78vh] w-full rounded-[18px] object-contain sm:rounded-[22px]"
            />
          </div>
        </div>
      )}

      {selectedExpense && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/75 p-3">
          <div className="relative max-h-[90vh] w-full max-w-3xl overflow-auto rounded-[26px] bg-white p-3 shadow-2xl sm:rounded-[32px] sm:p-5">
            <button
              type="button"
              onClick={() => setSelectedExpense(null)}
              className="absolute right-4 top-4 z-10 grid h-9 w-9 place-items-center rounded-full bg-slate-950 text-white shadow-lg"
            >
              ×
            </button>

            <div className="overflow-hidden rounded-[22px] bg-slate-100 sm:rounded-[26px]">
              {selectedExpense.proofImage ? (
                <img
                  src={makeImageUrl(apiBase, selectedExpense.proofImage)}
                  alt={selectedExpense.title}
                  className="h-48 w-full object-cover sm:h-80"
                />
              ) : (
                <div className="grid h-48 w-full place-items-center bg-gradient-to-br from-rose-600 to-orange-500 text-3xl font-black text-white sm:h-80">
                  OCF
                </div>
              )}
            </div>

            <div className="mt-4">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-rose-50 px-3 py-1.5 text-[10px] font-black text-rose-700 sm:text-xs">
                  {selectedExpense.category || 'General Expense'}
                </span>

                {hasProject(selectedExpense) && (
                  <span className="rounded-full bg-blue-50 px-3 py-1.5 text-[10px] font-black text-blue-700 sm:text-xs">
                    {selectedExpense.projectTitle || selectedExpense.project?.title}
                  </span>
                )}
              </div>

              <h2 className="mt-3 text-2xl font-black tracking-[-0.04em] text-slate-950 sm:text-4xl">
                {selectedExpense.title}
              </h2>

              <p className="mt-2 text-xs font-semibold leading-6 text-slate-500 sm:text-sm sm:leading-7">
                {selectedExpense.description || 'No description added.'}
              </p>

              <div className="mt-4 grid gap-2 sm:grid-cols-3">
                <div className="rounded-2xl bg-rose-50 p-3 sm:p-4">
                  <p className="text-[9px] font-black uppercase tracking-[0.14em] text-rose-500">
                    Amount
                  </p>
                  <p className="mt-1 text-sm font-black text-rose-700 sm:text-lg">
                    {money(selectedExpense.amount)}
                  </p>
                </div>

                <div className="rounded-2xl bg-blue-50 p-3 sm:p-4">
                  <p className="text-[9px] font-black uppercase tracking-[0.14em] text-blue-500">
                    Date
                  </p>
                  <p className="mt-1 text-sm font-black text-blue-700 sm:text-lg">
                    {formatDate(selectedExpense.expenseDate)}
                  </p>
                </div>

                <div className="rounded-2xl bg-slate-50 p-3 sm:p-4">
                  <p className="text-[9px] font-black uppercase tracking-[0.14em] text-slate-400">
                    Status
                  </p>
                  <p className="mt-1 text-sm font-black capitalize text-slate-950 sm:text-lg">
                    {selectedExpense.status || 'published'}
                  </p>
                </div>
              </div>

              <div className="mt-4 grid gap-2 sm:grid-cols-2">
                {selectedExpense.proofImage && (
                  <button
                    type="button"
                    onClick={() =>
                      setSelectedImage(makeImageUrl(apiBase, selectedExpense.proofImage))
                    }
                    className="h-11 rounded-2xl bg-slate-950 px-4 text-xs font-black text-white shadow-lg transition hover:-translate-y-1 sm:text-sm"
                  >
                    View Proof Image
                  </button>
                )}

                {selectedExpense.proofLink && (
                  <a
                    href={selectedExpense.proofLink}
                    target="_blank"
                    rel="noreferrer"
                    className="grid h-11 place-items-center rounded-2xl bg-blue-600 px-4 text-xs font-black text-white shadow-lg transition hover:-translate-y-1 sm:text-sm"
                  >
                    Open Proof Link
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="relative overflow-hidden rounded-[22px] bg-[radial-gradient(circle_at_85%_20%,rgba(251,113,133,0.34),transparent_28%),linear-gradient(135deg,#020617,#7f1d1d_48%,#e11d48)] p-4 text-white shadow-[0_18px_45px_rgba(225,29,72,0.18)] sm:rounded-[32px] sm:p-7 md:p-8">
        <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-white/10 blur-3xl motion-safe:animate-pulse" />
        <div className="absolute -bottom-24 left-10 h-64 w-64 rounded-full bg-orange-400/20 blur-3xl" />

        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-[8px] font-black uppercase tracking-[0.18em] text-rose-100 backdrop-blur-xl sm:px-4 sm:py-2 sm:text-[10px]">
            Transparency
          </div>

          <h1 className="mt-4 max-w-3xl text-[25px] font-black leading-[0.95] tracking-[-0.06em] sm:mt-6 sm:text-6xl">
            Public Expense Transparency
          </h1>

          <p className="mt-3 max-w-2xl text-[11px] font-semibold leading-5 text-rose-100/85 sm:mt-4 sm:text-sm sm:leading-7">
            See how foundation funds are spent with amount, category and proof.
          </p>
        </div>
      </div>

      <div className="mt-4 rounded-[22px] border border-rose-100 bg-white p-3 shadow-[0_12px_30px_rgba(15,23,42,0.05)] sm:rounded-[28px] sm:p-4">
        <div className="grid gap-2 sm:grid-cols-[1fr_auto]">
          <input
            type="text"
            placeholder="Search expense, category or project"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-10 rounded-2xl border border-rose-100 bg-slate-50 px-4 text-[11px] font-bold outline-none transition focus:border-rose-500 focus:ring-4 focus:ring-rose-100 sm:h-12 sm:text-sm"
          />

          <button
            type="button"
            onClick={loadExpenses}
            disabled={loading}
            className="h-10 rounded-2xl bg-slate-950 px-5 text-[11px] font-black text-white shadow-lg transition hover:-translate-y-1 disabled:opacity-60 sm:h-12 sm:text-sm"
          >
            {loading ? 'Loading...' : 'Refresh'}
          </button>
        </div>
      </div>

      <div className="mt-4">
        {loading ? (
          <div className="rounded-[24px] bg-white p-6 text-center text-xs font-bold text-slate-500 shadow-sm sm:text-sm">
            Loading transparency data...
          </div>
        ) : filteredExpenses.length === 0 ? (
          <div className="rounded-[24px] bg-white p-6 text-center text-xs font-bold text-slate-500 shadow-sm sm:text-sm">
            No expense record found.
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2 sm:gap-4 md:grid-cols-3 xl:grid-cols-4">
            {filteredExpenses.map((expense) => {
              const imageUrl = makeImageUrl(apiBase, expense.proofImage)
              const categoryName = expense.category || 'General Expense'

              return (
                <article
                  key={expense._id || expense.id}
                  className="group min-w-0 overflow-hidden rounded-[18px] border border-rose-100 bg-white shadow-[0_10px_24px_rgba(15,23,42,0.05)] transition duration-500 hover:-translate-y-1 hover:shadow-[0_18px_45px_rgba(225,29,72,0.12)] sm:rounded-[26px]"
                >
                  <button
                    type="button"
                    onClick={() => setSelectedExpense(expense)}
                    className="relative block h-24 w-full overflow-hidden bg-slate-100 sm:h-40"
                  >
                    {imageUrl ? (
                      <img
                        src={imageUrl}
                        alt={expense.title}
                        className="h-full w-full object-cover transition duration-700 group-hover:scale-110"
                      />
                    ) : (
                      <div className="grid h-full w-full place-items-center bg-gradient-to-br from-rose-600 to-orange-500 text-2xl font-black text-white sm:text-4xl">
                        OCF
                      </div>
                    )}

                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-transparent" />

                    <div className="absolute left-2 top-2 max-w-[calc(100%-16px)]">
                      <span className="block truncate rounded-full bg-white/90 px-2 py-1 text-[7px] font-black text-rose-700 backdrop-blur sm:text-[10px]">
                        {categoryName}
                      </span>
                    </div>

                    <div className="absolute bottom-2 left-2 right-2 text-left">
                      <h3 className="line-clamp-2 text-[11px] font-black leading-tight text-white sm:text-lg">
                        {expense.title}
                      </h3>

                      <p className="mt-0.5 text-[8px] font-bold text-rose-100 sm:text-xs">
                        {formatDate(expense.expenseDate)}
                      </p>
                    </div>
                  </button>

                  <div className="p-2 sm:p-3">
                    <p className="text-[7px] font-black uppercase tracking-[0.12em] text-rose-500 sm:text-[9px]">
                      Amount
                    </p>

                    <h3 className="mt-0.5 truncate text-[13px] font-black text-slate-950 sm:text-xl">
                      {money(expense.amount)}
                    </h3>

                    <button
                      type="button"
                      onClick={() => setSelectedExpense(expense)}
                      className="mt-2 h-8 w-full rounded-xl bg-slate-100 px-2 text-[9px] font-black text-slate-700 transition hover:-translate-y-1 hover:bg-slate-200 sm:h-10 sm:text-xs"
                    >
                      Details
                    </button>
                  </div>
                </article>
              )
            })}
          </div>
        )}
      </div>
    </section>
  )
}