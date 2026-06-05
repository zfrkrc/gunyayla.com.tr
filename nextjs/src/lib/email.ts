const SITE_NAME = process.env.SITE_NAME || "GünYayla"
const SMTP_HOST = process.env.SMTP_HOST || "postaci.zaferkaraca.net"
const SMTP_PORT = parseInt(process.env.SMTP_PORT || "587", 10)
const SMTP_USER = process.env.SMTP_USER || "admin@gunyayla.com.tr"
const SMTP_PASS = process.env.SMTP_PASS || "{,65,erSOnSiANDMicOVAlUsCRairEaBleDIn"
const EMAIL_FROM = process.env.EMAIL_FROM || `${SITE_NAME} <admin@gunyayla.com.tr>`

interface SendEmailParams {
  to: string
  subject: string
  html: string
}

export async function sendEmail({ to, subject, html }: SendEmailParams) {
  let nodemailer
  try {
    nodemailer = await import("nodemailer")
  } catch {
    console.warn("nodemailer yüklü değil, email gönderilemedi")
    return
  }

  const transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: SMTP_PORT,
    secure: SMTP_PORT === 465,
    auth: {
      user: SMTP_USER,
      pass: SMTP_PASS,
    },
  })

  await transporter.sendMail({
    from: EMAIL_FROM,
    to,
    subject,
    html,
  })
}

export function sendVerificationEmail(email: string, url: string) {
  return sendEmail({
    to: email,
    subject: `E-posta adresinizi doğrulayın — ${SITE_NAME}`,
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto">
        <h2 style="color:#2563eb">${SITE_NAME}'ya hoş geldiniz!</h2>
        <p>E-posta adresinizi doğrulamak için aşağıdaki bağlantıya tıklayın:</p>
        <a href="${url}" style="display:inline-block;background:#2563eb;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;margin:16px 0">
          E-posta Doğrula
        </a>
        <p style="color:#666;font-size:13px">Bağlantı 1 saat geçerlidir.</p>
      </div>
    `,
  })
}

export function sendResetPasswordEmail(email: string, url: string) {
  return sendEmail({
    to: email,
    subject: `Şifre sıfırlama — ${SITE_NAME}`,
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto">
        <h2 style="color:#2563eb">Şifre sıfırlama</h2>
        <p>Şifrenizi sıfırlamak için aşağıdaki bağlantıya tıklayın:</p>
        <a href="${url}" style="display:inline-block;background:#2563eb;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;margin:16px 0">
          Şifremi Sıfırla
        </a>
        <p style="color:#666;font-size:13px">Bu isteği siz yapmadıysanız bu e-postayı dikkate almayın.</p>
      </div>
    `,
  })
}
