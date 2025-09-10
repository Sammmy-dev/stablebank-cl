const sgMail = require("@sendgrid/mail");

// Initialize SendGrid with API key
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

/**
 * Send OTP via email using SendGrid
 * @param {string} email - Recipient email address
 * @param {string} otp - 6-digit OTP code
 * @returns {Promise} - SendGrid response
 */
async function sendEmailOTP(email, otp) {
  const msg = {
    to: email,
    from: process.env.SENDGRID_FROM_EMAIL || "noreply@stablebank.com",
    subject: "StableBank - Email Verification Code",
    text: `Your StableBank verification code is: ${otp}. This code will expire in 10 minutes.`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333; text-align: center;">StableBank Email Verification</h2>
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p style="font-size: 16px; color: #555; margin-bottom: 20px;">
            Your verification code is:
          </p>
          <div style="background-color: #007bff; color: white; font-size: 24px; font-weight: bold; text-align: center; padding: 15px; border-radius: 5px; letter-spacing: 3px; margin: 20px 0;">
            ${otp}
          </div>
          <p style="font-size: 14px; color: #666; text-align: center;">
            This code will expire in 10 minutes.
          </p>
        </div>
        <p style="font-size: 12px; color: #999; text-align: center;">
          If you didn't request this code, please ignore this email.
        </p>
      </div>
    `,
  };

  try {
    const response = await sgMail.send(msg);
    console.log("Email sent successfully:", response[0].statusCode);
    return response;
  } catch (error) {
    console.error("Error sending email:", error);
    throw error;
  }
}

module.exports = {
  sendEmailOTP,
};
