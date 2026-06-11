import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

// Preserve OTP cache across hot-reloads in development
const globalForOtp = global as typeof globalThis & {
  otpStore?: Map<string, { code: string; expiresAt: number }>;
};

const otpStore = globalForOtp.otpStore || new Map<string, { code: string; expiresAt: number }>();

if (process.env.NODE_ENV !== 'production') {
  globalForOtp.otpStore = otpStore;
}

export async function POST(req: Request) {
  try {
    const { action, email, otp } = await req.json();

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    const normalizedEmail = email.toLowerCase().trim();

    if (action === 'send') {
      // 1. Generate 6-digit OTP code
      const generatedCode = Math.floor(100000 + Math.random() * 900000).toString();
      const expiresAt = Date.now() + 5 * 60 * 1000; // 5 minutes expiration

      // 2. Cache in global map
      otpStore.set(normalizedEmail, { code: generatedCode, expiresAt });

      // 3. Log OTP to terminal (crucial for developers checking console)
      console.log('\n==================================================');
      console.log(`[SECURITY OTP] Verification Code for ${normalizedEmail}:`);
      console.log(`🔑 CODE: ${generatedCode}`);
      console.log(`⏰ Expires in: 5 minutes`);
      console.log('==================================================\n');

      let emailSent = false;
      const htmlBody = `
        <div style="font-family: system-ui, sans-serif; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px; max-width: 480px; margin: 0 auto; background-color: #f8fafc;">
          <h2 style="color: #0f172a; margin-top: 0; font-size: 20px; font-weight: 800;">Admin Verification</h2>
          <p style="color: #475569; font-size: 14px; line-height: 1.6;">A request was made to sign in to your portfolio admin dashboard.</p>
          <p style="color: #475569; font-size: 14px; line-height: 1.6; margin-bottom: 20px;">Use the following time-sensitive one-time security code:</p>
          <div style="font-family: monospace; font-size: 28px; font-weight: 800; color: #10b981; background-color: rgba(16, 185, 129, 0.1); padding: 12px 24px; border-radius: 8px; text-align: center; letter-spacing: 4px; display: inline-block; margin-bottom: 20px;">
            ${generatedCode}
          </div>
          <p style="color: #94a3b8; font-size: 12px; line-height: 1.5; margin-top: 20px; border-top: 1px solid #e2e8f0; padding-top: 16px;">This code will expire in 5 minutes. If you did not make this request, you can safely ignore this email.</p>
        </div>
      `;

      // 4. Send email if SMTP settings are configured
      if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
        try {
          const transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST,
            port: parseInt(process.env.SMTP_PORT || '587'),
            secure: process.env.SMTP_SECURE === 'true' || process.env.SMTP_PORT === '465',
            auth: {
              user: process.env.SMTP_USER,
              pass: process.env.SMTP_PASS,
            },
          });

          await transporter.sendMail({
            from: process.env.SMTP_FROM || `"Portfolio Auth" <${process.env.SMTP_USER}>`,
            to: normalizedEmail,
            subject: 'Your Admin Security Access Code',
            html: htmlBody,
          });

          console.log(`[SMTP] OTP successfully sent to ${normalizedEmail} via SMTP.`);
          emailSent = true;
        } catch (smtpError) {
          console.error('Error dispatching mail via SMTP transporter:', smtpError);
        }
      }

      // 5. Fallback to Resend API Key if SMTP is not configured or failed
      if (!emailSent && process.env.RESEND_API_KEY) {
        try {
          const resendResponse = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
            },
            body: JSON.stringify({
              from: 'Portfolio Auth <onboarding@resend.dev>',
              to: [normalizedEmail],
              subject: 'Your Admin Security Access Code',
              html: htmlBody,
            }),
          });

          if (!resendResponse.ok) {
            const errorDetails = await resendResponse.text();
            console.error('Failed to send email via Resend API:', errorDetails);
          } else {
            console.log(`[RESEND] OTP successfully sent to ${normalizedEmail} via Resend.`);
            emailSent = true;
          }
        } catch (mailError) {
          console.error('Error dispatching mail via Resend API fetch:', mailError);
        }
      }

      // 6. Return response
      // For testing convenience (Demo Mode or mock emails), expose the code in response
      // Only when no real mailer (SMTP or Resend) is configured or succeeded
      const isMockEmail = normalizedEmail === 's89953287@gmail.com' || normalizedEmail.endsWith('@portfolio.com');
      const shouldExposeCode = isMockEmail && !emailSent;
      
      return NextResponse.json({
        success: true,
        message: 'OTP sent successfully',
        demoCode: shouldExposeCode ? generatedCode : null, // Expose code in browser ONLY if no real mailer is set up
      });
    }

    if (action === 'verify') {
      if (!otp) {
        return NextResponse.json({ error: 'OTP is required' }, { status: 400 });
      }

      const cached = otpStore.get(normalizedEmail);

      if (!cached) {
        return NextResponse.json({ error: 'No OTP code found for this email. Please request a new code.' }, { status: 400 });
      }

      if (Date.now() > cached.expiresAt) {
        otpStore.delete(normalizedEmail); // clean up expired code
        return NextResponse.json({ error: 'OTP code has expired. Please request a new code.' }, { status: 400 });
      }

      if (cached.code !== otp.trim()) {
        return NextResponse.json({ error: 'Invalid OTP code. Please try again.' }, { status: 400 });
      }

      // Successful verification
      otpStore.delete(normalizedEmail); // Consume the OTP code
      return NextResponse.json({ success: true, message: 'OTP verified successfully' });
    }

    return NextResponse.json({ error: 'Invalid action specified' }, { status: 400 });
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : 'Server error occurred';
    console.error('Error in /api/admin/otp API:', error);
    return NextResponse.json({ error: errMsg }, { status: 500 });
  }
}
