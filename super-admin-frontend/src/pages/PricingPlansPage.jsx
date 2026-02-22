import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Plus, Check, MoreHorizontal, Edit, Trash2 } from 'lucide-react';
import { PlanForm } from '@/components/forms/PlanForm';
import { plansApi } from '@/services/api';
import { toast } from 'sonner';
import Loading from '@/components/comman/Loading';

export default function PricingPlansPage() {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState(null);
  const [formLoading, setFormLoading] = useState(false);

  const loadPlans = async () => {
    setLoading(true);
    try {
      const res = await plansApi.getList();
      if (res.success && res.data?.plans) setPlans(res.data.plans);
    } catch {
      setPlans([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPlans();
  }, []);

  const handleCreate = async (payload) => {
    setFormLoading(true);
    try {
      const res = await plansApi.create(payload);
      if (res.success && res.data) {
        setPlans((prev) => [...prev, res.data]);
        toast.success('Plan created (dummy – API replace karo)');
        setDialogOpen(false);
      }
    } catch {
      toast.error('Failed to create');
    } finally {
      setFormLoading(false);
    }
  };

  const handleUpdate = async (payload) => {
    if (!editingPlan) return;
    setFormLoading(true);
    try {
      const res = await plansApi.update(editingPlan._id, payload);
      if (res.success) {
        setPlans((prev) => prev.map((p) => (p._id === editingPlan._id ? { ...p, ...payload } : p)));
        toast.success('Plan updated (dummy – API replace karo)');
        setDialogOpen(false);
        setEditingPlan(null);
      }
    } catch {
      toast.error('Failed to update');
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this plan?')) return;
    try {
      const res = await plansApi.delete(id);
      if (res.success) {
        setPlans((prev) => prev.filter((p) => p._id !== id));
        toast.success('Plan deleted (dummy – API replace karo)');
      }
    } catch {
      toast.error('Failed to delete');
    }
  };

  const formatPrice = (price) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(price);

  const openCreate = () => {
    setEditingPlan(null);
    setDialogOpen(true);
  };

  const openEdit = (plan) => {
    setEditingPlan(plan);
    setDialogOpen(true);
  };

  if (loading && plans.length === 0) return <Loading />;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2>Pricing Plans</h2>
          <p className="text-muted-foreground">Dummy data – APIs lagane par yahi structure use karna</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openCreate}>
              <Plus className="w-4 h-4 mr-2" />
              Create Plan
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingPlan ? 'Edit Plan' : 'Create Plan'}</DialogTitle>
            </DialogHeader>
            <PlanForm
              initialData={editingPlan}
              isEdit={!!editingPlan}
              onSubmit={editingPlan ? handleUpdate : handleCreate}
              onCancel={() => { setDialogOpen(false); setEditingPlan(null); }}
              loading={formLoading}
            />
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {plans.map((plan) => (
          <Card key={plan._id} className={plan.isMostPopular ? 'ring-2 ring-primary' : ''}>
            {plan.isMostPopular && (
              <div className="flex justify-center pt-2">
                <Badge className="bg-primary">Most Popular</Badge>
              </div>
            )}
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>{plan.name}</CardTitle>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => openEdit(plan)}><Edit className="w-4 h-4 mr-2" />Edit</DropdownMenuItem>
                    <DropdownMenuItem className="text-destructive" onClick={() => handleDelete(plan._id)}><Trash2 className="w-4 h-4 mr-2" />Delete</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              <p className="text-muted-foreground text-sm">{plan.description}</p>
              <div className="text-3xl">
                {plan.pricePerUser > 0 ? formatPrice(plan.pricePerUser) : 'Contact Sales'}
              </div>
              <p className="text-xs text-muted-foreground">per user / {plan.interval}</p>
            </CardHeader>
            <CardContent className="space-y-2">
              {plan.features?.map((f) => (
                <div key={f._id} className="flex items-center gap-2 text-sm">
                  <Check className="w-4 h-4 text-green-600" />
                  {f.key}
                </div>
              ))}
              <div className="pt-2 border-t text-sm text-muted-foreground">
                Users: {plan.quotas?.usersMax === -1 ? 'Unlimited' : plan.quotas?.usersMax} · Storage: {plan.quotas?.storagePerUserGB}GB
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {plans.length === 0 && !loading && (
        <div className="text-center py-12 text-muted-foreground">
          No plans. Create one using the button above (dummy data load ho chuka hoga – refresh karo agar empty hai).
        </div>
      )}
    </div>
  );
}
