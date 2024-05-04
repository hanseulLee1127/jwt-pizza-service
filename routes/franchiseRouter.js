import express from 'express';
import { DB, Role } from '../database/database.js';
import { authRouter } from './authRouter.js';
import { asyncHandler } from '../endpointHelper.js';

const franchiseRouter = express.Router();

franchiseRouter.endpoints = [
  { method: 'GET', path: '/api/franchise', description: 'List all the franchises', example: `curl -b cookies.txt localhost:3000/api/franchise` },
  { method: 'GET', path: '/api/franchise/:userId', requiresAuth: true, description: `List a user's franchises`, example: `curl -b cookies.txt localhost:3000/api/franchise/1` },
  {
    method: 'POST',
    path: '/api/franchise',
    requiresAuth: true,
    description: 'Create a new franchise',
    example: `curl -b cookies.txt -X POST localhost:3000/api/franchise -H 'Content-Type: application/json' -d '{"franchiseId": 1, "storeId":1, "items":[{ "menuId": 1, "description": "Veggie", "price": 0.05 }]}'`,
  },
  { method: 'DELETE', path: '/api/franchise/:franchiseId', requiresAuth: true, description: `Delete a franchises`, example: `curl -X DELETE -b cookies.txt localhost:3000/api/franchise/1` },
  {
    method: 'DELETE',
    path: '/api/franchise/:franchiseId/store/:storeId',
    requiresAuth: true,
    description: `Delete a store`,
    example: `curl -X DELETE -b cookies.txt localhost:3000/api/franchise/1/store/1`,
  },
];

franchiseRouter.get(
  '/',
  asyncHandler(async (req, res) => {
    res.json(await DB.getFranchises(req.user));
  })
);

franchiseRouter.get(
  '/:userId',
  authRouter.authenticateToken,
  asyncHandler(async (req, res) => {
    let result = [];
    if (req.user.id === req.params.userId || req.user.isRole(Role.Admin)) {
      result = await DB.getUserFranchises(req.params.userId);
    }

    res.json(result);
  })
);

franchiseRouter.post(
  '/',
  authRouter.authenticateToken,
  asyncHandler(async (req, res) => {
    if (!req.user?.isRole(Role.Admin)) {
      throw new StatusCodeError('unable to create a franchise', 403);
    }

    const franchise = req.body;
    res.send(await DB.createFranchise(franchise));
  })
);

franchiseRouter.delete(
  '/:franchiseId/store/:storeId',
  authRouter.authenticateToken,
  asyncHandler(async (req, res) => {
    if (!req.user?.isRole(Role.Admin)) {
      throw new StatusCodeError('unable to delete a store', 403);
    }

    await DB.deleteStore(req.params.franchiseId, req.params.storeId);
    res.json({ message: 'store deleted' });
  })
);

franchiseRouter.delete(
  '/:franchiseId',
  authRouter.authenticateToken,
  asyncHandler(async (req, res) => {
    if (!req.user?.isRole(Role.Admin)) {
      throw new StatusCodeError('unable to delete a franchise', 403);
    }

    await DB.deleteFranchise(req.params.franchiseId);
    res.json({ message: 'franchise deleted' });
  })
);

export default franchiseRouter;
