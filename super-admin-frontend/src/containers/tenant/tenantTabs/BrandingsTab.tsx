"use client";

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { AlertTriangle } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import BrandingForm from '@/components/screens/BrandingForm';
import type { BrandingItem, CreateUpdateBrandingRequest } from '@/superadmin-apis/tenants/branding';

interface BrandingsTabProps {
  tenantId: string;
  brandingList: BrandingItem[];
  brandingLoading: boolean;
  brandingError: string | null;
  brandingActionLoading: boolean;
  refetchBranding: () => void;
  createBranding: (data: CreateUpdateBrandingRequest) => Promise<BrandingItem | undefined>;
  updateBranding: (data: CreateUpdateBrandingRequest, id: string) => Promise<BrandingItem | undefined>;
  deleteBranding: (id: string, tenantId?: string) => Promise<boolean>;
}

export default function BrandingsTab({
  tenantId,
  brandingList,
  brandingLoading,
  brandingError,
  brandingActionLoading,
  refetchBranding,
  createBranding,
  updateBranding,
  deleteBranding,
}: BrandingsTabProps) {
  const [showBrandingForm, setShowBrandingForm] = useState(false);
  const [editingBranding, setEditingBranding] = useState<BrandingItem | null>(null);

  const handleCreateBranding = async (data: CreateUpdateBrandingRequest) => {
    try {
      await createBranding(data);
      setShowBrandingForm(false);
      refetchBranding();
    } catch (error) {
      console.error('Failed to create branding:', error);
    }
  };

  const handleUpdateBranding = async (data: CreateUpdateBrandingRequest) => {
    if (!editingBranding) return;
    try {
      await updateBranding(data, editingBranding._id);
      setEditingBranding(null);
      setShowBrandingForm(false);
      refetchBranding();
    } catch (error) {
      console.error('Failed to update branding:', error);
    }
  };

  const handleEditBranding = (branding: BrandingItem) => {
    setEditingBranding(branding);
    setShowBrandingForm(true);
  };

  const handleCancelBrandingForm = () => {
    setShowBrandingForm(false);
    setEditingBranding(null);
  };

  const handleDeleteBranding = async (branding: BrandingItem) => {
    try {
      await deleteBranding(branding._id, tenantId);
      refetchBranding();
    } catch (error) {
      console.error('Failed to delete branding:', error);
    }
  };

  if (showBrandingForm) {
    return (
      <BrandingForm
        tenantId={tenantId}
        branding={editingBranding || undefined}
        onSubmit={editingBranding ? handleUpdateBranding : handleCreateBranding}
        onCancel={handleCancelBrandingForm}
        loading={brandingActionLoading}
      />
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Branding Management</CardTitle>
          <div className="flex gap-2">
            <Button
              size="sm"
              onClick={refetchBranding}
              disabled={brandingLoading}
              variant="outline"
            >
              Refresh
            </Button>
            {brandingList.length === 0 && (
              <Button
                size="sm"
                onClick={() => setShowBrandingForm(true)}
                disabled={brandingActionLoading}
              >
                Create Branding
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {brandingLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-24 w-full" />
            </div>
          ) : brandingError ? (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                {brandingError}
              </AlertDescription>
            </Alert>
          ) : brandingList.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-muted-foreground mb-4">
                No branding configurations found for this tenant.
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setShowBrandingForm(true)}
              >
                Create Branding
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {brandingList.map((branding) => (
                <Card key={branding._id} className="border-l-4 border-l-blue-500">
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 space-y-3">
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium">{branding.tagline}</h4>
                          {branding.isActive && (
                            <Badge variant="secondary" className="text-green-600">Active</Badge>
                          )}
                        </div>

                        <p className="text-sm text-muted-foreground">
                          {branding.description}
                        </p>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="font-medium">Custom Colors:</span>
                            <span className="ml-2">
                              {branding.customColors ? 'Enabled' : 'Disabled'}
                            </span>
                          </div>

                          <div>
                            <span className="font-medium">Primary Color:</span>
                            <span className="ml-2 capitalize">{branding.colors}</span>
                          </div>
                        </div>

                        {branding.featureHighlights && branding.featureHighlights.length > 0 && (
                          <div>
                            <span className="font-medium text-sm">Feature Highlights:</span>
                            <div className="flex flex-wrap gap-2 mt-2">
                              {branding.featureHighlights.map((feature, index) => (
                                <Badge key={index} variant="outline">
                                  {feature}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}

                        {branding.url && (
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-sm">Brand Image:</span>
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={branding.url}
                              alt="Brand logo"
                              className="h-8 w-8 object-contain rounded border"
                            />
                          </div>
                        )}

                        <div className="text-xs text-muted-foreground">
                          Created: {new Date(branding.createdAt).toLocaleDateString()} •
                          Updated: {new Date(branding.updatedAt).toLocaleDateString()}
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={brandingActionLoading}
                          onClick={() => handleEditBranding(branding)}
                        >
                          Edit
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={brandingActionLoading}
                            >
                              Delete
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Branding</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete this branding configuration?
                                This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDeleteBranding(branding)}>
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
    </div>
  );
}
