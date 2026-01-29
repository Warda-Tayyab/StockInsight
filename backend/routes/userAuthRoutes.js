const express = require('express');
const router = express.Router();
const UserAuthService = require('../service/UserAuthService');

router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const result = await UserAuthService.login(email, password);
    res.json(result);
  } catch (e) {
    next(e);
  }
});

module.exports = router;
