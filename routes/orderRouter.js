import express from 'express';
import { DB } from '../database/database.js';
import { authRouter } from './authRouter.js';
import { asyncHandler } from '../endpointHelper.js';

const orderRouter = express.Router();

orderRouter.endpoints = [
  { method: 'GET', path: '/api/order/menu', description: 'Get the pizza menu', example: `curl localhost:3000/order/menu` },
  { method: 'GET', path: '/api/order', requiresAuth: true, description: 'Get the orders for the authenticated user', example: `curl -b cookies.txt -X GET localhost:3000/api/order` },
  {
    method: 'POST',
    path: '/api/order',
    requiresAuth: true,
    description: 'Make a order for the authenticated user',
    example: `curl -b cookies.txt -X POST localhost:3000/api/order -H 'Content-Type: application/json' -d '{"franchiseId": 1, "storeId":1, "items":[{ "menuId": 1, "description": "Veggie", "price": 0.05 }]}'`,
  },
];

orderRouter.get(
  '/menu',
  asyncHandler(async (req, res) => {
    res.send(await DB.getMenu());
  })
);

orderRouter.get(
  '/',
  authRouter.authenticateToken,
  asyncHandler(async (req, res) => {
    res.json(await DB.getOrders(req.user, req.query.page));
  })
);

orderRouter.post(
  '/',
  authRouter.authenticateToken,
  asyncHandler(async (req, res) => {
    const order = req.body;
    res.send(await DB.addDinerOrder(req.user, order));
  })
);

export default orderRouter;
