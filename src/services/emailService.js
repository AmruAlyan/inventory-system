// emailService.js - שירות לשליחת אימיילים

// דוגמה עם Nodemailer (לשרת Node.js)
const nodemailer = require('nodemailer');

// הגדרת שירות האימייל
const transporter = nodemailer.createTransporter({
  service: 'gmail', // או שירות אימייל אחר
  auth: {
    user: 'your-email@gmail.com',
    pass: 'your-app-password' // App Password מ-Gmail
  }
});

// פונקציה לשליחת קוד אימות
export const sendVerificationCode = async (email, code) => {
  const mailOptions = {
    from: 'מערכת ניהול מלאי <noreply@yourdomain.com>',
    to: email,
    subject: 'קוד אימות לאיפוס סיסמה - מערכת ניהול מלאי',
    html: `
      <div dir="rtl" style="font-family: Arial; text-align: right; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #518664, #6ba777); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
          <h1 style="margin: 0;">מערכת ניהול מלאי</h1>
          <p style="margin: 5px 0 0 0; opacity: 0.9;">עמותת ותיקי מטה יהודה</p>
        </div>
        
        <div style="background: white; padding: 40px 30px; border-radius: 0 0 8px 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
          <h2 style="color: #518664; margin-bottom: 20px;">קוד אימות לאיפוס סיסמה</h2>
          
          <p>שלום,</p>
          
          <p>קיבלנו בקשה לאיפוס הסיסמה עבור החשבון שלך במערכת ניהול המלאי.</p>
          
          <div style="background: #f8f9fa; padding: 30px; border-radius: 8px; text-align: center; margin: 30px 0; border: 2px solid #518664;">
            <h3 style="margin: 0 0 15px 0; color: #333;">קוד האימות שלך:</h3>
            <div style="font-size: 48px; font-weight: bold; color: #518664; letter-spacing: 8px; font-family: 'Courier New', monospace;">
              ${code}
            </div>
          </div>
          
          <div style="background: #fff3cd; border: 1px solid #ffeaa7; border-radius: 6px; padding: 15px; margin: 20px 0;">
            <p style="margin: 0; color: #856404;"><strong>⚠️ חשוב לדעת:</strong></p>
            <ul style="margin: 10px 0; padding-right: 20px; color: #856404;">
              <li>קוד זה תקף למשך 5 דקות בלבד</li>
              <li>אל תשתף קוד זה עם אף אחד</li>
              <li>אם לא ביקשת לאפס סיסמה, התעלם מההודעה</li>
            </ul>
          </div>
          
          <p>לאחר הזנת הקוד במערכת, תקבל קישור לאיפוס הסיסמה בהודעה נפרדת.</p>
          
          <p style="margin-top: 30px;">
            בברכה,<br>
            צוות מערכת ניהול המלאי<br>
            עמותת ותיקי מטה יהודה
          </p>
          
          <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
          <p style="font-size: 12px; color: #999; text-align: center;">
            הודעה זו נשלחה אוטומטיה, אנא אל תשיב לכתובת זו.
          </p>
        </div>
      </div>
    `,
    text: `
מערכת ניהול מלאי - קוד אימות

שלום,

קיבלנו בקשה לאיפוס הסיסמה עבור החשבון שלך.

קוד האימות שלך: ${code}

חשוב לדעת:
• קוד זה תקף למשך 5 דקות בלבד
• אל תשתף קוד זה עם אף אחד  
• אם לא ביקשת לאפס סיסמה, התעלם מההודעה

לאחר הזנת הקוד, תקבל קישור לאיפוס הסיסמה.

בברכה,
צוות מערכת ניהול המלאי
עמותת ותיקי מטה יהודה
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    return { success: true };
  } catch (error) {
    console.error('Error sending email:', error);
    throw new Error('Failed to send verification code');
  }
};

// דוגמה עם SendGrid API
import sgMail from '@sendgrid/mail';

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

export const sendVerificationCodeSendGrid = async (email, code) => {
  const msg = {
    to: email,
    from: 'noreply@yourdomain.com',
    subject: 'קוד אימות לאיפוס סיסמה - מערכת ניהול מלאי',
    html: `
      <!-- Same HTML content as above -->
    `,
    text: `
      קוד האימות שלך: ${code}
      תקף למשך 5 דקות בלבד.
    `
  };

  try {
    await sgMail.send(msg);
    return { success: true };
  } catch (error) {
    console.error('Error sending email via SendGrid:', error);
    throw new Error('Failed to send verification code');
  }
};

// שימוש בקוד:
// import { sendVerificationCode } from './emailService.js';
// await sendVerificationCode('user@example.com', '123456');
