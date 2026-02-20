import { useState } from 'react'

function PricingPlan() {
  const [plans] = useState([
    {
      id: 1,
      name: 'Basic',
      price: 49,
      period: 'month',
      description: 'Perfect for small businesses getting started',
      features: [
        'Up to 100 products',
        'Basic inventory tracking',
        'Email support',
        '1 user account',
        'Basic reports'
      ],
      color: 'slate',
      popular: false
    },
    {
      id: 2,
      name: 'Pro',
      price: 149,
      period: 'month',
      description: 'Ideal for growing businesses',
      features: [
        'Up to 1,000 products',
        'Advanced inventory tracking',
        'Priority support',
        '5 user accounts',
        'Advanced analytics',
        'API access',
        'Custom integrations'
      ],
      color: 'blue',
      popular: true
    },
    {
      id: 3,
      name: 'Enterprise',
      price: 499,
      period: 'month',
      description: 'For large organizations with complex needs',
      features: [
        'Unlimited products',
        'Full inventory management',
        '24/7 dedicated support',
        'Unlimited user accounts',
        'Custom analytics',
        'Full API access',
        'White-label options',
        'Custom integrations',
        'Dedicated account manager'
      ],
      color: 'purple',
      popular: false
    }
  ])

  const getColorClasses = (color, popular) => {
    const colors = {
      slate: {
        border: 'border-slate-200',
        bg: 'bg-slate-50',
        text: 'text-slate-900',
        button: 'bg-slate-900 hover:bg-slate-800'
      },
      blue: {
        border: popular ? 'border-indigo-300 ring-2 ring-indigo-100' : 'border-blue-200',
        bg: popular ? 'bg-indigo-50/50' : 'bg-white',
        text: 'text-slate-900',
        button: 'bg-indigo-600 hover:bg-indigo-700'
      },
      purple: {
        border: 'border-purple-200',
        bg: 'bg-white',
        text: 'text-slate-900',
        button: 'bg-purple-600 hover:bg-purple-700'
      }
    }
    return colors[color] || colors.slate
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Pricing Plans</h1>
        <p className="text-slate-500 mt-1">
          Manage subscription plans and pricing
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {plans.map((plan) => {
          const colors = getColorClasses(plan.color, plan.popular)
          return (
            <div
              key={plan.id}
              className={`sa-card relative ${colors.bg} ${colors.border} transition-all hover:shadow-lg`}
            >
              {plan.popular && (
                <div className="absolute top-0 right-0 bg-indigo-600 text-white text-xs font-semibold px-3 py-1.5 rounded-bl-xl rounded-tr-xl">
                  Most Popular
                </div>
              )}
              <div className="mt-2 mb-6">
                <h3 className="text-2xl font-bold text-slate-900 mb-2">
                  {plan.name}
                </h3>
                <p className="text-sm text-slate-500 mb-4">{plan.description}</p>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-bold text-slate-900">
                    ${plan.price}
                  </span>
                  <span className="text-slate-500">/{plan.period}</span>
                </div>
              </div>
              <ul className="space-y-3 mb-6">
                {plan.features.map((feature, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <span className="text-green-500 mt-0.5 shrink-0">✓</span>
                    <span className="text-sm text-slate-700">{feature}</span>
                  </li>
                ))}
              </ul>
              <button
                type="button"
                className={`w-full ${colors.button} text-white font-semibold py-2.5 px-4 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500`}
              >
                {plan.popular ? 'Current Plan' : 'Select Plan'}
              </button>
            </div>
          )
        })}
      </div>

      <div className="sa-card">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">
          Plan Statistics
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="text-center p-4 bg-slate-50 rounded-xl">
            <div className="text-2xl font-bold text-slate-900">487</div>
            <div className="text-sm text-slate-500 mt-1">Basic Subscribers</div>
          </div>
          <div className="text-center p-4 bg-indigo-50 rounded-xl">
            <div className="text-2xl font-bold text-indigo-900">602</div>
            <div className="text-sm text-indigo-600 mt-1">Pro Subscribers</div>
          </div>
          <div className="text-center p-4 bg-purple-50 rounded-xl">
            <div className="text-2xl font-bold text-purple-900">158</div>
            <div className="text-sm text-purple-600 mt-1">Enterprise Subscribers</div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default PricingPlan
