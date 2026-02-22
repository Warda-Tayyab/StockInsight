"use client";

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Copy, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { superAdminAPI } from '@/api/super-admin-api';
import type { Tenant } from '@/types/super-admin';

interface OverviewTabProps {
  tenant: Tenant;
}

export default function OverviewTab({ tenant }: OverviewTabProps) {
  const [isResetDialogOpen, setIsResetDialogOpen] = useState(false);
  const [newPasswordData, setNewPasswordData] = useState<{ password: string; email: string } | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleResetPassword = async () => {
    if (!tenant.tenantId) return;
    
    setIsLoading(true);
    try {
      const response = await superAdminAPI.resetTenantPassword(tenant.tenantId);
      if (response.success && response.data) {
        setNewPasswordData(response.data);
        setIsResetDialogOpen(true);
        toast.success('Password reset successfully');
      }
    } catch (error) {
      console.error('Failed to reset password:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to reset password');
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Basic Information</CardTitle>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleResetPassword}
            disabled={isLoading}
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            Reset Password
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-medium text-sm">Company Name</h4>
              <p className="text-muted-foreground">{tenant.companyName || 'N/A'}</p>
            </div>
            <div>
              <h4 className="font-medium text-sm">Subdomain</h4>
              <p className="text-muted-foreground">{tenant.slug ? `${tenant.slug}.tickflo.com` : 'N/A'}</p>
            </div>
            <div>
              <h4 className="font-medium text-sm">Region</h4>
              <p className="text-muted-foreground">{tenant.region || 'N/A'}</p>
            </div>
            <div>
              <h4 className="font-medium text-sm">Isolation Mode</h4>
              <p className="text-muted-foreground capitalize">{tenant.isolationMode || 'N/A'}</p>
            </div>
          </div>

          <div>
            <h4 className="font-medium text-sm mb-2">Primary Contact</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <span className="text-sm text-muted-foreground">Name:</span>
                <p>{tenant.primaryContact?.name || 'N/A'}</p>
              </div>
              <div>
                <span className="text-sm text-muted-foreground">Email:</span>
                <p>{tenant.primaryContact?.email || 'N/A'}</p>
              </div>
              <div>
                <span className="text-sm text-muted-foreground">Phone:</span>
                <p>{tenant.primaryContact?.phone || 'N/A'}</p>
              </div>
              <div>
                <span className="text-sm text-muted-foreground">Timezone:</span>
                <p>{tenant.primaryContact?.timezone || 'N/A'}</p>
              </div>
            </div>
          </div>

          <div>
            <h4 className="font-medium text-sm mb-2">Address</h4>
            <p className="text-muted-foreground">
              {[
                tenant.primaryContact?.address?.street,
                tenant.primaryContact?.address?.city,
                tenant.primaryContact?.address?.state,
                tenant.primaryContact?.address?.zipCode,
                tenant.primaryContact?.address?.country
              ].filter(Boolean).join(', ') || 'N/A'}
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Business Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-bold text-sm mb-2">Categories</h4>
            <div className="space-y-2">
              <div>
                <span className="text-sm text-muted-foreground">Main Category:</span>
                <p className="capitalize">{tenant.verticalId ? tenant.verticalId.replace('_', ' ') : 'N/A'}</p>
              </div>
              <div>
                <span className="text-sm text-muted-foreground">Sub Category:</span>
                <p className="capitalize">{tenant.subTypeId ? tenant.subTypeId.replace('_', ' ') : 'N/A'}</p>
              </div>
            </div>
          </div>

          <div>
            <h4 className="font-medium text-sm mb-2">Use Cases</h4>
            <div className="flex flex-wrap gap-2">
              {(tenant.useCases || []).map((useCase) => (
                <Badge key={useCase} variant="outline" className="capitalize">
                  {useCase.replace('_', ' ')}
                </Badge>
              ))}
              {(!tenant.useCases || tenant.useCases.length === 0) && (
                <span className="text-sm text-muted-foreground">No use cases specified</span>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <Dialog open={isResetDialogOpen} onOpenChange={setIsResetDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Password Reset Successful</DialogTitle>
            <DialogDescription>
              The password for the primary contact has been reset. Please copy the new credentials below.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Email</Label>
              <div className="flex items-center space-x-2">
                <Input value={newPasswordData?.email || ''} readOnly />
                <Button
                  size="icon"
                  variant="outline"
                  onClick={() => copyToClipboard(newPasswordData?.email || '')}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              <Label>New Password</Label>
              <div className="flex items-center space-x-2">
                <Input value={newPasswordData?.password || ''} readOnly />
                <Button
                  size="icon"
                  variant="outline"
                  onClick={() => copyToClipboard(newPasswordData?.password || '')}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => setIsResetDialogOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}