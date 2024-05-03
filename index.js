import express from 'express';
import cookieParser from 'cookie-parser';
import pizzaRouter from './routes/pizzaRouter.js';
import authRouter from './routes/authRouter.js';

const app = express();
app.use(express.json());
app.use(cookieParser());
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  next();
});

const apiRouter = express.Router();
app.use('/api', apiRouter);
apiRouter.use('/pizza', pizzaRouter);
apiRouter.use('/auth', authRouter);

app.use('*', (_, res) => {
  res.status(404).send({
    message: 'welcome to the JWT Pizza',
    endpoints: [...authRouter.endpoints, ...pizzaRouter.endpoints],
  });
});

// Default error handler for all exceptions and errors.
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.statusCode ?? 500).json({ message: err.message });
});

const port = process.argv[2] || 3000;
app.listen(port, () => {
  console.log(`Server started on port ${port}`);
});
