import express from 'express';
import cookieParser from 'cookie-parser';
import pizzaRouter from './routes/pizzaRouter.js';
import authRouter from './routes/authRouter.js';

const app = express();
app.use(express.json());
app.use(cookieParser());

app.use('/pizza', pizzaRouter);
app.use('/auth', authRouter);

app.use('/', (req, res) =>
  res.send({
    message: 'welcome to the JWT Pizza',
    endpoints: [
      { method: 'POST', path: '/auth', description: 'Create a new user' },
      { method: 'PUT', path: '/auth', description: 'Login' },
      { method: 'GET', path: '/pizza/menu', description: 'Get the pizza menu' },
      { method: 'GET', path: '/pizza', description: 'Get the orders' },
      { method: 'POST', path: '/pizza/order', description: 'Add a new order' },
    ],
  })
);

app.use('*', (req, res) => res.status(404).json({ message: 'not found' }));

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: err.message });
});

const port = process.argv[2] || 3000;
app.listen(port, () => {
  console.log(`Server started on port ${port}`);
});
