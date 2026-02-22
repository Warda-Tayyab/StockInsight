'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Trash2, Plus, Mail, Loader2 } from 'lucide-react';
import {
  getTenantInboundEmails,
  addTenantInboundEmail,
  deleteTenantInboundEmail,
} from '@/superadmin-apis/tenants/inboundEmails';

interface InboundEmailsManagerProps {
  tenantId: string;
  tenantName: string;
}

export function InboundEmailsManager({ tenantId, tenantName }: InboundEmailsManagerProps) {
  const [emails, setEmails] = useState<string[]>([]);
  const [newEmail, setNewEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);

  const fetchEmails = useCallback(async () => {
    try {
      setIsFetching(true);
      const response = await getTenantInboundEmails(tenantId);
      setEmails(response.data.inboundEmails || []);
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || 'Failed to fetch inbound emails');
    } finally {
      setIsFetching(false);
    }
  }, [tenantId]);

  // Fetch existing emails
  useEffect(() => {
    fetchEmails();
  }, [fetchEmails]);

  const handleAddEmail = async () => {
    if (!newEmail.trim()) {
      toast.error('Please enter an email address');
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newEmail)) {
      toast.error('Please enter a valid email address');
      return;
    }

    try {
      setIsLoading(true);
      const response = await addTenantInboundEmail(tenantId, newEmail.toLowerCase().trim());
      
      if (response.success) {
        setEmails(response.data.inboundEmails);
        setNewEmail('');
        toast.success(response.message || 'Email added successfully');
      }
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || 'Failed to add email');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteEmail = async (email: string) => {
    try {
      setIsLoading(true);
      const response = await deleteTenantInboundEmail(tenantId, email);
      
      if (response.success) {
        setEmails(response.data?.inboundEmails || []);
        toast.success(response.message || 'Email deleted successfully');
      }
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || 'Failed to delete email');
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleAddEmail();
    }
  };

  if (isFetching) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Inbound Email Configuration</CardTitle>
          <CardDescription>Loading...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Mail className="h-5 w-5" />
          <CardTitle>Inbound Email Configuration</CardTitle>
        </div>
        <CardDescription>
          Configure email addresses that automatically create tickets for {tenantName}.
          Customers can send emails to these addresses to create support tickets.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Add Email Section */}
        <div className="flex gap-2">
          <Input
            type="email"
            placeholder="support@example.com"
            value={newEmail}
            onChange={(e) => setNewEmail(e.target.value)}
            onKeyPress={handleKeyPress}
            disabled={isLoading}
            className="flex-1"
          />
          <Button 
            onClick={handleAddEmail} 
            disabled={isLoading || !newEmail.trim()}
            size="default"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                <Plus className="h-4 w-4 mr-2" />
                Add Email
              </>
            )}
          </Button>
        </div>

        {/* Emails List */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-muted-foreground">
            Configured Emails ({emails.length})
          </h4>
          
          {emails.length === 0 ? (
            <div className="rounded-lg border border-dashed p-8 text-center">
              <Mail className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-sm text-muted-foreground">
                No inbound emails configured yet.
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Add an email address above to enable automatic ticket creation.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {emails.map((email) => (
                <div
                  key={email}
                  className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <Badge variant="secondary" className="font-mono">
                      {email}
                    </Badge>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteEmail(email)}
                    disabled={isLoading}
                    className="text-destructive hover:text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Info Box */}
        <div className="rounded-lg bg-blue-50 dark:bg-blue-950/20 p-4 text-sm">
          <p className="font-medium text-blue-900 dark:text-blue-100 mb-2">
            📧 How it works:
          </p>
          <ul className="space-y-1 text-blue-800 dark:text-blue-200 text-xs">
            <li>• Customers send emails to configured addresses</li>
            <li>• Emails are forwarded to webhook endpoint via SendGrid/Mailgun</li>
            <li>• System automatically creates tickets in this tenant</li>
            <li>• Sender email becomes the ticket requester</li>
          </ul>
        </div>

        {/* Warning */}
        {emails.length > 0 && (
          <div className="rounded-lg bg-amber-50 dark:bg-amber-950/20 p-4 text-sm">
            <p className="font-medium text-amber-900 dark:text-amber-100 mb-1">
              ⚠️ Important:
            </p>
            <p className="text-amber-800 dark:text-amber-200 text-xs">
              Make sure to configure your email provider (SendGrid/Mailgun) to forward 
              emails to the webhook endpoint: <code className="bg-amber-100 dark:bg-amber-900 px-1 py-0.5 rounded">/webhooks/email/simple</code>
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
