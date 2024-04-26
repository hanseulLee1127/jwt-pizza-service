const express = require('express');
const cookieParser = require('cookie-parser');
const jwt = require('jsonwebtoken');
const config = require('./config.json');

const app = express();
app.use(express.json());
app.use(cookieParser());

const users = new Map();

function setAuth(user, res) {
  const token = jwt.sign({ email: user.email }, config.jwtSecret);
  res.cookie('token', token);
}

app.put('/auth', (req, res) => {
  const { email, password } = req.body;
  if (!users.has(email)) {
    return res.status(400).json({ message: 'user does not exist' });
  }
  const user = users.get(email);
  if (user.password !== password) {
    return res.status(401).json({ message: 'incorrect password' });
  }
  setAuth(user, res);
  res.json({ email: user.email });
});

app.post('/auth', (req, res) => {
  const { email, password } = req.body;
  if (users.has(email)) {
    return res.status(400).json({ message: 'user already exists' });
  }
  const user = { email, password };
  users.set(email, user);
  setAuth(user, res);
  res.json({ email: user.email });
});

app.get('/menu', (req, res) => {
  res.send({
    menu: [
      { title: 'Veggie', description: 'A garden of delight', image: 'pizza1.png', price: 0.00038 },
      { title: 'Pepperoni', description: 'Spicy treat', image: 'pizza2.png', price: 0.00042 },
      { title: 'Margarita', description: 'Essential classic', image: 'pizza3.png', price: 0.00014 },
      { title: 'Crusty', description: 'A dry mouthed favorite', image: 'pizza4.png', price: 0.00024 },
      { title: 'Flat', description: 'Something special', image: 'pizza5.png', price: 0.00028 },
      { title: 'Chared Leopard', description: 'For those with a darker side', image: 'pizza6.png', price: 0.00099 },
    ],
  });
});

function authenticateToken(req, res, next) {
  const token = req.cookies.token;
  if (token == null) {
    return res.sendStatus(401);
  }

  jwt.verify(token, config.jwtSecret, (err, user) => {
    if (err) {
      return res.sendStatus(403);
    }

    req.user = user;
    next();
  });
}

app.post('/order', authenticateToken, async (req, res) => {
  const r = await fetch('http://localhost:3000/menu');
  const menu = await r.json();
  res.send({ user: req.user, menu, ...req.body });
});

app.get('/roles', authenticateToken, (req, res) => {
  res.send({ role: 'admin' });
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: err.message });
});

app.listen(3000, () => {
  console.log('Server started on port 3000');
});
