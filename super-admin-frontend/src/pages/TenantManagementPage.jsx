import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Plus, Search, Building2, Eye, AlertTriangle } from 'lucide-react';
import { useTenants } from '@/hooks/use-super-admin';

export default function TenantManagementPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const navigate = useNavigate();

  const { tenants, pagination, loading, error, refetch } = useTenants({
    page: currentPage,
    limit: 10,
    status: statusFilter === 'all' ? undefined : statusFilter,
    search: searchTerm || undefined
  });

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      refetch({ page: currentPage, limit: 10, status: statusFilter === 'all' ? undefined : statusFilter, search: searchTerm || undefined });
    }, 300);
    return () => clearTimeout(timeoutId);
  }, [searchTerm, statusFilter, currentPage]);

  const getStatusBadge = (status) => {
    switch ((status || '').toLowerCase()) {
      case 'active':
        return <Badge variant="secondary" className="text-green-600">Active</Badge>;
      case 'suspended':
        return <Badge variant="destructive">Suspended</Badge>;
      case 'trial':
        return <Badge variant="outline" className="text-blue-600">Trial</Badge>;
      case 'inactive':
        return <Badge variant="secondary" className="text-gray-500">Inactive</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  if (error) {
    return (
      <div className="space-y-6">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>Failed to load tenants: {error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2>Tenant Management</h2>
          <p className="text-muted-foreground">Manage all tenants and their configurations</p>
        </div>
        <Link to="/tenant-management/create">
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Create Tenant
          </Button>
        </Link>
      </div>

      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Search tenants..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Filter by Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active Only</SelectItem>
                <SelectItem value="trial">Trial Only</SelectItem>
                <SelectItem value="suspended">Suspended Only</SelectItem>
                <SelectItem value="inactive">Inactive Only</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>
            All Tenants {loading ? '(Loading...)' : `(${Array.isArray(tenants) ? tenants.length : 0})`}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Company</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Region</TableHead>
                <TableHead>Features</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {Array.isArray(tenants) && tenants.map((tenant) => (
                <TableRow key={tenant._id || tenant.tenantId}>
                  <TableCell>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-muted-foreground" />
                        <span className="font-medium">{tenant.companyName}</span>
                      </div>
                      <div className="text-xs text-muted-foreground">{tenant.slug}.tickflo.com</div>
                      <div className="text-xs text-muted-foreground">{tenant.primaryContact?.email}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      {getStatusBadge(tenant.status)}
                      {tenant.status === 'trial' && tenant.trial && (
                        <div className="text-xs text-muted-foreground">{tenant.trial.days} days</div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{tenant.region}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {tenant.features?.slice(0, 2).map((feature) => (
                        <Badge key={feature} variant="outline" className="text-xs">{feature}</Badge>
                      ))}
                      {tenant.features?.length > 2 && (
                        <Badge variant="outline" className="text-xs">+{tenant.features.length - 2}</Badge>
                      )}
                      {(!tenant.features || tenant.features.length === 0) && (
                        <Badge variant="outline" className="text-xs">No Features</Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {tenant?.createdAt ? new Date(tenant.createdAt).toLocaleDateString() : 'N/A'}
                  </TableCell>
                  <TableCell className="text-right cursor-pointer" onDoubleClick={() => navigate(`/tenant-management/${tenant.tenantId || tenant._id}`)}>
                    <Link to={`/tenant-management/${tenant.tenantId || tenant._id}`}>
                      <Button variant="ghost" size="sm">
                        <Eye className="w-4 h-4" />
                      </Button>
                    </Link>
                  </TableCell>
                </TableRow>
              ))}
              {Array.isArray(tenants) && tenants.length === 0 && !loading && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                    No tenants found. {searchTerm || statusFilter !== 'all' ? 'Try adjusting your filters.' : 'Create your first tenant to get started.'}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
          {pagination && pagination.totalPages > 1 && (
            <div className="flex items-center justify-between space-x-2 py-4">
              <div className="text-sm text-muted-foreground">
                Showing {((currentPage - 1) * 10) + 1} to {Math.min(currentPage * 10, pagination.total || 0)} of {pagination.total || 0} tenants
              </div>
              <div className="flex space-x-2">
                <Button variant="outline" size="sm" onClick={() => setCurrentPage((p) => p - 1)} disabled={currentPage <= 1 || loading}>Previous</Button>
                <Button variant="outline" size="sm" onClick={() => setCurrentPage((p) => p + 1)} disabled={currentPage >= (pagination.totalPages || 1) || loading}>Next</Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
