const nodemailer = require("nodemailer");

/**
 * sendEmail.js
 * Uses nodemailer to send the OTP.
 * Requires SMTP credentials in environment variables.
 */
const sendEmail = async ({ email, subject, message }) => {
  try {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.SMTP_MAIL,
        pass: process.env.SMTP_PASSWORD,
      },
    });

    const mailOptions = {
      from: `Hostel Buddy Auth <${process.env.SMTP_MAIL}>`,
      to: email,
      subject: subject,
      html: message,
    };

    await transporter.sendMail(mailOptions);
    console.log(`✉️ Email sent successfully to ${email}`);
  } catch (error) {
    console.error(`❌ Email sending failed: ${error.message}`);
    throw new Error("Email could not be sent");
  }
};

module.exports = sendEmail;
