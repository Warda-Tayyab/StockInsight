"use client"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, LineChart, Line, PieChart, Pie, Cell, Tooltip as RechartsTooltip, ResponsiveContainer
} from 'recharts'
import { Building2, Users, Ticket, DollarSign, TrendingUp, AlertTriangle } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useDashboardStats } from '@/hooks/use-super-admin'
import { DashboardStats } from '@/types/super-admin'


export default function DashboardPage() {
  const { stats, loading, error, refetch } = useDashboardStats();
  console.log("Dashboard stats:", stats);
  // Handle errors gracefully
  const handleRetry = () => {
    refetch();
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="space-y-0 pb-2">
                <Skeleton className="h-4 w-24" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16 mb-2" />
                <Skeleton className="h-4 w-32" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Failed to load dashboard data: {error}
            <button
              onClick={handleRetry}
              className="ml-2 underline hover:no-underline focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-50 rounded px-1"
            >
              Retry
            </button>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="space-y-6">
        <Alert>
          <AlertDescription>No dashboard data available.</AlertDescription>
        </Alert>
      </div>
    );
  }

  // Map API data to UI variables - API returns { stats: DashboardStats }
  const apiStats = (stats as { stats?: DashboardStats } | null)?.stats || stats;
  const totalTenants = apiStats?.summary?.tenants?.total ?? 0;
  const activeTenants = apiStats?.summary?.tenants?.active ?? 0;
  const suspendedTenants = apiStats?.summary?.tenants?.suspended ?? 0;
  const tenantGrowth = apiStats?.summary?.tenants?.delta?.vsLastMonthPct ?? '0%';
  
  const totalUsers = apiStats?.summary?.users?.total ?? 0;
  const activeUsers = apiStats?.summary?.users?.active ?? 0;
  const inactiveUsers = apiStats?.summary?.users?.inactive ?? 0;
  const userGrowth = apiStats?.summary?.users?.delta?.vsLastMonthPct ?? '0%';
  
  const totalTickets = apiStats?.summary?.tickets?.total ?? 0;
  const openTickets = apiStats?.summary?.tickets?.open ?? 0;
  const resolvedTickets = apiStats?.summary?.tickets?.resolved ?? 0;
  const criticalTickets = apiStats?.summary?.tickets?.critical ?? 0;
  
  const revenue = apiStats?.summary?.revenue?.current ?? 0;
  const revenueCurrency = apiStats?.summary?.revenue?.currency ?? apiStats?.meta?.currency ?? 'USD';
  const revenueGrowth = apiStats?.summary?.revenue?.delta?.vsLastMonthPct ?? '0%';
  
  // Get chart data from API
  const charts = {
    growthTrends: apiStats?.charts?.growthTrends ?? [],
    planDistribution: apiStats?.charts?.planDistribution ?? [],
    monthlyRevenue: apiStats?.charts?.monthlyRevenue ?? []
  };
  
  // Get recent activities from API
  const recentActivities = apiStats?.recentActivities ?? [];

  return (
    <div className="space-y-6">

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Tenants */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle>Total Tenants</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalTenants}</div>
            <div className="flex items-center gap-2 text-xs mt-1">
              <Badge variant="secondary" className="text-green-600">
                <TrendingUp className="w-3 h-3 mr-1" />
                {tenantGrowth}
              </Badge>
              <span className="text-muted-foreground">vs last month</span>
            </div>
            <div className="flex gap-4 mt-2 text-xs text-muted-foreground">
              <span>Active: {activeTenants}</span>
              <span>Suspended: {suspendedTenants}</span>
            </div>
          </CardContent>
        </Card>

        {/* Users */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle>Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalUsers}</div>
            <div className="flex items-center gap-2 text-xs mt-1">
              <Badge variant="secondary" className="text-green-600">
                <TrendingUp className="w-3 h-3 mr-1" />
                {userGrowth}
              </Badge>
              <span className="text-muted-foreground">vs last month</span>
            </div>
            <div className="flex gap-4 mt-2 text-xs text-muted-foreground">
              <span>Active: {activeUsers}</span>
              <span>Inactive: {inactiveUsers}</span>
            </div>
          </CardContent>
        </Card>

        {/* Tickets */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle>Open Tickets</CardTitle>
            <Ticket className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{openTickets}</div>
            <div className="flex items-center gap-2 text-xs mt-1">
              <Badge variant="secondary" className="text-blue-600">
                Total: {totalTickets}
              </Badge>
              <span className="text-muted-foreground">Resolved: {resolvedTickets}</span>
            </div>
            <div className="flex gap-4 mt-2 text-xs text-muted-foreground">
              <span>Critical: {criticalTickets}</span>
            </div>
          </CardContent>
        </Card>

        {/* Revenue */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle>Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{revenue} {revenueCurrency}</div>
            <div className="flex items-center gap-2 text-xs mt-1">
              <Badge variant="secondary" className="text-green-600">
                <TrendingUp className="w-3 h-3 mr-1" />
                {revenueGrowth}
              </Badge>
              <span className="text-muted-foreground">vs last month</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Growth Trends */}
        <Card>
          <CardHeader>
            <CardTitle>Growth Trends</CardTitle>
            <CardDescription>Users & Tickets growth (last 6 months)</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={charts.growthTrends}>
                <CartesianGrid vertical={false} />
                <XAxis dataKey="month" tickLine={false} tickMargin={10} axisLine={false} />
                <YAxis allowDecimals={false} />
                <RechartsTooltip />
                <Bar dataKey="users" fill="#4F46E5" radius={4} name="Users" />
                <Bar dataKey="tickets" fill="#22C55E" radius={4} name="Tickets" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Plan Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Plan Distribution</CardTitle>
            <CardDescription>Active tenants by plan</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <RechartsTooltip />
                <Pie
                  data={charts.planDistribution.map((p: { plan: string; count: number }) => ({ name: p.plan, value: p.count }))}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  label
                >
                  {charts.planDistribution.map((entry: { plan: string; count: number }, index: number) => (
                    <Cell key={`cell-${index}`} fill={["#4F46E5", "#22C55E", "#F59E42", "#EF4444"][index % 4]} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity & Revenue */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Latest system events</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {recentActivities.length === 0 && (
              <div className="text-muted-foreground text-sm">No recent activities.</div>
            )}
            {recentActivities.map((activity: { 
              id: string; 
              message: string; 
              tenant: string | null; 
              severity: 'high' | 'medium' | 'low'; 
              occurredAt: string 
            }) => (
              <div key={activity.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex-1">
                  <div className="font-medium text-sm">{activity.message}</div>
                  <div className="text-xs text-muted-foreground">{activity.tenant || 'N/A'}</div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge
                    variant={activity.severity === 'high' ? 'destructive' : activity.severity === 'medium' ? 'secondary' : 'default'}
                    className="text-xs"
                  >
                    {activity.severity}
                  </Badge>
                  <span className="text-xs text-muted-foreground">{new Date(activity.occurredAt).toLocaleString()}</span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Revenue Trend */}
        <Card>
          <CardHeader>
            <CardTitle>Revenue Trend</CardTitle>
            <CardDescription>Monthly revenue (last 6 months)</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={charts.monthlyRevenue}>
                <CartesianGrid vertical={false} />
                <XAxis dataKey="month" tickLine={false} tickMargin={10} axisLine={false} />
                <YAxis allowDecimals={false} />
                <RechartsTooltip />
                <Line
                  dataKey="revenue"
                  type="monotone"
                  stroke="#4F46E5"
                  strokeWidth={2}
                  dot={false}
                  name="Revenue"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
