const express = require('express');
const router = express.Router();
const AuthService = require('../service/AuthService');

router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const result = await AuthService.adminLogin(email, password, {
      ip: req.ip,
      userAgent: req.headers['user-agent']
    });
    res.json(result);
  } catch (e) {
    next(e);
  }
});

module.exports = router;
