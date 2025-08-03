import nodemailer from 'nodemailer';

// Create a single transporter for the application lifetime
let transporter: nodemailer.Transporter;

async function createTransporter() {
  // Prioritize real SMTP credentials if they are configured in .env
  if (process.env.EMAIL_SERVER_USER && process.env.EMAIL_SERVER_PASSWORD) {
    transporter = nodemailer.createTransport({
      host: process.env.EMAIL_SERVER_HOST,
      port: Number(process.env.EMAIL_SERVER_PORT),
      secure: process.env.EMAIL_SERVER_SECURE === 'true',
      auth: {
        user: process.env.EMAIL_SERVER_USER,
        pass: process.env.EMAIL_SERVER_PASSWORD,
      },
    });
    console.log("✅ Using configured SMTP server for sending emails.");
  } else {
    // Fallback to Ethereal for email testing if no real credentials are provided
    const testAccount = await nodemailer.createTestAccount();
    console.log("⚠️ No SMTP credentials found. Falling back to Ethereal for email testing.");
    console.log("   Ethereal User: ", testAccount.user);
    console.log("   Ethereal Pass: ", testAccount.pass);
    
    transporter = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });
  }
}

// Initialize the transporter when the module is loaded
createTransporter().catch(console.error);

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
}

export async function sendEmail({ to, subject, html }: EmailOptions) {
  if (!transporter) {
    throw new Error("Transporter not initialized. Please check your email configuration.");
  }
  
  const mailOptions = {
    from: process.env.EMAIL_FROM || '"Trace" <no-reply@trace.com>',
    to,
    subject,
    html,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent successfully');

    if (process.env.NODE_ENV !== 'production') {
      console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));
    }
    
  } catch (error) {
    console.error('Error sending email:', error);
    throw new Error('Failed to send email');
  }
}

export function generateVerificationEmail(code: string) {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
      <div style="text-align: center; margin-bottom: 20px;">
        <h1 style="color: #222e3e;">Verify Your Email Address</h1>
      </div>
      <div style="text-align: center;">
        <p style="font-size: 16px; color: #555;">To complete your TRACE registration, please use the following verification code:</p>
        <div style="background-color: #f5f5f5; border-radius: 8px; padding: 20px; margin: 20px 0; display: inline-block;">
          <p style="font-size: 36px; font-weight: bold; color: #222e3e; letter-spacing: 5px; margin: 0;">${code}</p>
        </div>
        <p style="font-size: 14px; color: #777;">This code will expire in 10 minutes.</p>
        <p style="font-size: 14px; color: #777;">If you did not request this code, you can safely ignore this email.</p>
      </div>
      <div style="text-align: center; margin-top: 30px; font-size: 12px; color: #aaa;">
        <p>&copy; ${new Date().getFullYear()} TRACE. All rights reserved.</p>
      </div>
    </div>
  `;
} 