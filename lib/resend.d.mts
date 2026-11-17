export type ResendEnvironment = Record<string, string | undefined>;

export class EmailConfigurationError extends Error {}
export class EmailDeliveryError extends Error {}

export type SendOptions = {
  env?: ResendEnvironment;
  fetchImpl?: typeof fetch;
  timeoutMs?: number;
};

export function getResendConfig(env?: ResendEnvironment): Readonly<{
  apiKey: string;
  from: string;
  replyTo: string;
  testTo: string;
}>;
export function maskEmail(value: string): string;
export function sendResendEmail(message: {
  to: string;
  subject: string;
  html: string;
  text: string;
  idempotencyKey?: string;
}, options?: SendOptions): Promise<{ id: string; recipient: string }>;
export function sendConfiguredTestEmail(options?: SendOptions & {
  idempotencyKey?: string;
  now?: Date;
}): Promise<{ id: string; recipient: string }>;
