import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useTenantQuotas } from '@/hooks/use-super-admin';

export default function QuotasTab({ tenant, stats }) {
  const { quotas, loading } = useTenantQuotas(tenant?.tenantId || tenant?._id);

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Quotas & Limits</CardTitle>
          <p className="text-sm text-muted-foreground">Resource limits (UI only)</p>
        </CardHeader>
        <CardContent className="space-y-4">
          {loading ? (
            <p className="text-muted-foreground">Loading...</p>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium">User Seats</p>
                <p className="text-2xl font-bold">{quotas?.seats ?? tenant?.quotas?.seats ?? 0}</p>
              </div>
              <div>
                <p className="text-sm font-medium">Storage (GB)</p>
                <p className="text-2xl font-bold">{quotas?.storageGB ?? tenant?.quotas?.storageGB ?? 0}</p>
              </div>
              <div>
                <p className="text-sm font-medium">Orders per month</p>
                <p className="text-2xl font-bold">{quotas?.ordersPerMonth ?? tenant?.quotas?.ordersPerMonth ?? 0}</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
