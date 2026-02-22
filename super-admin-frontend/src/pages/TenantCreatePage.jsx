import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { CreateTenantForm } from '@/components/forms/CreateTenantForm';
import { useTenantActions } from '@/hooks/use-super-admin';
import { toast } from 'sonner';

export default function TenantCreatePage() {
  const navigate = useNavigate();
  const { createTenant, loading } = useTenantActions();

  const handleSubmit = async (payload) => {
    const created = await createTenant(payload);
    if (created) {
      toast.success('Tenant created (dummy – API lagane par yahan real response aayega)');
      navigate('/tenant-management');
      // Optional: navigate to detail -> navigate(`/tenant-management/${created.tenantId}`);
    } else {
      toast.error('Create failed');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => navigate('/tenant-management')}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Tenants
        </Button>
      </div>
      <CreateTenantForm
        onSubmit={handleSubmit}
        onCancel={() => navigate('/tenant-management')}
        loading={loading}
      />
    </div>
  );
}
