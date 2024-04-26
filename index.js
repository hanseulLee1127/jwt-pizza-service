import express from 'express';
import cookieParser from 'cookie-parser';
import pizzaRouter from './routes/pizzaRouter.js';
import authRouter from './routes/authRouter.js';

const app = express();
app.use(express.json());
app.use(cookieParser());

app.use('/pizza', pizzaRouter);
app.use('/auth', authRouter);

app.use('*', (req, res) => res.status(404).json({ message: 'not found' }));

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: err.message });
});

const port = process.argv[2] || 3000;
app.listen(port, () => {
  console.log(`Server started on port ${port}`);
});
