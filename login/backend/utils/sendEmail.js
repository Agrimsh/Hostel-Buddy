const nodemailer = require("nodemailer");

/**
 * sendEmail.js
 *
 * Primary:  Resend HTTP API (works on Render — uses HTTPS, no SMTP ports needed)
 * Fallback: Nodemailer SMTP (for local development)
 *
 * Set RESEND_API_KEY in environment to use Resend.
 * If not set, falls back to nodemailer with SMTP_MAIL / SMTP_PASSWORD.
 */

// ── Resend (HTTP API — works everywhere, including Render free tier) ──
const sendViaResend = async ({ email, subject, message }) => {
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: process.env.RESEND_FROM || "Hostel Buddy <onboarding@resend.dev>",
      to: [email],
      subject,
      html: message,
    }),
  });

  if (!res.ok) {
    const errBody = await res.text();
    throw new Error(`Resend API error (${res.status}): ${errBody}`);
  }

  console.log(`✉️ Email sent via Resend to ${email}`);
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
    if (process.env.RESEND_API_KEY) {
      await sendViaResend({ email, subject, message });
    } else {
      await sendViaNodemailer({ email, subject, message });
    }
  } catch (error) {
    console.error(`❌ Email sending failed: ${error.message}`);
    throw new Error("Email could not be sent");
  }
};

module.exports = sendEmail;
