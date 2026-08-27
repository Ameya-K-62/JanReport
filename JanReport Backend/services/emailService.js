import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
  tls: {
    rejectUnauthorized: false,
  },
});


// ================= APPROVAL EMAIL =================

export const sendApprovalEmail = async (email, reportTitle, reason) => {

  const mailOptions = {
    from: `"JanReport Moderation Team" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: "Your News Has Been Approved",

    html: `
    <div style="font-family: Arial, sans-serif; line-height:1.6">

      <h2 style="color: green;">
        Your News Has Been Approved
      </h2>

      <h3>Report Review Result</h3>

      <p><strong>Report Title:</strong> ${reportTitle}</p>

      <p><strong>Moderator Feedback:</strong></p>

      <div style="
        background:#f4f6f8;
        padding:12px;
        border-radius:6px;
        border-left:4px solid green;
      ">
        ${reason}
      </div>

    </div>
    `
  };

  try {

    await transporter.sendMail(mailOptions);
    console.log("Approval email sent");

  } catch (error) {

    console.error("Error sending approval email:", error);

  }

};


// ================= REJECTION EMAIL =================

export const sendRejectionEmail = async (email, reportTitle, reason) => {

  const mailOptions = {
    from: `"JanReport Moderation Team" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: "Your News Has Been Rejected",

    html: `
    <div style="font-family: Arial, sans-serif; line-height:1.6">

      <h2 style="color: red;">
        Your News Has Been Rejected
      </h2>

      <h3>Report Review Result</h3>

      <p><strong>Report Title:</strong> ${reportTitle}</p>

      <p><strong>Moderator Feedback:</strong></p>

      <div style="
        background:#f4f6f8;
        padding:12px;
        border-radius:6px;
        border-left:4px solid red;
      ">
        ${reason}
      </div>

    </div>
    `
  };

  try {

    await transporter.sendMail(mailOptions);
    console.log("Rejection email sent");

  } catch (error) {

    console.error("Error sending rejection email:", error);

  }

};