"use client";

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { AlertTriangle, Plus, Edit, Trash2 } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import type { StatusItem, CreateUpdateStatusRequest } from '@/superadmin-apis/tenants/status';

interface StatusTabProps {
  tenantId: string;
  statusList: StatusItem[];
  statusLoading: boolean;
  statusError: string | null;
  statusActionLoading: boolean;
  refetchStatus: () => void;
  createStatus: (data: CreateUpdateStatusRequest) => Promise<StatusItem | undefined>;
  updateStatus: (statusId: string, data: Partial<CreateUpdateStatusRequest>) => Promise<StatusItem | undefined>;
  deleteStatus: (statusId: string, tenantId: string) => Promise<boolean>;
}

export default function StatusTab({
  tenantId,
  statusList,
  statusLoading,
  statusError,
  statusActionLoading,
  refetchStatus,
  createStatus,
  updateStatus,
  deleteStatus,
}: StatusTabProps) {
  const [showStatusForm, setShowStatusForm] = useState(false);
  const [editingStatus, setEditingStatus] = useState<StatusItem | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    color: '#007bff',
    allowedTransitions: [] as string[],
    order: 0,
    isDefault: false,
  });

  const resetForm = () => {
    setFormData({
      name: '',
      color: '#007bff',
      allowedTransitions: [],
      order: 0,
      isDefault: false,
    });
  };

  const handleCreateStatus = async () => {
    try {
      await createStatus({
        tenantId,
        ...formData,
      });
      setShowStatusForm(false);
      resetForm();
      refetchStatus();
    } catch (error) {
      console.error('Failed to create status:', error);
    }
  };

  const handleUpdateStatus = async () => {
    if (!editingStatus) return;
    try {
      await updateStatus(editingStatus._id, formData);
      setEditingStatus(null);
      setShowStatusForm(false);
      resetForm();
      refetchStatus();
    } catch (error) {
      console.error('Failed to update status:', error);
    }
  };

  const handleEditStatus = (status: StatusItem) => {
    setEditingStatus(status);
    setFormData({
      name: status.name,
      color: status.color,
      allowedTransitions: status.allowedTransitions || [],
      order: status.order,
      isDefault: status.isDefault || false,
    });
    setShowStatusForm(true);
  };

  const handleCancelStatusForm = () => {
    setShowStatusForm(false);
    setEditingStatus(null);
    resetForm();
  };

  const handleDeleteStatus = async (status: StatusItem) => {
    try {
      await deleteStatus(status._id, tenantId);
      refetchStatus();
    } catch (error) {
      console.error('Failed to delete status:', error);
    }
  };

  const addTransition = () => {
    setFormData(prev => ({
      ...prev,
      allowedTransitions: [...prev.allowedTransitions, '']
    }));
  };

  const updateTransition = (index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      allowedTransitions: prev.allowedTransitions.map((t, i) => i === index ? value : t)
    }));
  };

  const removeTransition = (index: number) => {
    setFormData(prev => ({
      ...prev,
      allowedTransitions: prev.allowedTransitions.filter((_, i) => i !== index)
    }));
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Status Management</CardTitle>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={refetchStatus}
              disabled={statusLoading}
            >
              Refresh
            </Button>
            <Button
              size="sm"
              onClick={() => setShowStatusForm(true)}
              disabled={statusActionLoading}
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Status
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {statusLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-24 w-full" />
            </div>
          ) : statusError ? (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                {statusError}
              </AlertDescription>
            </Alert>
          ) : statusList.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-muted-foreground mb-4">
                No statuses found for this tenant.
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setShowStatusForm(true)}
              >
                Create First Status
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {statusList.map((status) => (
                <Card key={status._id} className="border-l-4" style={{ borderLeftColor: status.color }}>
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 space-y-3">
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium">{status.name}</h4>
                          {status.isDefault && (
                            <Badge variant="secondary" className="text-green-600">Default</Badge>
                          )}
                          <div
                            className="w-4 h-4 rounded-full border"
                            style={{ backgroundColor: status.color }}
                          />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="font-medium">Color:</span>
                            <span className="ml-2">{status.color}</span>
                          </div>

                          <div>
                            <span className="font-medium">Order:</span>
                            <span className="ml-2">{status.order}</span>
                          </div>
                        </div>

                        {status.allowedTransitions && status.allowedTransitions.length > 0 && (
                          <div>
                            <span className="font-medium text-sm">Allowed Transitions:</span>
                            <div className="flex flex-wrap gap-2 mt-2">
                              {status.allowedTransitions.map((transition, index) => (
                                <Badge key={index} variant="outline">
                                  {transition}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}

                        <div className="text-xs text-muted-foreground">
                          Created: {new Date(status.createdAt).toLocaleDateString()} •
                          Updated: {new Date(status.updatedAt).toLocaleDateString()}
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={statusActionLoading}
                          onClick={() => handleEditStatus(status)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={statusActionLoading}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Status</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete this status? This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDeleteStatus(status)}>
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={showStatusForm} onOpenChange={setShowStatusForm}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {editingStatus ? 'Edit Status' : 'Create New Status'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Enter status name"
              />
            </div>

            <div>
              <Label htmlFor="color">Color</Label>
              <div className="flex gap-2">
                <Input
                  id="color"
                  type="color"
                  value={formData.color}
                  onChange={(e) => setFormData(prev => ({ ...prev, color: e.target.value }))}
                  className="w-16"
                />
                <Input
                  value={formData.color}
                  onChange={(e) => setFormData(prev => ({ ...prev, color: e.target.value }))}
                  placeholder="#007bff"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="order">Order</Label>
              <Input
                id="order"
                type="number"
                value={formData.order}
                onChange={(e) => setFormData(prev => ({ ...prev, order: parseInt(e.target.value) || 0 }))}
                placeholder="0"
              />
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="isDefault"
                checked={formData.isDefault}
                onChange={(e) => setFormData(prev => ({ ...prev, isDefault: e.target.checked }))}
              />
              <Label htmlFor="isDefault">Set as default status</Label>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <Label>Allowed Transitions</Label>
                <Button type="button" variant="outline" size="sm" onClick={addTransition}>
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
              <div className="space-y-2">
                {formData.allowedTransitions.map((transition, index) => (
                  <div key={index} className="flex gap-2">
                    <Input
                      value={transition}
                      onChange={(e) => updateTransition(index, e.target.value)}
                      placeholder="Enter transition name"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => removeTransition(index)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={handleCancelStatusForm}>
              Cancel
            </Button>
            <Button
              onClick={editingStatus ? handleUpdateStatus : handleCreateStatus}
              disabled={statusActionLoading || !formData.name.trim()}
            >
              {editingStatus ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}