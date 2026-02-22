import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function StatusTab({
  tenantId,
  statusList = [],
  statusLoading,
  statusError,
  statusActionLoading,
  refetchStatus,
  createStatus,
  updateStatus,
  deleteStatus
}) {
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Status</CardTitle>
          <p className="text-sm text-muted-foreground">
            {statusLoading ? 'Loading...' : statusError || 'Custom statuses (UI only)'}
          </p>
        </CardHeader>
        <CardContent>
          {Array.isArray(statusList) && statusList.length === 0 && !statusLoading && (
            <p className="text-muted-foreground">No custom statuses. Connect API to manage.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
