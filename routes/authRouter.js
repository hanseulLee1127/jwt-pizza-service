import express from 'express';
import jwt from 'jsonwebtoken';
import config from '../config.js';
import { asyncHandler } from '../endpointHelper.js';
import { DB, Role } from '../database/database.js';

const authRouter = express.Router();

authRouter.endpoints = [
  {
    method: 'POST',
    path: '/api/auth',
    description: 'Register a new user',
    example: `curl -X POST -c cookies.txt localhost:3000/api/auth -d '{"name":"pizza diner", "email":"d@jwt.com", "password":"a"}' -H 'Content-Type: application/json'`,
  },
  {
    method: 'PUT',
    path: '/api/auth',
    description: 'Login existing user',
    example: `curl -X PUT -c cookies.txt localhost:3000/api/auth -d '{"email":"a@jwt.com", "password":"a"}' -H 'Content-Type: application/json'`,
  },
  {
    method: 'DELETE',
    path: '/api/auth',
    description: 'Logout a user',
    example: `curl -X DELETE -c cookies.txt localhost:3000/api/auth`,
  },
];

function setAuth(user, res) {
  const token = jwt.sign(user, config.jwtSecret);
  res.cookie('token', token, { secure: true, httpOnly: true, sameSite: 'strict' });
}

function setAuthUser(req, res, next) {
  if (!req.cookies.token) next();

  jwt.verify(req.cookies.token, config.jwtSecret, (err, user) => {
    if (!err) {
      user.isRole = (role) => !!user.roles.find((r) => r.role === role);
      req.user = user;
    }
    next();
  });
}

authRouter.authenticateToken = (req, res, next) => {
  if (!req.user) {
    return res.status(401).send({ message: 'unauthorized' });
  }
  next();
};

authRouter.post(
  '/',
  asyncHandler(async (req, res) => {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'name, email, and password are required' });
    }
    const user = await DB.addUser({ name, email, password, roles: [{ role: Role.Diner }] });
    setAuth(user, res);
    res.json(user);
  })
);

authRouter.put(
  '/',
  asyncHandler(async (req, res) => {
    const { email, password } = req.body;
    const user = await DB.getUser(email, password);
    setAuth(user, res);
    res.json(user);
  })
);
authRouter.delete(
  '/',
  asyncHandler(async (_, res) => {
    res.clearCookie('token');
    res.json({ message: 'logout successful' });
  })
);
export { authRouter, setAuthUser };
