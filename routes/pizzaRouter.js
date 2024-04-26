import express from 'express';
import db from '../database/database.js';
import authRouter from './authRouter.js';

const pizzaRouter = express.Router();

pizzaRouter.get('/menu', (req, res) => {
  res.send({
    menu: [
      { title: 'Veggie', description: 'A garden of delight', image: 'pizza1.png', price: 0.00038 },
      { title: 'Pepperoni', description: 'Spicy treat', image: 'pizza2.png', price: 0.00042 },
      { title: 'Margarita', description: 'Essential classic', image: 'pizza3.png', price: 0.00014 },
      { title: 'Crusty', description: 'A dry mouthed favorite', image: 'pizza4.png', price: 0.00024 },
      { title: 'Flat', description: 'Something special', image: 'pizza5.png', price: 0.00028 },
      { title: 'Chared Leopard', description: 'For those with a darker side', image: 'pizza6.png', price: 0.00099 },
    ],
  });
});

pizzaRouter.get('/', authRouter.authenticateToken, async function (req, res) {
  res.json(await db.getOrders(req.query.page));
});

pizzaRouter.post('/order', authRouter.authenticateToken, async (req, res) => {
  const order = req.body;
  res.send(await db.addOrder(order));
});

export default pizzaRouter;
