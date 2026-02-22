"use client";

import { useCallback, useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Plus, Check, MoreHorizontal, Edit, Trash2, Users, CreditCard } from 'lucide-react';
import { availableFeaturesForPlan } from '@/lib/constants/options';
import { CreatePlan, Feature, Plan } from '@/types/pricing-plan';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import planAPI from '@/api/pricng-plan-api';
import Loading from '@/components/comman/Loading';
import { toast } from 'sonner';

const INITIAL_FORM_STATE: CreatePlan = {
  code: "",
  name: "",
  description: "",
  pricePerUser: 9,
  interval: "month",
  billingModel: "per_user",
  features: [],
  quotas: {
    usersMax: 1,
    storagePerUserGB: 1,
    apiCallsPerMonth: 1,
  },
};

const PricingPlansPage = () => {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPlanId, setEditingPlanId] = useState<string | null>(null);
  const [form, setForm] = useState<CreatePlan>(INITIAL_FORM_STATE);
  const [selectedFeatures, setSelectedFeatures] = useState<string[]>([]);
  const [isPopular, setIsPopular] = useState(false);
  const [formLoading, setFormLoading] = useState(false);

  const isEditMode = Boolean(editingPlanId);

  // Helper function to create Feature objects from feature IDs
  const createFeatureObjects = useCallback((featureIds: string[]): Feature[] => {
    return featureIds.map(featureId => {
      const feature = availableFeaturesForPlan.find(f => f.id === featureId);
      return {
        key: feature ? feature.label : featureId,
        _id: featureId,
        isAdd: true
      };
    });
  }, []);

  // CRUD Operations
  const fetchPlans = useCallback(async () => {
    setLoading(true);
    try {
      const response = await planAPI.getPlans();
      if (response.success && response.data?.plans) {
        setPlans(response.data.plans);
      } else {
        setPlans([]);
      }
    } catch (error) {
      console.error("Error fetching plans:", error);
      toast.error(error instanceof Error ? error.message : "Failed to fetch plans");
      setPlans([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const createPlan = useCallback(async (planData: CreatePlan): Promise<Plan | null> => {
    try {
      const response = await planAPI.createPlan(planData);
      if (response.success && response.data) {
        toast.success("Plan created successfully");
        return response.data;
      }
      throw new Error('Failed to create plan - invalid response');
    } catch (error) {
      console.error("Error creating plan:", error);
      toast.error(error instanceof Error ? error.message : "Failed to create plan");
      return null;
    }
  }, []);

  const updatePlan = useCallback(async (planId: string, planData: Partial<CreatePlan>): Promise<Plan | null> => {
    try {
      const response = await planAPI.updatePlan(planId, planData);
      if (response.success && response.data) {
        toast.success("Plan updated successfully");
        return response.data;
      }
      throw new Error('Failed to update plan - invalid response');
    } catch (error) {
      console.error("Error updating plan:", error);
      toast.error(error instanceof Error ? error.message : "Failed to update plan");
      return null;
    }
  }, []);

  const deletePlan = useCallback(async (planId: string): Promise<boolean> => {
    try {
      const response = await planAPI.deletePlan(planId);
      if (response.success) {
        toast.success("Plan deleted successfully");
        return true;
      }
      throw new Error('Failed to delete plan - invalid response');
    } catch (error) {
      console.error("Error deleting plan:", error);
      toast.error(error instanceof Error ? error.message : "Failed to delete plan");
      return false;
    }
  }, []);

  // State Management Helpers
  const resetForm = useCallback(() => {
    setForm({ ...INITIAL_FORM_STATE });
    setSelectedFeatures([]);
    setEditingPlanId(null);
    setIsPopular(false);
  }, []);

  const populateFormForEdit = useCallback((plan: Plan) => {
    setForm({
      code: plan.code || "",
      name: plan.name || "",
      description: plan.description || "",
      pricePerUser: plan.pricePerUser || 0,
      interval: plan.interval || "month",
      billingModel: plan.billingModel || "per_user",
      features: plan.features || [],
      quotas: {
        usersMax: plan.quotas?.usersMax || 1,
        storagePerUserGB: plan.quotas?.storagePerUserGB || 1,
        apiCallsPerMonth: plan.quotas?.apiCallsPerMonth || 1,
      },
    });
    
    const featureIds = (plan.features || []).map(feature => {
      const matchedFeature = availableFeaturesForPlan.find(af => 
        af.label === feature.key || af.id === feature._id
      );
      return matchedFeature ? matchedFeature.id : feature._id;
    });
    
    setSelectedFeatures(featureIds);
    setIsPopular(plan.isMostPopular || false);
    setEditingPlanId(plan._id);
  }, []);

  const generatePlanCode = useCallback((name: string, interval: string): string => {
    return name.toLowerCase().replace(/\s+/g, '_') + '_' + interval;
  }, []);

  // Event Handlers
  const handleDialogOpenChange = useCallback((open: boolean) => {
    setIsDialogOpen(open);
    if (!open) {
      resetForm();
    }
  }, [resetForm]);

  const handleInputChange = useCallback((
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setForm(prev => ({
      ...prev,
      [name]: name === 'pricePerUser' ? Math.max(0, value ? Number(value) : 0) : value,
    }));
  }, []);

  const handleQuotaChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({
      ...prev,
      quotas: {
        ...prev.quotas,
        [name]: Math.max(0, value ? Number(value) : 0),
      },
    }));
  }, []);

  const handleFeatureChange = useCallback((featureId: string, checked: boolean) => {
    setSelectedFeatures(prev => {
      return checked
        ? [...prev.filter(id => id !== featureId), featureId]
        : prev.filter(id => id !== featureId);
    });
  }, []);

  const handleSelectChange = useCallback((field: keyof CreatePlan, value: string | number) => {
    setForm(prev => ({ ...prev, [field]: value }));
  }, []);

  // Submit handler with refetch after create/update
  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);

    try {
      const featureObjects = createFeatureObjects(selectedFeatures);
      
      const planData: CreatePlan = {
        ...form,
        features: featureObjects,
        code: form.code || generatePlanCode(form.name, form.interval),
        isMostPopular: isPopular,
      };

      // Handle popular plan logic - only one can be popular at a time
      if (isPopular) {
        const currentPopularPlan = plans.find(plan => plan.isMostPopular && plan._id !== editingPlanId);
        if (currentPopularPlan) {
          // Automatically remove popular status from the other plan
          try {
            await planAPI.updatePlan(currentPopularPlan._id, { isMostPopular: false });
            toast.info(`Removed "Most Popular" status from "${currentPopularPlan.name}"`);
          } catch (error) {
            console.error("Error updating previous popular plan:", error);
            toast.error("Failed to update previous popular plan status");
            setFormLoading(false);
            return;
          }
        }
      }

      if (isEditMode && editingPlanId) {
        const updatedPlan = await updatePlan(editingPlanId, planData);
        if (updatedPlan) {
          handleDialogOpenChange(false);
          await fetchPlans(); // Refetch to get fresh data
        }
      } else {
        const newPlan = await createPlan(planData);
        if (newPlan) {
          handleDialogOpenChange(false);
          await fetchPlans(); // Refetch to get fresh data
        }
      }
    } catch (error) {
      console.error("Error saving plan:", error);
      toast.error("Failed to save plan");
    } finally {
      setFormLoading(false);
    }
  }, [form, selectedFeatures, isEditMode, editingPlanId, generatePlanCode, createFeatureObjects, updatePlan, createPlan, handleDialogOpenChange, fetchPlans, isPopular, plans]);

  // Plan Actions
  const handleEditPlan = useCallback((plan: Plan) => {
    populateFormForEdit(plan);
    setIsDialogOpen(true);
  }, [populateFormForEdit]);

  const handleCreateNewPlan = useCallback(() => {
    resetForm();
    setIsDialogOpen(true);
  }, [resetForm]);

  const handleDeletePlan = useCallback(async (planId: string) => {
    if (!confirm("Are you sure you want to delete this plan? This action cannot be undone.")) {
      return;
    }

    const originalPlans = plans;
    setPlans(prev => prev.filter(plan => plan._id !== planId));

    const success = await deletePlan(planId);
    
    if (!success) {
      setPlans(originalPlans);
    }
  }, [plans, deletePlan]);

  // const handleDuplicatePlan = useCallback((plan: Plan) => {
  //   const duplicatedPlan: CreatePlan = {
  //     code: "",
  //     name: `${plan.name || "Plan"} (Copy)`,
  //     description: plan.description || "",
  //     pricePerUser: plan.pricePerUser || 0,
  //     interval: plan.interval || "month",
  //     billingModel: plan.billingModel || "per_user",
  //     features: plan.features || [],
  //     quotas: {
  //       usersMax: plan.quotas?.usersMax || 1,
  //       storagePerUserGB: plan.quotas?.storagePerUserGB || 1,
  //       apiCallsPerMonth: plan.quotas?.apiCallsPerMonth || 1,
  //     },
  //   };

  //   setForm(duplicatedPlan);
  //   const featureIds = (plan.features || []).map(feature => feature._id);
  //   setSelectedFeatures(featureIds);
  //   setEditingPlanId(null);
  //   setIsPopular(false);
  //   setIsDialogOpen(true);
  // }, []);

  // const handleMarkAsPopular = useCallback(async (planId: string) => {
  //   try {
  //     // First, remove popular status from any existing popular plan
  //     const currentPopularPlan = plans.find(plan => plan.isMostPopular && plan._id !== planId);
  //     if (currentPopularPlan) {
  //       await planAPI.updatePlan(currentPopularPlan._id, { isMostPopular: false });
  //       toast.info(`Removed "Most Popular" status from "${currentPopularPlan.name}"`);
  //     }

  //     // Then mark the selected plan as popular
  //     const response = await planAPI.updatePlan(planId, { isMostPopular: true });
  //     if (response.success) {
  //       setPlans(prev => prev.map(plan => ({
  //         ...plan,
  //         isMostPopular: plan._id === planId
  //       })));
  //       toast.success("Plan marked as popular");
  //     } else {
  //       toast.error("Failed to mark plan as popular");
  //     }
  //   } catch (error) {
  //     console.error("Error updating popular status:", error);
  //     toast.error(error instanceof Error ? error.message : "Failed to update popular status");
  //   }
  // }, [plans]);

  const handleTogglePlanStatus = useCallback(async (planId: string, isActive: boolean) => {
    try {
      const response = await planAPI.updatePlan(planId, { isActive });
      if (response.success && response.data) {
        setPlans(prev => prev.map(plan =>
          plan._id === planId ? { ...plan, isActive } : plan
        ));
        toast.success(`Plan ${isActive ? 'activated' : 'deactivated'} successfully`);
      } else {
        toast.error("Failed to update plan status");
      }
    } catch (error) {
      console.error("Error updating plan status:", error);
      toast.error(error instanceof Error ? error.message : "Failed to update plan status");
    }
  }, []);  // Utility Functions
  const formatPrice = useCallback((price: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0
    }).format(price);
  }, []);

  const formatLimit = useCallback((value: number | undefined | null): string => {
    if (value === undefined || value === null) return 'N/A';
    if (value === -1) return 'Unlimited';
    return value.toLocaleString();
  }, []);

  // Effects
  useEffect(() => {
    fetchPlans();
  }, [fetchPlans]);

  if (loading && plans.length === 0) {
    return <Loading />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2>Pricing Plans</h2>
          <p className="text-muted-foreground">Manage subscription tiers and pricing</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={handleDialogOpenChange}>
          <DialogTrigger asChild>
            <Button onClick={handleCreateNewPlan}>
              <Plus className="w-4 h-4 mr-2" />
              Create Plan
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
            <DialogHeader className="flex-shrink-0">
              <DialogTitle>
                {isEditMode ? `Edit Pricing Plan - ${form.name}` : 'Create New Pricing Plan'}
              </DialogTitle>
              <DialogDescription>
                {isEditMode 
                  ? `Update the details and features for "${form.name || 'this pricing plan'}".` 
                  : 'Configure the details and features for your new pricing plan.'
                }
              </DialogDescription>
            </DialogHeader>
            
            <div className="flex-1 overflow-y-auto">
              <form onSubmit={handleSubmit} className="space-y-4 p-1">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className='mb-2' htmlFor="name">Plan Name</Label>
                    <Input 
                      id="name" 
                      name='name' 
                      value={form.name || ""} 
                      onChange={handleInputChange} 
                      placeholder="e.g., Professional" 
                      required 
                    />
                  </div>
                  <div>
                    <Label className='mb-2' htmlFor="pricePerUser">Price per User ($)</Label>
                    <Input 
                      id="pricePerUser" 
                      name='pricePerUser' 
                      value={form.pricePerUser || ""} 
                      onChange={handleInputChange} 
                      type="number" 
                      min="0"
                      step="0.01"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="mb-2 block" htmlFor="interval">Interval</Label>
                    <Select
                      value={form.interval}
                      onValueChange={(value) => handleSelectChange('interval', value as "month" | "year")}
                    >
                      <SelectTrigger id="interval" className="w-full">
                        <SelectValue placeholder="Select interval" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="month">Month</SelectItem>
                        <SelectItem value="year">Year</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label className="mb-2 block" htmlFor="billingModel">Billing Model</Label>
                    <Select
                      value={form.billingModel}
                      onValueChange={(value) => handleSelectChange('billingModel', value as "per_user" | "flat")}
                    >
                      <SelectTrigger id="billingModel" className="w-full">
                        <SelectValue placeholder="Select billing model" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="per_user">Per User</SelectItem>
                        <SelectItem value="flat">Flat</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label className='mb-2' htmlFor="description">Description</Label>
                  <Textarea 
                    id="description" 
                    name='description' 
                    value={form.description || ""} 
                    onChange={handleInputChange} 
                    placeholder="Brief description of the plan" 
                    required 
                  />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label className='mb-2' htmlFor="usersMax">User Limit</Label>
                    <Input 
                      id="usersMax" 
                      name='usersMax' 
                      value={form.quotas?.usersMax || ""} 
                      onChange={handleQuotaChange} 
                      type="number" 
                      placeholder="50" 
                      min="0"
                      required 
                    />
                  </div>
                  <div>
                    <Label className='mb-2' htmlFor="storagePerUserGB">Storage (GB)</Label>
                    <Input 
                      id="storagePerUserGB" 
                      name='storagePerUserGB' 
                      value={form.quotas?.storagePerUserGB || ""} 
                      onChange={handleQuotaChange} 
                      type="number" 
                      placeholder="100" 
                      min="0"
                      required 
                    />
                  </div>
                  <div>
                    <Label className='mb-2' htmlFor="apiCallsPerMonth">API Calls/mo</Label>
                    <Input 
                      id="apiCallsPerMonth" 
                      name='apiCallsPerMonth' 
                      value={form.quotas?.apiCallsPerMonth || ""} 
                      onChange={handleQuotaChange} 
                      type="number" 
                      placeholder="10000" 
                      min="0"
                      required 
                    />
                  </div>
                </div>

                <div>
                  <Label className='mb-2'>Features Included</Label>
                  <div className="grid grid-cols-1 gap-3 mt-2 max-h-56 overflow-y-auto border rounded-md p-3">
                    {availableFeaturesForPlan.map(feature => (
                      <div key={feature.id} className="flex items-start space-x-2">
                        <Checkbox
                          id={feature.id}
                          checked={selectedFeatures.includes(feature.id)}
                          className='border-primary'
                          onCheckedChange={(checked: boolean) =>
                            handleFeatureChange(feature.id, checked)
                          }
                        />
                        <div className="grid gap-1.5 leading-none">
                          <Label htmlFor={feature.id} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                            {feature.label}
                          </Label>
                          <p className="text-xs text-muted-foreground">{feature.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="popular"
                    className='border-primary'
                    checked={isPopular}
                    onCheckedChange={(checked) => setIsPopular(Boolean(checked))}
                  />
                  <Label htmlFor="popular">Mark as popular plan</Label>
                </div>
              </form>
            </div>

            <div className="flex-shrink-0 border-t pt-4 flex gap-2">
              <Button 
                className="flex-1" 
                onClick={handleSubmit} 
                disabled={formLoading}
              >
                {formLoading ? "Saving..." : (isEditMode ? "Update Plan" : "Create Plan")}
              </Button>
              <Button variant="outline" onClick={() => handleDialogOpenChange(false)}>
                Cancel
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Plans Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {plans.map((plan, index) => (
          <Card key={plan._id || `plan-${index}`} className={`relative ${plan.isMostPopular ? 'ring-2 ring-primary' : ''}`}>
            {plan.isMostPopular && (
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <Badge className="bg-primary text-primary-foreground">Most Popular</Badge>
              </div>
            )}
            <CardHeader className="text-center">
              <div className="flex items-center justify-between">
                <CardTitle>{plan.name}</CardTitle>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-8 w-8 p-0">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => handleEditPlan(plan)}>
                      <Edit className="w-4 h-4 mr-2" />
                      Edit Plan
                    </DropdownMenuItem>
                    <DropdownMenuItem className="text-destructive" onClick={() => handleDeletePlan(plan._id)}>
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete Plan
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              <p className="text-muted-foreground text-sm">{plan.description}</p>
              <div className="py-4">
                {plan.billingModel === 'flat' ? (
                  <div>
                    <div className="text-3xl">Contact Support</div>
                    <div className="text-sm text-muted-foreground">for custom pricing</div>
                  </div>
                ) : (
                  <div>
                    <div className="text-3xl">
                      {plan.pricePerUser && plan.pricePerUser > 0 
                        ? formatPrice(plan.pricePerUser) 
                        : 'Contact Sales'
                      }
                    </div>
                    <div className="text-sm text-muted-foreground">
                      per user / {plan.interval || 'month'}
                    </div>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Plan Features */}
              <div className="space-y-2">
                {plan.features && plan.features.length > 0 ? (
                  plan.features.map((feature, index) => (
                    <div key={`${plan._id}-feature-${feature._id || index}`} className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-green-600" />
                      <span className="text-sm">{feature.key}</span>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-gray-500">No features</p>
                )}
              </div>

              {/* Plan Limits */}
              <div className="border-t pt-4">
                <div className="text-sm space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Users:</span>
                    <span>{formatLimit(plan.quotas?.usersMax)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Storage:</span>
                    <span>{formatLimit(plan.quotas?.storagePerUserGB)}GB</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">API Calls:</span>
                    <span>{formatLimit(plan.quotas?.apiCallsPerMonth)}/mo</span>
                  </div>
                </div>
              </div>

              {/* Plan Stats */}
              <div className="border-t pt-4 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Billing Model</span>
                  </div>
                  <span className="text-sm capitalize">
                    {plan.billingModel?.replace('_', ' ') || 'Per User'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CreditCard className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Code</span>
                  </div>
                  <span className="text-sm font-mono">{plan.code || 'N/A'}</span>
                </div>
              </div>

              {/* Plan Status */}
              <div className="border-t pt-4 flex items-center justify-between">
                <Label htmlFor={`active-${plan._id}`}>Plan Active</Label>
                <Switch 
                  id={`active-${plan._id || index}`} 
                  checked={plan.isActive || false} 
                  onCheckedChange={(checked) => handleTogglePlanStatus(plan._id, checked)}
                />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Empty state */}
      {plans.length === 0 && !loading && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No pricing plans found. Create your first plan to get started.</p>
        </div>
      )}
    </div>
  );
};

export default PricingPlansPage;