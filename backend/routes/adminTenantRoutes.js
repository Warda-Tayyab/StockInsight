const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const Tenant = require('../models/shared/Tenant');
const User = require('../models/tenant/User');
const adminAuthMiddleware = require('../middleware/auth/adminAuthMiddleware');


//CREATE TENANT (Super Admin)
router.post('/', adminAuthMiddleware, async (req, res) => {
  try {
    const {
      name,
      slug,
      ownerEmail,
      ownerFirstName,
      ownerLastName,
      primaryContact,
      business
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
    //  Tenant create
    const tenant = await Tenant.create({
     // tenantId: crypto.randomUUID(),
      name,
      slug,
      ownerEmail,
      inviteToken,
      primaryContact,
      business
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
  status: passwordHash ? 'active' : 'invited'
});

await owner.save();


    //  Link owner to tenant
    tenant.ownerUserId = owner._id;
    await tenant.save();

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
router.get('/', adminAuthMiddleware, async (req, res) => {
  try {
    const tenants = await Tenant.find()
      .populate('ownerUserId', 'firstName lastName email status')
      .sort({ createdAt: -1 });

    res.json({ tenants });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

//GET SINGLE TENANT
router.get('/:id', adminAuthMiddleware, async (req, res) => {
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

router.put('/:id', adminAuthMiddleware, async (req, res) => {
  try {
    const tenant = await Tenant.findById(req.params.id);
    if (!tenant) {
      return res.status(404).json({ message: 'Tenant not found' });
    }

    const {
      name,
      slug,
      primaryContact,
      business
    } = req.body;

    if (name) tenant.name = name;
    if (slug) tenant.slug = slug;
    if (primaryContact) tenant.primaryContact = primaryContact;
    if (business) tenant.business = business;

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
   
router.patch('/:id/status', adminAuthMiddleware, async (req, res) => {
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


    //DELETE TENANT (Hard Delete)
 
router.delete('/:id', adminAuthMiddleware, async (req, res) => {
  try {
    const tenant = await Tenant.findById(req.params.id);
    if (!tenant) {
      return res.status(404).json({ message: 'Tenant not found' });
    }

    await User.deleteMany({ tenantId: tenant._id });
    await tenant.deleteOne();

    res.json({ message: 'Tenant deleted successfully' });

  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});
module.exports = router;
