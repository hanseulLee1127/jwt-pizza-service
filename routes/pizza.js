const express = require('express');
const router = express.Router();
const db = require('../database/database');

router.get('/', async function (req, res, next) {
  try {
    res.json(await db.getOrders(req.query.page));
  } catch (err) {
    console.error(`Error while getting programming languages `, err.message);
    next(err);
  }
});

router.post('/order', async function (req, res, next) {
  try {
    const order = req.body;
    res.send(await db.addOrder(order));
  } catch (err) {
    console.error(`Error while adding order: `, err.message);
    next(err);
  }
});

module.exports = router;
