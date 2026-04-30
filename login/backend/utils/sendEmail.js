const nodemailer = require("nodemailer");

/**
 * sendEmail.js
 * Uses nodemailer to send the OTP.
 * Requires SMTP credentials in environment variables.
 */
const sendEmail = async ({ email, subject, message }) => {
  try {
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: Number(process.env.SMTP_PORT) || 465,
      secure: true, // use SSL on port 465 (more reliable on cloud platforms like Render)
      auth: {
        user: process.env.SMTP_MAIL,
        pass: process.env.SMTP_PASSWORD,
      },
      connectionTimeout: 10000, // 10s to establish connection
      greetingTimeout: 10000,   // 10s for SMTP greeting
      socketTimeout: 15000,     // 15s for socket inactivity
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
