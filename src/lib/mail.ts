/*
App Name: CWL Hardware
App Client: CWL Hardware
Author: James Bryant D. Espino
URL: https://github.com/Jamespino20
Last Update Date: June 13, 2026
*/

import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.gmail.com",
  port: Number(process.env.SMTP_PORT) || 465,
  secure: true,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export async function sendMail({
  to,
  subject,
  html,
}: {
  to: string | string[];
  subject: string;
  html: string;
}) {
  const recipients = Array.isArray(to) ? to : [to];
  const uniqueRecipients = [...new Set(recipients.filter(Boolean))];

  if (uniqueRecipients.length === 0) return;

  const from =
    process.env.SMTP_FROM || "CWL Hardware <noreply@cwlhardware.com>";

  // Send individually so each recipient only sees "to me"
  for (const recipient of uniqueRecipients) {
    try {
      await transporter.sendMail({
        from,
        to: recipient,
        subject,
        html,
      });
    } catch (error) {
      console.error(`Failed to send email to ${recipient}:`, error);
    }
  }
}
