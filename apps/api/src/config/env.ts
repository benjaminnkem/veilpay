import { z } from 'zod';

const hex32 = /^0x[0-9a-fA-F]{64}$/;
const schema = z.object({
  NODE_ENV: z
    .enum(['development', 'test', 'production'])
    .default('development'),
  PORT: z.coerce.number().int().positive().default(3001),
  DATABASE_URL: z.string().min(1),
  JWT_ACCESS_SECRET: z.string().min(32),
  JWT_REFRESH_SECRET: z.string().min(32),
  JWT_ACCESS_TTL: z.string().default('15m'),
  JWT_REFRESH_TTL_SECONDS: z.coerce
    .number()
    .int()
    .positive()
    .default(2_592_000),
  DATA_ENCRYPTION_KEY: z.string().regex(hex32),
  WEB3_CHAIN_ID: z.coerce.number().int().positive().default(11155111),
  WEB3_RPC_URL: z.string().url(),
  WEB3_CONFIRMATIONS: z.coerce.number().int().positive().default(2),
  CONFIDENTIAL_PAYROLL_ADDRESS: z.string().regex(/^0x[0-9a-fA-F]{40}$/),
  CONFIDENTIAL_TOKEN_ADDRESS: z.string().regex(/^0x[0-9a-fA-F]{40}$/),
  MOCK_USDC_ADDRESS: z
    .string()
    .regex(/^0x[0-9a-fA-F]{40}$/)
    .optional(),
  NOX_MODE: z.enum(['real', 'test']).default('real'),
  NOX_GATEWAY_URL: z.string().url().optional(),
  NOX_COMPUTE_ADDRESS: z
    .string()
    .regex(/^0x[0-9a-fA-F]{40}$/)
    .optional(),
  NOX_SUBGRAPH_URL: z.string().url().optional(),
  RELAYER_PRIVATE_KEY: z.string().regex(hex32).optional(),
  SAFE_TRANSACTION_SERVICE_URL: z.string().url().optional(),
  SAFE_API_KEY: z.string().optional(),
  SIWE_DOMAIN: z.string().min(1).default('localhost'),
  SIWE_URI: z.string().url().default('http://localhost:3000'),
  EMAIL_PROVIDER: z.enum(['console', 'smtp']).default('console'),
  EMAIL_FROM: z.string().default('VeilPay <noreply@localhost>'),
  SMTP_HOST: z.preprocess(
    (value) => (value === '' ? undefined : value),
    z.string().min(1).optional(),
  ),
  SMTP_PORT: z.coerce.number().int().positive().default(587),
  SMTP_USER: z.string().optional(),
  SMTP_PASSWORD: z.string().optional(),
});

export function validateEnv(
  raw: Record<string, unknown>,
): Record<string, unknown> {
  const env = schema.parse(raw);
  if (
    env.NOX_MODE === 'real' &&
    (!env.NOX_GATEWAY_URL ||
      !env.NOX_COMPUTE_ADDRESS ||
      !env.NOX_SUBGRAPH_URL ||
      !env.RELAYER_PRIVATE_KEY)
  ) {
    throw new Error(
      'NOX_MODE=real requires NOX_GATEWAY_URL, NOX_COMPUTE_ADDRESS, NOX_SUBGRAPH_URL and RELAYER_PRIVATE_KEY',
    );
  }
  if (env.NODE_ENV === 'production' && env.NOX_MODE === 'test')
    throw new Error('NOX_MODE=test is forbidden in production');
  if (
    env.EMAIL_PROVIDER === 'smtp' &&
    (!env.SMTP_HOST || !env.SMTP_USER || !env.SMTP_PASSWORD)
  )
    throw new Error(
      'EMAIL_PROVIDER=smtp requires SMTP_HOST, SMTP_USER and SMTP_PASSWORD',
    );
  return env;
}
