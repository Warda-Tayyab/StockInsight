export interface Plan {
  _id: string
  code: string
  name: string
  description: string
  pricePerUser: number
  interval: "month" | "year"
  billingModel: "per_user" | "flat"
  features: Feature[]
  quotas: {
    usersMax: number
    storagePerUserGB: number
    apiCallsPerMonth: number
  }
  isMostPopular?: boolean
  isActive?: boolean
  createdAt?: string
  updatedAt?: string
}


export interface CreatePlan {
  code: string
  name: string
  description: string
  pricePerUser: number
  interval: "month" | "year"
  billingModel: "per_user" | "flat"
  features: Feature[]
  quotas: {
    usersMax: number
    storagePerUserGB: number
    apiCallsPerMonth: number
  }
  isMostPopular?: boolean
  isActive?: boolean
}

export interface Feature {
  key: string
  _id: string
  isAdd: boolean
}