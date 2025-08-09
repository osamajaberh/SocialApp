import nodemailer from "nodemailer"


export const sendEmail =async ({
     to=[],
    cc=[],
    bcc=[],
    html="",
    subject="SocialApp",
    attachments=[]
})=>{
 

// Create a test account or replace with real credentials.
const transporter = nodemailer.createTransport({
 service:"gmail",
 
  auth: {
    user: process.env.EMAIL,
    pass: process.env.EMAIL_PASS,
  },
});

// Wrap in an async IIFE so we can use await.

const info = await transporter.sendMail({
    from: `SocialApp <${process.env.EMAIL}`,
    to,
    cc,
    bcc,
    html,
    subject,
    attachments
  });

  console.log("Message sent:", info.messageId);

}
