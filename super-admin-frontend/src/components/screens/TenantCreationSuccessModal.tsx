import React from 'react';
import moment from 'moment';
import jsPDF from 'jspdf';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface TenantCreationResponse {
  success: boolean;
  data: {
    tenant: {
      tenantId: string;
      slug: string;
      companyName: string;
      status: string;
      region: string;
      ownerUserId: string;
      ownerPassword?: string;
      ownerInvite: {
        type: string;
        code: string;
        expiresAt: string;
      };
      createdAt: string;
    };
  };
}

interface TenantCreationSuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: TenantCreationResponse;
}

export function TenantCreationSuccessModal({
  isOpen,
  onClose,
  data,
}: TenantCreationSuccessModalProps) {
  const { tenant } = data.data;

  const handleSaveAsPdf = () => {
    const doc = new jsPDF();

    doc.setFontSize(20);
    doc.text('Tenant Creation Details', 20, 30);

    doc.setFontSize(12);
    let y = 50;

    doc.text(`Tenant ID: ${tenant.tenantId}`, 20, y);
    y += 10;
    doc.text(`Slug: ${tenant.slug}`, 20, y);
    y += 10;
    doc.text(`Company Name: ${tenant.companyName}`, 20, y);
    y += 10;
    doc.text(`Status: ${tenant.status}`, 20, y);
    y += 10;
    doc.text(`Region: ${tenant.region}`, 20, y);
    y += 10;
    doc.text(`Owner User ID: ${tenant.ownerUserId}`, 20, y);
    y += 10;
    doc.text(`Created At: ${moment(tenant.createdAt).format('MMMM Do YYYY, h:mm:ss a')}`, 20, y);
    y += 20;

    doc.setFontSize(14);
    doc.text('Owner Invite:', 20, y);
    y += 10;
    doc.setFontSize(12);
    doc.text(`Type: ${tenant.ownerInvite.type}`, 20, y);
    y += 10;
    doc.text(`Code: ${tenant.ownerInvite.code}`, 20, y);
    y += 10;
    doc.text(`Expires At: ${moment(tenant.ownerInvite.expiresAt).format('MMMM Do YYYY, h:mm:ss a')}`, 20, y);
    
    if (tenant.ownerPassword) {
      y += 20;
      doc.setFontSize(14);
      doc.text('Owner Credentials:', 20, y);
      y += 10;
      doc.setFontSize(12);
      doc.text(`Password: ${tenant.ownerPassword}`, 20, y);
    }

    doc.save('tenant-creation-details.pdf');
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Tenant Created Successfully!</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pr-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="font-semibold">Tenant ID:</label>
              <p>{tenant.tenantId}</p>
            </div>
            <div>
              <label className="font-semibold">Slug:</label>
              <p>{tenant.slug}</p>
            </div>
            <div>
              <label className="font-semibold">Company Name:</label>
              <p>{tenant.companyName}</p>
            </div>
            <div>
              <label className="font-semibold">Status:</label>
              <Badge variant="secondary">{tenant.status}</Badge>
            </div>
            <div>
              <label className="font-semibold">Region:</label>
              <p>{tenant.region}</p>
            </div>
            <div>
              <label className="font-semibold">Owner User ID:</label>
              <p>{tenant.ownerUserId}</p>
            </div>
            <div>
              <label className="font-semibold">Created At:</label>
              <p>{moment(tenant.createdAt).format('MMMM Do YYYY, h:mm:ss a')}</p>
            </div>
          </div>
          <div className="bg-yellow-100 p-4 rounded-lg border border-yellow-300">
            <h3 className="font-semibold text-yellow-800 mb-2">Owner Invite</h3>
            <div className="space-y-2">
              <div>
                <label className="font-medium text-yellow-700">Type:</label>
                <p className="text-yellow-600">{tenant.ownerInvite.type}</p>
              </div>
              <div>
                <label className="font-medium text-yellow-700">Code:</label>
                <p className="text-yellow-600 font-mono">{tenant.ownerInvite.code}</p>
              </div>
              <div>
                <label className="font-medium text-yellow-700">Expires At:</label>
                <p className="text-yellow-600">{moment(tenant.ownerInvite.expiresAt).format('MMMM Do YYYY, h:mm:ss a')}</p>
              </div>
            </div>
          </div>
          {tenant.ownerPassword && (
            <div className="bg-blue-100 p-4 rounded-lg border border-blue-300">
              <h3 className="font-semibold text-blue-800 mb-2">Owner Credentials</h3>
              <div className="space-y-2">
                <div>
                  <label className="font-medium text-blue-700">Password:</label>
                  <p className="text-blue-600 font-mono bg-white p-2 rounded border border-blue-200 break-all">{tenant.ownerPassword}</p>
                </div>
              </div>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSaveAsPdf}>
            Save as PDF
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}