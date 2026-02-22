"use client";

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Edit, Loader2 } from 'lucide-react';
import { useTenantQuotas } from '@/hooks/use-super-admin';
import moment from 'moment';
import { toast } from 'sonner';
import type { Tenant } from '@/types/super-admin';

interface TenantStats {
  userCount?: number;
  activeUsers?: number;
  departmentCount?: number;
  lastActivity?: string;
}

interface QuotasTabProps {
  tenant: Tenant;
  stats?: TenantStats | null;
}

export default function QuotasTab({ tenant, stats }: QuotasTabProps) {
  const { quotas, loading, error, updateQuotas } = useTenantQuotas(tenant.tenantId);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingQuotas, setEditingQuotas] = useState({
    seats: 0,
    storageGB: 0,
    ticketsPerMonth: 0,
    apiRps: 0,
    retentionDays: 0,
    departments: 0,
    roles: 0,
    projects: 0
  });
  const [saving, setSaving] = useState(false);

  const currentQuotas = quotas || tenant.quotas;

  const handleEditClick = () => {
    if (currentQuotas) {
      setEditingQuotas({
        seats: currentQuotas.seats,
        storageGB: currentQuotas.storageGB,
        ticketsPerMonth: currentQuotas.ticketsPerMonth,
        apiRps: currentQuotas.apiRps,
        retentionDays: currentQuotas.retentionDays,
        departments: currentQuotas.departments,
        roles: currentQuotas.roles,
        projects: currentQuotas.projects
      });
    }
    setIsEditDialogOpen(true);
  };

  const handleSaveQuotas = async () => {
    try {
      setSaving(true);
      const success = await updateQuotas(editingQuotas);
      if (success) {
        toast.success('Quotas updated successfully');
        setIsEditDialogOpen(false);
      } else {
        toast.error('Failed to update quotas');
      }
    } catch (error) {
      console.error('Error updating quotas:', error);
      toast.error('Failed to update quotas');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center p-8">
        <p className="text-red-500">Failed to load quotas: {error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Resource Quotas</h2>
        <Button
          variant="outline"
          onClick={handleEditClick}
          className="flex items-center gap-2"
        >
          <Edit className="h-4 w-4" />
          Edit Quotas
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Current Usage</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <div className="flex justify-between text-sm">
                <span>User Seats</span>
                <span>{stats?.userCount || 0} / {currentQuotas?.seats || 0}</span>
              </div>
              <Progress
                value={((stats?.userCount || 0) / (currentQuotas?.seats || 1)) * 100}
                className="mt-2"
              />
            </div>

            <div>
              <div className="flex justify-between text-sm">
                <span>Storage</span>
                <span>0 GB / {currentQuotas?.storageGB || 0} GB</span>
              </div>
              <Progress value={0} className="mt-2" />
            </div>

            <div>
              <div className="flex justify-between text-sm">
                <span>Monthly Tickets</span>
                <span>0 / {currentQuotas?.ticketsPerMonth || 0}</span>
              </div>
              <Progress value={0} className="mt-2" />
            </div>

            <div>
              <div className="flex justify-between text-sm">
                <span>API Rate Limit</span>
                <span>{currentQuotas?.apiRps || 0} req/sec</span>
              </div>
              <Progress value={0} className="mt-2" />
            </div>

            <div>
              <div className="flex justify-between text-sm">
                <span>Departments</span>
                <span>{stats?.departmentCount || 0} / {currentQuotas?.departments || 0}</span>
              </div>
              <Progress
                value={((stats?.departmentCount || 0) / (currentQuotas?.departments || 1)) * 100}
                className="mt-2"
              />
            </div>

            <div>
              <div className="flex justify-between text-sm">
                <span>Roles</span>
                <span>0 / {currentQuotas?.roles || 0}</span>
              </div>
              <Progress value={0} className="mt-2" />
            </div>

            <div>
              <div className="flex justify-between text-sm">
                <span>Projects</span>
                <span>0 / {currentQuotas?.projects || 0}</span>
              </div>
              <Progress value={0} className="mt-2" />
            </div>

            <div>
              <div className="flex justify-between text-sm">
                <span>Data Retention</span>
                <span>{currentQuotas?.retentionDays || 0} days</span>
              </div>
              <Progress value={0} className="mt-2" />
            </div>
          </div>

          {currentQuotas?.expiryDate && (
            <div className="mt-6 p-4 bg-muted rounded-lg">
              <div className="flex justify-between items-center">
                <span className="font-medium">Expiry Date:</span>
                <span>{moment(currentQuotas.expiryDate).format('MMMM Do YYYY')}</span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Quotas</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="seats">User Seats</Label>
              <Input
                id="seats"
                type="number"
                min="1"
                value={editingQuotas.seats}
                onChange={(e) => setEditingQuotas(prev => ({ ...prev, seats: parseInt(e.target.value) || 0 }))}
              />
            </div>
            <div>
              <Label htmlFor="storageGB">Storage (GB)</Label>
              <Input
                id="storageGB"
                type="number"
                min="1"
                value={editingQuotas.storageGB}
                onChange={(e) => setEditingQuotas(prev => ({ ...prev, storageGB: parseInt(e.target.value) || 0 }))}
              />
            </div>
            <div>
              <Label htmlFor="ticketsPerMonth">Monthly Tickets</Label>
              <Input
                id="ticketsPerMonth"
                type="number"
                min="1"
                value={editingQuotas.ticketsPerMonth}
                onChange={(e) => setEditingQuotas(prev => ({ ...prev, ticketsPerMonth: parseInt(e.target.value) || 0 }))}
              />
            </div>
            <div>
              <Label htmlFor="apiRps">API Rate Limit (req/sec)</Label>
              <Input
                id="apiRps"
                type="number"
                min="1"
                value={editingQuotas.apiRps}
                onChange={(e) => setEditingQuotas(prev => ({ ...prev, apiRps: parseInt(e.target.value) || 0 }))}
              />
            </div>
            <div>
              <Label htmlFor="retentionDays">Data Retention (days)</Label>
              <Input
                id="retentionDays"
                type="number"
                min="30"
                value={editingQuotas.retentionDays}
                onChange={(e) => setEditingQuotas(prev => ({ ...prev, retentionDays: parseInt(e.target.value) || 0 }))}
              />
            </div>
            <div>
              <Label htmlFor="departments">Departments</Label>
              <Input
                id="departments"
                type="number"
                min="1"
                value={editingQuotas.departments}
                onChange={(e) => setEditingQuotas(prev => ({ ...prev, departments: parseInt(e.target.value) || 0 }))}
              />
            </div>
            <div>
              <Label htmlFor="roles">Roles</Label>
              <Input
                id="roles"
                type="number"
                min="1"
                value={editingQuotas.roles}
                onChange={(e) => setEditingQuotas(prev => ({ ...prev, roles: parseInt(e.target.value) || 0 }))}
              />
            </div>
            <div>
              <Label htmlFor="projects">Projects</Label>
              <Input
                id="projects"
                type="number"
                min="1"
                value={editingQuotas.projects}
                onChange={(e) => setEditingQuotas(prev => ({ ...prev, projects: parseInt(e.target.value) || 0 }))}
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveQuotas} disabled={saving}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
