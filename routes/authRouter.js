import express from 'express';
import jwt from 'jsonwebtoken';
import config from '../config.js';
import { asyncHandler } from '../helper.js';
import { DB, Role } from '../database/database.js';

const authRouter = express.Router();

function setAuth(user, res) {
  const token = jwt.sign(user, config.jwtSecret);
  res.cookie('token', token);
}

function authenticateToken(req, res, next) {
  const token = req.cookies.token || '';
  jwt.verify(token, config.jwtSecret, (err, user) => {
    if (err) {
      return res.status(401).send({ message: 'unauthorized' });
    }

    req.user = user;
    next();
  });
}
authRouter.authenticateToken = authenticateToken;

authRouter.post('/', async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ message: 'name, email, and password are required' });
  }
  const user = await DB.addUser({ name, email, password, roles: [{ role: Role.Diner }] });
  setAuth(user, res);
  res.json(user);
});

authRouter.put(
  '/',
  asyncHandler(async (req, res) => {
    const { email, password } = req.body;
    const user = await DB.getUser(email, password);
    setAuth(user, res);
    res.json(user);
  })
);

export default authRouter;
