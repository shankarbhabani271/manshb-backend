import nodemailer from "nodemailer";

// Initialize the Nodemailer transporter configuration
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || "587", 10),
  secure: process.env.SMTP_PORT === "465", // true for 465, false for 587 or 25
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

/**
 * Sends a generic HTML email message.
 */
export const sendEmail = async ({ to, subject, html }) => {
  try {
    const mailOptions = {
      from: process.env.EMAIL_FROM || '"Urbasi Support" <noreply@urbasi.com>',
      to,
      subject,
      html,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`📩 [Mail Service] Email sent successfully to ${to}. Message ID: ${info.messageId}`);
    return info;
  } catch (error) {
    console.error("🔴 [Mail Service] Delivery FAILED: ", error);
    throw error;
  }
};

/**
 * Delivers registration verification OTP emails.
 */
export const sendOtpEmail = async (email, otp, username, purpose = "registration") => {
  const isLogin = purpose === "login";
  const title = isLogin ? "Login Verification Code" : "Account Verification Code";
  const desc = isLogin
    ? "Please enter the following 6-digit OTP code to complete your login session. This code is valid for 10 minutes."
    : "Thank you for registering. To activate your account, please enter the following 6-digit One-Time Password (OTP). This code is valid for 10 minutes.";

  const html = `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 550px; margin: 20px auto; padding: 25px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;">
      <h2 style="color: #4f46e5; text-align: center; margin-bottom: 20px; font-weight: 700;">${title}</h2>
      <p>Hello <strong>${username}</strong>,</p>
      <p>${desc}</p>
      <div style="text-align: center; margin: 30px 0;">
        <span style="font-size: 34px; font-weight: 800; letter-spacing: 5px; color: #1e1b4b; background-color: #f1f5f9; padding: 12px 24px; border-radius: 8px; border: 1px dashed #4f46e5; display: inline-block;">
          ${otp}
        </span>
      </div>
      <p style="color: #64748b; font-size: 14px; text-align: center;">If you did not initiate this request, you can safely ignore this email.</p>
      <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
      <p style="color: #94a3b8; font-size: 11px; text-align: center;">&copy; ${new Date().getFullYear()} Urbasi Enterprise. All rights reserved.</p>
    </div>
  `;
  return sendEmail({ to: email, subject: `Urbasi Enterprise - ${title}`, html });
};

/**
 * Sends a welcome email upon successful verification.
 */
export const sendWelcomeEmail = async (email, username) => {
  const html = `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 550px; margin: 20px auto; padding: 25px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;">
      <h2 style="color: #10b981; text-align: center; margin-bottom: 20px; font-weight: 700;">Welcome to Urbasi Enterprise!</h2>
      <p>Hello <strong>${username}</strong>,</p>
      <p>Your account has been successfully verified and activated! We are excited to have you join our platform.</p>
      <p>You can now log in to access your dashboard, manage categories, search catalog, and utilize all our premium services.</p>
      <div style="text-align: center; margin: 30px 0;">
        <a href="${process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',')[0] : 'http://localhost:5173'}/login" 
           style="background-color: #4f46e5; color: #ffffff; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: 600; display: inline-block;">
           Go to Login Dashboard
        </a>
      </div>
      <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
      <p style="color: #94a3b8; font-size: 11px; text-align: center;">&copy; ${new Date().getFullYear()} Urbasi Enterprise. All rights reserved.</p>
    </div>
  `;
  return sendEmail({ to: email, subject: "Welcome to Urbasi Enterprise!", html });
};

/**
 * Delivers forgot-password recovery OTP emails.
 */
export const sendPasswordResetEmail = async (email, otp, username) => {
  const html = `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 550px; margin: 20px auto; padding: 25px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;">
      <h2 style="color: #ef4444; text-align: center; margin-bottom: 20px; font-weight: 700;">Reset Your Password</h2>
      <p>Hello <strong>${username}</strong>,</p>
      <p>We received a password reset request for your account. Please use the following 6-digit One-Time Password (OTP) to reset your password. This code will expire in <strong>10 minutes</strong>.</p>
      <div style="text-align: center; margin: 30px 0;">
        <span style="font-size: 34px; font-weight: 800; letter-spacing: 5px; color: #1e1b4b; background-color: #f1f5f9; padding: 12px 24px; border-radius: 8px; border: 1px dashed #ef4444; display: inline-block;">
          ${otp}
        </span>
      </div>
      <p style="color: #64748b; font-size: 14px; text-align: center;">If you did not request this, please secure your credentials immediately.</p>
      <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
      <p style="color: #94a3b8; font-size: 11px; text-align: center;">&copy; ${new Date().getFullYear()} Urbasi Enterprise. All rights reserved.</p>
    </div>
  `;
  return sendEmail({ to: email, subject: "Urbasi Enterprise - Password Reset Request", html });
};

/**
 * Sends an administrator invitation email.
 */
export const sendAdminInvitationEmail = async (email, inviterName, registrationUrl) => {
  const html = `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 550px; margin: 20px auto; padding: 25px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;">
      <h2 style="color: #4f46e5; text-align: center; margin-bottom: 20px; font-weight: 700;">Administrator Invitation</h2>
      <p>Hello,</p>
      <p>You have been invited by <strong>${inviterName}</strong> to join the admin team at <strong>Urbasi Enterprise</strong>.</p>
      <p>Click the link below to accept the invitation and complete your admin user registration page:</p>
      <div style="text-align: center; margin: 30px 0;">
        <a href="${registrationUrl}" 
           style="background-color: #4f46e5; color: #ffffff; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: 600; display: inline-block;">
           Accept Invitation
        </a>
      </div>
      <p style="color: #64748b; font-size: 13px;">If you cannot click the button above, copy and paste this URL into your browser:</p>
      <p style="color: #4f46e5; font-size: 12px; word-break: break-all;">${registrationUrl}</p>
      <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
      <p style="color: #94a3b8; font-size: 11px; text-align: center;">&copy; ${new Date().getFullYear()} Urbasi Enterprise. All rights reserved.</p>
    </div>
  `;
  return sendEmail({ to: email, subject: "Urbasi Enterprise - Administrator Team Invitation", html });
};
