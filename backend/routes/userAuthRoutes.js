const express = require('express');
const router = express.Router();
const UserAuthService = require('../service/UserAuthService');


router.post('/login', async (req, res, next) => {
  try {
    const { email, password, slug } = req.body;
if (!email) {
  return res.status(400).json({
    message: 'Email is required'
  });
}

if (!password) {
  return res.status(400).json({
    message: 'Password is required'
  });
}

if (!slug) {
  return res.status(400).json({
    message: 'Company slug is required'
  });
}


    const result = await UserAuthService.login(email, password, slug);
    res.json(result);
  } catch (e) {
    next(e);
  }
});


module.exports = router;
