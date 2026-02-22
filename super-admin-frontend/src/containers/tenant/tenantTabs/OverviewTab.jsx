import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

export default function OverviewTab({ tenant }) {
  const handleResetPassword = () => toast.info('Reset password (connect API to enable)');

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Basic Information</CardTitle>
          <Button variant="outline" size="sm" onClick={handleResetPassword}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Reset Password
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-medium text-sm">Company Name</h4>
              <p className="text-muted-foreground">{tenant?.companyName || 'N/A'}</p>
            </div>
            <div>
              <h4 className="font-medium text-sm">Subdomain</h4>
              <p className="text-muted-foreground">{tenant?.slug ? `${tenant.slug}.tickflo.com` : 'N/A'}</p>
            </div>
            <div>
              <h4 className="font-medium text-sm">Region</h4>
              <p className="text-muted-foreground">{tenant?.region || 'N/A'}</p>
            </div>
            <div>
              <h4 className="font-medium text-sm">Isolation Mode</h4>
              <p className="text-muted-foreground capitalize">{tenant?.isolationMode || 'N/A'}</p>
            </div>
          </div>
          <div>
            <h4 className="font-medium text-sm mb-2">Primary Contact</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <span className="text-sm text-muted-foreground">Name:</span>
                <p>{tenant?.primaryContact?.name || 'N/A'}</p>
              </div>
              <div>
                <span className="text-sm text-muted-foreground">Email:</span>
                <p>{tenant?.primaryContact?.email || 'N/A'}</p>
              </div>
              <div>
                <span className="text-sm text-muted-foreground">Phone:</span>
                <p>{tenant?.primaryContact?.phone || 'N/A'}</p>
              </div>
              <div>
                <span className="text-sm text-muted-foreground">Timezone:</span>
                <p>{tenant?.primaryContact?.timezone || 'N/A'}</p>
              </div>
            </div>
          </div>
          <div>
            <h4 className="font-medium text-sm mb-2">Address</h4>
            <p className="text-muted-foreground">
              {[
                tenant?.primaryContact?.address?.street,
                tenant?.primaryContact?.address?.city,
                tenant?.primaryContact?.address?.state,
                tenant?.primaryContact?.address?.zipCode,
                tenant?.primaryContact?.address?.country
              ].filter(Boolean).join(', ') || 'N/A'}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
