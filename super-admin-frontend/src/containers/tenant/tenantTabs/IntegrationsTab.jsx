import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function IntegrationsTab({ tenantId }) {
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Integrations</CardTitle>
          <p className="text-sm text-muted-foreground">Tenant integrations (UI only – connect API to manage)</p>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Tenant ID: {tenantId || 'N/A'}</p>
        </CardContent>
      </Card>
    </div>
  );
}
