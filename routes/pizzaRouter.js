import express from 'express';
import { DB } from '../database/database.js';
import authRouter from './authRouter.js';

const pizzaRouter = express.Router();

pizzaRouter.get('/menu', async (req, res) => {
  res.send(await DB.getMenu());
});

pizzaRouter.get('/', authRouter.authenticateToken, async (req, res) => {
  res.json(await DB.getOrders(req.query.page));
});

pizzaRouter.post('/order', authRouter.authenticateToken, async (req, res) => {
  const order = req.body;
  res.send(await DB.addDinerOrder(order));
});

export default pizzaRouter;
