import express from 'express';
import cookieParser from 'cookie-parser';
import pizzaRouter from './routes/pizzaRouter.js';
import authRouter from './routes/authRouter.js';

const app = express();
app.use(express.json());
app.use(cookieParser());

const apiRouter = express.Router();

app.use('/api', apiRouter);
apiRouter.use('/pizza', pizzaRouter);
apiRouter.use('/auth', authRouter);

app.use('*', (_, res) => {
  res.send({
    message: 'welcome to the JWT Pizza',
    endpoints: [
      { method: 'POST', path: '/api/auth', description: 'Create a new user' },
      { method: 'PUT', path: '/api/auth', description: 'Login existing user' },
      { method: 'GET', path: '/api/pizza/menu', description: 'Get the pizza menu' },
      { method: 'GET', path: '/api/pizza', description: 'Get the orders' },
      { method: 'POST', path: '/api/pizza/order', description: 'Add a new order' },
    ],
  });
});

app.use((err, _, res) => {
  console.error(err.stack);
  res.status(500).json({ message: err.message });
});

const port = process.argv[2] || 3000;
app.listen(port, () => {
  console.log(`Server started on port ${port}`);
});
