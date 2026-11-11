const nodemailer = require("nodemailer");

function isEmailConfigured() {
  return Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASSWORD && process.env.SMTP_FROM && process.env.CLIENT_URL);
}

function createTransport() {
  if (!isEmailConfigured()) throw new Error("SMTP email delivery is not configured.");
  const port = Number(process.env.SMTP_PORT || 587);
  if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error("SMTP_PORT is invalid.");
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port,
    secure: port === 465,
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD },
  });
}

async function sendPasswordResetEmail(email, token) {
  const resetUrl = new URL(`/reset-password/${encodeURIComponent(token)}`, process.env.CLIENT_URL).toString();
  const transporter = createTransport();
  await transporter.sendMail({
    from: process.env.SMTP_FROM,
    to: email,
    subject: "Reset your HeartLink password",
    text: `Use this secure link to reset your HeartLink password. It expires in one hour: ${resetUrl}`,
    html: `<p>Use this secure link to reset your HeartLink password. It expires in one hour:</p><p><a href="${resetUrl}">Reset password</a></p>`,
  });
}

async function sendVerificationEmail(email, token) {
  const verifyUrl = new URL(`/verify-email/${encodeURIComponent(token)}`, process.env.CLIENT_URL).toString();
  const transporter = createTransport();
  await transporter.sendMail({
    from: process.env.SMTP_FROM,
    to: email,
    subject: "Verify your HeartLink email",
    text: `Verify your email address to finish setting up HeartLink. This link expires in 24 hours: ${verifyUrl}`,
    html: `<p>Verify your email address to finish setting up HeartLink. This link expires in 24 hours:</p><p><a href="${verifyUrl}">Verify email</a></p>`,
  });
}

module.exports = { isEmailConfigured, sendPasswordResetEmail, sendVerificationEmail };
