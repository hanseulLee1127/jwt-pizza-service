const express = require('express');
const jwt = require('jsonwebtoken');
const config = require('../config.js');
const { asyncHandler } = require('../endpointHelper.js');
const { DB, Role } = require('../database/database.js');

const authRouter = express.Router();

authRouter.endpoints = [
  {
    method: 'POST',
    path: '/api/auth',
    description: 'Register a new user',
    example: `curl -X POST -c cookies.txt localhost:3000/api/auth -d '{"name":"pizza diner", "email":"d@jwt.com", "password":"diner"}' -H 'Content-Type: application/json'`,
  },
  {
    method: 'PUT',
    path: '/api/auth',
    description: 'Login existing user',
    example: `curl -X PUT -c cookies.txt localhost:3000/api/auth -d '{"email":"a@jwt.com", "password":"admin"}' -H 'Content-Type: application/json'`,
  },
  {
    method: 'PUT',
    path: '/api/auth/:userId',
    requiresAuth: true,
    description: 'Update user',
    example: `curl -X PUT -b cookies.txt localhost:3000/api/auth/1 -d '{"email":"a@jwt.com", "password":"admin"}' -H 'Content-Type: application/json'`,
  },
  {
    method: 'DELETE',
    path: '/api/auth',
    requiresAuth: true,
    description: 'Logout a user',
    example: `curl -X DELETE -c cookies.txt localhost:3000/api/auth`,
  },
];

function setAuthUser(req, res, next) {
  if (!req.cookies.token) {
    next();
  } else {
    jwt.verify(req.cookies.token, config.jwtSecret, (err, user) => {
      if (!err) {
        user.isRole = (role) => !!user.roles.find((r) => r.role === role);
        req.user = user;
      }
      next();
    });
  }
}

// Authenticate token
authRouter.authenticateToken = (req, res, next) => {
  if (!req.user) {
    return res.status(401).send({ message: 'unauthorized' });
  }
  next();
};

// register
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

// login
authRouter.put(
  '/',
  asyncHandler(async (req, res) => {
    const { email, password } = req.body;
    const user = await DB.getUser(email, password);
    setAuth(user, res);
    res.json(user);
  })
);

// logout
authRouter.delete(
  '/',
  authRouter.authenticateToken,
  asyncHandler(async (_, res) => {
    res.clearCookie('token');
    res.json({ message: 'logout successful' });
  })
);

// updateUser
authRouter.put(
  '/:userId',
  authRouter.authenticateToken,
  asyncHandler(async (req, res) => {
    const { email, password } = req.body;
    const userId = Number(req.params.userId);
    const user = req.user;
    if (user.id !== userId && !user.isRole(Role.Admin)) {
      return res.status(403).json({ message: 'unauthorized' });
    }

    const updatedUser = await DB.updateUser(userId, email, password);
    res.json(updatedUser);
  })
);

function setAuth(user, res) {
  const token = jwt.sign(user, config.jwtSecret);
  res.cookie('token', token, { secure: true, httpOnly: true, sameSite: 'None' });
}

module.exports = { authRouter, setAuthUser };
