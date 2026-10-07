const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const Tenant = require('../models/shared/Tenant');
const User = require('../models/tenant/User');
//const adminAuthMiddleware = require('../middleware/auth/adminAuthMiddleware');
const { authenticate, authorize } = require('../middleware/auth/authMiddleware');
const logAdminActivity = require('../utils/logAdminActivity');

//CREATE TENANT (Super Admin)
router.post(
  '/',
  authenticate,
  authorize({ requireSuperAdmin: true }),
   async (req, res) => {
  try {
    const {
      name,
      slug,
      ownerEmail,
      ownerFirstName,
      ownerLastName,
      primaryContact,
      business,
      plan
    } = req.body;

   
if (!ownerFirstName) {
  return res.status(400).json({
    message: 'Owner first name is required'
  });
}

if (!ownerEmail) {
  return res.status(400).json({
    message: 'Owner email is required'
  });
}

    //  Invite token generate
    const inviteToken = crypto.randomBytes(20).toString('hex');
 

    const existing = await Tenant.findOne({ slug });
if (existing) {
  return res.status(400).json({ message: 'Slug already exists, use a different one' });
}
if (
  req.body.status &&
  !['trial', 'active', 'suspended'].includes(req.body.status)
) {
  return res.status(400).json({
    message: 'Invalid status'
  });
}
const { status } = req.body;
    //  Tenant create
    const tenant = await Tenant.create({
     // tenantId: crypto.randomUUID(),
      name,
      slug,
      ownerEmail,
      plan,
      status: status || 'trial', 
      inviteToken,
      primaryContact,
      business: {
        verticals: business?.verticals || [],
        useCases: business?.useCases || []
      }
    });

    let passwordHash = null;

if (req.body.setPasswordNow && req.body.password) {
  passwordHash = await bcrypt.hash(req.body.password, 10);
}

// Owner user create
const owner = new User({
  tenantId: tenant._id,
  firstName: ownerFirstName,
  lastName: ownerLastName,
  email: ownerEmail,
  role: 'owner',
  passwordHash,              // null OR hashed password
  status: passwordHash ? 'active' : 'invited',
  inviteToken               // add this line
});

await owner.save();

// 🔹 Generate temporary password if not set
const { sendLoginEmail } = require('../utils/sendEmail');

let tempPassword = null;

// If admin did NOT set password
if (!passwordHash) {
  tempPassword = crypto.randomBytes(3).toString('hex');
  owner.passwordHash = await bcrypt.hash(tempPassword, 10);
  owner.status = 'invited';
  owner.isActivated = false;
  await owner.save();
}

// 🔥 ALWAYS SEND EMAIL
await sendLoginEmail(
  owner,
  tenant,
  passwordHash ? req.body.password : tempPassword
);

// 🔹 Send initial email with login credentials
// use email utility function
// sendEmail(owner.email, 'Welcome to Techpark', `Your temporary password is: ${tempPassword}`);
    //  Link owner to tenant
    tenant.ownerUserId = owner._id;
    await tenant.save();

    await logAdminActivity({
      type: 'tenant_created',
      title: 'New tenant created',
      description: `${tenant.name} was onboarded to the platform`,
      entityType: 'tenant',
      entityId: tenant._id,
      metadata: { tenantName: tenant.name, status: tenant.status, plan: tenant.plan }
    });

    await logAdminActivity({
      type: 'user_invited',
      title: 'Owner account invited',
      description: `${ownerEmail} was invited as owner of ${tenant.name}`,
      entityType: 'user',
      entityId: owner._id,
      metadata: { email: ownerEmail, tenantName: tenant.name, role: 'owner' }
    });

    //  Response (later send email invite)
    res.json({
      message: 'Tenant created, owner invite token generated',
      tenant,
      inviteToken
    });

  }
  catch (error) {

  if (error.name === 'ValidationError') {
    const messages = Object.values(error.errors).map(e => e.message);

    return res.status(400).json({
      message: messages
    });
  }

  res.status(500).json({ message: 'Server error' , error});
}
 
});


//GET ALL TENANTS (Super Admin)
router.get(
  '/',
  authenticate,
  authorize({ requireSuperAdmin: true }),
  async (req, res) => {
  try {
    const tenants = await Tenant.find({
      $or: [
        { isArchived: false },
        { isArchived: { $exists: false } }
      ]
    })
    .populate('ownerUserId', 'firstName lastName email status')
    .sort({ createdAt: -1 });
    res.json({ tenants });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

//Get Archieve Tenants
router.get(
  '/archived',
  authenticate,
  authorize({ requireSuperAdmin: true }),
  async (req, res) => {
    try {

      const tenants = await Tenant.find({
        isArchived: true
      })
      .populate('ownerUserId','firstName lastName email status')
      .sort({ createdAt: -1 });

      res.json({ tenants });

    } catch (err) {

      console.error(err);

      res.status(500).json({
        message: "Server error",
        error: err.message
      });

    }
  }
);
//GET SINGLE TENANT
router.get(
  '/:id',
  authenticate,
  authorize({ requireSuperAdmin: true }),async (req, res) => {
  try {
    const tenant = await Tenant.findById(req.params.id)
      .populate('ownerUserId', 'firstName lastName email status');

    if (!tenant) {
      return res.status(404).json({ message: 'Tenant not found' });
    }

    res.json({ tenant });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// UPDATE TENANT DETAILS

router.put(
  '/:id',
  authenticate,
  authorize({ requireSuperAdmin: true }), async (req, res) => {
  try {
    const tenant = await Tenant.findById(req.params.id);
    if (!tenant) {
      return res.status(404).json({ message: 'Tenant not found' });
    }

    const {
      name,
      slug,
      primaryContact,
      business,
      plan
    } = req.body;
    if (slug) {
      const duplicate = await Tenant.findOne({
        slug,
        _id: { $ne: req.params.id }
      });
    
      if (duplicate) {
        return res.status(400).json({
          message: 'Slug already exists'
        });
      }
    }
    if (name) tenant.name = name;
    if (slug) tenant.slug = slug;
    if (primaryContact) tenant.primaryContact = primaryContact;
    if (business) tenant.business = business;
    if (plan !== undefined) tenant.plan = plan;
    const owner = await User.findById(
      tenant.ownerUserId
  );
  
  if(owner){
  
      if(req.body.ownerFirstName!==undefined)
          owner.firstName=req.body.ownerFirstName;
  
      if(req.body.ownerLastName!==undefined)
          owner.lastName=req.body.ownerLastName;
  
      if(req.body.ownerEmail!==undefined){
  
          owner.email=req.body.ownerEmail;
  
          tenant.ownerEmail=req.body.ownerEmail;
  
      }
      if (req.body.status) {
        tenant.status = req.body.status;
    }
      await owner.save();
  
  }
    await tenant.save();

    res.json({
      message: 'Tenant updated successfully',
      tenant
    });

  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

   // UPDATE TENANT STATUS (active / suspended / trial)
   
   router.patch(
    '/:id/status',
    authenticate,
    authorize({ requireSuperAdmin: true }),
     async (req, res) => {
  try {
    const { status } = req.body;

    if (!['active', 'suspended', 'trial'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const tenant = await Tenant.findById(req.params.id);
    if (!tenant) {
      return res.status(404).json({ message: 'Tenant not found' });
    }

    tenant.status = status;
    await tenant.save();

    await logAdminActivity({
      type: 'tenant_status',
      title: 'Tenant status changed',
      description: `${tenant.name} marked as ${status}`,
      entityType: 'tenant',
      entityId: tenant._id,
      metadata: { tenantName: tenant.name, status }
    });

    // Also update owner status
    if (tenant.ownerUserId) {
      await User.findByIdAndUpdate(tenant.ownerUserId, {
        status: status === 'active' ? 'active' : 'suspended'
      });
    }

    res.json({
      message: `Tenant status updated to ${status}`,
      tenant
    });

  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});


    //DELETE TENANT (Soft Delete)
    router.delete(
      '/:id',
      authenticate,
      authorize({ requireSuperAdmin: true }),
      async (req, res) => {
        try {
    
          const tenant = await Tenant.findById(req.params.id);
    
          if (!tenant) {
            return res.status(404).json({
              message: 'Tenant not found'
            });
          }
    
          tenant.isArchived = true;
          tenant.status = 'suspended'; 
          tenant.archivedAt = new Date();
          tenant.archivedBy = req.auth._id;
          await tenant.save();
          await User.updateMany(
            { tenantId: tenant._id },
            {
              status: 'suspended'
            }
          );
    
          await logAdminActivity({
            type: 'tenant_archived',
            title: 'Tenant Archived',
            description: `${tenant.name} archived`,
            entityType: 'tenant',
            entityId: tenant._id
          });
    
          res.json({
            message: 'Tenant archived successfully'
          });
    
        } catch (err) {
          console.error("Archive Error:", err);
          res.status(500).json({
            message: 'Server error'
          });
    
        }
      }
    );
    // Restore Tenant
    router.patch(
      '/:id/restore',
      authenticate,
      authorize({ requireSuperAdmin: true }),
      async (req, res) => {
    
        try {
    
          const tenant = await Tenant.findById(req.params.id);
    
          if (!tenant) {
            return res.status(404).json({
              message: 'Tenant not found'
            });
          }
    
          tenant.isArchived = false;
          tenant.status = 'active'; 
          tenant.archivedAt = null;
          tenant.archivedBy = null;
    
          await tenant.save();
    
          await User.updateMany(
            { tenantId: tenant._id },
            {
              status: 'active'
            }
          );
    
          res.json({
            message: 'Tenant restored',
            tenant
          });
    
        } catch (err) {
    
          res.status(500).json({
            message: 'Server error'
          });
    
        }
    
      }
    );
module.exports = router;
