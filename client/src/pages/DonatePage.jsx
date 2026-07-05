import { useEffect, useMemo, useState } from 'react'

const paymentMethods = [
  { value: 'bkash', label: 'bKash' },
  { value: 'nagad', label: 'Nagad' },
  { value: 'rocket', label: 'Rocket' },
  { value: 'bank', label: 'Bank Transfer' },
  { value: 'cash', label: 'Cash' },
  { value: 'card', label: 'Card' },
  { value: 'other', label: 'Other' },
]

const quickAmounts = [100, 500, 1000, 2000, 5000, 10000]

const emptyForm = {
  donorName: '',
  phone: '',
  email: '',
  amount: '',
  paymentMethod: 'bkash',
  transactionId: '',
  project: '',
  fundCategory: '',
  note: '',
  isAnonymous: false,
  proofImage: null,
}

function money(amount) {
  return `BDT ${Number(amount || 0).toLocaleString('en-US')}`
}

function getProgress(project) {
  if (!project) return 0

  if (typeof project.progressPercent === 'number') {
    return Math.min(Math.max(project.progressPercent, 0), 100)
  }

  const target = Number(project.targetAmount || 0)
  const collected = Number(project.collectedAmount || 0)

  if (target <= 0) return 0

  return Math.min(Math.round((collected / target) * 100), 100)
}

function getRemaining(project) {
  if (!project) return 0

  if (typeof project.remainingAmount === 'number') {
    return Math.max(project.remainingAmount, 0)
  }

  return Math.max(Number(project.targetAmount || 0) - Number(project.collectedAmount || 0), 0)
}

export default function DonatePage({ API }) {
  const apiBase = API || import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'

  const [form, setForm] = useState(emptyForm)
  const [projects, setProjects] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(false)
  const [submitLoading, setSubmitLoading] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')
  const [proofPreview, setProofPreview] = useState('')

  const selectedProject = useMemo(() => {
    if (!form.project) return null

    return (
      projects.find((project) => {
        return (
          String(project._id || '') === String(form.project) ||
          String(project.id || '') === String(form.project) ||
          String(project.slug || '') === String(form.project)
        )
      }) || null
    )
  }, [projects, form.project])

  const selectedCategory = useMemo(() => {
    if (!form.fundCategory) return null

    return (
      categories.find((category) => {
        return (
          String(category._id || '') === String(form.fundCategory) ||
          String(category.slug || '') === String(form.fundCategory)
        )
      }) || null
    )
  }, [categories, form.fundCategory])

  const loadData = async () => {
    try {
      setLoading(true)

      const [projectsRes, categoriesRes] = await Promise.all([
        fetch(`${apiBase}/api/projects`),
        fetch(`${apiBase}/api/categories`),
      ])

      const projectsData = await projectsRes.json()
      const categoriesData = await categoriesRes.json()

      if (!projectsRes.ok) {
        throw new Error(projectsData?.message || 'Failed to load projects.')
      }

      if (!categoriesRes.ok) {
        throw new Error(categoriesData?.message || 'Failed to load categories.')
      }

      const projectList = Array.isArray(projectsData?.projects) ? projectsData.projects : []
      const categoryList = Array.isArray(categoriesData?.categories)
        ? categoriesData.categories
        : []

      const params = new URLSearchParams(window.location.search)
      const queryProject = params.get('project') || ''
      const queryCategory = params.get('category') || ''

      const matchedProject = projectList.find((project) => {
        return (
          String(project._id || '') === String(queryProject) ||
          String(project.id || '') === String(queryProject) ||
          String(project.slug || '') === String(queryProject)
        )
      })

      const matchedCategory = categoryList.find((category) => {
        return (
          String(category._id || '') === String(queryCategory) ||
          String(category.slug || '') === String(queryCategory)
        )
      })

      setProjects(projectList)
      setCategories(categoryList)

      setForm((prev) => ({
        ...prev,
        project: matchedProject ? matchedProject._id : prev.project,
        fundCategory: matchedCategory ? matchedCategory._id : prev.fundCategory,
      }))
    } catch (error) {
      alert(error.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [apiBase])

  const handleChange = (e) => {
    const { name, value, type, checked, files } = e.target

    if (type === 'file') {
      const file = files?.[0] || null

      setForm((prev) => ({
        ...prev,
        [name]: file,
      }))

      if (proofPreview) {
        URL.revokeObjectURL(proofPreview)
      }

      setProofPreview(file ? URL.createObjectURL(file) : '')
      return
    }

    if (type === 'checkbox') {
      setForm((prev) => ({
        ...prev,
        [name]: checked,
      }))

      return
    }

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const setAmount = (amount) => {
    setForm((prev) => ({
      ...prev,
      amount: String(amount),
    }))
  }

  const clearProof = () => {
    if (proofPreview) {
      URL.revokeObjectURL(proofPreview)
    }

    setProofPreview('')

    setForm((prev) => ({
      ...prev,
      proofImage: null,
    }))
  }

  const resetForm = () => {
    if (proofPreview) {
      URL.revokeObjectURL(proofPreview)
    }

    setProofPreview('')

    setForm((prev) => ({
      ...emptyForm,
      project: prev.project,
      fundCategory: prev.fundCategory,
    }))
  }

  const submitDonation = async (e) => {
    e.preventDefault()
    setSuccessMessage('')

    if (!form.donorName.trim() && !form.isAnonymous) {
      alert('Donor name is required or select anonymous donation.')
      return
    }

    if (!form.phone.trim()) {
      alert('Phone number is required.')
      return
    }

    if (!form.amount || Number(form.amount) <= 0) {
      alert('Donation amount must be a valid positive number.')
      return
    }

    try {
      setSubmitLoading(true)

      const formData = new FormData()

      formData.append('donorName', form.isAnonymous ? 'Anonymous Donor' : form.donorName)
      formData.append('phone', form.phone)
      formData.append('email', form.email)
      formData.append('amount', form.amount)
      formData.append('paymentMethod', form.paymentMethod)
      formData.append('transactionId', form.transactionId)
      formData.append('project', form.project)
      formData.append('fundCategory', form.fundCategory)
      formData.append('note', form.note)
      formData.append('isAnonymous', form.isAnonymous ? 'true' : 'false')
      formData.append('source', 'website')

      if (form.proofImage) {
        formData.append('proofImage', form.proofImage)
      }

      const res = await fetch(`${apiBase}/api/donations/create`, {
        method: 'POST',
        body: formData,
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data?.message || 'Donation submission failed.')
      }

      setSuccessMessage(
        data?.message ||
          'Donation submitted successfully. Admin will verify your payment soon.'
      )

      resetForm()
    } catch (error) {
      alert(error.message)
    } finally {
      setSubmitLoading(false)
    }
  }

  const goToProjects = () => {
    window.history.pushState({}, '', '/projects')
    window.dispatchEvent(new PopStateEvent('popstate'))
  }

  return (
    <section className="min-h-screen bg-[#eef4ff] px-4 pb-28 pt-5 text-slate-950 sm:px-5 md:px-6">
      <div className="relative overflow-hidden rounded-[32px] bg-[radial-gradient(circle_at_85%_20%,rgba(96,165,250,0.45),transparent_28%),linear-gradient(135deg,#020617,#172554_45%,#2563eb)] p-5 text-white shadow-[0_22px_55px_rgba(37,99,235,0.20)] sm:p-7 md:p-8">
        <div className="absolute -right-20 -top-20 h-72 w-72 rounded-full bg-white/10 blur-3xl motion-safe:animate-pulse" />
        <div className="absolute -bottom-24 left-10 h-72 w-72 rounded-full bg-cyan-400/20 blur-3xl" />

        <div className="relative z-10 grid gap-6 lg:grid-cols-[1.1fr_0.9fr] lg:items-end">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-[10px] font-black uppercase tracking-[0.22em] text-blue-100 backdrop-blur-xl">
              Secure Donation
            </div>

            <h1 className="mt-6 max-w-3xl text-[40px] font-black leading-[0.92] tracking-[-0.06em] sm:text-6xl">
              Donate With Trust
            </h1>

            <p className="mt-4 max-w-2xl text-sm font-semibold leading-7 text-blue-100/85">
              Select a fund or project, send your payment, upload proof, and wait for admin
              verification.
            </p>
          </div>

          <div className="rounded-[28px] border border-white/15 bg-white/10 p-4 backdrop-blur-xl">
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-blue-100">
              Payment Information
            </p>

            <div className="mt-3 grid gap-2 text-sm font-bold text-white">
              <p>bKash / Nagad / Rocket transaction proof can be uploaded.</p>
              <p className="text-blue-100/80">
                Your donation will show in project progress after admin verification.
              </p>
            </div>
          </div>
        </div>
      </div>

      {successMessage && (
        <div className="mt-4 rounded-[26px] border border-emerald-100 bg-emerald-50 p-4 text-sm font-black leading-6 text-emerald-700 shadow-sm">
          {successMessage}
        </div>
      )}

      <div className="mt-4 grid gap-4 xl:grid-cols-[1fr_380px]">
        <form
          onSubmit={submitDonation}
          className="rounded-[32px] border border-blue-100 bg-white p-4 shadow-[0_16px_40px_rgba(15,23,42,0.06)] sm:p-5 md:p-6"
        >
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-600">
              Donation Form
            </p>

            <h2 className="mt-2 text-2xl font-black tracking-[-0.04em] text-slate-950 sm:text-3xl">
              Submit Donation Proof
            </h2>

            <p className="mt-2 text-sm font-semibold leading-6 text-slate-500">
              Fill the form carefully. Admin will verify your transaction and update the project
              fund.
            </p>
          </div>

          <div className="mt-5 grid gap-3 md:grid-cols-2">
            <label className="grid gap-2">
              <span className="text-xs font-black uppercase tracking-[0.16em] text-slate-400">
                Donor Name
              </span>

              <input
                type="text"
                name="donorName"
                placeholder="Your name"
                value={form.donorName}
                onChange={handleChange}
                disabled={form.isAnonymous}
                className="h-12 rounded-2xl border border-blue-100 bg-slate-50 px-4 text-sm font-bold outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100 disabled:opacity-60"
              />
            </label>

            <label className="grid gap-2">
              <span className="text-xs font-black uppercase tracking-[0.16em] text-slate-400">
                Phone
              </span>

              <input
                type="tel"
                name="phone"
                placeholder="Your phone number"
                value={form.phone}
                onChange={handleChange}
                className="h-12 rounded-2xl border border-blue-100 bg-slate-50 px-4 text-sm font-bold outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
              />
            </label>

            <label className="grid gap-2">
              <span className="text-xs font-black uppercase tracking-[0.16em] text-slate-400">
                Email Optional
              </span>

              <input
                type="email"
                name="email"
                placeholder="Your email"
                value={form.email}
                onChange={handleChange}
                className="h-12 rounded-2xl border border-blue-100 bg-slate-50 px-4 text-sm font-bold outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
              />
            </label>

            <label className="grid gap-2">
              <span className="text-xs font-black uppercase tracking-[0.16em] text-slate-400">
                Amount
              </span>

              <input
                type="number"
                name="amount"
                placeholder="Donation amount"
                value={form.amount}
                onChange={handleChange}
                className="h-12 rounded-2xl border border-blue-100 bg-slate-50 px-4 text-sm font-bold outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
              />
            </label>

            <div className="grid gap-2 md:col-span-2">
              <span className="text-xs font-black uppercase tracking-[0.16em] text-slate-400">
                Quick Amount
              </span>

              <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
                {quickAmounts.map((amount) => (
                  <button
                    key={amount}
                    type="button"
                    onClick={() => setAmount(amount)}
                    className={`h-11 rounded-2xl text-xs font-black transition hover:-translate-y-1 ${
                      Number(form.amount) === amount
                        ? 'bg-blue-600 text-white shadow-lg'
                        : 'bg-blue-50 text-blue-700'
                    }`}
                  >
                    {money(amount).replace('BDT ', '')}
                  </button>
                ))}
              </div>
            </div>

            <label className="grid gap-2">
              <span className="text-xs font-black uppercase tracking-[0.16em] text-slate-400">
                Project
              </span>

              <select
                name="project"
                value={form.project}
                onChange={handleChange}
                disabled={loading}
                className="h-12 rounded-2xl border border-blue-100 bg-slate-50 px-4 text-sm font-bold outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
              >
                <option value="">General donation / No project</option>
                {projects.map((project) => (
                  <option key={project._id || project.slug} value={project._id}>
                    {project.title}
                  </option>
                ))}
              </select>
            </label>

            <label className="grid gap-2">
              <span className="text-xs font-black uppercase tracking-[0.16em] text-slate-400">
                Fund Category
              </span>

              <select
                name="fundCategory"
                value={form.fundCategory}
                onChange={handleChange}
                disabled={loading}
                className="h-12 rounded-2xl border border-blue-100 bg-slate-50 px-4 text-sm font-bold outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
              >
                <option value="">Select category optional</option>
                {categories.map((category) => (
                  <option key={category._id || category.slug} value={category._id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </label>

            <label className="grid gap-2">
              <span className="text-xs font-black uppercase tracking-[0.16em] text-slate-400">
                Payment Method
              </span>

              <select
                name="paymentMethod"
                value={form.paymentMethod}
                onChange={handleChange}
                className="h-12 rounded-2xl border border-blue-100 bg-slate-50 px-4 text-sm font-bold outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
              >
                {paymentMethods.map((method) => (
                  <option key={method.value} value={method.value}>
                    {method.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="grid gap-2">
              <span className="text-xs font-black uppercase tracking-[0.16em] text-slate-400">
                Transaction ID
              </span>

              <input
                type="text"
                name="transactionId"
                placeholder="Transaction ID optional"
                value={form.transactionId}
                onChange={handleChange}
                className="h-12 rounded-2xl border border-blue-100 bg-slate-50 px-4 text-sm font-bold outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
              />
            </label>

            <label className="grid gap-2 md:col-span-2">
              <span className="text-xs font-black uppercase tracking-[0.16em] text-slate-400">
                Note Optional
              </span>

              <textarea
                name="note"
                placeholder="Write a short note"
                value={form.note}
                onChange={handleChange}
                rows="4"
                className="rounded-2xl border border-blue-100 bg-slate-50 px-4 py-3 text-sm font-bold outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
              />
            </label>

            <label className="flex cursor-pointer items-center gap-3 rounded-2xl bg-slate-50 p-4 md:col-span-2">
              <input
                type="checkbox"
                name="isAnonymous"
                checked={form.isAnonymous}
                onChange={handleChange}
                className="h-5 w-5 rounded border-blue-200"
              />

              <span className="text-sm font-black text-slate-700">
                Donate anonymously
              </span>
            </label>

            <div className="md:col-span-2">
              <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-[24px] border border-dashed border-blue-200 bg-blue-50 px-4 py-6 text-center transition hover:-translate-y-1 hover:bg-blue-100">
                <span className="text-sm font-black text-blue-700">
                  {form.proofImage ? form.proofImage.name : 'Upload payment proof image'}
                </span>

                <span className="text-xs font-bold text-blue-500">
                  JPG, PNG or WEBP image recommended
                </span>

                <input
                  type="file"
                  name="proofImage"
                  accept="image/*"
                  onChange={handleChange}
                  className="hidden"
                />
              </label>

              {proofPreview && (
                <div className="mt-3 overflow-hidden rounded-[24px] border border-blue-100 bg-white p-3">
                  <img
                    src={proofPreview}
                    alt="Proof preview"
                    className="max-h-72 w-full rounded-[18px] object-contain"
                  />

                  <button
                    type="button"
                    onClick={clearProof}
                    className="mt-3 h-10 w-full rounded-2xl bg-slate-950 px-4 text-xs font-black text-white"
                  >
                    Remove Proof
                  </button>
                </div>
              )}
            </div>
          </div>

          <button
            type="submit"
            disabled={submitLoading}
            className="mt-5 h-13 w-full rounded-2xl bg-gradient-to-r from-blue-600 to-cyan-500 px-5 py-4 text-sm font-black text-white shadow-[0_18px_38px_rgba(37,99,235,0.25)] transition hover:-translate-y-1 disabled:opacity-60"
          >
            {submitLoading ? 'Submitting...' : 'Submit Donation'}
          </button>
        </form>

        <aside className="grid content-start gap-4">
          <div className="rounded-[32px] border border-blue-100 bg-white p-4 shadow-[0_16px_40px_rgba(15,23,42,0.06)]">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-600">
              Donation Summary
            </p>

            <h3 className="mt-2 text-2xl font-black text-slate-950">
              {money(form.amount || 0)}
            </h3>

            <div className="mt-4 grid gap-2 text-sm font-bold text-slate-500">
              <p>
                Project:{' '}
                <span className="font-black text-slate-950">
                  {selectedProject?.title || 'General donation'}
                </span>
              </p>

              <p>
                Category:{' '}
                <span className="font-black text-slate-950">
                  {selectedCategory?.name || 'Not selected'}
                </span>
              </p>

              <p>
                Method:{' '}
                <span className="font-black text-slate-950">
                  {paymentMethods.find((item) => item.value === form.paymentMethod)?.label ||
                    form.paymentMethod}
                </span>
              </p>

              <p>
                Donor:{' '}
                <span className="font-black text-slate-950">
                  {form.isAnonymous ? 'Anonymous Donor' : form.donorName || 'Not added'}
                </span>
              </p>
            </div>
          </div>

          {selectedProject ? (
            <div className="overflow-hidden rounded-[32px] border border-blue-100 bg-white shadow-[0_16px_40px_rgba(15,23,42,0.06)]">
              {selectedProject.coverImage ? (
                <img
                  src={selectedProject.coverImage}
                  alt={selectedProject.title}
                  className="h-44 w-full object-cover"
                />
              ) : (
                <div className="grid h-44 w-full place-items-center bg-gradient-to-br from-blue-600 to-cyan-500 text-4xl font-black text-white">
                  OCF
                </div>
              )}

              <div className="p-4">
                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-blue-600">
                  Selected Project
                </p>

                <h3 className="mt-2 text-xl font-black leading-tight text-slate-950">
                  {selectedProject.title}
                </h3>

                <p className="mt-2 line-clamp-2 text-sm font-semibold leading-6 text-slate-500">
                  {selectedProject.shortDescription ||
                    selectedProject.description ||
                    'No project description added yet.'}
                </p>

                <div className="mt-4 grid grid-cols-3 gap-2">
                  <div className="rounded-2xl bg-slate-50 p-3">
                    <p className="text-[9px] font-black uppercase text-slate-400">Target</p>
                    <p className="mt-1 truncate text-xs font-black">
                      {money(selectedProject.targetAmount)}
                    </p>
                  </div>

                  <div className="rounded-2xl bg-emerald-50 p-3">
                    <p className="text-[9px] font-black uppercase text-emerald-500">
                      Collected
                    </p>
                    <p className="mt-1 truncate text-xs font-black text-emerald-700">
                      {money(selectedProject.collectedAmount)}
                    </p>
                  </div>

                  <div className="rounded-2xl bg-rose-50 p-3">
                    <p className="text-[9px] font-black uppercase text-rose-500">
                      Remaining
                    </p>
                    <p className="mt-1 truncate text-xs font-black text-rose-700">
                      {money(getRemaining(selectedProject))}
                    </p>
                  </div>
                </div>

                <div className="mt-4">
                  <div className="flex items-center justify-between text-xs font-black text-slate-500">
                    <span>Progress</span>
                    <span>{getProgress(selectedProject)}%</span>
                  </div>

                  <div className="mt-2 h-3 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-blue-600 to-cyan-400 transition-all duration-700"
                      style={{ width: `${getProgress(selectedProject)}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="rounded-[32px] border border-blue-100 bg-white p-5 text-center shadow-[0_16px_40px_rgba(15,23,42,0.06)]">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-600">
                No Project Selected
              </p>

              <h3 className="mt-2 text-xl font-black text-slate-950">
                General Donation
              </h3>

              <p className="mt-2 text-sm font-semibold leading-6 text-slate-500">
                You can donate to the general foundation fund or choose a project.
              </p>

              <button
                type="button"
                onClick={goToProjects}
                className="mt-4 h-11 w-full rounded-2xl bg-slate-950 px-4 text-xs font-black text-white transition hover:-translate-y-1"
              >
                Choose Project
              </button>
            </div>
          )}

          <div className="rounded-[32px] border border-amber-100 bg-amber-50 p-5 shadow-sm">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-amber-700">
              Verification Notice
            </p>

            <p className="mt-2 text-sm font-bold leading-6 text-amber-800">
              After submission, your donation will stay pending until admin verifies the payment
              proof.
            </p>
          </div>
        </aside>
      </div>
    </section>
  )
}