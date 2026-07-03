import { Resend } from 'resend'

function getResend() {
  return new Resend(process.env.RESEND_API_KEY!)
}

export async function sendWelcomeEmail({
  email,
  name,
  productTitle,
  inviteLink,
}: {
  email: string
  name: string
  productTitle: string
  inviteLink: string
}) {
  const firstName = name.split(' ')[0]
  const from = process.env.RESEND_FROM_EMAIL!
  const appUrl = process.env.NEXT_PUBLIC_APP_URL!

  await getResend().emails.send({
    from,
    to: email,
    subject: `Seu acesso ao "${productTitle}" está pronto!`,
    html: `<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f9fafb;font-family:'Helvetica Neue',Arial,sans-serif;color:#111827">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 16px">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:16px;overflow:hidden;border:1px solid #e5e7eb;max-width:600px;width:100%">
        <tr>
          <td style="background:#b48840;padding:32px 40px;text-align:center">
            <p style="margin:0;color:#f5efe3;font-size:13px;font-weight:600;letter-spacing:0.05em;text-transform:uppercase">Thiago Cantalovo · Nutricionista</p>
            <h1 style="margin:8px 0 0;color:#fff;font-size:24px;font-weight:700">Seu acesso foi liberado!</h1>
          </td>
        </tr>
        <tr>
          <td style="padding:40px">
            <p style="margin:0 0 16px;font-size:16px;line-height:1.6">Olá, <strong>${firstName}</strong>!</p>
            <p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:#374151">
              Obrigado pela sua compra. Você agora tem acesso a:
            </p>
            <div style="background:#f5efe3;border:1px solid #f0d98a;border-radius:10px;padding:16px 20px;margin:0 0 24px">
              <p style="margin:0;font-size:16px;font-weight:600;color:#7a5c10">📄 ${productTitle}</p>
            </div>
            <p style="margin:0 0 8px;font-size:15px;line-height:1.6;color:#374151">
              Para acessar o conteúdo, crie sua senha clicando no botão abaixo:
            </p>
            <p style="margin:0 0 28px;font-size:13px;line-height:1.6;color:#6b7280">
              (O link é válido por 24 horas)
            </p>
            <table cellpadding="0" cellspacing="0"><tr><td>
              <a href="${inviteLink}" style="display:inline-block;background:#b48840;color:#fff;font-size:15px;font-weight:600;text-decoration:none;padding:14px 32px;border-radius:10px">
                Criar minha senha e acessar
              </a>
            </td></tr></table>
            <p style="margin:32px 0 0;font-size:13px;color:#9ca3af;line-height:1.6">
              Se o botão não funcionar, copie e cole este link no seu navegador:<br>
              <a href="${inviteLink}" style="color:#b48840;word-break:break-all">${inviteLink}</a>
            </p>
          </td>
        </tr>
        <tr>
          <td style="padding:20px 40px 32px;border-top:1px solid #f3f4f6;text-align:center">
            <p style="margin:0;font-size:12px;color:#9ca3af">
              Thiago Cantalovo Nutricionista · <a href="${appUrl}" style="color:#b48840;text-decoration:none">${appUrl.replace(/^https?:\/\//, '')}</a>
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`,
  })
}

export async function sendCollaboratorInviteEmail({
  email,
  name,
  inviteLink,
}: {
  email: string
  name: string
  inviteLink: string
}) {
  const firstName = name.split(' ')[0]
  const from = process.env.RESEND_FROM_EMAIL!
  const appUrl = process.env.NEXT_PUBLIC_APP_URL!

  await getResend().emails.send({
    from,
    to: email,
    subject: `Você foi adicionado à equipe de Thiago Cantalovo!`,
    html: `<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f9fafb;font-family:'Helvetica Neue',Arial,sans-serif;color:#111827">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 16px">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:16px;overflow:hidden;border:1px solid #e5e7eb;max-width:600px;width:100%">
        <tr>
          <td style="background:#b48840;padding:32px 40px;text-align:center">
            <p style="margin:0;color:#f5efe3;font-size:13px;font-weight:600;letter-spacing:0.05em;text-transform:uppercase">Thiago Cantalovo · Nutricionista</p>
            <h1 style="margin:8px 0 0;color:#fff;font-size:24px;font-weight:700">Seu acesso foi liberado!</h1>
          </td>
        </tr>
        <tr>
          <td style="padding:40px">
            <p style="margin:0 0 16px;font-size:16px;line-height:1.6">Olá, <strong>${firstName}</strong>!</p>
            <p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:#374151">
              Bem vindo(a) ao Time. Você agora tem acesso ao:
            </p>
            <div style="background:#f5efe3;border:1px solid #f0d98a;border-radius:10px;padding:16px 20px;margin:0 0 24px">
              <p style="margin:0;font-size:16px;font-weight:600;color:#7a5c10">🛡️ Painel Admin</p>
            </div>
            <p style="margin:0 0 8px;font-size:15px;line-height:1.6;color:#374151">
              Para acessar o painel, crie sua senha clicando no botão abaixo:
            </p>
            <p style="margin:0 0 28px;font-size:13px;line-height:1.6;color:#6b7280">
              (O link é válido por 24 horas)
            </p>
            <table cellpadding="0" cellspacing="0"><tr><td>
              <a href="${inviteLink}" style="display:inline-block;background:#b48840;color:#fff;font-size:15px;font-weight:600;text-decoration:none;padding:14px 32px;border-radius:10px">
                Criar minha senha e acessar
              </a>
            </td></tr></table>
            <p style="margin:32px 0 0;font-size:13px;color:#9ca3af;line-height:1.6">
              Se o botão não funcionar, copie e cole este link no seu navegador:<br>
              <a href="${inviteLink}" style="color:#b48840;word-break:break-all">${inviteLink}</a>
            </p>
          </td>
        </tr>
        <tr>
          <td style="padding:20px 40px 32px;border-top:1px solid #f3f4f6;text-align:center">
            <p style="margin:0;font-size:12px;color:#9ca3af">
              Thiago Cantalovo Nutricionista · <a href="${appUrl}" style="color:#b48840;text-decoration:none">${appUrl.replace(/^https?:\/\//, '')}</a>
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`,
  })
}

export async function sendAccessGrantedEmail({
  email,
  name,
  productTitle,
}: {
  email: string
  name: string
  productTitle: string
}) {
  const firstName = name.split(' ')[0]
  const from = process.env.RESEND_FROM_EMAIL!
  const appUrl = process.env.NEXT_PUBLIC_APP_URL!

  await getResend().emails.send({
    from,
    to: email,
    subject: `Novo conteúdo liberado: "${productTitle}"`,
    html: `<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f9fafb;font-family:'Helvetica Neue',Arial,sans-serif;color:#111827">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 16px">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:16px;overflow:hidden;border:1px solid #e5e7eb;max-width:600px;width:100%">
        <tr>
          <td style="background:#b48840;padding:32px 40px;text-align:center">
            <p style="margin:0;color:#f5efe3;font-size:13px;font-weight:600;letter-spacing:0.05em;text-transform:uppercase">Thiago Cantalovo · Nutricionista</p>
            <h1 style="margin:8px 0 0;color:#fff;font-size:24px;font-weight:700">Novo conteúdo liberado!</h1>
          </td>
        </tr>
        <tr>
          <td style="padding:40px">
            <p style="margin:0 0 16px;font-size:16px;line-height:1.6">Olá, <strong>${firstName}</strong>!</p>
            <p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:#374151">
              Obrigado pela sua compra. Você agora tem acesso a:
            </p>
            <div style="background:#f5efe3;border:1px solid #f0d98a;border-radius:10px;padding:16px 20px;margin:0 0 28px">
              <p style="margin:0;font-size:16px;font-weight:600;color:#7a5c10">📄 ${productTitle}</p>
            </div>
            <table cellpadding="0" cellspacing="0"><tr><td>
              <a href="${appUrl}/dashboard" style="display:inline-block;background:#b48840;color:#fff;font-size:15px;font-weight:600;text-decoration:none;padding:14px 32px;border-radius:10px">
                Acessar minha área de membros
              </a>
            </td></tr></table>
          </td>
        </tr>
        <tr>
          <td style="padding:20px 40px 32px;border-top:1px solid #f3f4f6;text-align:center">
            <p style="margin:0;font-size:12px;color:#9ca3af">
              Thiago Cantalovo Nutricionista · <a href="${appUrl}" style="color:#b48840;text-decoration:none">${appUrl.replace(/^https?:\/\//, '')}</a>
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`,
  })
}
