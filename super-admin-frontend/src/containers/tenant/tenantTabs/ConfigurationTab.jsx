import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';

export default function ConfigurationTab({ tenant }) {
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Configuration</CardTitle>
          <p className="text-sm text-muted-foreground">Tenant configuration (UI only – connect API to load/save)</p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Tenant ID</Label>
            <p className="text-muted-foreground">{tenant?.tenantId || tenant?._id || 'N/A'}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
