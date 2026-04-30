const nodemailer = require("nodemailer");

/**
 * sendEmail.js
 *
 * Primary:  Brevo HTTP API (works on Render — uses HTTPS, no SMTP ports needed)
 * Fallback: Nodemailer SMTP (for local development)
 *
 * Set BREVO_API_KEY in environment to use Brevo.
 * If not set, falls back to nodemailer with SMTP_MAIL / SMTP_PASSWORD.
 */

// ── Brevo (HTTP API — works everywhere, including Render free tier) ──
const sendViaBrevo = async ({ email, subject, message }) => {
  const res = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: {
      "api-key": process.env.BREVO_API_KEY,
      "Content-Type": "application/json",
      "Accept": "application/json",
    },
    body: JSON.stringify({
      sender: {
        name: "Hostel Buddy",
        email: process.env.SMTP_MAIL || "hostelbuddy374@gmail.com",
      },
      to: [
        {
          email: email,
        },
      ],
      subject: subject,
      htmlContent: message,
    }),
  });

  if (!res.ok) {
    const errBody = await res.text();
    throw new Error(`Brevo API error (${res.status}): ${errBody}`);
  }

  console.log(`✉️ Email sent via Brevo to ${email}`);
};

// ── Nodemailer SMTP (local dev fallback) ──────────────────────────────
const sendViaNodemailer = async ({ email, subject, message }) => {
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || "smtp.gmail.com",
    port: 465,
    secure: true,
    auth: {
      user: process.env.SMTP_MAIL,
      pass: process.env.SMTP_PASSWORD,
    },
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 15000,
  });

  await transporter.sendMail({
    from: `Hostel Buddy Auth <${process.env.SMTP_MAIL}>`,
    to: email,
    subject,
    html: message,
  });

  console.log(`✉️ Email sent via Nodemailer to ${email}`);
};

// ── Main export ───────────────────────────────────────────────────────
const sendEmail = async ({ email, subject, message }) => {
  try {
    if (process.env.BREVO_API_KEY) {
      await sendViaBrevo({ email, subject, message });
    } else {
      await sendViaNodemailer({ email, subject, message });
    }
  } catch (error) {
    console.error(`❌ Email sending failed: ${error.message}`);
    throw new Error("Email could not be sent");
  }
};

module.exports = sendEmail;
