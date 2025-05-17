import nodemailer from "nodemailer";

// Create a test account or replace with real credentials.
const transport = nodemailer.createTransport({
  host: "live.smtp.mailtrap.io",
  port: 587,
  auth: {
    user: "api",
    pass: "f5aadbad0b49a2e3fe9e99a17d12f863",
  },
});

// Wrap in an async IIFE so we can use await.
export async function sendMail() {
  const info = await transport.sendMail({
    from: "demomailtrap.co",
    to: "justbeltagy@gmail.com",
    subject: "Hello ✔",
    text: "Hello world?",
  });

  console.log("Message sent:", info.messageId);
}
