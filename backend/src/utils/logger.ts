import winston from "winston";

const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

const format = winston.format.combine(
  winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
  winston.format.errors({ stack: true }),
  winston.format.printf(({ timestamp, level, message, stack }) => {
    return `${timestamp} [${level.toUpperCase()}]: ${stack || message}`;
  })
);

const transports = [
  new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      format
    ),
  }),
  new winston.transports.File({
    filename: "logs/error.log",
    level: "error",
    format,
  }),
  new winston.transports.File({
    filename: "logs/combined.log",
    format,
  }),
];

const logger = winston.createLogger({
  level: process.env.NODE_ENV === "production" ? "http" : "debug",
  levels,
  transports,
});

export default logger;
