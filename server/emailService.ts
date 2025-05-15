import nodemailer from 'nodemailer';
import { log } from './vite';

// Create reusable transporter with Gmail (or other service)
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// Verify transporter connection on startup
transporter.verify((error) => {
  if (error) {
    log(`Email service error: ${error.message}`, 'error');
  } else {
    log('Email service is ready to send messages', 'info');
  }
});

interface EmailOptions {
  to: string;
  subject: string;
  text?: string;
  html?: string;
}

/**
 * Send an email using the configured transport
 */
export async function sendEmail({ to, subject, text, html }: EmailOptions): Promise<boolean> {
  try {
    const from = `Vyna.live <${process.env.EMAIL_USER}>`;
    
    const info = await transporter.sendMail({
      from,
      to,
      subject,
      text,
      html,
    });
    
    log(`Email sent: ${info.messageId}`, 'info');
    return true;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    log(`Failed to send email: ${errorMessage}`, 'error');
    return false;
  }
}

/**
 * Send a password reset email
 */
export async function sendPasswordResetEmail(email: string, resetUrl: string): Promise<boolean> {
  const subject = 'Vyna.live - Password Reset';
  
  const text = `
    You requested a password reset for your Vyna.live account.
    
    Please click the link below to reset your password:
    ${resetUrl}
    
    This link will expire in 1 hour.
    
    If you didn't request this, please ignore this email and your password will remain unchanged.
  `;
  
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #A67D44;">Vyna.live Password Reset</h2>
      <p>You requested a password reset for your Vyna.live account.</p>
      <p>Please click the button below to reset your password:</p>
      <p style="text-align: center;">
        <a href="${resetUrl}" 
           style="display: inline-block; background-color: #A67D44; color: white; padding: 10px 20px; 
                  text-decoration: none; border-radius: 4px; font-weight: bold;">
          Reset Password
        </a>
      </p>
      <p>This link will expire in 1 hour.</p>
      <p>If you didn't request this, please ignore this email and your password will remain unchanged.</p>
      <hr style="border: 1px solid #eee; margin-top: 30px;">
      <p style="color: #777; font-size: 12px;">
        This email was sent from Vyna.live. Please do not reply to this email.
      </p>
    </div>
  `;
  
  return await sendEmail({ to: email, subject, text, html });
}

/**
 * Send an email verification email
 */
export async function sendVerificationEmail(email: string, verificationUrl: string): Promise<boolean> {
  const subject = 'Vyna.live - Verify Your Email';
  
  const text = `
    Thank you for registering with Vyna.live!
    
    Please click the link below to verify your email address:
    ${verificationUrl}
    
    If you didn't create an account with us, please ignore this email.
  `;
  
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #A67D44;">Welcome to Vyna.live!</h2>
      <p>Thank you for registering with Vyna.live!</p>
      <p>Please click the button below to verify your email address:</p>
      <p style="text-align: center;">
        <a href="${verificationUrl}" 
           style="display: inline-block; background-color: #A67D44; color: white; padding: 10px 20px; 
                  text-decoration: none; border-radius: 4px; font-weight: bold;">
          Verify Email
        </a>
      </p>
      <p>If you didn't create an account with us, please ignore this email.</p>
      <hr style="border: 1px solid #eee; margin-top: 30px;">
      <p style="color: #777; font-size: 12px;">
        This email was sent from Vyna.live. Please do not reply to this email.
      </p>
    </div>
  `;
  
  return await sendEmail({ to: email, subject, text, html });
}