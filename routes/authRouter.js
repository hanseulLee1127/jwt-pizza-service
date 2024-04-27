import express from 'express';
import jwt from 'jsonwebtoken';
import config from '../config.js';

const authRouter = express.Router();

let _nextId = 0;
const nextId = () => _nextId++;
const users = new Map();

function setAuth(user, res) {
  const token = jwt.sign({ email: user.email }, config.jwtSecret);
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

authRouter.put('/', (req, res) => {
  const { email, password } = req.body;
  if (!users.has(email)) {
    return res.status(400).json({ message: 'user does not exist' });
  }
  const user = users.get(email);
  if (user.password !== password) {
    return res.status(401).json({ message: 'incorrect password' });
  }
  setAuth(user, res);
  res.json({ ...user, password: undefined });
});

authRouter.post('/', (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ message: 'name, email, and password are required' });
  }
  if (users.has(email)) {
    return res.status(400).json({ message: 'user already exists' });
  }
  const user = { id: nextId(), name, email, password, roles: ['diner'] };
  users.set(email, user);
  setAuth(user, res);
  res.json({ ...user, password: undefined });
});

export default authRouter;
