import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { ArrowLeft, Building2, Users, HardDrive, Activity, Play, Pause, AlertTriangle } from 'lucide-react';
import { useTenant, useTenantStats, useTenantActions } from '@/hooks/use-super-admin';
import { useBranding, useBrandingActions } from '@/hooks/use-branding';
import { useStatus, useStatusActions } from '@/hooks/use-status';
import Loading from '@/components/comman/Loading';
import { OverviewTab, ConfigurationTab, QuotasTab, SecurityTab, BrandingsTab, IntegrationsTab, StatusTab } from '@/containers/tenant/tenantTabs';
import { InboundEmailsManager } from '@/components/screens/InboundEmailsManager';

export default function TenantDetailsPage() {
  const navigate = useNavigate();
  const { id: tenantId } = useParams();

  const { tenant, loading, error, refetch } = useTenant(tenantId);
  const { stats, loading: statsLoading } = useTenantStats(tenantId);
  const { suspendTenant, reactivateTenant, loading: actionLoading } = useTenantActions();
  const { brandingList, loading: brandingLoading, error: brandingError, refetch: refetchBranding } = useBranding(tenantId);
  const { createBranding, updateBranding, deleteBranding, loading: brandingActionLoading } = useBrandingActions();
  const { statusList, loading: statusLoading, error: statusError, refetch: refetchStatus } = useStatus(tenantId);
  const { createStatus, updateStatus, deleteStatus, loading: statusActionLoading } = useStatusActions();

  const [activeTab, setActiveTab] = useState('overview');

  const handleBack = () => navigate('/tenant-management');

  const handleSuspendTenant = async () => {
    const success = await suspendTenant(tenantId, { reason: 'Administrative action', notifyUsers: true });
    if (success) refetch();
  };

  const handleReactivateTenant = async () => {
    const success = await reactivateTenant(tenantId, { notifyUsers: true });
    if (success) refetch();
  };

  const getStatusBadge = (status) => {
    switch ((status || '').toLowerCase()) {
      case 'active': return <Badge variant="secondary" className="text-green-600">Active</Badge>;
      case 'suspended': return <Badge variant="destructive">Suspended</Badge>;
      case 'trial': return <Badge variant="outline" className="text-blue-600">Trial</Badge>;
      case 'inactive': return <Badge variant="secondary" className="text-gray-500">Inactive</Badge>;
      default: return <Badge>{status}</Badge>;
    }
  };

  if (loading) return <Loading />;
  if (error || !tenant) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={handleBack}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
        </div>
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error || 'Tenant not found'}</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={handleBack}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h2 className="text-2xl font-bold flex items-center gap-3">
              <Building2 className="w-6 h-6" />
              {tenant.companyName || 'Unknown Company'}
            </h2>
            <p className="text-muted-foreground">
              {tenant.slug ? `${tenant.slug}.tickflo.com` : 'No subdomain'} • Created {tenant.createdAt ? new Date(tenant.createdAt).toLocaleDateString() : 'Unknown'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {getStatusBadge(tenant.status)}
          {tenant.status?.toLowerCase() === 'active' && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" size="sm" disabled={actionLoading}>
                  <Pause className="w-4 h-4 mr-2" />
                  Suspend
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Suspend Tenant</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will suspend the tenant account. Users will lose access immediately. Are you sure?
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleSuspendTenant}>Suspend Tenant</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
          {tenant.status?.toLowerCase() === 'suspended' && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" size="sm" disabled={actionLoading}>
                  <Play className="w-4 h-4 mr-2" />
                  Reactivate
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Reactivate Tenant</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will reactivate the tenant account. Users will regain access immediately. Are you sure?
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleReactivateTenant}>Reactivate Tenant</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {statsLoading ? <Skeleton className="h-6 w-16" /> : <div className="text-2xl font-bold">{stats?.userCount || 0}</div>}
            <p className="text-xs text-muted-foreground">Active: {stats?.activeUsers || 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Storage</CardTitle>
            <HardDrive className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{tenant.quotas?.storageGB || 0}GB</div>
            <p className="text-xs text-muted-foreground">Limit: {tenant.quotas?.storageGB || 0}GB</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Departments</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {statsLoading ? <Skeleton className="h-6 w-16" /> : <div className="text-2xl font-bold">{stats?.departmentCount || 0}</div>}
            <p className="text-xs text-muted-foreground">Active departments</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Last Activity</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {statsLoading ? <Skeleton className="h-6 w-24" /> : <div className="text-sm font-bold">{stats?.lastActivity ? new Date(stats.lastActivity).toLocaleDateString() : 'Never'}</div>}
            <p className="text-xs text-muted-foreground">Last user activity</p>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="configuration">Configuration</TabsTrigger>
          <TabsTrigger value="quotas">Quotas</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="brandings">Brandings</TabsTrigger>
          <TabsTrigger value="integrations">Integrations</TabsTrigger>
          <TabsTrigger value="status">Status</TabsTrigger>
          <TabsTrigger value="email-to-ticket">Inbound Email</TabsTrigger>
        </TabsList>
        <TabsContent value="overview" className="space-y-4"><OverviewTab tenant={tenant} /></TabsContent>
        <TabsContent value="configuration" className="space-y-4"><ConfigurationTab tenant={tenant} /></TabsContent>
        <TabsContent value="quotas" className="space-y-4"><QuotasTab tenant={tenant} stats={stats} /></TabsContent>
        <TabsContent value="security" className="space-y-4"><SecurityTab tenant={tenant} /></TabsContent>
        <TabsContent value="brandings" className="space-y-4">
          <BrandingsTab
            tenantId={tenantId}
            brandingList={brandingList}
            brandingLoading={brandingLoading}
            brandingError={brandingError}
            brandingActionLoading={brandingActionLoading}
            refetchBranding={refetchBranding}
            createBranding={createBranding}
            updateBranding={updateBranding}
            deleteBranding={deleteBranding}
          />
        </TabsContent>
        <TabsContent value="integrations" className="space-y-4"><IntegrationsTab tenantId={tenantId} /></TabsContent>
        <TabsContent value="status" className="space-y-4">
          <StatusTab
            tenantId={tenantId}
            statusList={statusList}
            statusLoading={statusLoading}
            statusError={statusError}
            statusActionLoading={statusActionLoading}
            refetchStatus={refetchStatus}
            createStatus={createStatus}
            updateStatus={updateStatus}
            deleteStatus={deleteStatus}
          />
        </TabsContent>
        <TabsContent value="email-to-ticket" className="space-y-4">
          <InboundEmailsManager tenantId={tenantId} tenantName={tenant.companyName || 'Tenant'} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
