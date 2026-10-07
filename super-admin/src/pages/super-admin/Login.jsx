import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Eye, EyeOff } from 'lucide-react'
import api from '../../utils/api'
function Login() {
  const [email, setEmail] = useState('inventoryinsights2102@gmail.com')
  const [password, setPassword] = useState('meerabwarda')
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const navigate = useNavigate()


  const handleSubmit = async (e) => {
    e.preventDefault()
    setErrors({})
    let newErrors = {}

    if (!email) newErrors.email = 'Email is required'
    if (!password) newErrors.password = 'Password is required'

    if (Object.keys(newErrors).length) {
      setErrors(newErrors)
      return
    }

    try {
      setLoading(true)
      setErrors({})
    
      const res = await api.post('/api/admin/auth/login', {
        email,
        password
      })
    
      const data = res.data
    
      localStorage.setItem('superAdminToken', data.token)
      setSuccess(data.message)
    
      setTimeout(() => {
        navigate('/super-admin')
      }, 1500)
    
    } catch (error) {
      const err = error.response?.data
    
      setErrors({
        [err?.errorField || 'general']: err?.message || 'Server error'
      })
    } finally {
      setLoading(false)
    }
  
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="max-w-md w-full bg-white rounded-xl shadow-sm border border-slate-200 p-8">
      <div className="text-center mb-8">
  <img
    src="/superadmin-logo.jpg"
    alt="StockInsight Logo"
    className="w-30 h-20 object-contain rounded-2xl mx-auto mb-4"
  />

  <h1 className="text-2xl font-bold text-slate-900">
    Super Admin Login
  </h1>

  <p className="mt-2 text-slate-600">
    Sign in to access the dashboard
  </p>
</div>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-slate-700">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value)
                setErrors(prev => ({ ...prev, email: '' }))
              }}
              className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
            {errors.email && (
                <p className="text-red-600 text-sm">
                  {errors.email}
                </p>
              )}
          </div>
          <div className="relative">
  <label htmlFor="password" className="block text-sm font-medium text-slate-700">
    Password
  </label>
  <input
    id="password"
    type={showPassword ? 'text' : 'password'}
    value={password}
    onChange={(e) => {
      setPassword(e.target.value)
      setErrors(prev => ({ ...prev, password: '' }))
    }}
    className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
  />
  <span
    className="absolute right-3 top-11 transform -translate-y-1/2 cursor-pointer text-gray-500" 
    onClick={() => setShowPassword(!showPassword)}
  >
    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
  </span>
  {errors.password && (
    <p className="text-red-600 text-sm mt-1">{errors.password}</p>
  )}
</div>
          {errors.general && (
  <p className="text-red-600 text-sm">
    {errors.general}
  </p>)}


          <button
            type="submit"
            className="w-full bg-cyan-500 text-white py-2 px-4 rounded-lg hover:bg-cyan-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
          >
           {loading ? 'Signing in...' : 'Sign In'}
          </button>
          {success && (
  <p className="text-green-600 text-center font-medium mb-4 mt-2">
    {success}
  </p>
)}
        </form>
      </div>
    </div>
  )
}

export default Login