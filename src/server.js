import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { errorHandler } from './middleware/errorHandler.js';
import { logger } from './middleware/logger.js';
import { notFoundHandler } from './middleware/notFoundHandler.js';
import { connectMongoDB } from './db/connectMongoDB.js';
import notesRoutes from './routes/notesRoutes.js';
import 'dotenv/config';

const PORT = process.env.PORT ?? 3000;
const app = express();

app.use(
  cors({
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
  }),
);
app.use(helmet());

app.use(logger);

app.use(
  express.json({
    limit: '5mb',
  }),
);

app.use(notesRoutes);

app.use(notFoundHandler);

app.use(errorHandler);

await connectMongoDB();

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});