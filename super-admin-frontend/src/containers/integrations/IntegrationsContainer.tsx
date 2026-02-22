"use client";

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Plus, Edit, Trash2 } from 'lucide-react';
import { integrationsAPI } from '@/superadmin-apis/integrations';
import type { MasterIntegration, CreateIntegrationRequest, UpdateIntegrationRequest } from '@/superadmin-apis/integrations/types';
import { toast } from 'sonner';

export function IntegrationsContainer() {
  const [integrations, setIntegrations] = useState<MasterIntegration[]>([]);
  const [loading, setLoading] = useState(true);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingIntegration, setEditingIntegration] = useState<MasterIntegration | null>(null);

  // Form states
  const [formData, setFormData] = useState<CreateIntegrationRequest>({
    name: 'slack',
    displayName: '',
    description: '',
    category: 'communication'
  });

  useEffect(() => {
    loadIntegrations();
  }, []);

  const loadIntegrations = async () => {
    try {
      setLoading(true);
      const response = await integrationsAPI.getMasterIntegrations();
      if (response.success && response.data) {
        setIntegrations(response.data);
      }
    } catch (error) {
      toast.error('Failed to load integrations');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    try {
      const response = await integrationsAPI.createMasterIntegration(formData);
      if (response.success) {
        toast.success('Integration created successfully');
        setCreateDialogOpen(false);
        resetForm();
        loadIntegrations();
      }
    } catch (error) {
      toast.error('Failed to create integration');
      console.error(error);
    }
  };

  const handleEdit = async () => {
    if (!editingIntegration) return;

    try {
      const updateData: UpdateIntegrationRequest = {
        displayName: formData.displayName,
        description: formData.description,
        category: formData.category,
        isActive: editingIntegration.isActive
      };

      const response = await integrationsAPI.updateMasterIntegration(editingIntegration._id!, updateData);
      if (response.success) {
        toast.success('Integration updated successfully');
        setEditDialogOpen(false);
        setEditingIntegration(null);
        resetForm();
        loadIntegrations();
      }
    } catch (error) {
      toast.error('Failed to update integration');
      console.error(error);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const response = await integrationsAPI.deleteMasterIntegration(id);
      if (response.success) {
        toast.success('Integration deleted successfully');
        loadIntegrations();
      }
    } catch (error) {
      toast.error('Failed to delete integration');
      console.error(error);
    }
  };

  const resetForm = () => {
    setFormData({
      name: 'slack',
      displayName: '',
      description: '',
      category: 'communication'
    });
  };

  const openEditDialog = (integration: MasterIntegration) => {
    setEditingIntegration(integration);
    setFormData({
      name: integration.name,
      displayName: integration.displayName,
      description: integration.description || '',
      category: integration.category
    });
    setEditDialogOpen(true);
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'communication': return 'bg-blue-100 text-blue-800';
      case 'project_management': return 'bg-green-100 text-green-800';
      case 'calendar': return 'bg-purple-100 text-purple-800';
      case 'authentication': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center h-64">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Master Integrations</h2>
          <p className="text-muted-foreground">Manage available integrations for tenants</p>
        </div>
        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Add Integration
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Integration</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Name</Label>
                <Select value={formData.name} onValueChange={(value) => setFormData({...formData, name: value as MasterIntegration['name']})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="slack">Slack</SelectItem>
                    <SelectItem value="teams">Microsoft Teams</SelectItem>
                    <SelectItem value="email">Email</SelectItem>
                    <SelectItem value="jira">Jira</SelectItem>
                    <SelectItem value="gcal">Google Calendar</SelectItem>
                    <SelectItem value="saml">SAML SSO</SelectItem>
                    <SelectItem value="oidc">OpenID Connect</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="displayName">Display Name</Label>
                <Input
                  id="displayName"
                  value={formData.displayName}
                  onChange={(e) => setFormData({...formData, displayName: e.target.value})}
                  placeholder="Enter display name"
                />
              </div>
              <div>
                <Label htmlFor="category">Category</Label>
                <Select value={formData.category} onValueChange={(value) => setFormData({...formData, category: value as MasterIntegration['category']})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="communication">Communication</SelectItem>
                    <SelectItem value="project_management">Project Management</SelectItem>
                    <SelectItem value="calendar">Calendar</SelectItem>
                    <SelectItem value="authentication">Authentication</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  placeholder="Enter description"
                />
              </div>
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleCreate}>Create</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Display Name</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Description</TableHead>
              <TableHead className="w-24">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {integrations.map((integration) => (
              <TableRow key={integration._id}>
                <TableCell className="font-medium">{integration.name}</TableCell>
                <TableCell>{integration.displayName}</TableCell>
                <TableCell>
                  <Badge className={getCategoryColor(integration.category)}>
                    {integration.category.replace('_', ' ')}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge variant={integration.isActive ? 'default' : 'secondary'}>
                    {integration.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                </TableCell>
                <TableCell className="max-w-xs truncate">{integration.description}</TableCell>
                <TableCell>
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openEditDialog(integration)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="outline" size="sm">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Integration</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete {integration.displayName}? This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDelete(integration._id!)}>
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Integration</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Display Name</Label>
              <Input
                value={formData.displayName}
                onChange={(e) => setFormData({...formData, displayName: e.target.value})}
                placeholder="Enter display name"
              />
            </div>
            <div>
              <Label>Category</Label>
              <Select value={formData.category} onValueChange={(value) => setFormData({...formData, category: value as MasterIntegration['category']})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="communication">Communication</SelectItem>
                  <SelectItem value="project_management">Project Management</SelectItem>
                  <SelectItem value="calendar">Calendar</SelectItem>
                  <SelectItem value="authentication">Authentication</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Description</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                placeholder="Enter description"
              />
            </div>
          </div>
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleEdit}>Update</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
