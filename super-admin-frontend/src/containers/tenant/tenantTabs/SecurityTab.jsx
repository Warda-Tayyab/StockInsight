import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';

export default function SecurityTab({ tenant }) {
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Security Settings</CardTitle>
          <p className="text-sm text-muted-foreground">Security options (UI only – connect API to load/save)</p>
        </CardHeader>
        <CardContent>
          <div>
            <Label>Tenant</Label>
            <p className="text-muted-foreground">{tenant?.companyName || tenant?.tenantId || 'N/A'}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
