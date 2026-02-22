import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function BrandingsTab({
  tenantId,
  brandingList = [],
  brandingLoading,
  brandingError,
  brandingActionLoading,
  refetchBranding,
  createBranding,
  updateBranding,
  deleteBranding
}) {
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Brandings</CardTitle>
          <p className="text-sm text-muted-foreground">
            {brandingLoading ? 'Loading...' : brandingError || 'Manage brandings (UI only)'}
          </p>
        </CardHeader>
        <CardContent>
          {Array.isArray(brandingList) && brandingList.length === 0 && !brandingLoading && (
            <p className="text-muted-foreground">No brandings. Connect API to manage.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
