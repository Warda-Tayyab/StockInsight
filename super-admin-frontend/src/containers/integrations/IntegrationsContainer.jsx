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
import { toast } from 'sonner';
import { integrationsApi } from '@/services/api';

export function IntegrationsContainer() {
  const [integrations, setIntegrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingIntegration, setEditingIntegration] = useState(null);
  const [formData, setFormData] = useState({
    name: 'slack',
    displayName: '',
    description: '',
    category: 'communication'
  });

  const loadIntegrations = async () => {
    setLoading(true);
    try {
      const res = await integrationsApi.getList();
      if (res.success && res.data) setIntegrations(res.data);
    } catch {
      setIntegrations([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadIntegrations();
  }, []);

  const resetForm = () => setFormData({ name: 'slack', displayName: '', description: '', category: 'communication' });

  const handleCreate = async () => {
    try {
      const res = await integrationsApi.create(formData);
      if (res.success && res.data) {
        setIntegrations((prev) => [...prev, res.data]);
        toast.success('Integration created (dummy – API replace karo)');
        setCreateDialogOpen(false);
        resetForm();
      }
    } catch {
      toast.error('Failed to create');
    }
  };

  const handleEdit = async () => {
    if (!editingIntegration) return;
    try {
      const res = await integrationsApi.update(editingIntegration._id, {
        displayName: formData.displayName,
        description: formData.description,
        category: formData.category
      });
      if (res.success) {
        setIntegrations((prev) => prev.map((i) => (i._id === editingIntegration._id ? { ...i, ...formData } : i)));
        toast.success('Integration updated (dummy – API replace karo)');
        setEditDialogOpen(false);
        setEditingIntegration(null);
        resetForm();
      }
    } catch {
      toast.error('Failed to update');
    }
  };

  const handleDelete = async (id) => {
    try {
      const res = await integrationsApi.delete(id);
      if (res.success) {
        setIntegrations((prev) => prev.filter((i) => i._id !== id));
        toast.success('Integration deleted (dummy – API replace karo)');
      }
    } catch {
      toast.error('Failed to delete');
    }
  };

  const openEditDialog = (integration) => {
    setEditingIntegration(integration);
    setFormData({
      name: integration.name,
      displayName: integration.displayName,
      description: integration.description || '',
      category: integration.category
    });
    setEditDialogOpen(true);
  };

  const getCategoryColor = (category) => {
    switch (category) {
      case 'communication': return 'bg-blue-100 text-blue-800';
      case 'project_management': return 'bg-green-100 text-green-800';
      case 'calendar': return 'bg-purple-100 text-purple-800';
      case 'authentication': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) return <div className="flex justify-center items-center h-64">Loading...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Master Integrations</h2>
          <p className="text-muted-foreground">Dummy data – APIs lagane par src/services/api.js replace karna</p>
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
                <Select value={formData.name} onValueChange={(value) => setFormData({ ...formData, name: value })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
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
                <Input id="displayName" value={formData.displayName} onChange={(e) => setFormData({ ...formData, displayName: e.target.value })} placeholder="Enter display name" />
              </div>
              <div>
                <Label htmlFor="category">Category</Label>
                <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
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
                <Textarea id="description" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} placeholder="Enter description" />
              </div>
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleCreate}>Create</Button>
            </div>
            <p className="text-xs text-muted-foreground">Jab API banaogi: src/services/api.js mein integrationsApi replace karna</p>
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
                  <Badge className={getCategoryColor(integration.category)}>{integration.category.replace('_', ' ')}</Badge>
                </TableCell>
                <TableCell>
                  <Badge variant={integration.isActive ? 'default' : 'secondary'}>{integration.isActive ? 'Active' : 'Inactive'}</Badge>
                </TableCell>
                <TableCell className="max-w-xs truncate">{integration.description}</TableCell>
                <TableCell>
                  <div className="flex space-x-2">
                    <Button variant="outline" size="sm" onClick={() => openEditDialog(integration)}><Edit className="w-4 h-4" /></Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="outline" size="sm"><Trash2 className="w-4 h-4" /></Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Integration</AlertDialogTitle>
                          <AlertDialogDescription>Are you sure you want to delete {integration.displayName}?</AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDelete(integration._id)}>Delete</AlertDialogAction>
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

      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Edit Integration</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Display Name</Label>
              <Input value={formData.displayName} onChange={(e) => setFormData({ ...formData, displayName: e.target.value })} placeholder="Enter display name" />
            </div>
            <div>
              <Label>Category</Label>
              <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
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
              <Textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} placeholder="Enter description" />
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
