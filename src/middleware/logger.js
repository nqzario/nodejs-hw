import pino from 'pino';
import pinoHttp from 'pino-http';

const pinoLogger = pino({
  level: 'info',
  transport: {
    target: 'pino-pretty',
    options: {
      colorize: true,
      translateTime: 'HH:MM:ss',
      ignore: 'pid,hostname',
    },
  },
});

export const logger = pinoHttp({
  logger: pinoLogger,
});
