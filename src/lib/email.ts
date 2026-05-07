import nodemailer from "nodemailer";

function getTransporter() {
  const user = process.env.EMAIL_USER;
  const pass = process.env.EMAIL_PASS;

  if (!user || !pass) {
    // Dev fallback: log email to console instead of sending
    return null;
  }

  return nodemailer.createTransport({
    service: "gmail",
    auth: { user, pass },
  });
}

export async function sendVerificationEmail(to: string, name: string, token: string) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const verifyUrl = `${appUrl}/api/auth/verify-email?token=${token}`;

  const html = `
    <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:24px;background:#18181b;color:#e4e4e7;border-radius:12px;">
      <h2 style="color:#a855f7;margin-bottom:8px;">Verify your ChatFlow email</h2>
      <p style="color:#a1a1aa;margin-bottom:24px;">Hi ${name}, click the button below to verify your email address.</p>
      <a href="${verifyUrl}" style="display:inline-block;background:#a855f7;color:white;text-decoration:none;padding:12px 24px;border-radius:8px;font-weight:600;">Verify Email</a>
      <p style="color:#71717a;margin-top:24px;font-size:12px;">Link expires in 24 hours. If you didn't create an account, ignore this email.</p>
    </div>
  `;

  const transporter = getTransporter();

  if (!transporter) {
    // Dev mode: print to console
    console.log("\n📧 [EMAIL VERIFICATION — dev mode]");
    console.log(`   To: ${to}`);
    console.log(`   Link: ${verifyUrl}\n`);
    return;
  }

  await transporter.sendMail({
    from: `"ChatFlow" <${process.env.EMAIL_USER}>`,
    to,
    subject: "Verify your ChatFlow account",
    html,
  });
}
