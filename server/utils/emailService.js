import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import Settings from '../models/Settings.js';

dotenv.config();

const createTransporter = async () => {
  // Try to get SMTP settings from database first
  const settings = await Settings.getSettings();
  const emailSettings = settings.notifications;

  // Use database settings if available, otherwise fall back to .env
  const host = emailSettings?.smtpHost || process.env.EMAIL_HOST;
  const port = emailSettings?.smtpPort || parseInt(process.env.EMAIL_PORT) || 587;
  const user = emailSettings?.smtpUser || process.env.EMAIL_USER;
  const pass = emailSettings?.smtpPassword || process.env.EMAIL_PASS;

  if (!host || !user || !pass) {
    throw new Error('SMTP settings not configured');
  }

  return nodemailer.createTransporter({
    host,
    port,
    secure: port === 465,
    auth: {
      user,
      pass,
    },
  });
};

export const sendEmail = async (options) => {
  try {
    // Check if email notifications are enabled
    const settings = await Settings.getSettings();
    if (!settings.notifications?.emailNotifications) {
      return { success: false, error: 'Email notifications are disabled' };
    }

    const transporter = await createTransporter();
    const emailFrom = settings.general?.contactEmail || process.env.EMAIL_USER;
    const siteName = settings.general?.siteName || 'منصة التوصيل العالمي';

    const mailOptions = {
      from: `"${siteName}" <${emailFrom}>`,
      to: options.email,
      subject: options.subject,
      html: options.html,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Email error:', error);
    return { success: false, error: error.message };
  }
};

export const sendOrderConfirmationEmail = async (user, order) => {
  const html = `
    <div style="font-family: 'Cairo', Arial, sans-serif; direction: rtl; text-align: right;">
      <h2>مرحباً ${user.name}</h2>
      <p>تم تأكيد طلبك بنجاح!</p>
      <p><strong>رقم الطلب:</strong> ${order.orderNumber}</p>
      <p><strong>المبلغ الإجمالي:</strong> ${order.pricing.totalInYER} ريال يمني</p>
      <p>شكراً لك على استخدام منصتنا!</p>
    </div>
  `;

  return await sendEmail({
    email: user.email,
    subject: 'تأكيد طلبك - منصة التوصيل العالمي',
    html,
  });
};

/**
 * إرسال فاتورة بالإيميل
 */
export const sendInvoiceEmail = async (invoice, pdfPath) => {
  try {
    // Check if email notifications are enabled
    const settings = await Settings.getSettings();
    if (!settings.notifications?.emailNotifications) {
      return { success: false, error: 'Email notifications are disabled' };
    }

    const transporter = await createTransporter();
    const emailFrom = settings.general?.contactEmail || process.env.EMAIL_USER;
    const siteName = settings.general?.siteName || 'Olivia Ship';

    // تنسيق المبلغ
    const formatCurrency = (amount) => {
      return new Intl.NumberFormat('ar-SA', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
      }).format(amount);
    };

    // HTML للإيميل
    const html = `
      <!DOCTYPE html>
      <html lang="ar" dir="rtl">
      <head>
        <meta charset="UTF-8">
        <style>
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            direction: rtl;
            text-align: right;
            background: #f5f5f5;
            margin: 0;
            padding: 20px;
          }
          .container {
            max-width: 600px;
            margin: 0 auto;
            background: white;
            border-radius: 10px;
            overflow: hidden;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
          }
          .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 30px;
            text-align: center;
          }
          .header h1 {
            margin: 0;
            font-size: 28px;
          }
          .content {
            padding: 30px;
          }
          .invoice-info {
            background: #f8f9fa;
            padding: 20px;
            border-radius: 8px;
            margin: 20px 0;
          }
          .invoice-info p {
            margin: 10px 0;
            font-size: 16px;
          }
          .invoice-info strong {
            color: #667eea;
          }
          .amount {
            font-size: 32px;
            font-weight: bold;
            color: #667eea;
            text-align: center;
            margin: 20px 0;
          }
          .status {
            display: inline-block;
            padding: 8px 20px;
            border-radius: 20px;
            font-weight: bold;
            font-size: 14px;
          }
          .status-paid {
            background: #d4edda;
            color: #155724;
          }
          .status-pending {
            background: #fff3cd;
            color: #856404;
          }
          .button {
            display: inline-block;
            background: #667eea;
            color: white;
            padding: 12px 30px;
            text-decoration: none;
            border-radius: 5px;
            margin: 20px 0;
            font-weight: bold;
          }
          .footer {
            background: #f8f9fa;
            padding: 20px;
            text-align: center;
            color: #666;
            font-size: 14px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>📄 فاتورة جديدة</h1>
          </div>
          <div class="content">
            <p>عزيزي/عزيزتي <strong>${invoice.customerInfo.name}</strong>،</p>
            <p>نرسل لك فاتورة طلبك. يرجى مراجعة التفاصيل أدناه:</p>
            
            <div class="invoice-info">
              <p><strong>رقم الفاتورة:</strong> ${invoice.invoiceNumber}</p>
              <p><strong>تاريخ الإصدار:</strong> ${new Date(invoice.createdAt).toLocaleDateString('ar-SA')}</p>
              <p><strong>تاريخ الاستحقاق:</strong> ${new Date(invoice.dueDate).toLocaleDateString('ar-SA')}</p>
              <p><strong>الحالة:</strong> 
                <span class="status status-${invoice.status}">
                  ${invoice.status === 'paid' ? 'مدفوعة' : invoice.status === 'pending' ? 'قيد الانتظار' : invoice.status}
                </span>
              </p>
            </div>

            <div class="amount">
              ${formatCurrency(invoice.total)} ${invoice.currency}
            </div>

            <p style="text-align: center;">
              <strong>المجموع الفرعي:</strong> ${formatCurrency(invoice.subtotal)} ${invoice.currency}<br>
              <strong>الضريبة (${invoice.tax.rate}%):</strong> ${formatCurrency(invoice.tax.amount)} ${invoice.currency}
            </p>

            ${invoice.notes ? `<p style="background: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;"><strong>ملاحظات:</strong><br>${invoice.notes}</p>` : ''}

            <p style="text-align: center;">
              الفاتورة الكاملة مرفقة مع هذا الإيميل بصيغة PDF.
            </p>
          </div>
          <div class="footer">
            <p>شكراً لتعاملكم معنا!</p>
            <p>${invoice.companyInfo.name}</p>
            ${invoice.companyInfo.email ? `<p>${invoice.companyInfo.email}</p>` : ''}
            ${invoice.companyInfo.phone ? `<p>${invoice.companyInfo.phone}</p>` : ''}
          </div>
        </div>
      </body>
      </html>
    `;

    const mailOptions = {
      from: `"${siteName}" <${emailFrom}>`,
      to: invoice.customerInfo.email,
      subject: `فاتورة ${invoice.invoiceNumber} - ${siteName}`,
      html,
      attachments: pdfPath ? [
        {
          filename: `invoice_${invoice.invoiceNumber}.pdf`,
          path: pdfPath,
        },
      ] : [],
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Invoice email sent:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Invoice email error:', error);
    return { success: false, error: error.message };
  }
};
