import { useEffect, useMemo, useState } from 'react'
import { bangladeshDistricts } from '../data/bangladeshDistricts'

function today() {
  const date = new Date()
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')

  return `${year}-${month}-${day}`
}

function isFutureDate(value) {
  if (!value) return false

  const selectedDate = new Date(`${value}T00:00:00`)
  const currentDate = new Date(`${today()}T00:00:00`)

  return selectedDate > currentDate
}

function cleanPhone(value) {
  return String(value || '').replace(/\D/g, '').slice(0, 11)
}

function isValidBdPhone(value) {
  return /^01\d{9}$/.test(String(value || '').trim())
}

function makeImageUrl(API, url) {
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
    return `${API}${url}`
  }

  return `${API}/${url}`
}

function formatAmount(amount) {
  return Number(amount || 0).toLocaleString('en-US')
}

function formatDateTime(date) {
  if (!date) return 'Time not found'

  const parsedDate = new Date(date)

  if (Number.isNaN(parsedDate.getTime())) {
    return 'Time not found'
  }

  return parsedDate.toLocaleString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function formatShortDate(date) {
  if (!date) return 'Not yet'

  const parsedDate = new Date(date)

  if (Number.isNaN(parsedDate.getTime())) {
    return 'Not yet'
  }

  return parsedDate.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

function getBloodAvailability(nextEligibleDate) {
  if (!nextEligibleDate) {
    return {
      label: 'Available',
      className: 'border-emerald-100 bg-emerald-50 text-emerald-700',
    }
  }

  const nextDate = new Date(nextEligibleDate)

  if (Number.isNaN(nextDate.getTime()) || nextDate <= new Date()) {
    return {
      label: 'Available',
      className: 'border-emerald-100 bg-emerald-50 text-emerald-700',
    }
  }

  const daysLeft = Math.ceil((nextDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24))

  return {
    label: `${daysLeft} days left`,
    className: 'border-amber-100 bg-amber-50 text-amber-700',
  }
}

function InfoCard({ label, value, tone = 'blue' }) {
  return (
    <div
      className={`rounded-[20px] border p-3 shadow-sm ${
        tone === 'violet'
          ? 'border-violet-100 bg-violet-50/70'
          : tone === 'slate'
            ? 'border-slate-100 bg-slate-50'
            : 'border-blue-100 bg-blue-50/70'
      }`}
    >
      <p
        className={`text-[9px] font-black uppercase tracking-[0.18em] ${
          tone === 'violet'
            ? 'text-violet-500'
            : tone === 'slate'
              ? 'text-slate-400'
              : 'text-blue-500'
        }`}
      >
        {label}
      </p>

      <p className="mt-1 break-words text-xs font-black leading-5 text-slate-800 sm:text-sm">
        {value || 'Not added'}
      </p>
    </div>
  )
}

export default function ProfilePage({
  API,
  bloodGroups,
  currentUser,
  setCurrentUser,
  token,
  setToken,
  onDonorUpdated,
}) {
  const maxDate = today()

  const [authMode, setAuthMode] = useState('login')
  const [authLoading, setAuthLoading] = useState(false)

  const [otpStep, setOtpStep] = useState(false)
  const [pendingPhone, setPendingPhone] = useState('')
  const [otpCode, setOtpCode] = useState('')
  const [resendSeconds, setResendSeconds] = useState(0)

  const [profilePhoto, setProfilePhoto] = useState('')

  const [donationLoading, setDonationLoading] = useState(false)
  const [donationSummary, setDonationSummary] = useState({
    totalDonated: 0,
    history: [],
  })
  const [showDonationHistory, setShowDonationHistory] = useState(false)

  const [authForm, setAuthForm] = useState({
    name: '',
    phone: '',
    email: '',
    password: '',
    identifier: '',
  })

  const [donorForm, setDonorForm] = useState({
    name: '',
    phone: '',
    district: '',
    address: '',
    bloodGroup: 'B+',
  })

  const [volunteerForm, setVolunteerForm] = useState({
    district: '',
    note: '',
    photo: null,
    nidFront: null,
    nidBack: null,
  })

  const [bloodProofLoading, setBloodProofLoading] = useState(false)
  const [bloodRequestsLoading, setBloodRequestsLoading] = useState(false)
  const [bloodDonationRequests, setBloodDonationRequests] = useState([])

  const [bloodProofForm, setBloodProofForm] = useState({
    donationDate: today(),
    note: '',
    proofImage: null,
  })

  const FieldClass =
    'h-11 w-full rounded-2xl border border-blue-100 bg-white/90 px-3 text-xs font-bold text-slate-900 outline-none shadow-inner transition focus:border-violet-500 focus:ring-4 focus:ring-violet-100 sm:h-12 sm:px-4 sm:text-sm'

  const FileBoxClass =
    'group rounded-[24px] border border-dashed border-violet-200 bg-white/80 p-3 text-xs font-black text-slate-800 shadow-sm transition hover:-translate-y-0.5 hover:border-violet-500 hover:bg-violet-50 hover:shadow-lg sm:p-4 sm:text-sm'

  const profileImage = makeImageUrl(API, profilePhoto)

  const donationHistory = Array.isArray(donationSummary.history) ? donationSummary.history : []
  const donationBars = donationHistory.slice(0, 6)
  const maxDonationAmount = Math.max(1, ...donationBars.map((item) => Number(item.amount) || 0))
  const bloodAvailability = getBloodAvailability(currentUser?.nextEligibleDate)

  const pendingBloodRequestCount = useMemo(() => {
    return bloodDonationRequests.filter((item) => item.status === 'pending').length
  }, [bloodDonationRequests])

  useEffect(() => {
    if (resendSeconds <= 0) return undefined

    const timer = setInterval(() => {
      setResendSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(timer)
          return 0
        }

        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [resendSeconds])

  useEffect(() => {
    if (currentUser) {
      setDonorForm((prev) => ({
        ...prev,
        name: currentUser.name || '',
        phone: currentUser.phone || '',
        district: currentUser.district || '',
        address: currentUser.address || '',
        bloodGroup: currentUser.bloodGroup || 'B+',
      }))

      setVolunteerForm((prev) => ({
        ...prev,
        district: currentUser.district || '',
      }))

      setProfilePhoto(currentUser.profilePhoto || '')
    } else {
      setProfilePhoto('')
      setDonationSummary({
        totalDonated: 0,
        history: [],
      })
      setShowDonationHistory(false)
      setBloodDonationRequests([])
      setBloodProofForm({
        donationDate: today(),
        note: '',
        proofImage: null,
      })
    }
  }, [currentUser])

  useEffect(() => {
    if (!currentUser?.phone) return undefined

    const loadMyDonationHistory = async () => {
      try {
        setDonationLoading(true)

        const res = await fetch(`${API}/api/donations/search/${currentUser.phone}`)
        const data = await res.json()

        if (!res.ok) {
          setDonationSummary({
            totalDonated: 0,
            history: [],
          })
          return
        }

        setDonationSummary({
          totalDonated: Number(data?.totalDonated || data?.totalDonation || 0),
          history: Array.isArray(data?.history) ? data.history : [],
        })
      } catch (error) {
        console.log(error.message)

        setDonationSummary({
          totalDonated: 0,
          history: [],
        })
      } finally {
        setDonationLoading(false)
      }
    }

    loadMyDonationHistory()

    return undefined
  }, [API, currentUser?.phone])

  const loadMyBloodDonationRequests = async () => {
    if (!token || !currentUser?.isBloodDonor) {
      setBloodDonationRequests([])
      return
    }

    try {
      setBloodRequestsLoading(true)

      const res = await fetch(`${API}/api/blood-donations/my-requests`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data?.message || 'Blood donation requests loading failed')
      }

      setBloodDonationRequests(Array.isArray(data?.requests) ? data.requests : [])
    } catch (error) {
      console.log(error.message)
      setBloodDonationRequests([])
    } finally {
      setBloodRequestsLoading(false)
    }
  }

  useEffect(() => {
    loadMyBloodDonationRequests()
  }, [API, token, currentUser?.id, currentUser?._id, currentUser?.isBloodDonor])

  const saveAuthData = (newToken, user) => {
    localStorage.setItem('ocf_token', newToken)
    localStorage.setItem('ocf_user', JSON.stringify(user))
    setToken(newToken)
    setCurrentUser(user)
  }

  const handleLogout = () => {
    localStorage.removeItem('ocf_token')
    localStorage.removeItem('ocf_user')
    setToken('')
    setCurrentUser(null)
    setAuthMode('login')
    setOtpStep(false)
    setPendingPhone('')
    setOtpCode('')
    setResendSeconds(0)
    setProfilePhoto('')
    setDonationSummary({
      totalDonated: 0,
      history: [],
    })
    setShowDonationHistory(false)
  }

  const handleAuthInput = (e) => {
    const { name, value } = e.target

    setAuthForm((prev) => ({
      ...prev,
      [name]: name === 'phone' ? cleanPhone(value) : value,
    }))
  }

  const handleRegister = async (e) => {
    e.preventDefault()

    if (!authForm.name.trim() || !authForm.phone.trim() || !authForm.password.trim()) {
      alert('Name, phone and password are required')
      return
    }

    if (!isValidBdPhone(authForm.phone)) {
      alert('Please enter a valid 11 digit mobile number')
      return
    }

    try {
      setAuthLoading(true)

      const res = await fetch(`${API}/api/users/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: authForm.name.trim(),
          phone: authForm.phone.trim(),
          email: authForm.email.trim(),
          password: authForm.password,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data?.message || 'OTP request failed')
      }

      setPendingPhone(data.phone || authForm.phone)
      setOtpStep(true)
      setOtpCode('')
      setResendSeconds(data.resendAfterSeconds || 30)

      alert('OTP sent successfully. Please check your phone.')
    } catch (error) {
      alert(error.message)
    } finally {
      setAuthLoading(false)
    }
  }

  const handleVerifyOtp = async (e) => {
    e.preventDefault()

    if (!pendingPhone || !otpCode) {
      alert('Phone and OTP are required')
      return
    }

    try {
      setAuthLoading(true)

      const res = await fetch(`${API}/api/users/verify-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phone: pendingPhone,
          otp: otpCode,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data?.message || 'OTP verification failed')
      }

      saveAuthData(data.token, data.user)

      setOtpStep(false)
      setPendingPhone('')
      setOtpCode('')
      setResendSeconds(0)
      setAuthForm({
        name: '',
        phone: '',
        email: '',
        password: '',
        identifier: '',
      })

      alert('Phone verified. You are logged in successfully.')
    } catch (error) {
      alert(error.message)
    } finally {
      setAuthLoading(false)
    }
  }

  const handleResendOtp = async () => {
    if (!pendingPhone) {
      alert('No pending phone number found')
      return
    }

    if (resendSeconds > 0) {
      alert(`Please wait ${resendSeconds} seconds`)
      return
    }

    try {
      setAuthLoading(true)

      const res = await fetch(`${API}/api/users/resend-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phone: pendingPhone,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data?.message || 'OTP resend failed')
      }

      setOtpCode('')
      setResendSeconds(data.resendAfterSeconds || 30)

      alert('OTP resent successfully.')
    } catch (error) {
      alert(error.message)
    } finally {
      setAuthLoading(false)
    }
  }

  const handleLogin = async (e) => {
    e.preventDefault()

    if (!authForm.identifier.trim() || !authForm.password.trim()) {
      alert('Phone/email and password are required')
      return
    }

    try {
      setAuthLoading(true)

      const res = await fetch(`${API}/api/users/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          identifier: authForm.identifier.trim(),
          password: authForm.password,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data?.message || 'Login failed')
      }

      saveAuthData(data.token, data.user)
      alert('Login successful')
    } catch (error) {
      alert(error.message)
    } finally {
      setAuthLoading(false)
    }
  }

  const handleProfilePhotoChange = async (e) => {
    const file = e.target.files?.[0]

    if (!file) return

    if (!file.type.startsWith('image/')) {
      alert('Please select an image file')
      return
    }

    if (!token) {
      alert('Please login first')
      return
    }

    try {
      setAuthLoading(true)

      const formData = new FormData()
      formData.append('profilePhoto', file)

      const res = await fetch(`${API}/api/users/profile-photo`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data?.message || 'Profile photo upload failed')
      }

      const updatedUser = {
        ...currentUser,
        ...(data.user || {}),
      }

      localStorage.setItem('ocf_user', JSON.stringify(updatedUser))
      setCurrentUser(updatedUser)
      setProfilePhoto(updatedUser.profilePhoto || '')

      alert('Profile photo updated successfully')
    } catch (error) {
      alert(error.message)
    } finally {
      setAuthLoading(false)
      e.target.value = ''
    }
  }

  const handleDonorInput = (e) => {
    const { name, value } = e.target

    setDonorForm((prev) => ({
      ...prev,
      [name]: name === 'phone' ? cleanPhone(value) : value,
    }))
  }

  const handleBecomeBloodDonor = async (e) => {
    e.preventDefault()

    if (!token) {
      alert('Please login first')
      return
    }

    if (
      !donorForm.name.trim() ||
      !donorForm.phone.trim() ||
      !donorForm.district.trim() ||
      !donorForm.bloodGroup
    ) {
      alert('Name, phone, district and blood group are required')
      return
    }

    if (!isValidBdPhone(donorForm.phone)) {
      alert('Please enter a valid 11 digit mobile number')
      return
    }

    try {
      setAuthLoading(true)

      const res = await fetch(`${API}/api/users/become-blood-donor`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...donorForm,
          name: donorForm.name.trim(),
          phone: donorForm.phone.trim(),
          district: donorForm.district.trim(),
          address: donorForm.address.trim(),
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data?.message || 'Failed to add donor')
      }

      const updatedUser = {
        ...currentUser,
        ...data.donor,
      }

      localStorage.setItem('ocf_user', JSON.stringify(updatedUser))
      setCurrentUser(updatedUser)

      if (onDonorUpdated) {
        await onDonorUpdated()
      }

      alert(currentUser.isBloodDonor ? 'Blood donor information updated' : 'You are now added as a blood donor')
    } catch (error) {
      alert(error.message)
    } finally {
      setAuthLoading(false)
    }
  }

  const handleRemoveBloodDonor = async () => {
    if (!token) {
      alert('Please login first')
      return
    }

    const confirmRemove = confirm('Are you sure you want to remove yourself from blood donor list?')

    if (!confirmRemove) return

    try {
      setAuthLoading(true)

      const res = await fetch(`${API}/api/users/remove-blood-donor`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data?.message || 'Failed to remove donor')
      }

      const updatedUser = {
        ...currentUser,
        ...(data.user || {}),
      }

      localStorage.setItem('ocf_user', JSON.stringify(updatedUser))
      setCurrentUser(updatedUser)

      if (onDonorUpdated) {
        await onDonorUpdated()
      }

      alert('You have been removed from blood donor list.')
    } catch (error) {
      alert(error.message)
    } finally {
      setAuthLoading(false)
    }
  }

  const handleBloodProofInput = (e) => {
    const { name, value, files } = e.target

    if (name === 'donationDate' && isFutureDate(value)) {
      alert('Future date is not allowed.')
      return
    }

    setBloodProofForm((prev) => ({
      ...prev,
      [name]: files ? files[0] : value,
    }))
  }

  const handleBloodProofSubmit = async (e) => {
    e.preventDefault()

    if (!currentUser || !token) {
      alert('Please login first')
      return
    }

    if (!currentUser.isBloodDonor) {
      alert('Please add yourself as a blood donor first')
      return
    }

    if (!bloodProofForm.donationDate) {
      alert('Donation date is required')
      return
    }

    if (isFutureDate(bloodProofForm.donationDate)) {
      alert('Future donation date is not allowed')
      return
    }

    if (!bloodProofForm.proofImage) {
      alert('Proof image is required')
      return
    }

    try {
      setBloodProofLoading(true)

      const formData = new FormData()
      formData.append('donationDate', bloodProofForm.donationDate)
      formData.append('note', bloodProofForm.note || '')
      formData.append('proofImage', bloodProofForm.proofImage)

      const res = await fetch(`${API}/api/blood-donations/request`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data?.message || 'Blood donation proof submit failed')
      }

      setBloodProofForm({
        donationDate: today(),
        note: '',
        proofImage: null,
      })

      await loadMyBloodDonationRequests()

      alert('Blood donation proof submitted successfully. Waiting for admin approval.')
    } catch (error) {
      alert(error.message)
    } finally {
      setBloodProofLoading(false)
      e.target.reset()
    }
  }

  const handleVolunteerInput = (e) => {
    const { name, value, files } = e.target

    setVolunteerForm((prev) => ({
      ...prev,
      [name]: files ? files[0] : value,
    }))
  }

  const handleVolunteerApply = async (e) => {
    e.preventDefault()

    if (!currentUser || !token) {
      alert('Please login first')
      return
    }

    if (
      !volunteerForm.district ||
      !volunteerForm.photo ||
      !volunteerForm.nidFront ||
      !volunteerForm.nidBack
    ) {
      alert('District, photo, NID front and NID back are required')
      return
    }

    try {
      setAuthLoading(true)

      const formData = new FormData()

      formData.append('district', volunteerForm.district)
      formData.append('note', volunteerForm.note || '')
      formData.append('photo', volunteerForm.photo)
      formData.append('nidFront', volunteerForm.nidFront)
      formData.append('nidBack', volunteerForm.nidBack)

      const res = await fetch(`${API}/api/volunteers/apply`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data?.message || 'Volunteer application failed')
      }

      const updatedUser = {
        ...currentUser,
        ...(data.user || {}),
      }

      localStorage.setItem('ocf_user', JSON.stringify(updatedUser))
      setCurrentUser(updatedUser)

      setVolunteerForm({
        district: updatedUser.district || '',
        note: '',
        photo: null,
        nidFront: null,
        nidBack: null,
      })

      alert('Volunteer application submitted successfully. Waiting for admin approval.')
    } catch (error) {
      alert(error.message)
    } finally {
      setAuthLoading(false)
    }
  }

  return (
    <section className="profile-shell relative overflow-hidden rounded-[28px] border border-blue-100 bg-[#f8fbff] shadow-[0_28px_100px_rgba(30,64,175,0.14)] sm:rounded-[38px]">
      <style>{`
        @keyframes profileSweep {
          0% { transform: translateX(-120%) skewX(-15deg); }
          100% { transform: translateX(180%) skewX(-15deg); }
        }

        .profile-hero-card::before {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(120deg, transparent 0%, rgba(255,255,255,0.24) 45%, transparent 70%);
          animation: profileSweep 5s linear infinite;
          pointer-events: none;
        }
      `}</style>

      <div className="absolute -left-24 top-16 h-72 w-72 rounded-full bg-blue-500/15 blur-3xl" />
      <div className="absolute -right-24 top-52 h-72 w-72 rounded-full bg-violet-500/20 blur-3xl" />

      <div className="profile-hero-card relative overflow-hidden bg-[#050816] px-4 py-6 text-white sm:px-6 md:px-8 md:py-10">
        <div className="absolute right-10 top-12 h-28 w-28 rounded-full bg-blue-500/30 blur-2xl" />
        <div className="absolute bottom-0 left-1/2 h-40 w-96 -translate-x-1/2 rounded-full bg-violet-500/30 blur-3xl" />

        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-[8px] font-black uppercase tracking-[0.2em] text-blue-100 backdrop-blur-xl sm:px-4 sm:py-2 sm:text-[10px]">
            <span className="h-1.5 w-1.5 rounded-full bg-blue-300 shadow-[0_0_18px_rgba(147,197,253,0.9)]" />
            Open Care Foundation
          </div>

          <h2 className="mt-4 text-[30px] font-black leading-[1.02] tracking-tight sm:text-5xl md:text-6xl">
            {currentUser ? (
              <>
                Your Impact
                <span className="block bg-gradient-to-r from-blue-200 via-white to-violet-200 bg-clip-text text-transparent">
                  Identity
                </span>
              </>
            ) : (
              <>
                Secure
                <span className="block bg-gradient-to-r from-blue-200 via-white to-violet-200 bg-clip-text text-transparent">
                  Profile Access
                </span>
              </>
            )}
          </h2>

          <p className="mt-3 max-w-2xl text-xs leading-5 text-blue-100/80 sm:text-sm md:text-base md:leading-6">
            Manage your donor identity, volunteer status, district, blood support information and
            total donation history from one profile.
          </p>
        </div>
      </div>

      <div className="relative z-10 bg-gradient-to-br from-blue-50 via-white to-violet-50 p-3 sm:p-4 md:p-6">
        {!currentUser ? (
          <div className="mx-auto max-w-2xl rounded-[28px] border border-blue-100 bg-white/90 p-4 shadow-[0_28px_90px_rgba(30,64,175,0.14)] backdrop-blur-xl md:p-6">
            <div className="mb-5 grid grid-cols-2 gap-2 rounded-[22px] bg-slate-100 p-1">
              <button
                type="button"
                onClick={() => {
                  setAuthMode('login')
                  setOtpStep(false)
                }}
                className={`rounded-[18px] px-4 py-3 text-sm font-black transition ${
                  authMode === 'login'
                    ? 'bg-gradient-to-r from-blue-600 to-violet-600 text-white shadow-lg'
                    : 'text-slate-500 hover:bg-white'
                }`}
              >
                Login
              </button>

              <button
                type="button"
                onClick={() => {
                  setAuthMode('register')
                  setOtpStep(false)
                }}
                className={`rounded-[18px] px-4 py-3 text-sm font-black transition ${
                  authMode === 'register'
                    ? 'bg-gradient-to-r from-blue-600 to-violet-600 text-white shadow-lg'
                    : 'text-slate-500 hover:bg-white'
                }`}
              >
                Register
              </button>
            </div>

            {authMode === 'login' ? (
              <form onSubmit={handleLogin} className="grid gap-3">
                <input
                  type="text"
                  name="identifier"
                  placeholder="Phone or email"
                  value={authForm.identifier}
                  onChange={handleAuthInput}
                  className={FieldClass}
                />

                <input
                  type="password"
                  name="password"
                  placeholder="Password"
                  value={authForm.password}
                  onChange={handleAuthInput}
                  className={FieldClass}
                />

                <button
                  type="submit"
                  disabled={authLoading}
                  className="h-12 rounded-2xl bg-gradient-to-r from-blue-600 to-violet-600 font-black text-white shadow-[0_16px_36px_rgba(79,70,229,0.28)] transition hover:-translate-y-0.5 disabled:opacity-70"
                >
                  {authLoading ? 'Please wait...' : 'Login'}
                </button>
              </form>
            ) : otpStep ? (
              <form onSubmit={handleVerifyOtp} className="grid gap-3">
                <div className="rounded-[24px] border border-violet-200 bg-violet-50 p-4">
                  <p className="text-sm font-black text-violet-700">OTP Verification</p>
                  <p className="mt-1 text-sm leading-6 text-violet-700/80">
                    We sent an OTP to <b>{pendingPhone}</b>. Please enter the code below.
                  </p>
                </div>

                <input
                  type="text"
                  inputMode="numeric"
                  maxLength="6"
                  placeholder="000000"
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  className="h-16 rounded-2xl border border-slate-200 bg-white px-4 text-center text-2xl font-black tracking-[0.35em] outline-none transition focus:border-violet-400 focus:ring-4 focus:ring-violet-100"
                />

                <button
                  type="submit"
                  disabled={authLoading}
                  className="h-12 rounded-2xl bg-gradient-to-r from-blue-600 to-violet-600 font-black text-white shadow-[0_16px_36px_rgba(79,70,229,0.28)] transition hover:-translate-y-0.5 disabled:opacity-70"
                >
                  {authLoading ? 'Verifying...' : 'Verify OTP & Login'}
                </button>

                <button
                  type="button"
                  onClick={handleResendOtp}
                  disabled={authLoading || resendSeconds > 0}
                  className="h-12 rounded-2xl border border-slate-200 bg-white font-black text-slate-800 transition hover:bg-slate-50 disabled:opacity-50"
                >
                  {resendSeconds > 0 ? `Resend OTP in ${resendSeconds}s` : 'Resend OTP'}
                </button>
              </form>
            ) : (
              <form onSubmit={handleRegister} className="grid gap-3">
                <input
                  type="text"
                  name="name"
                  placeholder="Full name"
                  value={authForm.name}
                  onChange={handleAuthInput}
                  className={FieldClass}
                />

                <input
                  type="tel"
                  name="phone"
                  placeholder="11 digit phone number"
                  value={authForm.phone}
                  onChange={handleAuthInput}
                  className={FieldClass}
                />

                <input
                  type="email"
                  name="email"
                  placeholder="Email optional"
                  value={authForm.email}
                  onChange={handleAuthInput}
                  className={FieldClass}
                />

                <input
                  type="password"
                  name="password"
                  placeholder="Password"
                  value={authForm.password}
                  onChange={handleAuthInput}
                  className={FieldClass}
                />

                <button
                  type="submit"
                  disabled={authLoading}
                  className="h-12 rounded-2xl bg-gradient-to-r from-blue-600 to-violet-600 font-black text-white shadow-[0_16px_36px_rgba(79,70,229,0.28)] transition hover:-translate-y-0.5 disabled:opacity-70"
                >
                  {authLoading ? 'Sending OTP...' : 'Create Account'}
                </button>
              </form>
            )}
          </div>
        ) : (
          <div className="grid gap-5 xl:grid-cols-[390px_1fr]">
            <aside className="xl:sticky xl:top-5 xl:self-start">
              <div className="flex flex-col overflow-hidden rounded-[28px] border border-blue-100 bg-white/95 shadow-[0_30px_90px_rgba(30,64,175,0.16)] backdrop-blur-xl sm:rounded-[36px]">
                <div className="flex flex-col gap-4 p-4 sm:p-5">
                  <div className="rounded-[26px] border border-white/60 bg-gradient-to-br from-[#07133b] via-[#1f1854] to-[#4c1d95] p-4 text-white shadow-[0_22px_50px_rgba(79,70,229,0.28)] sm:rounded-[32px]">
                    <div className="flex items-center gap-3 sm:gap-4">
                      <div className="h-16 w-16 shrink-0 overflow-hidden rounded-[22px] border border-white/30 bg-white/10 sm:h-20 sm:w-20 sm:rounded-[26px]">
                        {profileImage ? (
                          <img
                            src={profileImage}
                            alt="Profile"
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="grid h-full w-full place-items-center text-2xl font-black sm:text-3xl">
                            {currentUser.name?.charAt(0)?.toUpperCase()}
                          </div>
                        )}
                      </div>

                      <div className="min-w-0">
                        <h3 className="truncate text-lg font-black sm:text-xl">{currentUser.name}</h3>
                        <p className="mt-1 text-[11px] font-semibold text-blue-100/75 sm:text-xs">
                          {currentUser.phone}
                        </p>

                        <label className="mt-3 inline-flex h-8 cursor-pointer items-center justify-center rounded-2xl bg-white px-3 text-[10px] font-black text-violet-700 shadow-xl transition hover:-translate-y-0.5 sm:h-9 sm:px-4 sm:text-[11px]">
                          {authLoading ? 'Uploading...' : 'Change Photo'}
                          <input
                            type="file"
                            accept="image/jpeg,image/jpg,image/png,image/webp"
                            onChange={handleProfilePhotoChange}
                            className="hidden"
                          />
                        </label>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-[26px] border border-violet-100 bg-gradient-to-br from-blue-50 via-white to-violet-50 p-4 sm:rounded-[30px]">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-[9px] font-black uppercase tracking-[0.2em] text-violet-400 sm:text-[10px]">
                          Donation Impact
                        </p>
                        <p className="mt-3 text-xs font-bold text-slate-500">Total Donated</p>
                        <p className="mt-1 text-2xl font-black text-slate-950 sm:text-3xl">
                          BDT {donationLoading ? '...' : formatAmount(donationSummary.totalDonated)}
                        </p>
                      </div>

                      <div className="rounded-2xl bg-white px-3 py-2 text-center shadow-sm">
                        <p className="text-base font-black text-violet-700 sm:text-lg">
                          {donationHistory.length}
                        </p>
                        <p className="text-[9px] font-bold text-slate-400 sm:text-[10px]">Times</p>
                      </div>
                    </div>

                    <div className="mt-4 flex h-20 items-end gap-2 rounded-[22px] bg-white/80 p-3">
                      {donationBars.length === 0 ? (
                        <div className="grid h-full w-full place-items-center text-xs font-bold text-slate-400">
                          No donation chart yet
                        </div>
                      ) : (
                        donationBars.map((item, index) => {
                          const height = Math.max(
                            12,
                            Math.round(((Number(item.amount) || 0) / maxDonationAmount) * 100)
                          )

                          return (
                            <div
                              key={item._id || index}
                              className="flex flex-1 flex-col items-center justify-end"
                            >
                              <div
                                className="w-full rounded-t-2xl bg-gradient-to-t from-blue-600 to-violet-500 shadow-[0_10px_20px_rgba(79,70,229,0.25)]"
                                style={{ height: `${height}%` }}
                                title={`BDT ${formatAmount(item.amount)}`}
                              />
                            </div>
                          )
                        })
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => setShowDonationHistory((prev) => !prev)}
                      className="mt-4 h-11 w-full rounded-2xl bg-gradient-to-r from-blue-600 to-violet-600 text-xs font-black text-white shadow-[0_14px_30px_rgba(79,70,229,0.25)] transition hover:-translate-y-0.5 sm:text-sm"
                    >
                      {showDonationHistory ? 'Hide Donation History' : 'View Donation History'}
                    </button>
                  </div>

                  {showDonationHistory && (
                    <div className="max-h-[260px] overflow-y-auto rounded-[26px] border border-blue-100 bg-slate-50 p-3 sm:rounded-[28px]">
                      {donationHistory.length === 0 ? (
                        <p className="rounded-2xl bg-white p-4 text-center text-sm font-bold text-slate-500">
                          No donation history found
                        </p>
                      ) : (
                        <div className="space-y-2">
                          {donationHistory.map((item, index) => (
                            <div
                              key={item._id || index}
                              className="rounded-2xl bg-white p-3 shadow-sm"
                            >
                              <div className="flex items-start justify-between gap-3">
                                <div>
                                  <p className="text-sm font-black text-slate-900">
                                    BDT {formatAmount(item.amount)}
                                  </p>
                                  <p className="mt-1 text-[11px] font-semibold text-slate-500">
                                    {formatDateTime(item.createdAt || item.updatedAt)}
                                  </p>
                                </div>

                                <span className="rounded-xl bg-violet-50 px-2 py-1 text-[10px] font-black capitalize text-violet-700">
                                  {item.status || 'saved'}
                                </span>
                              </div>

                              {(item.transactionId || item.trxId) && (
                                <p className="mt-2 text-[11px] font-semibold text-slate-400">
                                  TRX: {item.transactionId || item.trxId}
                                </p>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {currentUser.isBloodDonor && (
                    <div className="rounded-[26px] border border-rose-100 bg-gradient-to-br from-rose-50 via-white to-red-50 p-4 shadow-sm sm:rounded-[30px]">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-[9px] font-black uppercase tracking-[0.2em] text-rose-400 sm:text-[10px]">
                            Blood Donor Status
                          </p>
                          <p className="mt-2 text-xl font-black text-slate-950 sm:text-2xl">
                            {currentUser.totalBloodDonations || 0} Times
                          </p>
                          <p className="mt-1 text-xs font-bold text-slate-500">
                            Total verified blood donations
                          </p>
                        </div>

                        <span
                          className={`rounded-2xl border px-3 py-2 text-[11px] font-black sm:text-xs ${bloodAvailability.className}`}
                        >
                          {bloodAvailability.label}
                        </span>
                      </div>

                      <div className="mt-4 grid grid-cols-2 gap-3">
                        <div className="rounded-[20px] border border-rose-100 bg-white/85 p-3 sm:rounded-[22px]">
                          <p className="text-[9px] font-black uppercase tracking-[0.16em] text-rose-400 sm:text-[10px]">
                            Last Date
                          </p>
                          <p className="mt-1 text-xs font-black text-slate-900 sm:text-sm">
                            {formatShortDate(currentUser.lastBloodDonationDate)}
                          </p>
                        </div>

                        <div className="rounded-[20px] border border-rose-100 bg-white/85 p-3 sm:rounded-[22px]">
                          <p className="text-[9px] font-black uppercase tracking-[0.16em] text-rose-400 sm:text-[10px]">
                            Next Date
                          </p>
                          <p className="mt-1 text-xs font-black text-slate-900 sm:text-sm">
                            {formatShortDate(currentUser.nextEligibleDate)}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="grid gap-3">
                    <InfoCard label="Email" value={currentUser.email || 'N/A'} tone="blue" />
                    <InfoCard label="District" value={currentUser.district} tone="violet" />
                    <InfoCard label="Address" value={currentUser.address} tone="slate" />
                    <InfoCard label="Blood Group" value={currentUser.bloodGroup} tone="blue" />
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <div className="rounded-2xl bg-blue-50 p-3 text-center">
                      <p className="text-base font-black text-blue-700 sm:text-lg">
                        {currentUser.isBloodDonor ? 'Yes' : 'No'}
                      </p>
                      <p className="text-[9px] font-bold text-blue-400 sm:text-[10px]">Blood</p>
                    </div>

                    <div className="rounded-2xl bg-violet-50 p-3 text-center">
                      <p className="truncate text-base font-black capitalize text-violet-700 sm:text-lg">
                        {currentUser.volunteerStatus || 'none'}
                      </p>
                      <p className="text-[9px] font-bold text-violet-400 sm:text-[10px]">
                        Volunteer
                      </p>
                    </div>

                    <div className="rounded-2xl bg-slate-100 p-3 text-center">
                      <p className="text-base font-black capitalize text-slate-800 sm:text-lg">
                        {currentUser.role || 'user'}
                      </p>
                      <p className="text-[9px] font-bold text-slate-400 sm:text-[10px]">Role</p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleLogout}
                    className="h-12 w-full rounded-2xl bg-slate-950 font-black text-white shadow-[0_16px_36px_rgba(15,23,42,0.25)] transition hover:-translate-y-0.5"
                  >
                    Logout
                  </button>
                </div>
              </div>
            </aside>

            <main className="grid gap-5">
              <div className="rounded-[28px] border border-violet-100 bg-white/95 p-4 shadow-[0_28px_80px_rgba(88,28,135,0.10)] backdrop-blur-xl sm:rounded-[36px] sm:p-5 md:p-6">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-[9px] font-black uppercase tracking-[0.22em] text-violet-400 sm:text-[10px]">
                      Volunteer Mode
                    </p>
                    <h3 className="mt-1 text-xl font-black text-slate-950 sm:text-2xl">
                      Volunteer Application
                    </h3>
                    <p className="mt-1 text-xs leading-5 text-slate-500 sm:text-sm sm:leading-6">
                      Upload your photo, NID front, NID back and district.
                    </p>
                  </div>

                  <span className="w-max rounded-2xl bg-violet-50 px-4 py-2 text-xs font-black capitalize text-violet-700 sm:text-sm">
                    {currentUser.volunteerStatus || 'none'}
                  </span>
                </div>

                {currentUser.volunteerStatus === 'pending' ? (
                  <div className="mt-5 rounded-[24px] border border-amber-200 bg-amber-50 p-4 sm:rounded-[26px] sm:p-5">
                    <p className="text-sm font-black text-amber-700">Application Pending</p>
                    <p className="mt-1 text-sm text-amber-700/80">
                      Please wait for admin approval.
                    </p>
                  </div>
                ) : currentUser.volunteerStatus === 'approved' ? (
                  <div className="mt-5 rounded-[24px] border border-emerald-200 bg-emerald-50 p-4 sm:rounded-[26px] sm:p-5">
                    <p className="text-sm font-black text-emerald-700">Volunteer Approved</p>
                    <p className="mt-1 text-sm text-emerald-700/80">
                      You are now an approved volunteer.
                    </p>
                  </div>
                ) : (
                  <form onSubmit={handleVolunteerApply} className="mt-5 grid gap-3">
                    <select
                      name="district"
                      value={volunteerForm.district}
                      onChange={handleVolunteerInput}
                      className={FieldClass}
                    >
                      <option value="">Select volunteer district</option>
                      {bangladeshDistricts.map((district) => (
                        <option key={district} value={district}>
                          {district}
                        </option>
                      ))}
                    </select>

                    <textarea
                      name="note"
                      placeholder="Why do you want to become a volunteer? Optional"
                      value={volunteerForm.note}
                      onChange={handleVolunteerInput}
                      rows="3"
                      className="w-full rounded-2xl border border-blue-100 bg-white/90 px-4 py-3 text-sm font-bold text-slate-800 outline-none transition focus:border-violet-500 focus:ring-4 focus:ring-violet-100"
                    />

                    <div className="grid gap-3 md:grid-cols-3">
                      <label className={FileBoxClass}>
                        <span className="block text-violet-700">Your Photo</span>
                        <input
                          type="file"
                          name="photo"
                          accept="image/*"
                          onChange={handleVolunteerInput}
                          className="mt-2 block w-full text-xs font-semibold"
                        />
                      </label>

                      <label className={FileBoxClass}>
                        <span className="block text-violet-700">NID Front</span>
                        <input
                          type="file"
                          name="nidFront"
                          accept="image/*"
                          onChange={handleVolunteerInput}
                          className="mt-2 block w-full text-xs font-semibold"
                        />
                      </label>

                      <label className={FileBoxClass}>
                        <span className="block text-violet-700">NID Back</span>
                        <input
                          type="file"
                          name="nidBack"
                          accept="image/*"
                          onChange={handleVolunteerInput}
                          className="mt-2 block w-full text-xs font-semibold"
                        />
                      </label>
                    </div>

                    <button
                      type="submit"
                      disabled={authLoading}
                      className="h-12 rounded-2xl bg-gradient-to-r from-blue-600 to-violet-600 font-black text-white shadow-[0_16px_36px_rgba(79,70,229,0.28)] transition hover:-translate-y-0.5 disabled:opacity-70"
                    >
                      {authLoading ? 'Submitting...' : 'Apply as Volunteer'}
                    </button>
                  </form>
                )}
              </div>

              <div className="rounded-[28px] border border-blue-100 bg-white/95 p-4 shadow-[0_28px_80px_rgba(30,64,175,0.10)] backdrop-blur-xl sm:rounded-[36px] sm:p-5 md:p-6">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-[9px] font-black uppercase tracking-[0.22em] text-blue-400 sm:text-[10px]">
                      Blood Network
                    </p>
                    <h3 className="mt-1 text-xl font-black text-slate-950 sm:text-2xl">
                      Blood Donor Profile
                    </h3>
                    <p className="mt-1 text-xs text-slate-500 sm:text-sm">
                      Fill this form to appear in public blood donor list.
                    </p>
                  </div>

                  {currentUser.isBloodDonor && (
                    <span className="w-max rounded-2xl bg-gradient-to-r from-blue-600 to-violet-600 px-4 py-2 text-xs font-black text-white shadow-lg sm:text-sm">
                      Active Donor
                    </span>
                  )}
                </div>

                <form onSubmit={handleBecomeBloodDonor} className="mt-5 grid gap-3 md:grid-cols-2">
                  <input
                    type="text"
                    name="name"
                    placeholder="Name"
                    value={donorForm.name}
                    onChange={handleDonorInput}
                    className={FieldClass}
                  />

                  <input
                    type="tel"
                    name="phone"
                    placeholder="11 digit phone"
                    value={donorForm.phone}
                    onChange={handleDonorInput}
                    className={FieldClass}
                  />

                  <select
                    name="district"
                    value={donorForm.district}
                    onChange={handleDonorInput}
                    className={FieldClass}
                  >
                    <option value="">Select district</option>
                    {bangladeshDistricts.map((district) => (
                      <option key={district} value={district}>
                        {district}
                      </option>
                    ))}
                  </select>

                  <select
                    name="bloodGroup"
                    value={donorForm.bloodGroup}
                    onChange={handleDonorInput}
                    className={FieldClass}
                  >
                    {bloodGroups.map((group) => (
                      <option key={group} value={group}>
                        {group}
                      </option>
                    ))}
                  </select>

                  <input
                    type="text"
                    name="address"
                    placeholder="Address"
                    value={donorForm.address}
                    onChange={handleDonorInput}
                    className={`${FieldClass} md:col-span-2`}
                  />

                  <button
                    type="submit"
                    disabled={authLoading}
                    className="h-12 rounded-2xl bg-gradient-to-r from-blue-600 to-violet-600 font-black text-white shadow-[0_16px_36px_rgba(79,70,229,0.28)] transition hover:-translate-y-0.5 disabled:opacity-70 md:col-span-2"
                  >
                    {authLoading
                      ? 'Saving...'
                      : currentUser.isBloodDonor
                        ? 'Update Blood Donor Information'
                        : 'Add Me as Blood Donor'}
                  </button>

                  {currentUser.isBloodDonor && (
                    <button
                      type="button"
                      onClick={handleRemoveBloodDonor}
                      disabled={authLoading}
                      className="h-12 rounded-2xl border border-violet-200 bg-white font-black text-violet-700 transition hover:bg-violet-50 disabled:opacity-70 md:col-span-2"
                    >
                      Remove Me from Blood Donor List
                    </button>
                  )}
                </form>
              </div>

              <div className="rounded-[28px] border border-rose-100 bg-white/95 p-4 shadow-[0_28px_80px_rgba(190,18,60,0.10)] backdrop-blur-xl sm:rounded-[36px] sm:p-5 md:p-6">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-[9px] font-black uppercase tracking-[0.22em] text-rose-400 sm:text-[10px]">
                      Blood Donation Proof
                    </p>
                    <h3 className="mt-1 text-xl font-black text-slate-950 sm:text-2xl">
                      Submit Donation Proof
                    </h3>
                    <p className="mt-1 text-xs leading-5 text-slate-500 sm:text-sm sm:leading-6">
                      Upload proof after donating blood. Future dates are not allowed.
                    </p>
                  </div>

                  <span className="w-max rounded-2xl bg-rose-50 px-4 py-2 text-xs font-black text-rose-700 sm:text-sm">
                    {pendingBloodRequestCount} Pending
                  </span>
                </div>

                {!currentUser.isBloodDonor ? (
                  <div className="mt-5 rounded-[24px] border border-amber-200 bg-amber-50 p-4 sm:rounded-[26px] sm:p-5">
                    <p className="text-sm font-black text-amber-700">Become a blood donor first</p>
                    <p className="mt-1 text-sm text-amber-700/80">
                      Please complete the Blood Donor Profile form above before submitting proof.
                    </p>
                  </div>
                ) : (
                  <>
                    <form onSubmit={handleBloodProofSubmit} className="mt-5 grid gap-3">
                      <div className="grid gap-3 md:grid-cols-2">
                        <input
                          type="date"
                          name="donationDate"
                          value={bloodProofForm.donationDate}
                          max={maxDate}
                          onChange={handleBloodProofInput}
                          className={FieldClass}
                        />

                        <label className="flex h-11 cursor-pointer items-center justify-between rounded-2xl border border-dashed border-rose-200 bg-rose-50/60 px-3 text-xs font-black text-rose-700 transition hover:-translate-y-0.5 hover:bg-rose-50 sm:h-12 sm:px-4 sm:text-sm">
                          <span className="truncate">
                            {bloodProofForm.proofImage
                              ? bloodProofForm.proofImage.name
                              : 'Upload Proof Image'}
                          </span>
                          <input
                            type="file"
                            name="proofImage"
                            accept="image/jpeg,image/jpg,image/png,image/webp"
                            onChange={handleBloodProofInput}
                            className="hidden"
                          />
                        </label>
                      </div>

                      <textarea
                        name="note"
                        placeholder="Short note optional, e.g. hospital name, patient name, location"
                        value={bloodProofForm.note}
                        onChange={handleBloodProofInput}
                        rows="3"
                        className="w-full rounded-2xl border border-rose-100 bg-white/90 px-4 py-3 text-sm font-bold text-slate-800 outline-none transition focus:border-rose-500 focus:ring-4 focus:ring-rose-100"
                      />

                      <button
                        type="submit"
                        disabled={bloodProofLoading}
                        className="h-12 rounded-2xl bg-gradient-to-r from-red-600 to-rose-600 font-black text-white shadow-[0_16px_36px_rgba(225,29,72,0.28)] transition hover:-translate-y-0.5 disabled:opacity-70"
                      >
                        {bloodProofLoading ? 'Submitting Proof...' : 'Submit Blood Donation Proof'}
                      </button>
                    </form>

                    <div className="mt-5">
                      <div className="mb-3 flex items-center justify-between gap-3">
                        <h4 className="text-base font-black text-slate-950 sm:text-lg">
                          My Blood Proof Requests
                        </h4>

                        <button
                          type="button"
                          onClick={loadMyBloodDonationRequests}
                          disabled={bloodRequestsLoading}
                          className="rounded-2xl border border-rose-100 bg-white px-4 py-2 text-xs font-black text-rose-700 transition hover:bg-rose-50 disabled:opacity-60"
                        >
                          {bloodRequestsLoading ? 'Loading...' : 'Refresh'}
                        </button>
                      </div>

                      {bloodRequestsLoading ? (
                        <p className="rounded-[24px] border border-rose-100 bg-rose-50 p-4 text-sm font-bold text-rose-700">
                          Loading requests...
                        </p>
                      ) : bloodDonationRequests.length === 0 ? (
                        <p className="rounded-[24px] border border-slate-100 bg-slate-50 p-4 text-sm font-bold text-slate-500">
                          No blood donation proof submitted yet.
                        </p>
                      ) : (
                        <div className="grid gap-3">
                          {bloodDonationRequests.map((request) => {
                            const proofImage = makeImageUrl(API, request.proofImage)

                            return (
                              <div
                                key={request._id}
                                className="rounded-[24px] border border-rose-100 bg-gradient-to-br from-white to-rose-50 p-4 shadow-sm sm:rounded-[26px]"
                              >
                                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                  <div className="flex min-w-0 items-center gap-3">
                                    <div className="h-14 w-14 shrink-0 overflow-hidden rounded-[20px] border border-rose-100 bg-white sm:h-16 sm:w-16 sm:rounded-[22px]">
                                      {proofImage ? (
                                        <img
                                          src={proofImage}
                                          alt="Blood donation proof"
                                          className="h-full w-full object-cover"
                                        />
                                      ) : (
                                        <div className="grid h-full w-full place-items-center text-xl">
                                          🩸
                                        </div>
                                      )}
                                    </div>

                                    <div className="min-w-0">
                                      <p className="text-sm font-black text-slate-950">
                                        {formatShortDate(request.donationDate)}
                                      </p>
                                      <p className="mt-1 text-xs font-bold text-slate-500">
                                        Submitted: {formatDateTime(request.createdAt)}
                                      </p>
                                    </div>
                                  </div>

                                  <span
                                    className={`w-max rounded-2xl px-3 py-2 text-xs font-black capitalize ${
                                      request.status === 'approved'
                                        ? 'bg-emerald-50 text-emerald-700'
                                        : request.status === 'rejected'
                                          ? 'bg-red-50 text-red-700'
                                          : 'bg-amber-50 text-amber-700'
                                    }`}
                                  >
                                    {request.status}
                                  </span>
                                </div>

                                {request.note && (
                                  <p className="mt-3 rounded-2xl bg-white/80 p-3 text-sm font-bold text-slate-600">
                                    {request.note}
                                  </p>
                                )}

                                {request.adminNote && (
                                  <p className="mt-3 rounded-2xl bg-slate-950 p-3 text-sm font-bold text-white">
                                    Admin note: {request.adminNote}
                                  </p>
                                )}
                              </div>
                            )
                          })}
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            </main>
          </div>
        )}
      </div>
    </section>
  )
}