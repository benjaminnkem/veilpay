export default () => ({
  nodeEnv: process.env.NODE_ENV ?? 'development',
  port: parseInt(process.env.PORT ?? '3001', 10),
  corsOrigin: process.env.CORS_ORIGIN?.split(',') ?? [
    'http://localhost:3000',
    'http://127.0.0.1:3000',
  ],
  database: {
    host: process.env.DB_HOST ?? 'localhost',
    port: parseInt(process.env.DB_PORT ?? '5432', 10),
    username: process.env.DB_USERNAME ?? 'veilpay',
    password: process.env.DB_PASSWORD ?? 'veilpay',
    database: process.env.DB_DATABASE ?? 'veilpay',
    synchronize: (process.env.DB_SYNC ?? 'true') === 'true',
    logging: (process.env.DB_LOGGING ?? 'false') === 'true',
  },
  jwt: {
    accessSecret:
      process.env.JWT_ACCESS_SECRET ?? 'veilpay-dev-access-secret-change-me',
    refreshSecret:
      process.env.JWT_REFRESH_SECRET ?? 'veilpay-dev-refresh-secret-change-me',
    accessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN ?? '15m',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN ?? '7d',
  },
  app: {
    name: process.env.APP_NAME ?? 'VeilPay',
    invitationExpiryDays: parseInt(
      process.env.INVITATION_EXPIRY_DAYS ?? '7',
      10,
    ),
  },
});
