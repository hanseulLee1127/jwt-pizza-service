import express from 'express';
import cookieParser from 'cookie-parser';
import { authRouter, setAuthUser } from './routes/authRouter.js';
import orderRouter from './routes/orderRouter.js';
import franchiseRouter from './routes/franchiseRouter.js';

const app = express();
app.use(express.json());
app.use(cookieParser());
app.use(setAuthUser);
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  next();
});

const apiRouter = express.Router();
app.use('/api', apiRouter);
apiRouter.use('/auth', authRouter);
apiRouter.use('/order', orderRouter);
apiRouter.use('/franchise', franchiseRouter);

app.use('*', (_req, res) => {
  res.json({
    message: 'welcome to JWT Pizza',
    endpoints: [...authRouter.endpoints, ...orderRouter.endpoints, ...franchiseRouter.endpoints],
  });
});

// Default error handler for all exceptions and errors.
app.use((err, _req, res, _next) => {
  console.error(err.stack);
  res.status(err.statusCode ?? 500).json({ message: err.message, stack: err.stack });
});

const port = process.argv[2] || 3000;
app.listen(port, () => {
  console.log(`Server started on port ${port}`);
});
