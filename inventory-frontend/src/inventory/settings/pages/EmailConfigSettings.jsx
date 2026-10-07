/** @module inventory/settings/pages/EmailConfigSettings */

import { useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';
import { HiOutlineEye, HiOutlineEyeOff } from 'react-icons/hi';
import settingsService from '../../../shared/services/settingsService';


const PROVIDER_PRESETS = {
  gmail: {
    label: 'Gmail / Google Workspace',
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    domains: ['gmail.com'],
    guideTitle: 'How to set up Gmail / Google Workspace email sending?',
    guideDescription:
      'Follow these steps to connect your Gmail or Google Workspace account and send emails from your inventory system.',
    steps: [
      {
        title: 'Open your Google Account',
        description:
          'Sign in to the Gmail or Google Workspace account that you want to use for sending emails from your inventory system.',
        example: 'Example: yourcompany@gmail.com',
      },
      {
        title: 'Go to Security settings',
        description:
          'Open your Google Account settings and select the Security section from the left-side menu.',
      },
      {
        title: 'Turn on 2-Step Verification',
        description:
          'In the Security section, find 2-Step Verification and turn it on for your Google account.',
        important:
          'Google App Passwords are available when 2-Step Verification is enabled on your account.',
      },
      {
        title: 'Open App Passwords',
        description:
          'After enabling 2-Step Verification, return to your Google Account Security settings and open App Passwords.',
      },
      {
        title: 'Generate an App Password',
        description:
          'Create a new App Password for your inventory system.',
        bullets: [
          'Enter a name such as Inventory Insights.',
          'Click Create or Generate.',
          'Google will display a 16-character App Password.',
        ],
      },
      {
        title: 'Copy your App Password',
        description:
          'Copy the generated App Password and paste it into the Password field below.',
        warning:
          'Use the Google App Password here, not your normal Gmail account password.',
      },
      {
        title: 'Enter the SMTP settings',
        description:
          'Use the automatically filled SMTP settings below. You can edit them if required.',
      },
      {
        title: 'Save and test your configuration',
        description:
          'Click Save Email Config first. Then enter a recipient email address and click Send Test to verify your email configuration.',
      },
    ],
  },

  yahoo: {
    label: 'Yahoo Mail',
    host: 'smtp.mail.yahoo.com',
    port: 587,
    secure: false,
    domains: ['yahoo.com', 'yahoo.co.uk', 'yahoo.ca', 'yahoo.com.au'],
    guideTitle: 'How to set up Yahoo Mail email sending?',
    guideDescription:
      'Follow these steps to connect your Yahoo Mail account and send emails from your inventory system.',
    steps: [
      {
        title: 'Open your Yahoo Mail account',
        description:
          'Sign in to the Yahoo Mail account that you want to use for sending emails.',
        example: 'Example: yourcompany@yahoo.com',
      },
      {
        title: 'Open Account Security settings',
        description:
          'Go to your Yahoo Account Security settings and look for the option to manage app passwords.',
      },
      {
        title: 'Generate an App Password',
        description:
          'Create a new app password for your inventory system. Yahoo may ask you to select or enter an app name.',
      },
      {
        title: 'Copy your App Password',
        description:
          'Copy the generated password and paste it into the Password field below.',
        warning:
          'Use the Yahoo generated App Password instead of your normal Yahoo account password.',
      },
      {
        title: 'Enter the SMTP settings',
        description:
          'Use the automatically filled SMTP settings below.',
      },
      {
        title: 'Save and test your configuration',
        description:
          'Click Save Email Config first. Then enter a recipient email address and click Send Test.',
      },
    ],
  },

  outlook: {
    label: 'Outlook / Hotmail / Microsoft 365',
    host: 'smtp-mail.outlook.com',
    port: 587,
    secure: false,
    domains: ['outlook.com', 'hotmail.com', 'live.com', 'msn.com'],
    guideTitle: 'How to set up Outlook / Hotmail / Microsoft 365 email sending?',
    guideDescription:
      'Follow these steps to connect your Microsoft email account and send emails from your inventory system.',
    steps: [
      {
        title: 'Open your Microsoft account',
        description:
          'Sign in to the Outlook, Hotmail, or Microsoft 365 account that you want to use for sending emails.',
        example: 'Example: yourcompany@outlook.com',
      },
      {
        title: 'Check your account security',
        description:
          'Open your Microsoft account security settings and make sure your account has the required security verification enabled.',
      },
      {
        title: 'Create an App Password if required',
        description:
          'If your organization or Microsoft account requires an App Password for SMTP authentication, create one from your account security settings.',
      },
      {
        title: 'Copy your password',
        description:
          'Copy the required password or App Password and paste it into the Password field below.',
      },
      {
        title: 'Enter the SMTP settings',
        description:
          'Use the automatically filled Outlook / Microsoft SMTP settings below.',
      },
      {
        title: 'Save and test your configuration',
        description:
          'Click Save Email Config first. Then enter a recipient email address and click Send Test.',
      },
    ],
  },

  icloud: {
    label: 'iCloud Mail',
    host: 'smtp.mail.me.com',
    port: 587,
    secure: false,
    domains: ['icloud.com', 'me.com', 'mac.com'],
    guideTitle: 'How to set up iCloud Mail email sending?',
    guideDescription:
      'Follow these steps to connect your iCloud Mail account and send emails from your inventory system.',
    steps: [
      {
        title: 'Open your Apple Account',
        description:
          'Sign in to the Apple Account connected to the iCloud Mail address you want to use.',
        example: 'Example: yourcompany@icloud.com',
      },
      {
        title: 'Enable two-factor authentication',
        description:
          'Make sure two-factor authentication is enabled for your Apple Account.',
      },
      {
        title: 'Generate an App-Specific Password',
        description:
          'Create an app-specific password for your inventory system from your Apple Account security settings.',
      },
      {
        title: 'Copy the App-Specific Password',
        description:
          'Copy the generated password and paste it into the Password field below.',
      },
      {
        title: 'Enter the SMTP settings',
        description:
          'Use the automatically filled iCloud SMTP settings below.',
      },
      {
        title: 'Save and test your configuration',
        description:
          'Click Save Email Config first. Then enter a recipient email address and click Send Test.',
      },
    ],
  },

  zoho: {
    label: 'Zoho Mail',
    host: 'smtp.zoho.com',
    port: 587,
    secure: false,
    domains: ['zoho.com'],
    guideTitle: 'How to set up Zoho Mail email sending?',
    guideDescription:
      'Follow these steps to connect your Zoho Mail account and send emails from your inventory system.',
    steps: [
      {
        title: 'Open your Zoho Mail account',
        description:
          'Sign in to the Zoho Mail account that you want to use for sending emails.',
        example: 'Example: yourcompany@yourdomain.com',
      },
      {
        title: 'Open Security settings',
        description:
          'Open your Zoho Account security settings and review your authentication options.',
      },
      {
        title: 'Enable required authentication',
        description:
          'If your Zoho account uses multi-factor authentication, create an App Password for SMTP access if required.',
      },
      {
        title: 'Copy your password',
        description:
          'Copy the required password or App Password and paste it into the Password field below.',
      },
      {
        title: 'Enter the SMTP settings',
        description:
          'Use the automatically filled Zoho SMTP settings below.',
      },
      {
        title: 'Save and test your configuration',
        description:
          'Click Save Email Config first. Then enter a recipient email address and click Send Test.',
      },
    ],
  },

  aol: {
    label: 'AOL Mail',
    host: 'smtp.aol.com',
    port: 587,
    secure: false,
    domains: ['aol.com'],
    guideTitle: 'How to set up AOL Mail email sending?',
    guideDescription:
      'Follow these steps to connect your AOL Mail account and send emails from your inventory system.',
    steps: [
      {
        title: 'Open your AOL Mail account',
        description:
          'Sign in to the AOL Mail account that you want to use for sending emails.',
        example: 'Example: yourcompany@aol.com',
      },
      {
        title: 'Open Account Security',
        description:
          'Go to your AOL account security settings and open the option for managing app passwords.',
      },
      {
        title: 'Generate an App Password',
        description:
          'Create an App Password for your inventory system.',
      },
      {
        title: 'Copy your App Password',
        description:
          'Copy the generated App Password and paste it into the Password field below.',
      },
      {
        title: 'Enter the SMTP settings',
        description:
          'Use the automatically filled AOL SMTP settings below.',
      },
      {
        title: 'Save and test your configuration',
        description:
          'Click Save Email Config first. Then enter a recipient email address and click Send Test.',
      },
    ],
  },

  mailcom: {
    label: 'Mail.com',
    host: 'smtp.mail.com',
    port: 587,
    secure: false,
    domains: ['mail.com'],
    guideTitle: 'How to set up Mail.com email sending?',
    guideDescription:
      'Follow these steps to connect your Mail.com account and send emails from your inventory system.',
    steps: [
      {
        title: 'Open your Mail.com account',
        description:
          'Sign in to the Mail.com account that you want to use for sending emails.',
      },
      {
        title: 'Check SMTP access',
        description:
          'Make sure SMTP access is available and enabled for your account.',
      },
      {
        title: 'Enter your account password',
        description:
          'Enter the password required for SMTP authentication in the Password field below.',
      },
      {
        title: 'Enter the SMTP settings',
        description:
          'Use the automatically filled Mail.com SMTP settings below.',
      },
      {
        title: 'Save and test your configuration',
        description:
          'Click Save Email Config first. Then enter a recipient email address and click Send Test.',
      },
    ],
  },

  gmx: {
    label: 'GMX Mail',
    host: 'mail.gmx.com',
    port: 587,
    secure: false,
    domains: ['gmx.com', 'gmx.net'],
    guideTitle: 'How to set up GMX Mail email sending?',
    guideDescription:
      'Follow these steps to connect your GMX Mail account and send emails from your inventory system.',
    steps: [
      {
        title: 'Open your GMX Mail account',
        description:
          'Sign in to the GMX Mail account that you want to use for sending emails.',
      },
      {
        title: 'Check SMTP access',
        description:
          'Make sure SMTP access is available for your GMX account.',
      },
      {
        title: 'Enter your SMTP password',
        description:
          'Enter your GMX account password or required app-specific password in the Password field below.',
      },
      {
        title: 'Enter the SMTP settings',
        description:
          'Use the automatically filled GMX SMTP settings below.',
      },
      {
        title: 'Save and test your configuration',
        description:
          'Click Save Email Config first. Then enter a recipient email address and click Send Test.',
      },
    ],
  },

  yandex: {
    label: 'Yandex Mail',
    host: 'smtp.yandex.com',
    port: 587,
    secure: false,
    domains: ['yandex.com', 'yandex.ru'],
    guideTitle: 'How to set up Yandex Mail email sending?',
    guideDescription:
      'Follow these steps to connect your Yandex Mail account and send emails from your inventory system.',
    steps: [
      {
        title: 'Open your Yandex Mail account',
        description:
          'Sign in to the Yandex Mail account that you want to use for sending emails.',
      },
      {
        title: 'Open account security settings',
        description:
          'Go to your Yandex account security settings and check the available authentication options.',
      },
      {
        title: 'Generate an App Password if required',
        description:
          'If Yandex requires an application password for SMTP access, generate one for your inventory system.',
      },
      {
        title: 'Copy your password',
        description:
          'Copy the required password and paste it into the Password field below.',
      },
      {
        title: 'Enter the SMTP settings',
        description:
          'Use the automatically filled Yandex SMTP settings below.',
      },
      {
        title: 'Save and test your configuration',
        description:
          'Click Save Email Config first. Then enter a recipient email address and click Send Test.',
      },
    ],
  },

  custom: {
    label: 'Custom SMTP',
    host: '',
    port: 587,
    domains: [],
    secure: false,
    guideTitle: 'How to set up a Custom SMTP server?',
    guideDescription:
      'Use this option if your email provider is not listed above or your organization provides its own SMTP server.',
    steps: [
      {
        title: 'Get your SMTP server details',
        description:
          'Ask your email provider or system administrator for the SMTP host, port, SSL/TLS setting, username, and password.',
      },
      {
        title: 'Enter the SMTP host',
        description:
          'Enter the SMTP server hostname provided by your email provider.',
        example: 'Example: smtp.yourcompany.com',
      },
      {
        title: 'Enter the SMTP port',
        description:
          'Enter the SMTP port provided by your email provider. Common ports include 587 and 465.',
      },
      {
        title: 'Configure SSL / TLS',
        description:
          'Enable or disable SSL / TLS according to your email provider requirements.',
      },
      {
        title: 'Enter your SMTP credentials',
        description:
          'Enter your SMTP username and password in the fields below.',
      },
      {
        title: 'Save and test your configuration',
        description:
          'Click Save Email Config first. Then enter a recipient email address and click Send Test.',
      },
    ],
  },
};
const empty = {
  enabled: false,
  provider: 'gmail',
  host: PROVIDER_PRESETS.gmail.host,
  port: PROVIDER_PRESETS.gmail.port,
  secure: PROVIDER_PRESETS.gmail.secure,
  user: '',
  pass: '',
  fromName: '',
  fromEmail: '',
};
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const SMTP_HOST_REGEX =
  /^(smtp\.)?[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

  const validateEmailConfig = (form, passChanged) => {
  const errors = {};

  if (!form.enabled) {
    return errors;
  }

  if (!form.host.trim()) {
    errors.host = 'SMTP host is required';
  } else if (!SMTP_HOST_REGEX.test(form.host.trim())) {
    errors.host = 'Enter a valid SMTP host, e.g. smtp.gmail.com';
  }

  const port = Number(form.port);

  if (!form.port) {
    errors.port = 'SMTP port is required';
  } else if (!Number.isInteger(port) || port < 1 || port > 65535) {
    errors.port = 'Port must be between 1 and 65535';
  }

  if (!form.user.trim()) {
    errors.user = 'SMTP username is required';
  } else if (!EMAIL_REGEX.test(form.user.trim())) {
    errors.user = 'Enter a valid email address';
  } else {
    const selectedProvider = PROVIDER_PRESETS[form.provider];
  
    if (
      selectedProvider?.domains?.length > 0
    ) {
      const userDomain = form.user
        .trim()
        .toLowerCase()
        .split('@')[1];
  
      const isValidProviderEmail =
        selectedProvider.domains.includes(userDomain);
  
      if (!isValidProviderEmail) {
        errors.user = `Please enter a ${selectedProvider.label} email address`;
      }
    }
  }


  if (passChanged && !form.pass.trim()) {
    errors.pass = 'Please enter your SMTP password';
  }

  if (!form.fromEmail.trim()) {
    errors.fromEmail = 'From email is required';
  } else if (!EMAIL_REGEX.test(form.fromEmail.trim())) {
    errors.fromEmail = 'Enter a valid sender email address';
  }

  if (
    form.secure &&
    Number(form.port) !== 465
  ) {
    errors.secure = 'SSL is normally used with port 465';
  }

  if (
    !form.secure &&
    Number(form.port) === 465
  ) {
    errors.secure = 'Port 465 normally requires SSL to be enabled';
  }

  return errors;
};
const EmailConfigSettings = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [passChanged, setPassChanged] = useState(false);
  const [testEmail, setTestEmail] = useState('');
  const [form, setForm] = useState(empty);
  const [errors, setErrors] = useState({});
  const [showGuide, setShowGuide] = useState(false);
  const selectedProvider =
  PROVIDER_PRESETS[form.provider] || PROVIDER_PRESETS.custom;
  useEffect(() => {
    settingsService
      .getEmailConfig()
      .then((res) => {
        const d = res.data.data || {};
  
        const provider = d.provider || 'gmail';
        const preset = PROVIDER_PRESETS[provider];
  
        setForm({
          enabled: d.enabled ?? false,
          provider,
          host: d.host || preset.host,
          port: d.port || preset.port,
          secure: d.secure ?? preset.secure,
          user: d.user || '',
          pass: d.pass || '',
          fromName: d.fromName || '',
          fromEmail: d.fromEmail || '',
        });
  
        setPassChanged(false);
      })
      .catch(() => {
        // API fail ho jaye tab bhi Gmail hi selected rahe
        setForm(empty);
        toast.error('Failed to load email config');
      })
      .finally(() => setLoading(false));
  }, []);

  const set = (field, value) => {
    setForm((f) => ({
      ...f,
      [field]: value,
    }));
  
    setErrors((prev) => ({
      ...prev,
      [field]: '',
    }));
  };

  const handlePassChange = (e) => {
    setPassChanged(true);
    set('pass', e.target.value);
  };
  const handleProviderChange = (e) => {
    const provider = e.target.value;
  
    const preset = PROVIDER_PRESETS[provider];
  
    setForm((prev) => ({
      ...prev,
      provider,
      host: preset?.host ?? '',
      port: preset?.port ?? 587,
      secure: preset?.secure ?? false,
    }));
  
    setErrors((prev) => ({
      ...prev,
      host: '',
      port: '',
      secure: '',
    }));
  };
  const handleSave = async (e) => {
    e.preventDefault();
  
    const validationErrors = validateEmailConfig(form, passChanged);
    setErrors(validationErrors);
  
    if (Object.keys(validationErrors).length > 0) {
      toast.error('Please fix the highlighted fields');
      return;
    }
  
    setSaving(true);
  
    try {
      const payload = {
        enabled: form.enabled,
        provider: form.provider,
        host: form.host.trim(),
        port: Number(form.port),
        secure: form.secure,
        user: form.user.trim(),
        fromName: form.fromName.trim(),
        fromEmail: form.fromEmail.trim(),
      };
      
      // Only send password if user changed it
      if (passChanged) {
        payload.pass = form.pass;
      }
  
      await settingsService.saveEmailConfig(payload);
  
      setPassChanged(false);
  
      toast.success('Email configuration saved successfully');
    } catch (err) {
      toast.error(
        err.response?.data?.message ||
        'Failed to save email configuration'
      );
    } finally {
      setSaving(false);
    }
  };

  const handleTest = async () => {
    if (!testEmail) return toast.error('Enter a recipient email to test');
    setTesting(true);
    try {
      await settingsService.testEmailConfig({ to: testEmail });
      toast.success(`Test email sent to ${testEmail}`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Test failed — check your SMTP settings');
    } finally {
      setTesting(false);
    }
  };

  if (loading) return <div className="py-12 text-center text-slate-500">Loading…</div>;

  return (
    <form onSubmit={handleSave} className="space-y-6">
      {/* Header card */}
      <div className="card-padded">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Email Configuration</h2>
            <p className="text-sm text-slate-500 mt-0.5">
              When enabled, outgoing emails (user invites, activations) are sent from your own
              SMTP server instead of the platform default.
            </p>
          </div>
          <label className="flex items-center gap-2 cursor-pointer shrink-0">
            <span className="text-sm font-medium text-slate-700">
              {form.enabled ? 'Enabled' : 'Disabled'}
            </span>
            <div className="relative">
              <input
                type="checkbox"
                className="sr-only"
                checked={form.enabled}
                onChange={(e) => set('enabled', e.target.checked)}
              />
              <div
                onClick={() => set('enabled', !form.enabled)}
                className={`w-10 h-6 rounded-full cursor-pointer transition-colors ${
                  form.enabled ? 'bg-indigo-600' : 'bg-slate-300'
                }`}
              >
                <div
                  className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${
                    form.enabled ? 'translate-x-5' : 'translate-x-1'
                  }`}
                />
              </div>
            </div>
          </label>

        </div>
      </div>
      <div className="card-padded">
  <label className="block text-sm font-semibold mb-2">
    Email Provider
  </label>

  <select
    className="input-field"
    value={form.provider}
    onChange={handleProviderChange}
  >
    <option value="gmail">
      Gmail / Google Workspace
    </option>

    <option value="yahoo">
      Yahoo Mail
    </option>

    <option value="outlook">
      Outlook / Hotmail / Microsoft 365
    </option>

    <option value="icloud">
      iCloud Mail
    </option>

    <option value="zoho">
      Zoho Mail
    </option>

    <option value="aol">
      AOL Mail
    </option>

    <option value="mailcom">
      Mail.com
    </option>

    <option value="gmx">
      GMX Mail
    </option>

    <option value="yandex">
      Yandex Mail
    </option>

    <option value="custom">
      Custom SMTP
    </option>
  </select>

  <p className="text-xs text-slate-400 mt-2">
    Select your email provider. SMTP settings will be filled automatically.
    You can edit them if needed.
  </p>
</div>
<div className="mt-4 rounded-xl border border-indigo-100 bg-indigo-50/70 overflow-hidden">
  {/* Guide Header */}
  <button
    type="button"
    onClick={() => setShowGuide((v) => !v)}
    className="w-full flex items-center justify-between gap-4 p-4 text-left hover:bg-indigo-50 transition"
  >
    <div>
      <h3 className="font-semibold text-indigo-900">
        {selectedProvider.guideTitle}
      </h3>

      <p className="text-sm text-indigo-700 mt-1">
        {selectedProvider.guideDescription}
      </p>
    </div>

    <span className="text-indigo-600 text-sm font-medium shrink-0">
      {showGuide ? 'Hide Guide' : 'Show Guide'}
    </span>
  </button>

  {showGuide && (
    <div className="border-t border-indigo-100 p-4 space-y-5">
      {selectedProvider.steps.map((step, index) => (
        <div key={step.title} className="flex gap-3">
          <div className="w-7 h-7 rounded-full bg-indigo-600 text-white flex items-center justify-center text-sm font-semibold shrink-0">
            {index + 1}
          </div>

          <div className="w-full">
            <h4 className="font-semibold text-slate-800">
              {step.title}
            </h4>

            <p className="text-sm text-slate-600 mt-1">
              {step.description}
            </p>

            {step.example && (
              <p className="text-xs text-slate-500 mt-2">
                {step.example}
              </p>
            )}

            {step.bullets && (
              <ul className="mt-3 ml-4 list-disc space-y-1 text-sm text-slate-600">
                {step.bullets.map((bullet) => (
                  <li key={bullet}>{bullet}</li>
                ))}
              </ul>
            )}

            {step.important && (
              <div className="mt-2 rounded-lg bg-white border border-indigo-100 p-3">
                <p className="text-xs text-slate-600">
                  <strong>Important:</strong> {step.important}
                </p>
              </div>
            )}

            {step.warning && (
              <div className="mt-2 rounded-lg bg-amber-50 border border-amber-200 p-3">
                <p className="text-xs text-amber-800">
                  <strong>Important:</strong> {step.warning}
                </p>
              </div>
            )}

            {step.title === 'Enter the SMTP settings' && (
              <div className="mt-3 rounded-lg bg-white border border-indigo-100 overflow-hidden">
                <div className="grid grid-cols-2 text-sm">
                  <div className="px-3 py-2 border-b border-slate-100 text-slate-500">
                    SMTP Host
                  </div>

                  <div className="px-3 py-2 border-b border-slate-100 font-medium text-slate-800">
                    {form.host || 'Not configured'}
                  </div>

                  <div className="px-3 py-2 border-b border-slate-100 text-slate-500">
                    Port
                  </div>

                  <div className="px-3 py-2 border-b border-slate-100 font-medium text-slate-800">
                    {form.port}
                  </div>

                  <div className="px-3 py-2 border-b border-slate-100 text-slate-500">
                    SSL / TLS
                  </div>

                  <div className="px-3 py-2 border-b border-slate-100 font-medium text-slate-800">
                    {form.secure ? 'Enabled' : 'Disabled'}
                  </div>

                  <div className="px-3 py-2 border-b border-slate-100 text-slate-500">
                    Username
                  </div>

                  <div className="px-3 py-2 border-b border-slate-100 font-medium text-slate-800">
                    {form.user || 'Your email address'}
                  </div>

                  <div className="px-3 py-2 text-slate-500">
                    Password
                  </div>

                  <div className="px-3 py-2 font-medium text-slate-800">
                    SMTP / App Password
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  )}
</div>
      {/* SMTP settings */}
      <div className="card-padded grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="md:col-span-2">
          <h3 className="text-base font-semibold text-slate-800">SMTP Server</h3>
        </div>

        <div>
          <label className="block text-sm font-semibold mb-2">SMTP Host</label>
          <input
            className="input-field"
            placeholder="e.g. smtp.gmail.com"
            value={form.host}
            onChange={(e) => set('host', e.target.value)}
          />
          {errors.host && (
  <p className="text-xs text-red-500 mt-1">
    {errors.host}
  </p>
)}
        </div>

        <div>
          <label className="block text-sm font-semibold mb-2">Port</label>
          <input
            type="number"
            className="input-field"
            placeholder="587"
            value={form.port}
            onChange={(e) => set('port', e.target.value)}
          />
          {errors.port && (
  <p className="text-xs text-red-500 mt-1">
    {errors.port}
  </p>
)}
        </div>

        <div>
          <label className="block text-sm font-semibold mb-2">Username (SMTP auth)</label>
          <input
            className="input-field"
            placeholder="your@email.com"
            value={form.user}
            onChange={(e) => set('user', e.target.value)}
          />
          {errors.user && (
  <p className="text-xs text-red-500 mt-1">
    {errors.user}
  </p>
)}
        </div>

        <div>
  <label className="block text-sm font-semibold mb-2">
    Password
  </label>

  <div className="relative">
    <input
      type={showPass ? 'text' : 'password'}
      className="input-field pr-10"
      placeholder="Enter SMTP / App Password"
      value={form.pass}
      onChange={handlePassChange}
    />

    <button
      type="button"
      onClick={() => setShowPass((v) => !v)}
      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
      aria-label={showPass ? 'Hide password' : 'Show password'}
    >
      {showPass ? (
        <HiOutlineEyeOff className="w-4 h-4" />
      ) : (
        <HiOutlineEye className="w-4 h-4" />
      )}
    </button>
  </div>

  {errors.pass ? (
    <p className="text-xs text-red-500 mt-1">
      {errors.pass}
    </p>
  ) : (
    <p className="text-xs text-slate-400 mt-1">
      Your saved password is shown here. Select and replace it if you want
      to change your SMTP password.
    </p>
  )}
</div>
        <div>
  <label className="flex items-center gap-2 cursor-pointer">
    <input
      type="checkbox"
      className="w-4 h-4 rounded text-indigo-600"
      checked={form.secure}
      onChange={(e) => set('secure', e.target.checked)}
    />

    <span className="text-sm font-medium text-slate-700">
      Use SSL / TLS
    </span>
  </label>

  <p className="text-xs text-slate-400 mt-1">
    Port 465 usually uses SSL. Port 587 usually uses STARTTLS.
  </p>

  {errors.secure && (
    <p className="text-xs text-red-500 mt-1">
      {errors.secure}
    </p>
  )}
</div>
      </div>

      {/* From address */}
      <div className="card-padded grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="md:col-span-2">
          <h3 className="text-base font-semibold text-slate-800">Sender Identity</h3>
          <p className="text-sm text-slate-500">How your emails appear in the recipient's inbox</p>
        </div>

        <div>
          <label className="block text-sm font-semibold mb-2">From name</label>
          <input
            className="input-field"
            placeholder="e.g. Acme Inventory"
            value={form.fromName}
            onChange={(e) => set('fromName', e.target.value)}
          />
        </div>

        <div>
          <label className="block text-sm font-semibold mb-2">From email</label>
          <input
  type="email"
  className={`input-field ${
    errors.fromEmail ? 'border-red-500 focus:ring-red-500' : ''
  }`}
  placeholder="noreply@yourcompany.com"
  value={form.fromEmail}
  onChange={(e) => set('fromEmail', e.target.value)}
/>

{errors.fromEmail && (
  <p className="text-xs text-red-500 mt-1">
    {errors.fromEmail}
  </p>
)}
        </div>
      </div>

      {/* Test + Save */}
      <div className="card-padded">
        <h3 className="text-base font-semibold text-slate-800 mb-3">Send a test email</h3>
        <div className="flex gap-3 items-center">
          <input
            type="email"
            className="input-field max-w-xs"
            placeholder="recipient@example.com"
            value={testEmail}
            onChange={(e) => setTestEmail(e.target.value)}
          />
          <button
            type="button"
            onClick={handleTest}
            disabled={testing}
            className="btn-secondary disabled:opacity-50"
          >
            {testing ? 'Sending…' : 'Send Test'}
          </button>
        </div>
        <p className="text-xs text-slate-400 mt-2">
          Uses the saved configuration — save first if you made changes.
        </p>
      </div>

      <div className="flex justify-end">
        <button type="submit" disabled={saving} className="btn-primary disabled:opacity-50">
          {saving ? 'Saving…' : 'Save Email Config'}
        </button>
      </div>
    </form>
  );
};

export default EmailConfigSettings;
