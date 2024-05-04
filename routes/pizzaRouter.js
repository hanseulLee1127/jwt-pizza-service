import express from 'express';
import { DB } from '../database/database.js';
import { authRouter } from './authRouter.js';
import { asyncHandler } from '../endpointHelper.js';

const pizzaRouter = express.Router();

pizzaRouter.endpoints = [
  { method: 'GET', path: '/api/pizza/menu', description: 'Get the pizza menu', example: `curl localhost:3000/pizza/menu` },
  { method: 'GET', path: '/api/pizza', requiresAuth: true, description: 'Get the orders for the authenticated user', example: `curl -b cookies.txt -X GET localhost:3000/api/pizza/order` },
  {
    method: 'POST',
    path: '/api/pizza/order',
    requiresAuth: true,
    description: 'Make an order for the authenticated user',
    example: `curl -b cookies.txt -X POST localhost:3000/api/pizza/order -H 'Content-Type: application/json' -d '{"franchiseId": 1, "storeId":1, "items":[{ "menuId": 1, "description": "Veggie", "price": 0.05 }]}'`,
  },
];

pizzaRouter.get(
  '/menu',
  asyncHandler(async (req, res) => {
    res.send(await DB.getMenu());
  })
);

pizzaRouter.get(
  '/order',
  authRouter.authenticateToken,
  asyncHandler(async (req, res) => {
    res.json(await DB.getOrders(req.user, req.query.page));
  })
);

pizzaRouter.post(
  '/order',
  authRouter.authenticateToken,
  asyncHandler(async (req, res) => {
    const order = req.body;
    res.send(await DB.addDinerOrder(req.user, order));
  })
);

export default pizzaRouter;
