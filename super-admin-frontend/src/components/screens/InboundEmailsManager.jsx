import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Trash2, Plus, Mail } from 'lucide-react';

export function InboundEmailsManager({ tenantId, tenantName }) {
  const [emails, setEmails] = useState([]);
  const [newEmail, setNewEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleAddEmail = () => {
    if (!newEmail.trim()) {
      toast.error('Please enter an email address');
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newEmail)) {
      toast.error('Please enter a valid email address');
      return;
    }
    setIsLoading(true);
    setEmails((prev) => [...prev, newEmail.toLowerCase().trim()]);
    setNewEmail('');
    toast.success('Email added (demo – no API)');
    setIsLoading(false);
  };

  const handleDeleteEmail = (email) => {
    setEmails((prev) => prev.filter((e) => e !== email));
    toast.success('Email removed (demo – no API)');
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mail className="h-5 w-5" />
          Inbound Orders / Email
        </CardTitle>
        <CardDescription>
          Email addresses for {tenantName || tenantId} (e.g. orders, support). UI only – connect API to persist.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Input
            type="email"
            placeholder="Add inbound email address"
            value={newEmail}
            onChange={(e) => setNewEmail(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAddEmail()}
          />
          <Button onClick={handleAddEmail} disabled={isLoading}>
            <Plus className="h-4 w-4 mr-2" />
            Add
          </Button>
        </div>
        <div className="space-y-2">
          {emails.length === 0 ? (
            <p className="text-sm text-muted-foreground">No inbound emails added yet.</p>
          ) : (
            emails.map((email) => (
              <div key={email} className="flex items-center justify-between p-2 border rounded-lg">
                <span className="text-sm">{email}</span>
                <Button variant="ghost" size="sm" onClick={() => handleDeleteEmail(email)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
