# הוראות התאמת תבנית אימייל איפוס סיסמה - Firebase

## דרך 1: התאמה דרך Firebase Console (מומלץ)

### שלבים:
1. **היכנס ל-Firebase Console**: https://console.firebase.google.com
2. **בחר את הפרויקט שלך**
3. **עבור ל-Authentication** → **Templates**
4. **לחץ על "Password reset"**
5. **התאם את התבנית:**

### תוכן מותאם בעברית:

#### **נושא האימייל:**
```
איפוס סיסמה - מערכת ניהול מלאי
```

#### **תוכן האימייל:**
```html
<p>שלום,</p>

<p>קיבלנו בקשה לאיפוס הסיסמה עבור החשבון שלך במערכת ניהול המלאי של עמותת ותיקי מטה יהודה.</p>

<p>לאיפוס הסיסמה, לחץ על הקישור הבא:</p>
<p><a href="%LINK%">אפס את הסיסמה שלי</a></p>

<p><strong>חשוב לדעת:</strong></p>
<ul>
  <li>קישור זה תקף למשך שעה אחת בלבד</li>
  <li>אם לא ביקשת לאפס את הסיסמה, התעלם מהודעה זו</li>
  <li>הסיסמה הנוכחית שלך תישאר פעילה עד שתגדיר סיסמה חדשה</li>
</ul>

<p>לשאלות או בעיות, צור קשר עם מנהל המערכת.</p>

<p>בברכה,<br>
צוות מערכת ניהול המלאי<br>
עמותת ותיקי מטה יהודה</p>

<hr>
<p style="font-size: 12px; color: #666;">
הודעה זו נשלחה אוטומטיה, אנא אל תשיב לכתובת זו.
</p>
```

## דרך 2: שימוש ב-Action URL מותאם

### הוספת Action URL מותאם:
1. **Firebase Console** → **Authentication** → **Settings**
2. **Authorized domains** - הוסף את הדומיין שלך
3. **Single page web app URL** - הגדר URL מותאם

### דוגמה:
```javascript
// ב-Login.jsx, ניתן להוסיף actionCodeSettings
const actionCodeSettings = {
  url: 'https://yourdomain.com/reset-password', // הדף שלך לאיפוס סיסמה
  handleCodeInApp: true,
  iOS: {
    bundleId: 'com.yourapp.ios'
  },
  android: {
    packageName: 'com.yourapp.android',
    installApp: true,
    minimumVersion: '12'
  },
  dynamicLinkDomain: 'yourapp.page.link'
};

await sendPasswordResetEmail(auth, resetEmail, actionCodeSettings);
```

## דרך 3: הטמעת שירות אימייל מותאם

### יתרונות:
- שליטה מלאה על עיצוב האימייל
- תמיכה מלאה בעברית ו-RTL
- אפשרות להוסיף לוגו ומיתוג
- גמישות בתוכן ובפונקציונליות

### שירותי אימייל מומלצים:
- **SendGrid** (חינמי עד 100 אימיילים ביום)
- **Mailgun** (חינמי עד 5,000 אימיילים בחודש)
- **Amazon SES** (זול מאוד)
- **Nodemailer** (עם Gmail/Outlook)

## הגדרת Firebase Functions לאימייל מותאם

### התקנה:
```bash
npm install -g firebase-tools
firebase init functions
cd functions
npm install nodemailer
```

### קוד דוגמה:
```javascript
// functions/index.js
const functions = require('firebase-functions');
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransporter({
  service: 'gmail',
  auth: {
    user: 'your-email@gmail.com',
    pass: 'your-app-password'
  }
});

exports.sendCustomPasswordReset = functions.https.onCall(async (data, context) => {
  const { email, resetLink } = data;
  
  const mailOptions = {
    from: 'מערכת ניהול מלאי <noreply@yourdomain.com>',
    to: email,
    subject: 'איפוס סיסמה - מערכת ניהול מלאי',
    html: `
      <!-- כאן תכניס את התבנית HTML -->
      <div dir="rtl">
        <h2>איפוס סיסמה</h2>
        <p>לחץ <a href="${resetLink}">כאן</a> לאיפוס הסיסמה</p>
      </div>
    `
  };
  
  await transporter.sendMail(mailOptions);
  return { success: true };
});
```

## הערות חשובות:

1. **Firebase Console הוא הדרך הפשוטה ביותר** - מומלץ להתחיל משם
2. **%LINK%** ב-Firebase הוא placeholder שמוחלף אוטומטית בקישור לאיפוס
3. **אל תשכח להגדיר Authorized Domains** ב-Firebase Console
4. **בדוק שהאימיילים לא נכנסים לספאם** - הוסף SPF ו-DKIM records
5. **תמיד בדוק על מכשירים ועל דפדפנים שונים**

## בדיקה:
1. הזן אימייל קיים בטופס "שכחת סיסמה"
2. בדוק את תיבת הדואר (כולל ספאם)
3. ודא שהקישור עובד ומוביל לדף איפוס הסיסמה
4. בדוק שהאימייל נראה טוב במכשירים שונים
