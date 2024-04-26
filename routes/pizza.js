import express from 'express';
import db from '../database/database.js';

const pizzaRouter = express.Router();

pizzaRouter.get('/', async function (req, res, next) {
  try {
    res.json(await db.getOrders(req.query.page));
  } catch (err) {
    console.error(`Error while getting programming languages `, err.message);
    next(err);
  }
});

pizzaRouter.post('/order', async function (req, res, next) {
  try {
    const order = req.body;
    res.send(await db.addOrder(order));
  } catch (err) {
    console.error(`Error while adding order: `, err.message);
    next(err);
  }
});

export default pizzaRouter;
