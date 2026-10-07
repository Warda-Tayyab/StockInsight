/** @module inventory/settings/pages/UserManagement */

import { useCallback, useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';
import {
  HiOutlineMail,
  HiOutlineRefresh,
  HiOutlineTrash,
  HiOutlineUserAdd,
} from 'react-icons/hi';
import userManagementService from '../../../shared/services/userManagementService';
import { useAuthContext } from '../../../shared/context/AuthContext';
import { getRoleLabel, ROLES } from '../../../shared/utils/roles';

const emptyInvite = {
  firstName: '',
  lastName: '',
  email: '',
  role: 'cashier',
};

const statusStyles = {
  active: 'bg-emerald-100 text-emerald-800',
  invited: 'bg-amber-100 text-amber-800',
  suspended: 'bg-red-100 text-red-800',
};

const UserManagement = () => {
  const { user: currentUser } = useAuthContext();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [inviting, setInviting] = useState(false);
  const [showInvite, setShowInvite] = useState(false);
  const [invite, setInvite] = useState(emptyInvite);

  const loadUsers = useCallback(async () => {
    try {
      setLoading(true);
      const res = await userManagementService.list();
      setUsers(res.data.data || []);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load users');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const handleInviteChange = (field, value) => {
    setInvite((prev) => ({ ...prev, [field]: value }));
  };

  const handleInvite = async (e) => {
    e.preventDefault();
    setInviting(true);
    try {
      await userManagementService.invite(invite);
      toast.success(`Invite email sent to ${invite.email}`);
      setInvite(emptyInvite);
      setShowInvite(false);
      await loadUsers();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Invite failed');
    } finally {
      setInviting(false);
    }
  };

  const handleResend = async (id) => {
    try {
      await userManagementService.resendInvite(id);
      toast.success('Invite email resent');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Resend failed');
    }
  };

  const handleRoleChange = async (id, role) => {
    try {
      await userManagementService.update(id, { role });
      toast.success('Role updated');
      await loadUsers();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Update failed');
    }
  };

  const handleStatusToggle = async (user) => {
    const next = user.status === 'suspended' ? 'active' : 'suspended';
    try {
      await userManagementService.update(user.id, { status: next });
      toast.success(next === 'suspended' ? 'User suspended' : 'User reactivated');
      await loadUsers();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Status update failed');
    }
  };

  const handleRemove = async (user) => {
    if (!window.confirm(`Remove ${user.firstName} (${user.email})?`)) return;
    try {
      await userManagementService.remove(user.id);
      toast.success('User removed');
      await loadUsers();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Remove failed');
    }
  };

  const canInviteManager = currentUser?.role === ROLES.OWNER;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Team &amp; Access</h2>
          <p className="text-sm text-slate-500">
            Invite managers and cashiers by email. Cashiers only get POS, returns, and sales history.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowInvite((v) => !v)}
          className="btn-primary"
        >
          <HiOutlineUserAdd className="w-4 h-4" />
          Invite User
        </button>
      </div>

      {showInvite && (
        <form onSubmit={handleInvite} className="card-padded grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold mb-2 text-slate-900">First name</label>
            <input
              required
              className="input-field"
              value={invite.firstName}
              onChange={(e) => handleInviteChange('firstName', e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-semibold mb-2 text-slate-900">Last name</label>
            <input
              className="input-field"
              value={invite.lastName}
              onChange={(e) => handleInviteChange('lastName', e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-semibold mb-2 text-slate-900">Email</label>
            <input
              required
              type="email"
              className="input-field"
              value={invite.email}
              onChange={(e) => handleInviteChange('email', e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-semibold mb-2 text-slate-900">Role</label>
            <select
              className="select-field"
              value={invite.role}
              onChange={(e) => handleInviteChange('role', e.target.value)}
            >
              <option value="cashier">Cashier — POS, Returns, Sales History</option>
              {canInviteManager && (
                <option value="manager">Manager — Full access</option>
              )}
            </select>
          </div>
          <div className="md:col-span-2 flex justify-end gap-2 pt-2">
            <button
              type="button"
              className="btn-secondary"
              onClick={() => {
                setShowInvite(false);
                setInvite(emptyInvite);
              }}
            >
              Cancel
            </button>
            <button type="submit" disabled={inviting} className="btn-primary disabled:opacity-50">
              <HiOutlineMail className="w-4 h-4" />
              {inviting ? 'Sending…' : 'Send Invite Email'}
            </button>
          </div>
        </form>
      )}

      <div className="card overflow-hidden">
        {loading ? (
          <div className="py-16 text-center text-slate-500">Loading users…</div>
        ) : users.length === 0 ? (
          <div className="py-16 text-center text-slate-500">No users yet</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr className="text-left text-slate-600">
                  <th className="px-4 py-3 font-semibold">Name</th>
                  <th className="px-4 py-3 font-semibold">Email</th>
                  <th className="px-4 py-3 font-semibold">Role</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 font-semibold">Last login</th>
                  <th className="px-4 py-3 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => {
                  const isOwner = u.role === 'owner';
                  const isSelf = String(u.id) === String(currentUser?.id);
                  return (
                    <tr key={u.id} className="border-b border-slate-100 last:border-0">
                      <td className="px-4 py-3 font-medium text-slate-900">
                        {[u.firstName, u.lastName].filter(Boolean).join(' ') || '—'}
                      </td>
                      <td className="px-4 py-3 text-slate-600">{u.email}</td>
                      <td className="px-4 py-3">
                        {isOwner || isSelf ? (
                          <span className="font-medium text-slate-800">{getRoleLabel(u.role)}</span>
                        ) : (
                          <select
                            className="select-field !py-1.5 !text-sm"
                            value={u.role === 'staff' ? 'cashier' : u.role}
                            onChange={(e) => handleRoleChange(u.id, e.target.value)}
                          >
                            <option value="cashier">Cashier</option>
                            {canInviteManager && <option value="manager">Manager</option>}
                            {!canInviteManager && u.role === 'manager' && (
                              <option value="manager">Manager</option>
                            )}
                          </select>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold capitalize ${
                            statusStyles[u.status] || 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {u.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-500">
                        {u.lastLoginAt
                          ? new Date(u.lastLoginAt).toLocaleString()
                          : '—'}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-1">
                          {!isOwner && (u.status === 'invited' || !u.isActivated) && (
                            <button
                              type="button"
                              title="Resend invite email"
                              onClick={() => handleResend(u.id)}
                              className="p-2 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600"
                            >
                              <HiOutlineRefresh className="w-4 h-4" />
                            </button>
                          )}
                          {!isOwner && !isSelf && u.isActivated && (
                            <button
                              type="button"
                              onClick={() => handleStatusToggle(u)}
                              className="px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs font-medium hover:bg-slate-50"
                            >
                              {u.status === 'suspended' ? 'Activate' : 'Suspend'}
                            </button>
                          )}
                          {!isOwner && !isSelf && (
                            <button
                              type="button"
                              title="Remove user"
                              onClick={() => handleRemove(u)}
                              className="p-2 rounded-lg border border-red-200 hover:bg-red-50 text-red-600"
                            >
                              <HiOutlineTrash className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserManagement;
