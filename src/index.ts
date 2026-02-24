import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { APP_ORIGIN, PORT } from './constants/env';
import appRoutes from './routes';
import connectToDatabase from './config/db';
import { customResponse, errorHandler } from './middlewares';

const app = express();
//middleware
app.use(
  cors({
    origin: APP_ORIGIN,
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  })
);
app.options("*", cors());

app.use(customResponse);
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

//app routes
app.use('/api', appRoutes);

// error handler 
app.use(errorHandler);

app.listen(PORT, async () => {
  console.log(`Server is running on http://localhost:${PORT}`);
  await connectToDatabase();
});
