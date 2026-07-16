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
    webUrl: process.env.WEB_URL ?? 'http://localhost:3000',
    invitationExpiryDays: parseInt(
      process.env.INVITATION_EXPIRY_DAYS ?? '7',
      10,
    ),
  },
  mail: {
    host: process.env.MAIL_HOST ?? 'smtp.gmail.com',
    port: parseInt(process.env.MAIL_PORT ?? '587', 10),
    secure: (process.env.MAIL_SECURE ?? 'false') === 'true',
    user: process.env.MAIL_USER ?? '',
    pass: process.env.MAIL_PASS ?? '',
    from: process.env.MAIL_FROM ?? process.env.MAIL_USER ?? 'noreply@veilpay.app',
  },
});
