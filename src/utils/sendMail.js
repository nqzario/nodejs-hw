import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
dotenv.config();

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
});

export const sendEmail = async (options) => {
  return transporter.sendMail(options);
};

transporter
  .verify()
  .then(() => console.log('✅ SMTP connected'))
  .catch((err) => console.error('SMTP ERROR', err));
