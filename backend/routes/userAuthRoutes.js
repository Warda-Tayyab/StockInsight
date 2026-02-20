const express = require('express');
const router = express.Router();
const UserAuthService = require('../service/UserAuthService');


router.post('/login', async (req, res, next) => {
  try {
    let { email, password, slug } = req.body;
    email = email?.trim();
    password = password?.trim();
    slug = slug?.trim();

    if (!slug) return res.status(400).json({ errorField: 'slug', message: 'Company slug is required' });
    if (!email) return res.status(400).json({ errorField: 'email', message: 'Email is required' });
    if (!password) return res.status(400).json({ errorField: 'password', message: 'Password is required' });

    const result = await UserAuthService.login(email, password, slug);

if (!result) {
  return res.status(500).json({ errorField: 'general', message: 'Login service did not return a result.' });
}
if (result.errorField) {
  return res.status(result.status || 400).json(result);
}
res.json(result);
  } catch (err) {
    console.error('Login service error:', err);
    res.status(500).json({ errorField: 'general', message: 'Server error. Try again.' });
  }
});


module.exports = router;
