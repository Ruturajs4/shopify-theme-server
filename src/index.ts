import express from 'express';
import logger from './utils/logger';
import { config } from './config/environment';
import themeRoutes from './routes/theme.routes';
import codexRoutes from './routes/codex.routes';
import chatRoutes from './routes/chat.routes';

const app = express();

// Middleware
app.use(express.json());

// Routes
app.use('/', themeRoutes);
app.use('/api', codexRoutes);
app.use('/', chatRoutes);

// Start server
const PORT = config.PORT;

app.listen(PORT, () => {
  logger.info(`Shopify Theme Manager running on port ${PORT}`);
});
