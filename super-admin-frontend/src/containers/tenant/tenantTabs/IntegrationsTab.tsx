"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Edit, Trash2, Settings, Check, X, Copy } from 'lucide-react';
import { integrationsAPI } from '@/superadmin-apis/integrations';
import type { TenantIntegration, IntegrationConfig, MasterIntegration, CreateIntegrationConfigRequest } from '@/superadmin-apis/integrations/types';
import { toast } from 'sonner';

interface SchemaField {
  type?: string;
  format?: string;
  description?: string;
  required?: boolean;
  enum?: string[];
}

interface IntegrationsTabProps {
  tenantId: string;
}

export default function IntegrationsTab({ tenantId }: IntegrationsTabProps) {
  const [tenantIntegrations, setTenantIntegrations] = useState<TenantIntegration[]>([]);
  const [integrationConfigs, setIntegrationConfigs] = useState<IntegrationConfig[]>([]);
  const [masterIntegrations, setMasterIntegrations] = useState<MasterIntegration[]>([]);
  const [loading, setLoading] = useState(true);
  const [configDialogOpen, setConfigDialogOpen] = useState(false);
  const [editingConfig, setEditingConfig] = useState<IntegrationConfig | null>(null);

  // Form states
  const [configFormData, setConfigFormData] = useState<CreateIntegrationConfigRequest>({
    integrationId: '',
    config: {}
  });

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success('Copied to clipboard');
    } catch {
      toast.error('Failed to copy');
    }
  };

  useEffect(() => {
    loadData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tenantId]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [tenantResponse, configsResponse, masterResponse] = await Promise.all([
        integrationsAPI.getTenantIntegrations(tenantId),
        integrationsAPI.getIntegrationConfigs(tenantId),
        integrationsAPI.getMasterIntegrations()
      ]);

      if (tenantResponse.success && tenantResponse.data) {
        setTenantIntegrations(tenantResponse.data);
        console.log('Loaded tenant integrations:', tenantResponse.data);
      }

      if (configsResponse.success && configsResponse.data) {
        setIntegrationConfigs(configsResponse.data);
        console.log('Loaded configs:', configsResponse.data);
        console.log('First config integrationId type:', typeof configsResponse.data[0]?.integrationId);
        console.log('First config integrationId value:', configsResponse.data[0]?.integrationId);
      }

      if (masterResponse.success && masterResponse.data) {
        setMasterIntegrations(masterResponse.data);
      }
    } catch (error) {
      toast.error('Failed to load integration data');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleIntegration = async (integrationId: string, isEnabled: boolean) => {
    try {
      let updatedIntegrations: string[];

      if (isEnabled) {
        // Add integration
        updatedIntegrations = [...tenantIntegrations.map(i => i._id), integrationId];
      } else {
        // Remove integration
        updatedIntegrations = tenantIntegrations.filter(i => i._id !== integrationId).map(i => i._id);
      }

      const response = await integrationsAPI.updateTenantIntegrations(tenantId, updatedIntegrations);

      if (response.success) {
        toast.success(isEnabled ? 'Integration enabled' : 'Integration disabled');
        loadData();
      } else {
        toast.error(response.message || 'Failed to update integration');
      }
    } catch (error) {
      toast.error('Failed to update integration');
      console.error(error);
    }
  };

  const handleCreateConfig = async () => {
    try {
      const response = await integrationsAPI.createIntegrationConfig(tenantId, configFormData);

      if (response.success) {
        toast.success('Integration configured successfully');
        setConfigDialogOpen(false);
        setConfigFormData({ integrationId: '', config: {} });
        loadData();
      } else {
        toast.error(response.message || 'Failed to create configuration');
      }
    } catch (error) {
      toast.error('Failed to create configuration');
      console.error(error);
    }
  };

  const handleUpdateConfig = async () => {
    if (!editingConfig) return;

    try {
      const response = await integrationsAPI.updateIntegrationConfig(
        tenantId,
        editingConfig._id!,
        { config: configFormData.config }
      );

      if (response.success) {
        toast.success('Configuration updated successfully');
        setConfigDialogOpen(false);
        setEditingConfig(null);
        setConfigFormData({ integrationId: '', config: {} });
        loadData();
      } else {
        toast.error(response.message || 'Failed to update configuration');
      }
    } catch (error) {
      toast.error('Failed to update configuration');
      console.error(error);
    }
  };

  const handleDeleteConfig = async (configId: string) => {
    try {
      const response = await integrationsAPI.deleteIntegrationConfig(tenantId, configId);

      if (response.success) {
        toast.success('Configuration deleted successfully');
        loadData();
      } else {
        toast.error(response.message || 'Failed to delete configuration');
      }
    } catch (error) {
      toast.error('Failed to delete configuration');
      console.error(error);
    }
  };

  const openConfigDialog = (integrationId: string, existingConfig?: IntegrationConfig) => {
    if (existingConfig) {
      setEditingConfig(existingConfig);
      // Extract config from the data field based on your API structure
      const configData = existingConfig.data?.config || existingConfig.data || {};
      setConfigFormData({
        integrationId,
        config: configData as Record<string, unknown>
      });
    } else {
      setEditingConfig(null);
      setConfigFormData({
        integrationId,
        config: {}
      });
    }
    setConfigDialogOpen(true);
  };

  const getIntegrationConfig = (integrationId: string) => {
    return integrationConfigs.find(config => {
      // Handle both string and populated object cases
      const configIntegrationId = typeof config.integrationId === 'string' 
        ? config.integrationId 
        : (config.integrationId as MasterIntegration)?._id;
      return configIntegrationId === integrationId;
    });
  };

  const getMasterIntegration = (integrationId: string) => {
    return masterIntegrations.find(integration => integration._id === integrationId);
  };

  // Helper function to get integration ID from config (handles both string and object)
  const getConfigIntegrationId = (config: IntegrationConfig): string => {
    return typeof config.integrationId === 'string' 
      ? config.integrationId 
      : (config.integrationId as MasterIntegration)?._id || '';
  };

  // Helper function to get integration details from config
  const getIntegrationFromConfig = (config: IntegrationConfig) => {
    // If integrationId is already populated as an object, use it directly
    if (typeof config.integrationId === 'object' && config.integrationId !== null) {
      return config.integrationId as MasterIntegration;
    }
    // Otherwise, find it in master integrations
    return getMasterIntegration(config.integrationId as string);
  };

  const isIntegrationEnabled = (integrationId: string) => {
    return tenantIntegrations.some(integration => integration._id === integrationId);
  };

  const renderConfigForm = (integration: MasterIntegration) => {
    const configSchema = integration.configSchema;

    if (!configSchema) {
      return (
        <div className="space-y-4">
          <div>
            <Label htmlFor="config-json">Configuration (JSON)</Label>
            <Textarea
              id="config-json"
              placeholder="Enter configuration as JSON"
              value={JSON.stringify(configFormData.config, null, 2)}
              onChange={(e) => {
                try {
                  const parsed = JSON.parse(e.target.value);
                  setConfigFormData(prev => ({ ...prev, config: parsed }));
                } catch {
                  // Invalid JSON, don't update config
                  console.warn('Invalid JSON in config field');
                }
              }}
              rows={10}
              className="w-full max-w-full font-mono text-sm whitespace-pre-wrap break-words resize-none overflow-auto"
            />
          </div>
        </div>
      );
    }

    // Render form based on schema
    return (
      <div className="space-y-4">
        {Object.entries(configSchema).map(([key, field]: [string, unknown]) => {
          const schemaField = field as SchemaField;
          if (schemaField.type === 'string') {
            return (
              <div key={key}>
                <Label htmlFor={key}>{key}</Label>
                <Input
                  id={key}
                  type={schemaField.format === 'uri' ? 'url' : 'text'}
                  placeholder={schemaField.description || key}
                  value={String((configFormData.config as Record<string, unknown>)[key] || '')}
                  onChange={(e) => setConfigFormData(prev => ({
                    ...prev,
                    config: { ...prev.config, [key]: e.target.value }
                  }))}
                  required={schemaField.required}
                />
              </div>
            );
          }

          if (schemaField.type === 'number') {
            return (
              <div key={key}>
                <Label htmlFor={key}>{key}</Label>
                <Input
                  id={key}
                  type="number"
                  placeholder={schemaField.description || key}
                  value={String((configFormData.config as Record<string, unknown>)[key] || '')}
                  onChange={(e) => setConfigFormData(prev => ({
                    ...prev,
                    config: { ...prev.config, [key]: parseFloat(e.target.value) }
                  }))}
                  required={schemaField.required}
                />
              </div>
            );
          }

          if (schemaField.enum) {
            return (
              <div key={key}>
                <Label htmlFor={key}>{key}</Label>
                <Select
                  value={(configFormData.config as Record<string, unknown>)[key] as string || ''}
                  onValueChange={(value) => setConfigFormData(prev => ({
                    ...prev,
                    config: { ...prev.config, [key]: value }
                  }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={`Select ${key}`} />
                  </SelectTrigger>
                  <SelectContent>
                    {schemaField.enum.map((option: string) => (
                      <SelectItem key={option} value={option}>
                        {option}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            );
          }

          return null;
        })}
      </div>
    );
  };

  if (loading) {
    return <div className="space-y-4">Loading integrations...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Available Integrations */}
      <Card>
        <CardHeader>
          <CardTitle>Available Integrations</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {masterIntegrations.map((integration) => {
              const isEnabled = isIntegrationEnabled(integration._id!);
              const config = getIntegrationConfig(integration._id!);

              return (
                <Card key={integration._id} className={`border-2 ${isEnabled ? 'border-green-200' : 'border-gray-200'}`}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{integration.displayName}</CardTitle>
                      <Badge variant={isEnabled ? 'secondary' : 'outline'}>
                        {isEnabled ? 'Enabled' : 'Disabled'}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{integration.description}</p>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Badge variant="outline" className="capitalize">
                        {integration.category.replace('_', ' ')}
                      </Badge>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant={isEnabled ? 'destructive' : 'default'}
                          onClick={() => handleToggleIntegration(integration._id!, !isEnabled)}
                        >
                          {isEnabled ? <X className="w-4 h-4" /> : <Check className="w-4 h-4" />}
                          {isEnabled ? 'Disable' : 'Enable'}
                        </Button>
                        {isEnabled && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openConfigDialog(integration._id!, config)}
                          >
                            <Settings className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                    {config && (
                      <div className="text-xs text-muted-foreground">
                        Configured on {new Date(config.updatedAt || config.createdAt!).toLocaleDateString()}
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Integration Configurations */}
      {integrationConfigs.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Integration Configurations</CardTitle>
              <Button variant="outline" size="sm" onClick={loadData}>
                Refresh
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Integration</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Last Updated</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {integrationConfigs.map((config) => {
                  const masterIntegration = getIntegrationFromConfig(config);

                  return (
                    <TableRow key={config._id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{masterIntegration?.displayName || 'Unknown'}</div>
                          <div className="text-sm text-muted-foreground">{masterIntegration?.description}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">Configured</Badge>
                      </TableCell>
                      <TableCell>
                        {new Date(config.updatedAt || config.createdAt!).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openConfigDialog(getConfigIntegrationId(config), config)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button size="sm" variant="outline">
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete Configuration</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to delete the configuration for {masterIntegration?.displayName}?
                                  This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleDeleteConfig(config._id!)}>
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Configuration Dialog */}
      <Dialog open={configDialogOpen} onOpenChange={setConfigDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingConfig ? 'Edit Integration Configuration' : 'Configure Integration'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 max-w-full overflow-hidden">
            {configFormData.integrationId && (() => {
              const integration = getMasterIntegration(configFormData.integrationId);
              if (!integration) return null;
              return (
                <div className="space-y-4 border-b pb-4">
                  <div className="flex items-center justify-between">
                    <Label>Integration Display Name</Label>
                    <Button variant="ghost" size="sm" onClick={() => copyToClipboard(integration.displayName)}>
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                  <Input value={integration.displayName} readOnly />
                  <div className="flex items-center justify-between">
                    <Label>Integration Id</Label>
                    <Button variant="ghost" size="sm" onClick={() => copyToClipboard(integration._id!)}>
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                  <Input value={integration._id!} readOnly />
                </div>
              );
            })()}
            {configFormData.integrationId && (
              <>
                {(() => {
                  const integration = getMasterIntegration(configFormData.integrationId);
                  return integration ? renderConfigForm(integration) : null;
                })()}
              </>
            )}
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setConfigDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={editingConfig ? handleUpdateConfig : handleCreateConfig}>
                {editingConfig ? 'Update Configuration' : 'Create Configuration'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
