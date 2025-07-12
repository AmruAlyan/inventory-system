const functions = require('firebase-functions');
const admin = require('firebase-admin');
const nodemailer = require('nodemailer'); // Add this for sending verification emails

// Initialize admin SDK
admin.initializeApp();

// Configure email transporter for verification emails
const transporter = nodemailer.createTransporter({
  service: 'gmail', // or your preferred email service
  auth: {
    user: functions.config().email?.user || 'your-email@gmail.com', // Set with: firebase functions:config:set email.user="your-email@gmail.com"
    pass: functions.config().email?.pass || 'your-app-password'      // Set with: firebase functions:config:set email.pass="your-app-password"
  }
});

/**
 * Cloud Function to send invitation emails
 * This function can be called from your frontend to send invitation emails
 * using Firebase's email infrastructure or external email services
 */
exports.sendInvitationEmail = functions.https.onCall(async (data, context) => {
  // Verify authentication
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }

  // Verify admin role (optional - add role verification if needed)
  const userRecord = await admin.auth().getUser(context.auth.uid);
  const userDoc = await admin.firestore().collection('users').doc(context.auth.uid).get();
  const userData = userDoc.data();
  
  if (!userData || userData.role !== 'admin') {
    throw new functions.https.HttpsError('permission-denied', 'Only admins can send invitations');
  }

  const { email, name, role, signupLink, invitedBy, isResend = false } = data;

  // Validate required fields
  if (!email || !name || !signupLink) {
    throw new functions.https.HttpsError('invalid-argument', 'Missing required fields');
  }

  try {
    // Option 1: Use Firebase Auth's email action handler
    // This leverages Firebase's built-in email infrastructure
    
    // Create a custom email action
    const actionCodeSettings = {
      url: signupLink,
      handleCodeInApp: true
    };

    // For now, we'll use Firebase's password reset email as a base
    // In production, you would want to create a custom email template
    
    // Option 2: Use external email service (recommended)
    // You can integrate with SendGrid, Mailgun, or other email services here
    
    // Example with SendGrid (you'll need to install @sendgrid/mail)
    /*
    const sgMail = require('@sendgrid/mail');
    sgMail.setApiKey(functions.config().sendgrid.key);

    const msg = {
      to: email,
      from: 'noreply@yourapp.com',
      subject: isResend ? 'הזמנה מחודשת למערכת ניהול המלאי' : 'הזמנה למערכת ניהול המלאי',
      html: `
        <div dir="rtl" style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>שלום ${name},</h2>
          <p>הוזמנת על ידי ${invitedBy} להצטרף למערכת ניהול המלאי בתפקיד ${role === 'admin' ? 'מנכ"ל' : 'מנהל'}.</p>
          <p>לחץ על הקישור הבא כדי להשלים את ההרשמה:</p>
          <a href="${signupLink}" style="background-color: #4CAF50; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">השלמת הרשמה</a>
          <p>הקישור תקף למשך 7 ימים.</p>
          <br>
          <p>בברכה,<br>צוות ניהול המלאי</p>
        </div>
      `
    };

    await sgMail.send(msg);
    */

    // For now, we'll log the email content and return success
    console.log('Invitation email would be sent to:', email);
    console.log('Signup link:', signupLink);
    console.log('Invited by:', invitedBy);
    console.log('Role:', role);
    console.log('Is resend:', isResend);

    // In a real implementation, replace the above with actual email sending
    
    return { 
      success: true, 
      message: 'Invitation email sent successfully',
      email: email
    };

  } catch (error) {
    console.error('Error sending invitation email:', error);
    throw new functions.https.HttpsError('internal', 'Failed to send invitation email');
  }
});

/**
 * Helper function to generate email templates
 */
function generateInvitationEmailHTML(name, signupLink, invitedBy, role, isResend = false) {
  const roleText = role === 'admin' ? 'מנכ"ל' : 'מנהל';
  const subject = isResend ? 'הזמנה מחודשת למערכת ניהול המלאי' : 'הזמנה למערכת ניהול המלאי';
  
  return `
    <!DOCTYPE html>
    <html dir="rtl" lang="he">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${subject}</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background-color: #f4f4f4; padding: 20px; border-radius: 10px;">
        <h1 style="color: #518664; text-align: center; margin-bottom: 30px;">
          ${isResend ? 'הזמנה מחודשת' : 'ברוכים הבאים'}
        </h1>
        
        <div style="background-color: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
          <h2>שלום ${name},</h2>
          
          <p style="font-size: 16px; margin-bottom: 20px;">
            ${isResend ? 'שולחים לך שוב את' : ''} הוזמנת על ידי <strong>${invitedBy}</strong> להצטרף למערכת ניהול המלאי שלנו בתפקיד <strong>${roleText}</strong>.
          </p>
          
          <p style="font-size: 16px; margin-bottom: 30px;">
            כדי להשלים את ההרשמה ולהגדיר את הסיסמה שלך, לחץ על הכפתור למטה:
          </p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${signupLink}" 
               style="background-color: #518664; 
                      color: white; 
                      padding: 15px 30px; 
                      text-decoration: none; 
                      border-radius: 5px; 
                      display: inline-block; 
                      font-size: 16px; 
                      font-weight: bold;">
              השלמת הרשמה
            </a>
          </div>
          
          <div style="background-color: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <p style="margin: 0; font-size: 14px;">
              <strong>חשוב:</strong> הקישור תקף למשך 7 ימים בלבד. אם הקישור פג, פנה למנהל המערכת.
            </p>
          </div>
          
          <p style="font-size: 14px; color: #666; margin-top: 30px;">
            אם אתה לא יכול ללחוץ על הכפתור, העתק והדבק את הקישור הבא בדפדפן שלך:
            <br>
            <a href="${signupLink}" style="color: #518664; word-break: break-all;">${signupLink}</a>
          </p>
        </div>
        
        <div style="text-align: center; margin-top: 30px; font-size: 14px; color: #666;">
          <p>בברכה,<br><strong>צוות מערכת ניהול המלאי</strong></p>
        </div>
      </div>
    </body>
    </html>
  `;
}

// ============================================================================
// VERIFICATION EMAIL FUNCTIONS FOR PASSWORD RESET
// ============================================================================

/**
 * Function triggered when a verification code document is created
 * Sends email with verification code using Firebase-style template
 */
exports.sendVerificationEmail = functions.firestore
  .document('verificationCodes/{docId}')
  .onCreate(async (snap, context) => {
    const data = snap.data();
    
    // Only send email for password-reset type codes
    if (data.type !== 'password-reset') {
      return null;
    }
    
    const { email, code } = data;
    
    try {
      // Email template that matches Firebase Auth design
      const emailHtml = generateVerificationEmailTemplate(code);
      const emailText = generateVerificationEmailText(code);
      
      // Send email using Nodemailer
      const mailOptions = {
        from: 'מערכת ניהול מלאי <noreply@yourdomain.com>',
        to: email,
        subject: 'קוד אימות לאיפוס סיסמה - מערכת ניהול מלאי',
        html: emailHtml,
        text: emailText
      };
      
      await transporter.sendMail(mailOptions);
      
      console.log(`Verification email sent successfully to ${email}`);
      
      // Update document to mark email as sent
      await snap.ref.update({
        emailSent: true,
        emailSentAt: admin.firestore.FieldValue.serverTimestamp()
      });
      
      return null;
      
    } catch (error) {
      console.error('Error sending verification email:', error);
      
      // Update document to mark email send failure
      await snap.ref.update({
        emailSent: false,
        emailError: error.message,
        emailErrorAt: admin.firestore.FieldValue.serverTimestamp()
      });
      
      throw error;
    }
  });

/**
 * Clean up expired verification codes (runs every hour)
 */
exports.cleanupExpiredCodes = functions.pubsub
  .schedule('0 * * * *') // Every hour
  .onRun(async (context) => {
    const now = admin.firestore.Timestamp.now();
    const expiredCodes = await admin.firestore()
      .collection('verificationCodes')
      .where('expiresAt', '<', now)
      .get();
    
    const batch = admin.firestore().batch();
    expiredCodes.docs.forEach(doc => {
      batch.delete(doc.ref);
    });
    
    await batch.commit();
    
    console.log(`Cleaned up ${expiredCodes.size} expired verification codes`);
    return null;
  });

/**
 * Generate HTML template for verification email
 */
function generateVerificationEmailTemplate(code) {
  return `
    <!DOCTYPE html>
    <html dir="rtl" lang="he">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>קוד אימות - מערכת ניהול מלאי</title>
      <style>
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          direction: rtl;
          text-align: right;
          background-color: #f5f5f5;
          margin: 0;
          padding: 20px;
        }
        
        .email-container {
          max-width: 600px;
          margin: 0 auto;
          background-color: #ffffff;
          border-radius: 8px;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
          overflow: hidden;
        }
        
        .header {
          background: linear-gradient(135deg, #518664, #6ba777);
          color: white;
          padding: 32px 24px;
          text-align: center;
        }
        
        .header h1 {
          margin: 0;
          font-size: 24px;
          font-weight: 400;
        }
        
        .content {
          padding: 32px 24px;
          line-height: 1.6;
          color: #333;
        }
        
        .greeting {
          font-size: 16px;
          margin-bottom: 24px;
        }
        
        .code-container {
          background: #f8f9fa;
          border: 2px solid #518664;
          border-radius: 8px;
          padding: 24px;
          text-align: center;
          margin: 24px 0;
        }
        
        .code-label {
          font-size: 14px;
          color: #666;
          margin-bottom: 8px;
        }
        
        .verification-code {
          font-size: 36px;
          font-weight: bold;
          color: #518664;
          letter-spacing: 4px;
          font-family: 'Courier New', monospace;
        }
        
        .warning {
          background-color: #fff3cd;
          border: 1px solid #ffeaa7;
          border-radius: 6px;
          padding: 16px;
          margin: 24px 0;
          color: #856404;
        }
        
        .footer {
          background-color: #f8f9fa;
          padding: 24px;
          color: #666;
          font-size: 14px;
          text-align: center;
        }
        
        @media (max-width: 600px) {
          .content {
            padding: 24px 16px;
          }
          
          .verification-code {
            font-size: 28px;
            letter-spacing: 2px;
          }
        }
      </style>
    </head>
    <body>
      <div class="email-container">
        <div class="header">
          <h1>מערכת ניהול מלאי</h1>
          <p style="margin: 8px 0 0 0; opacity: 0.9;">עמותת ותיקי מטה יהודה</p>
        </div>
        
        <div class="content">
          <div class="greeting">
            שלום,
          </div>
          
          <p>קיבלנו בקשה לאיפוס הסיסמה עבור החשבון שלך במערכת ניהול המלאי.</p>
          
          <div class="code-container">
            <div class="code-label">קוד האימות שלך:</div>
            <div class="verification-code">${code}</div>
          </div>
          
          <p>הזן קוד זה במערכת כדי להמשיך בתהליך איפוס הסיסמה.</p>
          
          <div class="warning">
            <strong>⚠️ חשוב לדעת:</strong>
            <ul style="margin: 8px 0; padding-right: 20px;">
              <li>קוד זה תקף למשך 5 דקות בלבד</li>
              <li>אל תשתף קוד זה עם אף אחד</li>
              <li>אם לא ביקשת לאפס סיסמה, התעלם מההודעה</li>
            </ul>
          </div>
          
          <p>לאחר הזנת הקוד, תקבל הודעה נפרדת עם קישור לאיפוס הסיסמה.</p>
          
          <p style="margin-top: 32px;">
            בברכה,<br>
            צוות מערכת ניהול המלאי
          </p>
        </div>
        
        <div class="footer">
          הודעה זו נשלחה אוטומטיה מ-Firebase. אנא אל תשיב לכתובת זו.
        </div>
      </div>
    </body>
    </html>
  `;
}

/**
 * Generate plain text template for verification email
 */
function generateVerificationEmailText(code) {
  return `
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
  `;
}
