const express = require('express');
const config = require('../config.js');
const { Role, DB } = require('../database/database.js');
const { authRouter } = require('./authRouter.js');
const { asyncHandler, StatusCodeError } = require('../endpointHelper.js');
const metrics = require("../metrics.js");
const logger = require('../logger.js');

const orderRouter = express.Router();

// let enableChaos = false;
// orderRouter.put(
//   '/chaos/:state',
//   authRouter.authenticateToken,
//   asyncHandler(async (req, res) => {
//     if (req.user.isRole(Role.Admin)) {
//       enableChaos = req.params.state === 'true';
//     }

//     res.json({ chaos: enableChaos });
//   })
// );

// orderRouter.post('/', (req, res, next) => {
//   if (enableChaos && Math.random() < 0.5) {
//     metrics.addChaosCount();
//     throw new StatusCodeError('Chaos monkey', 500);
//   }
//   next();
// });

orderRouter.endpoints = [
  {
    method: 'GET',
    path: '/api/order/menu',
    description: 'Get the pizza menu',
    example: `curl localhost:3000/api/order/menu`,
    response: [{ id: 1, title: 'Veggie', image: 'pizza1.png', price: 0.0038, description: 'A garden of delight' }],
  },
  {
    method: 'PUT',
    path: '/api/order/menu',
    requiresAuth: true,
    description: 'Add an item to the menu',
    example: `curl -X PUT localhost:3000/api/order/menu -H 'Content-Type: application/json' -d '{ "title":"Student", "description": "No topping, no sauce, just carbs", "image":"pizza9.png", "price": 0.0001 }'  -H 'Authorization: Bearer tttttt'`,
    response: [{ id: 1, title: 'Student', description: 'No topping, no sauce, just carbs', image: 'pizza9.png', price: 0.0001 }],
  },
  {
    method: 'GET',
    path: '/api/order',
    requiresAuth: true,
    description: 'Get the orders for the authenticated user',
    example: `curl -X GET localhost:3000/api/order  -H 'Authorization: Bearer tttttt'`,
    response: { dinerId: 4, orders: [{ id: 1, franchiseId: 1, storeId: 1, date: '2024-06-05T05:14:40.000Z', items: [{ id: 1, menuId: 1, description: 'Veggie', price: 0.05 }] }], page: 1 },
  },
  {
    method: 'POST',
    path: '/api/order',
    requiresAuth: true,
    description: 'Create a order for the authenticated user',
    example: `curl -X POST localhost:3000/api/order -H 'Content-Type: application/json' -d '{"franchiseId": 1, "storeId":1, "items":[{ "menuId": 1, "description": "Veggie", "price": 0.05 }]}'  -H 'Authorization: Bearer tttttt'`,
    response: { order: { franchiseId: 1, storeId: 1, items: [{ menuId: 1, description: 'Veggie', price: 0.05 }], id: 1 }, jwt: '1111111111' },
  },
];

// getMenu
orderRouter.get(
  '/menu',
  asyncHandler(async (req, res) => {
    const result = await DB.getMenu();
    logger.log('info', 'database', { query: 'DB.getMenu()', result });
    res.send(result);
  })
);

// addMenuItem
orderRouter.put(
  '/menu',
  authRouter.authenticateToken,
  asyncHandler(async (req, res) => {
    if (!req.user.isRole(Role.Admin)) {
      throw new StatusCodeError('unable to add menu item', 403);
    }

    const addMenuItemReq = req.body;
    await DB.addMenuItem(addMenuItemReq);
    logger.log('info', 'database', { query: 'DB.addMenuItem', user: req.user.id, item: addMenuItemReq });

    const result = await DB.getMenu();
    logger.log('info', 'database', { query: 'DB.getMenu()', result });
    res.send(result);
  })
);

// getOrders
orderRouter.get(
  '/',
  authRouter.authenticateToken,
  asyncHandler(async (req, res) => {
    const result = await DB.getOrders(req.user, req.query.page);
    logger.log('info', 'database', { query: 'DB.getOrders', user: req.user.id, result });
    res.json(result);
  })
);

// createOrder
orderRouter.post(
  '/',
  authRouter.authenticateToken,
  metrics.measurePizzaLatency(),
  asyncHandler(async (req, res) => {
    const orderReq = req.body;

    const menu = await DB.getMenu();
    const menuMap = {};
    for (const item of menu) {
      menuMap[item.id] = item.price;
    }

    const sanitizedItems = orderReq.items.map(item => {
      const actualPrice = menuMap[item.menuId];
      if (actualPrice === undefined) {
        throw new StatusCodeError(`Invalid menuId: ${item.menuId}`, 400);
      }
      return {
        menuId: item.menuId,
        description: item.description,
        price: actualPrice,
      };
    });

    const sanitizedOrder = {
      franchiseId: orderReq.franchiseId,
      storeId: orderReq.storeId,
      items: sanitizedItems,
    };

    const order = await DB.addDinerOrder(req.user, sanitizedOrder);
    logger.log('info', 'database', { query: 'DB.addDinerOrder', user: req.user.id, order });

    const r = await fetch(`${config.factory.url}/api/order`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', authorization: `Bearer ${config.factory.apiKey}` },
      body: JSON.stringify({ diner: { id: req.user.id, name: req.user.name, email: req.user.email }, order }),
    });
    const j = await r.json();

    if (r.ok) {
      metrics.trackPizzaOrder(order, true);
      logger.log('info', 'factory', { user: req.user.id, orderReq: req.body, factoryResponse: j });
      res.send({ order, reportSlowPizzaToFactoryUrl: j.reportUrl, jwt: j.jwt });
    } else {
      metrics.trackPizzaOrder(order, false);
      logger.log('error', 'factory', { user: req.user.id, orderReq: req.body, factoryResponse: j });
      res.status(500).send({ message: 'Failed to fulfill order at factory', reportPizzaCreationErrorToPizzaFactoryUrl: j.reportUrl });
    }
  })
);
;

module.exports = orderRouter;
