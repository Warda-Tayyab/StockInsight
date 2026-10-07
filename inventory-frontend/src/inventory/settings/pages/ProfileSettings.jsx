
/** @module inventory/settings/pages/ProfileSettings */

import { useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';
import { Eye, EyeOff } from 'lucide-react';
import settingsService from '../../../shared/services/settingsService';
import { useAuthContext } from '../../../shared/context/AuthContext';
import { getRoleLabel } from '../../../shared/utils/roles';

const ProfileSettings = () => {
  const { user, setUser } = useAuthContext();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [pwdSaving, setPwdSaving] = useState(false);

  const [showPassword, setShowPassword] = useState({
    current: false,
    new: false,
    confirm: false,
  });

  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    role: '',
  });

  const [pwd, setPwd] = useState({
    currentPassword: '',
    newPassword: '',
    confirm: '',
  });

  useEffect(() => {
    settingsService.getProfile()
      .then((res) => {
        const d = res.data.data;
        setForm({
          firstName: d.firstName || '',
          lastName: d.lastName || '',
          email: d.email || '',
          role: d.role || '',
        });
      })
      .catch(() => toast.error('Failed to load profile'))
      .finally(() => setLoading(false));
  }, []);

  const saveProfile = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      const res = await settingsService.updateProfile({
        firstName: form.firstName,
        lastName: form.lastName,
      });

      const d = res.data.data;

      const nextUser = {
        ...user,
        firstName: d.firstName,
        lastName: d.lastName,
      };

      setUser(nextUser);
      localStorage.setItem('user', JSON.stringify(nextUser));

      toast.success('Profile updated');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Update failed');
    } finally {
      setSaving(false);
    }
  };

  const savePassword = async (e) => {
    e.preventDefault();

    if (pwd.newPassword !== pwd.confirm) {
      toast.error('Passwords do not match');
      return;
    }

    setPwdSaving(true);

    try {
      await settingsService.changePassword({
        currentPassword: pwd.currentPassword,
        newPassword: pwd.newPassword,
      });

      setPwd({
        currentPassword: '',
        newPassword: '',
        confirm: '',
      });

      toast.success('Password changed');
    } catch (err) {
      toast.error(
        err.response?.data?.message || 'Password change failed'
      );
    } finally {
      setPwdSaving(false);
    }
  };

  const togglePassword = (field) => {
    setShowPassword((prev) => ({
      ...prev,
      [field]: !prev[field],
    }));
  };

  if (loading) {
    return (
      <div className="py-12 text-center text-slate-500">
        Loading…
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">

      {/* Profile */}
      <form
        onSubmit={saveProfile}
        className="card-padded grid grid-cols-1 md:grid-cols-2 gap-4"
      >
        <div className="md:col-span-2">
          <h2 className="text-lg font-semibold text-slate-900">
            Profile / Account
          </h2>
          <p className="text-sm text-slate-500">
            Your name and account details
          </p>
        </div>

        <div>
          <label className="block text-sm font-semibold mb-2">
            First name
          </label>
          <input
            className="input-field"
            required
            value={form.firstName}
            onChange={(e) =>
              setForm((f) => ({
                ...f,
                firstName: e.target.value,
              }))
            }
          />
        </div>

        <div>
          <label className="block text-sm font-semibold mb-2">
            Last name
          </label>
          <input
            className="input-field"
            value={form.lastName}
            onChange={(e) =>
              setForm((f) => ({
                ...f,
                lastName: e.target.value,
              }))
            }
          />
        </div>

        <div>
          <label className="block text-sm font-semibold mb-2">
            Email
          </label>
          <input
            className="input-field bg-slate-50"
            value={form.email}
            disabled
          />
        </div>

        <div>
          <label className="block text-sm font-semibold mb-2">
            Role
          </label>
          <input
            className="input-field bg-slate-50"
            value={getRoleLabel(form.role)}
            disabled
          />
        </div>

        <div className="md:col-span-2 flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="btn-primary disabled:opacity-50"
          >
            {saving ? 'Saving…' : 'Save Profile'}
          </button>
        </div>
      </form>

      {/* Change Password */}
      <form
        onSubmit={savePassword}
        className="card-padded grid grid-cols-1 md:grid-cols-2 gap-4"
      >
        <div className="md:col-span-2">
          <h2 className="text-lg font-semibold text-slate-900">
            Change Password
          </h2>
        </div>

        {/* Current Password */}
        <div className="md:col-span-2">
          <label className="block text-sm font-semibold mb-2">
            Current password
          </label>

          <div className="relative">
            <input
              type={showPassword.current ? 'text' : 'password'}
              className="input-field pr-10"
              required
              value={pwd.currentPassword}
              onChange={(e) =>
                setPwd((p) => ({
                  ...p,
                  currentPassword: e.target.value,
                }))
              }
            />

            <button
              type="button"
              onClick={() => togglePassword('current')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700"
              aria-label={
                showPassword.current
                  ? 'Hide current password'
                  : 'Show current password'
              }
            >
              {showPassword.current ? (
                <EyeOff size={18} />
              ) : (
                <Eye size={18} />
              )}
            </button>
          </div>
        </div>

        {/* New Password */}
        <div>
          <label className="block text-sm font-semibold mb-2">
            New password
          </label>

          <div className="relative">
            <input
              type={showPassword.new ? 'text' : 'password'}
              className="input-field pr-10"
              required
              value={pwd.newPassword}
              onChange={(e) =>
                setPwd((p) => ({
                  ...p,
                  newPassword: e.target.value,
                }))
              }
            />

            <button
              type="button"
              onClick={() => togglePassword('new')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700"
              aria-label={
                showPassword.new
                  ? 'Hide new password'
                  : 'Show new password'
              }
            >
              {showPassword.new ? (
                <EyeOff size={18} />
              ) : (
                <Eye size={18} />
              )}
            </button>
          </div>
        </div>

        {/* Confirm Password */}
        <div>
          <label className="block text-sm font-semibold mb-2">
            Confirm new password
          </label>

          <div className="relative">
            <input
              type={showPassword.confirm ? 'text' : 'password'}
              className="input-field pr-10"
              required
              value={pwd.confirm}
              onChange={(e) =>
                setPwd((p) => ({
                  ...p,
                  confirm: e.target.value,
                }))
              }
            />

            <button
              type="button"
              onClick={() => togglePassword('confirm')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700"
              aria-label={
                showPassword.confirm
                  ? 'Hide confirm password'
                  : 'Show confirm password'
              }
            >
              {showPassword.confirm ? (
                <EyeOff size={18} />
              ) : (
                <Eye size={18} />
              )}
            </button>
          </div>
        </div>

        <div className="md:col-span-2 flex justify-end">
          <button
            type="submit"
            disabled={pwdSaving}
            className="btn-primary disabled:opacity-50"
          >
            {pwdSaving ? 'Updating…' : 'Update Password'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ProfileSettings;
