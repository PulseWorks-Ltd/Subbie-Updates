import sgMail from "@sendgrid/mail";

const apiKey = process.env.SENDGRID_API_KEY;

if (apiKey) {
  sgMail.setApiKey(apiKey);
}

export async function sendUpdateEmail({
  to,
  from,
  subject,
  text,
  html,
}: {
  to: string;
  from: string;
  subject: string;
  text: string;
  html?: string;
}) {
  if (!apiKey) {
    return;
  }

  await sgMail.send({
    to,
    from,
    subject,
    text,
    html,
  });
}
