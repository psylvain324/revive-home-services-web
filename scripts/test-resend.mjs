import { EmailConfigurationError, EmailDeliveryError, getResendConfig, maskEmail, sendConfiguredTestEmail } from "../lib/resend.mjs";

const shouldSend = process.argv.includes("--send");

try {
  const config = getResendConfig();
  if (!shouldSend) {
    console.log(`Resend configuration is valid. Test recipient: ${maskEmail(config.testTo)}.`);
    console.log("Run `npm run email:test` to perform an opt-in delivery test.");
    process.exit(0);
  }

  const result = await sendConfiguredTestEmail();
  console.log(`Resend accepted the test email for ${result.recipient}. Delivery id: ${result.id}.`);
} catch (error) {
  if (error instanceof EmailConfigurationError || error instanceof EmailDeliveryError) {
    console.error(error.message);
  } else {
    console.error("Unable to complete the Resend verification.");
  }
  process.exit(1);
}
