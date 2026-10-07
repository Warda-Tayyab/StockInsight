
const nodemailer = require('nodemailer');

/** Build a nodemailer transporter.
 *  If an EmailConfig doc is passed and enabled, use its credentials.
 *  Otherwise fall back to the global .env SMTP settings.
 */
const buildTransporter = (emailConfig) => {
  if (emailConfig?.enabled && emailConfig.host && emailConfig.user) {
    return nodemailer.createTransport({
      host: emailConfig.host,
      port: Number(emailConfig.port) || 587,
      secure: emailConfig.secure === true,
      auth: {
        user: emailConfig.user,
        pass: emailConfig.pass || '',
      },
    });
  }
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT),
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
};

/** Resolve the "from" address string.
 *  Prefer tenant config if enabled, else fall back to env vars.
 */
const buildFrom = (emailConfig, fallbackName) => {
  if (emailConfig?.enabled && emailConfig.fromEmail) {
    const name = emailConfig.fromName || fallbackName || emailConfig.fromEmail;
    return `"${name}" <${emailConfig.fromEmail}>`;
  }
  return process.env.SMTP_FROM || process.env.SMTP_USER;
};

// Default transporter (env-based) kept for backward-compat with functions
// that don't yet accept a per-tenant config.
const transporter = buildTransporter(null);

// Send login email with temporary password
const sendLoginEmail = async (user, tenant, tempPassword) => {

  const displayTenantName = tenant.name;
   const tenantSlug = tenant.slug;
   const loginLink = `${process.env.INVENTORY_FRONTEND}/auth/login?slug=${tenant.slug}`;

  const subject = `Welcome to ${displayTenantName} - Your Account Credentials`;

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      
      <h2 style="color: #333;">
        Welcome to ${displayTenantName}, ${user.firstName}!
      </h2>

      <p>Your account has been successfully created. Below are your temporary login details:</p>
      
      <div style="background-color: #f8f9fa; padding: 20px; border-radius: 5px; margin: 20px 0;">
        <h3 style="margin: 0 0 15px 0; color: #333;">Account Details</h3>
        <p><strong>Email:</strong> ${user.email}</p>
        <p><strong>Password:</strong> ${tempPassword}</p>
                <p><strong>Tenant:</strong> ${tenantSlug}</p>

        
      </div>
      
      <div style="text-align: center; margin: 30px 0;">
        <a href="${loginLink}" 
           style="background-color: #007bff; color: white; padding: 12px 24px; 
                  text-decoration: none; border-radius: 5px; display: inline-block;">
           Login to Your Account
        </a>
      </div>
      
      <div style="background-color: #fff3cd; border: 1px solid #ffeaa7; 
                  padding: 15px; border-radius: 5px; margin: 20px 0;">
        <p style="margin: 0; color: #856404;">
          <strong>Security Notice:</strong> 
          Please activate your account and change your password immediately 
          after first login for security purposes.
        </p>
      </div>
      
      <p>If you need assistance, please contact your administrator.</p>
      
      <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
      <p style="color: #666; font-size: 12px;">
        This is an automated message. Please do not reply to this email.
      </p>
    </div>
  `;

  await transporter.sendMail({
    from: process.env.SMTP_FROM,
    to: user.email,
    subject,
    html
  });
};




// Send activation email with code
const sendActivationEmail = async (user, code, tenant) => {
  
  if (!user?.email) throw new Error('Missing recipient email');

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT),
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  });

  const displayTenantName = tenant?.name || 'Our Service';
  const tenantSlug = tenant?.slug || '';
  const loginLink = `${process.env.INVENTORY_FRONTEND}/invite?token=${user.inviteToken}&tenant=${tenantSlug}`;
  const activationLink =
  `${process.env.INVENTORY_FRONTEND}/auth/activate?token=${user.activationCode}&slug=${tenant.slug}`;
  const subject = `Activate your account - ${displayTenantName}`;

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #333;">Hello ${user.firstName},</h2>
      <p>You were invited to join <strong>${displayTenantName}</strong>. Please activate your account using the details below:</p>
      
      <div style="background-color: #f8f9fa; padding: 20px; border-radius: 5px; margin: 20px 0;">
        <h3 style="margin: 0 0 15px 0; color: #333;">Activation Details</h3>
        <p><strong>Activation Code:</strong> ${code}</p>
        <p><strong>Tenant:</strong> ${tenantSlug}</p>
        <p><strong>Expires In:</strong> 15 minutes</p>
      </div>

      <div style="text-align: center; margin: 30px 0;">
        <a href="${activationLink}" 
        
           style="background-color: #007bff; color: white; padding: 12px 24px; 
                  text-decoration: none; border-radius: 5px; display: inline-block;">
           Activate Account
        </a>
      </div>

      <div style="background-color: #fff3cd; border: 1px solid #ffeaa7; 
                  padding: 15px; border-radius: 5px; margin: 20px 0;">
        <p style="margin: 0; color: #856404;">
          <strong>Security Notice:</strong> Please activate your account and change your password immediately after first login.
        </p>
      </div>

      <p>If you need assistance, please contact your administrator.</p>

      <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
      <p style="color: #666; font-size: 12px;">This is an automated message. Please do not reply to this email.</p>
    </div>
  `;
// password reset function
  const info = await transporter.sendMail({
    from: process.env.SMTP_FROM,
    to: user.email,
    subject,
    html
  });

  console.log('Activation email sent', { to: user.email, messageId: info?.messageId });
  return info;
};
const sendResetPasswordEmail = async (user, token, tenant) => {

  const resetLink =
  `${process.env.INVENTORY_FRONTEND}/auth/reset-password/${token}?slug=${tenant.slug}`;

  const subject = `Password Reset - ${tenant.name || 'StockInsights'}`;

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      
      <h2 style="color: #333;">Password Reset Request</h2>
      
      <p>Hello ${user.firstName},</p>
      
      <p>You requested a password reset for your account on 
        <strong>${tenant.name || 'Tickflo'}</strong>.
      </p>
      
      <p>Please click the button below to reset your password:</p>
      
      <div style="text-align: center; margin: 30px 0;">
        <a href="${resetLink}" 
           style="background-color: #dc3545; 
                  color: white; 
                  padding: 12px 24px; 
                  text-decoration: none; 
                  border-radius: 5px; 
                  display: inline-block;">
           Reset Password
        </a>
      </div>
      
      <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
        <p style="margin: 0; color: #666;">
          <strong>Important:</strong> This link will expire in 10 minutes.
          If you did not request this reset, please ignore this email.
        </p>
      </div>
      
      <p>If the button doesn't work, you can copy and paste this link into your browser:</p>
      
      <p style="word-break: break-all; color: #007bff;">
        ${resetLink}
      </p>
      
      <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
      
      <p style="color: #666; font-size: 12px;">
        This is an automated message. Please do not reply to this email.
      </p>
      
    </div>
  `;

  await transporter.sendMail({
    from: process.env.SMTP_FROM,
    to: user.email,
    subject,
    html
  });
};
/**
 * Team invite email (manager / cashier) with activation code + role
 */
/**
 * @param {object} user
 * @param {string} code  activation code
 * @param {object} tenant
 * @param {string} [roleLabel]
 * @param {object|null} [emailConfig]  EmailConfig doc — uses tenant SMTP when enabled
 */
const sendTeamInviteEmail = async (user, code, tenant, roleLabel = 'Team Member', emailConfig = null) => {
  if (!user?.email) throw new Error('Missing recipient email');

  const displayTenantName = tenant?.name || 'StockInsights';
  const tenantSlug = tenant?.slug || '';
  const activationLink =
    `${process.env.INVENTORY_FRONTEND}/auth/activate?token=${user.activationCode}&slug=${tenant.slug}&email=${encodeURIComponent(user.email)}`;

  const subject = `You're invited as ${roleLabel} — ${displayTenantName}`;

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #333;">Hello ${user.firstName},</h2>
      <p>
        You have been invited to join <strong>${displayTenantName}</strong>
        as a <strong>${roleLabel}</strong>.
      </p>

      <div style="background-color: #f8f9fa; padding: 20px; border-radius: 5px; margin: 20px 0;">
        <h3 style="margin: 0 0 15px 0; color: #333;">Activation Details</h3>
        <p><strong>Email:</strong> ${user.email}</p>
        <p><strong>Role:</strong> ${roleLabel}</p>
        <p><strong>Company code (slug):</strong> ${tenantSlug}</p>
        <p><strong>Activation Code:</strong> <span style="font-size: 20px; letter-spacing: 3px; font-weight: bold;">${code}</span></p>
        <p><strong>Expires In:</strong> 15 minutes</p>
      </div>

      <div style="text-align: center; margin: 30px 0;">
        <a href="${activationLink}"
           style="background-color: #4f46e5; color: white; padding: 12px 24px;
                  text-decoration: none; border-radius: 5px; display: inline-block;">
           Activate Account
        </a>
      </div>

      <div style="background-color: #fff3cd; border: 1px solid #ffeaa7;
                  padding: 15px; border-radius: 5px; margin: 20px 0;">
        <p style="margin: 0; color: #856404;">
          <strong>Next steps:</strong> Open the link, enter your email, company slug,
          activation code, and set a new password. Then sign in.
        </p>
      </div>

      <p>If you did not expect this invite, you can ignore this email.</p>

      <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
      <p style="color: #666; font-size: 12px;">This is an automated message. Please do not reply.</p>
    </div>
  `;

  const t = buildTransporter(emailConfig);
  const from = buildFrom(emailConfig, `${displayTenantName} (via StockInsight)`);

  const info = await t.sendMail({ from, to: user.email, subject, html });

  console.log('Team invite email sent', { to: user.email, messageId: info?.messageId });
  return info;
};

module.exports = {
  sendLoginEmail,
  sendActivationEmail,
  sendResetPasswordEmail,
  sendTeamInviteEmail,
};
