import express from 'express';
import { DB, Role } from '../database/database.js';
import authRouter from './authRouter.js';
import { asyncHandler } from '../endpointHelper.js';

const franchiseRouter = express.Router();

franchiseRouter.endpoints = [
  { method: 'GET', path: '/api/franchise', description: 'List all the franchises', example: `curl -b cookies.txt localhost:3000/api/franchise` },
  { method: 'GET', path: '/api/franchise/:userId', requiresAuth: true, description: `List a user's franchises`, example: `curl -b cookies.txt localhost:3000/api/franchise/1` },
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

export default franchiseRouter;
