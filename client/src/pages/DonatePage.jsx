import { useEffect, useMemo, useState } from 'react'

const FOUNDATION_BKASH_NUMBER = '01749077919'

const quickAmounts = [100, 500, 1000, 2000, 5000, 10000]

const paymentOptions = [
  {
    value: 'manual',
    label: 'Manual',
    subtitle: 'Active',
    active: true,
  },
  {
    value: 'bkash',
    label: 'bKash',
    subtitle: 'Soon',
    active: false,
  },
  {
    value: 'nagad',
    label: 'Nagad',
    subtitle: 'Soon',
    active: false,
  },
  {
    value: 'rocket',
    label: 'Rocket',
    subtitle: 'Soon',
    active: false,
  },
  {
    value: 'card',
    label: 'Card',
    subtitle: 'Soon',
    active: false,
  },
]

const emptyForm = {
  donorName: '',
  phone: '',
  email: '',
  amount: '500',
  project: '',
  fundCategory: '',
  paymentMethod: 'manual',
  senderNumber: '',
  paymentDone: false,
}

function money(amount) {
  return `BDT ${Number(amount || 0).toLocaleString('en-US')}`
}

function normalize(value) {
  return String(value || '').trim().toLowerCase()
}

function isValidPhone(value) {
  return /^01\d{9}$/.test(String(value || '').trim())
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

function FieldError({ message }) {
  if (!message) return null

  return <p className="text-[10px] font-black text-rose-600 sm:text-xs">{message}</p>
}

function inputClass(error) {
  return `h-10 w-full min-w-0 rounded-2xl border bg-slate-50 px-3 text-xs font-bold outline-none transition focus:ring-4 sm:h-11 sm:px-4 sm:text-sm ${
    error
      ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-100'
      : 'border-blue-100 focus:border-blue-500 focus:ring-blue-100'
  }`
}

export default function DonatePage({ API }) {
  const apiBase = API || import.meta.env.VITE_API_BASE_URL || window.location.origin

  const [step, setStep] = useState('form')
  const [form, setForm] = useState(emptyForm)
  const [projects, setProjects] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(false)
  const [submitLoading, setSubmitLoading] = useState(false)
  const [successData, setSuccessData] = useState(null)
  const [errors, setErrors] = useState({})
  const [copied, setCopied] = useState(false)

  const cleanCategories = useMemo(() => {
    const seen = new Set()

    return categories.filter((category) => {
      const key = normalize(category.name || category.slug || category._id)

      if (!key || seen.has(key)) return false

      seen.add(key)
      return true
    })
  }, [categories])

  const activeProjects = useMemo(() => {
    return projects.filter((project) => project.status === 'active' || !project.status)
  }, [projects])

  const generalCategory = useMemo(() => {
    return (
      cleanCategories.find((category) => normalize(category.name) === 'general donation') ||
      cleanCategories[0] ||
      null
    )
  }, [cleanCategories])

  const allProjectCategory = useMemo(() => {
    return (
      cleanCategories.find((category) => normalize(category.name) === 'all project') ||
      cleanCategories.find((category) => normalize(category.slug) === 'all-project') ||
      generalCategory ||
      null
    )
  }, [cleanCategories, generalCategory])

  const selectedCategory = useMemo(() => {
    if (!form.fundCategory && generalCategory?._id) return generalCategory

    if (!form.fundCategory) return null

    return (
      cleanCategories.find((category) => {
        return (
          String(category._id || '') === String(form.fundCategory) ||
          String(category.slug || '') === String(form.fundCategory)
        )
      }) || null
    )
  }, [cleanCategories, form.fundCategory, generalCategory])

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

  const donationChoiceValue = useMemo(() => {
    if (form.project) return `project:${form.project}`

    if (form.fundCategory) {
      return `category:${form.fundCategory}`
    }

    if (generalCategory?._id) {
      return `category:${generalCategory._id}`
    }

    return ''
  }, [form.project, form.fundCategory, generalCategory])

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

      const uniqueCategoryList = []
      const seen = new Set()

      categoryList.forEach((category) => {
        const key = normalize(category.name || category.slug || category._id)

        if (!key || seen.has(key)) return

        seen.add(key)
        uniqueCategoryList.push(category)
      })

      const defaultCategory =
        uniqueCategoryList.find((category) => normalize(category.name) === 'general donation') ||
        uniqueCategoryList[0] ||
        null

      const allProjectFund =
        uniqueCategoryList.find((category) => normalize(category.name) === 'all project') ||
        uniqueCategoryList.find((category) => normalize(category.slug) === 'all-project') ||
        defaultCategory ||
        null

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

      const matchedCategory = uniqueCategoryList.find((category) => {
        return (
          String(category._id || '') === String(queryCategory) ||
          String(category.slug || '') === String(queryCategory)
        )
      })

      setProjects(projectList)
      setCategories(uniqueCategoryList)

      setForm((prev) => ({
        ...prev,
        amount: prev.amount || '500',
        project:
          matchedProject && (matchedProject.status === 'active' || !matchedProject.status)
            ? matchedProject._id
            : '',
        fundCategory:
          matchedProject && (matchedProject.status === 'active' || !matchedProject.status)
            ? allProjectFund?._id || defaultCategory?._id || ''
            : matchedCategory
              ? matchedCategory._id
              : defaultCategory?._id || prev.fundCategory || '',
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
    const { name, value, type, checked } = e.target

    setErrors((prev) => ({
      ...prev,
      [name]: '',
    }))

    setForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }))
  }

  const handleDonationChoiceChange = (e) => {
    const value = e.target.value

    setErrors((prev) => ({
      ...prev,
      fundCategory: '',
      project: '',
    }))

    if (!value) {
      setForm((prev) => ({
        ...prev,
        fundCategory: generalCategory?._id || '',
        project: '',
      }))
      return
    }

    if (value.startsWith('category:')) {
      const categoryId = value.replace('category:', '')

      setForm((prev) => ({
        ...prev,
        fundCategory: categoryId,
        project: '',
      }))
      return
    }

    if (value.startsWith('project:')) {
      const projectId = value.replace('project:', '')
      const project = activeProjects.find((item) => String(item._id) === String(projectId))

      if (!project) {
        alert('This project is not active now.')
        return
      }

      setForm((prev) => ({
        ...prev,
        project: projectId,
        fundCategory: allProjectCategory?._id || generalCategory?._id || '',
      }))
    }
  }

  const setAmount = (amount) => {
    setErrors((prev) => ({
      ...prev,
      amount: '',
    }))

    setForm((prev) => ({
      ...prev,
      amount: String(amount),
    }))
  }

  const clearSelectedProject = () => {
    setForm((prev) => ({
      ...prev,
      project: '',
      fundCategory: generalCategory?._id || prev.fundCategory,
    }))
  }

  const validateBasicForm = () => {
    const nextErrors = {}

    if (!form.donorName.trim()) {
      nextErrors.donorName = 'Please write your name.'
    }

    if (!form.phone.trim()) {
      nextErrors.phone = 'Please write your mobile number.'
    } else if (!isValidPhone(form.phone)) {
      nextErrors.phone = 'Mobile number must be 11 digits and start with 01.'
    }

    if (!form.amount || Number(form.amount) <= 0) {
      nextErrors.amount = 'Please write a valid donation amount.'
    }

    setErrors(nextErrors)

    if (Object.keys(nextErrors).length > 0) {
      alert('Please complete the required fields correctly.')
      return false
    }

    return true
  }

  const validatePaymentForm = () => {
    const nextErrors = {}

    if (!form.senderNumber.trim()) {
      nextErrors.senderNumber = 'Please write the sender mobile number.'
    } else if (!isValidPhone(form.senderNumber)) {
      nextErrors.senderNumber = 'Sender number must be 11 digits and start with 01.'
    }

    if (!form.paymentDone) {
      nextErrors.paymentDone = 'Please confirm that you have already sent the payment.'
    }

    setErrors(nextErrors)

    if (Object.keys(nextErrors).length > 0) {
      alert('Please complete the payment confirmation correctly.')
      return false
    }

    return true
  }

  const goToPayment = (e) => {
    e.preventDefault()

    if (!validateBasicForm()) return

    setStep('payment')

    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    })
  }

  const copyNumber = async () => {
    try {
      await navigator.clipboard.writeText(FOUNDATION_BKASH_NUMBER)
      setCopied(true)

      setTimeout(() => {
        setCopied(false)
      }, 1500)
    } catch {
      alert('Copy failed. Please copy the number manually.')
    }
  }

  const submitDonation = async (e) => {
    e.preventDefault()

    if (!validateBasicForm()) return

    if (form.paymentMethod !== 'manual') {
      alert('Only manual donation is active now.')
      return
    }

    if (!validatePaymentForm()) return

    try {
      setSubmitLoading(true)

      const categoryText = selectedCategory?.name || 'General Donation'
      const projectText = selectedProject?.title || 'General donation'

      const manualNote = [
        `Manual donation submitted from website.`,
        `Payment sent from: ${form.senderNumber}.`,
        `Selected category: ${categoryText}.`,
        `Selected project: ${projectText}.`,
        `User confirmed payment before submission.`,
        `If a project is selected, this donation should be treated under All project fund and the selected project.`,
      ].join(' ')

      const formData = new FormData()

      formData.append('donorName', form.donorName)
      formData.append('phone', form.phone)
      formData.append('email', form.email)
      formData.append('amount', form.amount)
      formData.append('paymentMethod', 'other')
      formData.append('transactionId', '')
      formData.append('project', form.project)
      formData.append('fundCategory', form.fundCategory || generalCategory?._id || '')
      formData.append('note', manualNote)
      formData.append('isAnonymous', 'false')
      formData.append('source', 'website')

      const res = await fetch(`${apiBase}/api/donations/create`, {
        method: 'POST',
        body: formData,
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data?.message || 'Donation submission failed.')
      }

      setSuccessData({
        amount: form.amount,
        donorName: form.donorName,
        category: categoryText,
        project: projectText,
        message:
          data?.message ||
          'Thank you. Your donation has been submitted and will be verified within one day.',
      })

      setForm({
        ...emptyForm,
        amount: '500',
        fundCategory: generalCategory?._id || '',
      })

      setErrors({})
      setStep('thankyou')

      window.scrollTo({
        top: 0,
        behavior: 'smooth',
      })
    } catch (error) {
      alert(error.message)
    } finally {
      setSubmitLoading(false)
    }
  }

  const startAgain = () => {
    setSuccessData(null)
    setErrors({})
    setStep('form')
  }

  if (step === 'thankyou') {
    return (
      <section className="min-h-screen overflow-x-hidden bg-[#eef4ff] px-2 pb-28 pt-3 text-slate-950 sm:px-5 md:px-6">
        <div className="mx-auto w-full max-w-2xl overflow-hidden rounded-[26px] border border-emerald-100 bg-white shadow-[0_20px_60px_rgba(15,23,42,0.08)] sm:rounded-[30px]">
          <div className="relative overflow-hidden bg-[radial-gradient(circle_at_80%_20%,rgba(52,211,153,0.35),transparent_28%),linear-gradient(135deg,#022c22,#047857_55%,#14b8a6)] p-4 text-white sm:p-7">
            <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-white/10 blur-3xl motion-safe:animate-pulse" />

            <div className="relative z-10">
              <div className="grid h-12 w-12 place-items-center rounded-[20px] bg-white text-emerald-600 shadow-lg sm:h-14 sm:w-14">
                <span className="text-2xl font-black sm:text-3xl">✓</span>
              </div>

              <p className="mt-4 text-[9px] font-black uppercase tracking-[0.22em] text-emerald-100 sm:text-[10px]">
                Donation Submitted
              </p>

              <h1 className="mt-2 text-3xl font-black tracking-[-0.06em] sm:text-5xl">
                Thank You
              </h1>

              <p className="mt-3 max-w-xl text-xs font-semibold leading-6 text-emerald-50 sm:text-sm sm:leading-7">
                Your donation information has been received. We will verify the payment and update
                the foundation fund within one day.
              </p>
            </div>
          </div>

          <div className="grid gap-3 p-3 sm:p-5">
            <div className="rounded-[20px] bg-emerald-50 p-4 sm:rounded-[22px]">
              <p className="text-[9px] font-black uppercase tracking-[0.18em] text-emerald-700 sm:text-[10px]">
                Submitted Amount
              </p>
              <p className="mt-2 text-2xl font-black text-emerald-800 sm:text-3xl">
                {money(successData?.amount)}
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-[18px] bg-slate-50 p-3 sm:rounded-[20px] sm:p-4">
                <p className="text-[10px] font-black uppercase text-slate-400 sm:text-xs">Donor</p>
                <p className="mt-1 text-sm font-black text-slate-950">
                  {successData?.donorName || 'Not added'}
                </p>
              </div>

              <div className="rounded-[18px] bg-slate-50 p-3 sm:rounded-[20px] sm:p-4">
                <p className="text-[10px] font-black uppercase text-slate-400 sm:text-xs">Fund</p>
                <p className="mt-1 text-sm font-black text-slate-950">
                  {successData?.category || 'General Donation'}
                </p>
              </div>
            </div>

            <div className="rounded-[18px] bg-slate-50 p-3 sm:rounded-[20px] sm:p-4">
              <p className="text-[10px] font-black uppercase text-slate-400 sm:text-xs">Project</p>
              <p className="mt-1 text-sm font-black text-slate-950">
                {successData?.project || 'General donation'}
              </p>
            </div>

            <button
              type="button"
              onClick={startAgain}
              className="mt-1 h-11 rounded-2xl bg-gradient-to-r from-emerald-600 to-cyan-500 px-5 text-sm font-black text-white shadow-[0_16px_35px_rgba(16,185,129,0.22)] transition hover:-translate-y-1 sm:h-12"
            >
              Make Another Donation
            </button>
          </div>
        </div>
      </section>
    )
  }

  if (step === 'payment') {
    return (
      <section className="min-h-screen overflow-x-hidden bg-[#eef4ff] px-2 pb-28 pt-3 text-slate-950 sm:px-5 md:px-6">
        <div className="mx-auto grid w-full max-w-5xl gap-3 lg:grid-cols-[minmax(0,1fr)_300px]">
          <form
            onSubmit={submitDonation}
            className="min-w-0 overflow-hidden rounded-[26px] border border-blue-100 bg-white shadow-[0_20px_60px_rgba(15,23,42,0.08)] sm:rounded-[30px]"
          >
            <div className="relative overflow-hidden bg-[radial-gradient(circle_at_85%_20%,rgba(96,165,250,0.45),transparent_28%),linear-gradient(135deg,#020617,#172554_45%,#2563eb)] p-4 text-white sm:p-6">
              <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-white/10 blur-3xl motion-safe:animate-pulse" />

              <div className="relative z-10">
                <button
                  type="button"
                  onClick={() => setStep('form')}
                  className="rounded-2xl bg-white/10 px-3 py-2 text-[10px] font-black text-blue-100 backdrop-blur-xl sm:px-4 sm:text-xs"
                >
                  ← Back
                </button>

                <p className="mt-4 text-[9px] font-black uppercase tracking-[0.2em] text-blue-100 sm:text-[10px]">
                  Manual Payment
                </p>

                <h1 className="mt-2 break-words text-2xl font-black tracking-[-0.05em] sm:text-5xl">
                  Pay {money(form.amount)}
                </h1>

                <p className="mt-2 max-w-xl text-[11px] font-semibold leading-5 text-blue-100/85 sm:text-sm sm:leading-6">
                  Send first. Then confirm with sender number.
                </p>
              </div>
            </div>

            <div className="grid gap-3 p-3 sm:p-5">
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
                {paymentOptions.map((option) => {
                  const isActive = form.paymentMethod === option.value

                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => {
                        if (!option.active) {
                          alert(`${option.label} payment will be available soon.`)
                          return
                        }

                        setForm((prev) => ({
                          ...prev,
                          paymentMethod: option.value,
                        }))
                      }}
                      className={`min-w-0 rounded-[16px] border p-2 text-left transition sm:rounded-[18px] sm:p-3 ${
                        isActive
                          ? 'border-blue-500 bg-blue-50 shadow-[0_14px_30px_rgba(37,99,235,0.12)]'
                          : 'border-slate-100 bg-slate-50 hover:bg-white'
                      }`}
                    >
                      <p
                        className={`truncate text-[11px] font-black sm:text-xs ${
                          isActive ? 'text-blue-700' : 'text-slate-950'
                        }`}
                      >
                        {option.label}
                      </p>
                      <p className="mt-1 text-[9px] font-bold text-slate-500 sm:text-[10px]">
                        {option.subtitle}
                      </p>
                    </button>
                  )
                })}
              </div>

              <div className="overflow-hidden rounded-[22px] border border-amber-100 bg-amber-50 sm:rounded-[24px]">
                <div className="bg-gradient-to-r from-amber-500 to-orange-500 px-3 py-3 text-white sm:px-4">
                  <p className="text-[9px] font-black uppercase tracking-[0.18em] sm:text-[10px]">
                    Payment Instruction
                  </p>
                </div>

                <div className="grid gap-3 p-3 sm:p-4">
                  <div className="rounded-[18px] bg-white p-3 shadow-sm sm:rounded-[20px] sm:p-4">
                    <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
                      <div className="min-w-0">
                        <p className="text-[9px] font-black uppercase tracking-[0.16em] text-amber-600 sm:text-[10px]">
                          Send Money To
                        </p>

                        <div className="mt-1 flex min-w-0 items-center gap-2">
                          <p className="min-w-0 truncate text-lg font-black tracking-tight text-slate-950 sm:text-3xl">
                            {FOUNDATION_BKASH_NUMBER}
                          </p>

                          <button
                            type="button"
                            onClick={copyNumber}
                            className="shrink-0 rounded-xl bg-blue-50 px-3 py-2 text-[9px] font-black text-blue-700 sm:text-[10px]"
                          >
                            {copied ? 'Copied' : 'Copy'}
                          </button>
                        </div>
                      </div>

                      <div className="min-w-0 rounded-2xl bg-blue-50 px-3 py-3 sm:px-4">
                        <p className="text-[9px] font-black uppercase text-blue-600 sm:text-[10px]">
                          Amount
                        </p>
                        <p className="break-words text-base font-black text-blue-800 sm:text-xl">
                          {money(form.amount)}
                        </p>
                      </div>
                    </div>

                    <p className="mt-3 text-[11px] font-bold leading-5 text-slate-500 sm:text-sm sm:leading-6">
                      Pay {money(form.amount)} first. We will verify and update within one day.
                    </p>
                  </div>

                  <label className="grid gap-2">
                    <span className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-400 sm:text-xs">
                      Payment Sent From Number
                    </span>

                    <input
                      type="tel"
                      name="senderNumber"
                      placeholder="11 digit sender number"
                      value={form.senderNumber}
                      onChange={handleChange}
                      className={`h-11 w-full rounded-2xl border bg-white px-3 text-xs font-bold outline-none transition focus:ring-4 sm:h-12 sm:px-4 sm:text-sm ${
                        errors.senderNumber
                          ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-100'
                          : 'border-amber-100 focus:border-amber-500 focus:ring-amber-100'
                      }`}
                    />

                    <FieldError message={errors.senderNumber} />
                  </label>

                  <label
                    className={`flex cursor-pointer items-start gap-3 rounded-[18px] bg-white p-3 shadow-sm sm:rounded-[20px] sm:p-4 ${
                      errors.paymentDone ? 'ring-2 ring-rose-200' : ''
                    }`}
                  >
                    <input
                      type="checkbox"
                      name="paymentDone"
                      checked={form.paymentDone}
                      onChange={handleChange}
                      className="mt-1 h-5 w-5 shrink-0 rounded border-amber-300"
                    />

                    <span className="text-[11px] font-bold leading-5 text-slate-700 sm:text-sm sm:leading-6">
                      I have paid {money(form.amount)} from this number.
                    </span>
                  </label>

                  <FieldError message={errors.paymentDone} />

                  <button
                    type="submit"
                    disabled={submitLoading}
                    className="h-11 rounded-2xl bg-gradient-to-r from-blue-600 to-cyan-500 px-5 text-sm font-black text-white shadow-[0_18px_38px_rgba(37,99,235,0.25)] transition hover:-translate-y-1 disabled:opacity-60 sm:h-12"
                  >
                    {submitLoading ? 'Submitting...' : 'Confirm Donation'}
                  </button>
                </div>
              </div>
            </div>
          </form>

          <aside className="grid min-w-0 content-start gap-3">
            <div className="rounded-[24px] border border-blue-100 bg-white p-4 shadow-[0_16px_40px_rgba(15,23,42,0.06)] sm:rounded-[28px]">
              <p className="text-[9px] font-black uppercase tracking-[0.2em] text-blue-600 sm:text-[10px]">
                Summary
              </p>

              <h3 className="mt-2 break-words text-2xl font-black text-slate-950 sm:text-3xl">
                {money(form.amount)}
              </h3>

              <div className="mt-4 grid gap-2 text-xs font-bold text-slate-500 sm:text-sm">
                <p>
                  Donor:{' '}
                  <span className="font-black text-slate-950">
                    {form.donorName || 'Not added'}
                  </span>
                </p>

                <p>
                  Fund:{' '}
                  <span className="font-black text-slate-950">
                    {selectedCategory?.name || 'General Donation'}
                  </span>
                </p>

                <p>
                  Project:{' '}
                  <span className="font-black text-slate-950">
                    {selectedProject?.title || 'General donation'}
                  </span>
                </p>
              </div>
            </div>

            <div className="rounded-[24px] border border-emerald-100 bg-emerald-50 p-4 sm:rounded-[28px]">
              <p className="text-[9px] font-black uppercase tracking-[0.2em] text-emerald-700 sm:text-[10px]">
                Verification
              </p>
              <p className="mt-2 text-xs font-bold leading-6 text-emerald-800 sm:text-sm">
                After admin approval, this amount will be added to selected fund/project.
              </p>
            </div>
          </aside>
        </div>
      </section>
    )
  }

  return (
    <section className="min-h-screen overflow-x-hidden bg-[#eef4ff] px-0 pb-28 pt-3 text-slate-950 sm:px-5 md:px-6">
      <div className="mx-auto grid w-full max-w-5xl gap-3 px-2 sm:px-0 lg:grid-cols-[minmax(0,1fr)_280px]">
        <form
          onSubmit={goToPayment}
          className="min-w-0 overflow-hidden rounded-[24px] border border-blue-100 bg-white shadow-[0_20px_60px_rgba(15,23,42,0.08)] sm:rounded-[30px]"
        >
          <div className="relative overflow-hidden bg-[radial-gradient(circle_at_15%_20%,rgba(56,189,248,0.30),transparent_30%),radial-gradient(circle_at_90%_25%,rgba(129,140,248,0.45),transparent_28%),linear-gradient(135deg,#020617,#172554_50%,#2563eb)] p-4 text-white sm:p-6">
            <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-white/10 blur-3xl motion-safe:animate-pulse" />
            <div className="absolute -bottom-24 left-8 h-72 w-72 rounded-full bg-cyan-400/20 blur-3xl" />
            <div className="absolute right-8 top-8 h-12 w-12 rounded-full border border-white/15 motion-safe:animate-[spin_12s_linear_infinite] sm:h-14 sm:w-14" />
            <div className="absolute right-14 top-14 h-7 w-7 rounded-full border border-cyan-200/25 motion-safe:animate-[spin_8s_linear_infinite_reverse] sm:right-16 sm:top-16 sm:h-8 sm:w-8" />

            <div className="relative z-10 min-w-0">
              <div className="inline-flex max-w-full rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-[8px] font-black uppercase tracking-[0.16em] text-blue-100 backdrop-blur-xl sm:px-3 sm:py-2 sm:text-[9px]">
                Secure Donation
              </div>

              <h1 className="mt-3 break-words text-[28px] font-black leading-[0.92] tracking-[-0.06em] sm:mt-4 sm:text-5xl">
                Donate Now
              </h1>

              <p className="mt-2 max-w-xl text-[11px] font-semibold leading-5 text-blue-100/85 sm:text-sm sm:leading-6">
                Choose a fund or active project, add your details and donate.
              </p>
            </div>
          </div>

          <div className="grid gap-3 p-3 sm:p-5">
            <div className="min-w-0 rounded-[22px] border border-blue-100 bg-gradient-to-br from-blue-50 to-cyan-50 p-3 sm:rounded-[24px]">
              <div className="mb-2 flex min-w-0 items-center justify-between gap-2">
                <span className="truncate text-[9px] font-black uppercase tracking-[0.16em] text-blue-700 sm:text-xs">
                  Quick Amount
                </span>
                <span className="shrink-0 rounded-full bg-white px-2 py-1 text-[8px] font-black text-blue-700 sm:px-3 sm:text-[10px]">
                  Default 500
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2">
                {quickAmounts.map((amount) => (
                  <button
                    key={amount}
                    type="button"
                    onClick={() => setAmount(amount)}
                    className={`h-9 min-w-0 rounded-2xl text-[10px] font-black transition hover:-translate-y-1 sm:h-10 sm:text-xs ${
                      Number(form.amount) === amount
                        ? 'bg-blue-600 text-white shadow-lg'
                        : 'bg-white text-blue-700'
                    }`}
                  >
                    {money(amount).replace('BDT ', '')}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid min-w-0 gap-3 sm:grid-cols-2">
              <label className="grid min-w-0 gap-1.5 sm:gap-2">
                <span className="text-[9px] font-black uppercase tracking-[0.16em] text-slate-400 sm:text-xs">
                  Donor Name
                </span>
                <input
                  type="text"
                  name="donorName"
                  placeholder="Your name"
                  value={form.donorName}
                  onChange={handleChange}
                  className={inputClass(errors.donorName)}
                />
                <FieldError message={errors.donorName} />
              </label>

              <label className="grid min-w-0 gap-1.5 sm:gap-2">
                <span className="text-[9px] font-black uppercase tracking-[0.16em] text-slate-400 sm:text-xs">
                  Mobile Number
                </span>
                <input
                  type="tel"
                  name="phone"
                  placeholder="11 digit mobile number"
                  value={form.phone}
                  onChange={handleChange}
                  className={inputClass(errors.phone)}
                />
                <FieldError message={errors.phone} />
              </label>

              <label className="grid min-w-0 gap-1.5 sm:gap-2">
                <span className="text-[9px] font-black uppercase tracking-[0.16em] text-slate-400 sm:text-xs">
                  Email Optional
                </span>
                <input
                  type="email"
                  name="email"
                  placeholder="Your email address"
                  value={form.email}
                  onChange={handleChange}
                  className={inputClass(errors.email)}
                />
              </label>

              <label className="grid min-w-0 gap-1.5 sm:gap-2">
                <span className="text-[9px] font-black uppercase tracking-[0.16em] text-slate-400 sm:text-xs">
                  Custom Amount
                </span>
                <input
                  type="number"
                  name="amount"
                  min="1"
                  placeholder="Write any amount"
                  value={form.amount}
                  onChange={handleChange}
                  className={inputClass(errors.amount)}
                />
                <FieldError message={errors.amount} />
              </label>
            </div>

            <div className="grid min-w-0 gap-1.5 sm:gap-2">
              <span className="text-[9px] font-black uppercase tracking-[0.16em] text-slate-400 sm:text-xs">
                Donation Fund / Project
              </span>

              <select
                value={donationChoiceValue}
                onChange={handleDonationChoiceChange}
                disabled={loading}
                className="h-10 w-full min-w-0 rounded-2xl border border-blue-100 bg-slate-50 px-3 text-xs font-bold outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100 sm:h-11 sm:px-4 sm:text-sm"
              >
                {cleanCategories.length > 0 && (
                  <optgroup label="Fund Categories">
                    {cleanCategories
                      .filter((category) => normalize(category.name) !== 'all project')
                      .map((category) => (
                        <option
                          key={category._id || category.slug}
                          value={`category:${category._id}`}
                        >
                          {category.name}
                        </option>
                      ))}
                  </optgroup>
                )}

                {activeProjects.length > 0 && (
                  <optgroup label="Active Projects">
                    {activeProjects.map((project) => (
                      <option key={project._id || project.slug} value={`project:${project._id}`}>
                        Project: {project.title}
                      </option>
                    ))}
                  </optgroup>
                )}
              </select>
            </div>

            {selectedProject && (
              <div className="min-w-0 rounded-[22px] border border-blue-100 bg-slate-50 p-3 sm:rounded-[24px]">
                <div className="mb-3 flex min-w-0 items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-[9px] font-black uppercase tracking-[0.16em] text-slate-400 sm:text-xs">
                      Selected Project
                    </p>
                    <p className="mt-1 truncate text-xs font-black text-slate-950 sm:text-sm">
                      This donation will go to All project fund.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={clearSelectedProject}
                    className="shrink-0 rounded-full bg-white px-3 py-1 text-[9px] font-black text-rose-600 sm:text-[10px]"
                  >
                    Clear
                  </button>
                </div>

                <div className="overflow-hidden rounded-[20px] border border-blue-100 bg-white sm:rounded-[22px]">
                  <div className="h-28 bg-slate-100 sm:h-40">
                    {makeImageUrl(apiBase, selectedProject.coverImage) ? (
                      <img
                        src={makeImageUrl(apiBase, selectedProject.coverImage)}
                        alt={selectedProject.title}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="grid h-full w-full place-items-center bg-gradient-to-br from-blue-600 to-cyan-500 text-2xl font-black text-white sm:text-3xl">
                        OCF
                      </div>
                    )}
                  </div>

                  <div className="p-3 sm:p-4">
                    <h4 className="line-clamp-2 text-base font-black text-slate-950 sm:text-lg">
                      {selectedProject.title}
                    </h4>

                    <div className="mt-3 flex items-center justify-between text-[10px] font-black text-slate-500 sm:text-[11px]">
                      <span>Progress</span>
                      <span>{getProgress(selectedProject)}%</span>
                    </div>

                    <div className="mt-1.5 h-2.5 overflow-hidden rounded-full bg-slate-100">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-blue-600 to-cyan-400"
                        style={{ width: `${getProgress(selectedProject)}%` }}
                      />
                    </div>

                    <div className="mt-3 grid grid-cols-3 gap-2">
                      <div className="min-w-0 rounded-xl bg-slate-50 p-2">
                        <p className="text-[7px] font-black uppercase text-slate-400 sm:text-[8px]">
                          Target
                        </p>
                        <p className="mt-1 truncate text-[9px] font-black sm:text-[10px]">
                          {money(selectedProject.targetAmount)}
                        </p>
                      </div>

                      <div className="min-w-0 rounded-xl bg-emerald-50 p-2">
                        <p className="text-[7px] font-black uppercase text-emerald-500 sm:text-[8px]">
                          Collected
                        </p>
                        <p className="mt-1 truncate text-[9px] font-black text-emerald-700 sm:text-[10px]">
                          {money(selectedProject.collectedAmount)}
                        </p>
                      </div>

                      <div className="min-w-0 rounded-xl bg-rose-50 p-2">
                        <p className="text-[7px] font-black uppercase text-rose-500 sm:text-[8px]">
                          Left
                        </p>
                        <p className="mt-1 truncate text-[9px] font-black text-rose-700 sm:text-[10px]">
                          {money(getRemaining(selectedProject))}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <button
              type="submit"
              className="h-11 rounded-2xl bg-gradient-to-r from-blue-600 to-cyan-500 px-5 text-sm font-black text-white shadow-[0_18px_38px_rgba(37,99,235,0.25)] transition hover:-translate-y-1 sm:h-12"
            >
              Donate Now
            </button>
          </div>
        </form>

        <aside className="grid min-w-0 content-start gap-3">
          <div className="rounded-[24px] border border-blue-100 bg-white p-4 shadow-[0_16px_40px_rgba(15,23,42,0.06)] sm:rounded-[28px]">
            <p className="text-[9px] font-black uppercase tracking-[0.2em] text-blue-600 sm:text-[10px]">
              Summary
            </p>

            <h3 className="mt-2 break-words text-2xl font-black text-slate-950 sm:text-3xl">
              {money(form.amount)}
            </h3>

            <div className="mt-4 grid gap-2 text-xs font-bold text-slate-500 sm:text-sm">
              <p>
                Donor:{' '}
                <span className="font-black text-slate-950">
                  {form.donorName || 'Not added'}
                </span>
              </p>

              <p>
                Fund:{' '}
                <span className="font-black text-slate-950">
                  {selectedCategory?.name || 'General Donation'}
                </span>
              </p>

              <p>
                Project:{' '}
                <span className="font-black text-slate-950">
                  {selectedProject?.title || 'No project selected'}
                </span>
              </p>
            </div>
          </div>

          <div className="rounded-[24px] border border-cyan-100 bg-cyan-50 p-4 sm:rounded-[28px]">
            <p className="text-[9px] font-black uppercase tracking-[0.2em] text-cyan-700 sm:text-[10px]">
              Clean Process
            </p>
            <p className="mt-2 text-xs font-bold leading-6 text-cyan-800 sm:text-sm">
              Project donation will be stored under All project fund and selected project.
            </p>
          </div>
        </aside>
      </div>
    </section>
  )
}