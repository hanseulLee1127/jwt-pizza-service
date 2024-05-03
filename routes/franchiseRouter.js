import express from 'express';
import { DB } from '../database/database.js';
import authRouter from './authRouter.js';
import { asyncHandler } from '../endpointHelper.js';

const franchiseRouter = express.Router();

franchiseRouter.endpoints = [{ method: 'GET', path: '/api/franchise', requiresAuth: true, description: 'Get the list of franchises', example: `curl -b cookies.txt localhost:3000/api/franchise` }];

franchiseRouter.get(
  '/',
  authRouter.authenticateToken,
  asyncHandler(async (req, res) => {
    res.json(await DB.getFranchises(req.user));
  })
);

export default franchiseRouter;
