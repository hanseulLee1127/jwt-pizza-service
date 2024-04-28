import express from 'express';
import db from '../database/database.js';
import authRouter from './authRouter.js';

const pizzaRouter = express.Router();

pizzaRouter.get('/menu', async (req, res) => {
  res.send(await db.getMenu());
});

pizzaRouter.get('/', authRouter.authenticateToken, async (req, res) => {
  res.json(await db.getOrders(req.query.page));
});

pizzaRouter.post('/order', authRouter.authenticateToken, async (req, res) => {
  const order = req.body;
  res.send(await db.addOrder(order));
});

export default pizzaRouter;
