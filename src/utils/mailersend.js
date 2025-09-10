const { MailerSend, EmailParams, Sender, Recipient } = require("mailersend");

const apiKey = process.env.MAILERSEND_API_KEY;
const fromEmail =
  process.env.MAILERSEND_FROM_EMAIL || " test-r9084zv32ovgw63d.mlsender.net";
const fromName = process.env.MAILERSEND_FROM_NAME || "StableBank";

const mailerSend = new MailerSend({ apiKey });

async function sendEmailOTP(email, otp) {
  const sentFrom = new Sender(fromEmail, fromName);
  const recipients = [new Recipient(email)];

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #333; text-align: center;">StableBank Email Verification</h2>
      <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <p style="font-size: 16px; color: #555; margin-bottom: 20px;">Your verification code is:</p>
        <div style="background-color: #007bff; color: white; font-size: 24px; font-weight: bold; text-align: center; padding: 15px; border-radius: 5px; letter-spacing: 3px; margin: 20px 0;">
          ${otp}
        </div>
        <p style="font-size: 14px; color: #666; text-align: center;">This code will expire in 10 minutes.</p>
      </div>
      <p style="font-size: 12px; color: #999; text-align: center;">If you didn't request this code, please ignore this email.</p>
    </div>
  `;

  const text = `Your StableBank verification code is: ${otp}. This code will expire in 10 minutes.`;

  const emailParams = new EmailParams()
    .setFrom(sentFrom)
    .setTo(recipients)
    .setSubject("StableBank - Email Verification Code")
    .setHtml(html)
    .setText(text);

  return mailerSend.email.send(emailParams);
}

module.exports = {
  sendEmailOTP,
};
