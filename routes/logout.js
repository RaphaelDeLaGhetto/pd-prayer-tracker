const express = require('express');
const passport = require('passport');
const router = express.Router();

router.get('/', (req, res) => {
  req.logout();
  res.redirect('/');
});

module.exports = router;
