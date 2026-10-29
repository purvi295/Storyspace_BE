import pino from 'pino';

declare global {
  namespace Express {
    interface Request {
      /** Set by pino-http's request-id generator. */
      id: string;
    }
  }
}

/** JSON logs suitable for a log platform such as Datadog, Loki, or ELK. */
export const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  timestamp: pino.stdTimeFunctions.isoTime,
  redact: {
    paths: [
      'req.headers.authorization',
      'req.headers.cookie',
      'password',
      'token',
      'err.config.headers.authorization',
    ],
    censor: '[REDACTED]',
  },
});

export default logger;
