import ContactMessage from '../models/ContactMessage.js';
import { catchAsync } from '../utils/catchAsync.js';
import { sendEmail } from '../utils/emailService.js';
import Settings from '../models/Settings.js';

/**
 * Create new contact message
 */
export const createMessage = catchAsync(async (req, res, next) => {
  const { name, email, phone, subject, message } = req.body;

  if (!name || !email || !subject || !message) {
    return res.status(400).json({
      success: false,
      message: 'جميع الحقول المطلوبة يجب ملؤها',
    });
  }

  const contactMessage = await ContactMessage.create({
    name,
    email,
    phone,
    subject,
    message,
  });

  // Send email notification to admin
  try {
    const settings = await Settings.getSettings();
    const adminEmail = settings.general?.contactEmail || process.env.EMAIL_USER;
    
    if (adminEmail) {
      await sendEmail({
        email: adminEmail,
        subject: `رسالة جديدة من ${name}: ${subject}`,
        html: `
          <div dir="rtl" style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #4F46E5;">رسالة جديدة من موقع التواصل</h2>
            <div style="background: #F3F4F6; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <p><strong>الاسم:</strong> ${name}</p>
              <p><strong>البريد الإلكتروني:</strong> ${email}</p>
              ${phone ? `<p><strong>رقم الهاتف:</strong> ${phone}</p>` : ''}
              <p><strong>الموضوع:</strong> ${subject}</p>
            </div>
            <div style="background: #FFFFFF; padding: 20px; border: 1px solid #E5E7EB; border-radius: 8px;">
              <h3 style="color: #1F2937;">الرسالة:</h3>
              <p style="line-height: 1.6; color: #4B5563;">${message.replace(/\n/g, '<br>')}</p>
            </div>
            <div style="margin-top: 20px; padding: 15px; background: #FEF3C7; border-radius: 8px;">
              <p style="color: #92400E; font-size: 14px;">
                يمكنك الرد على هذه الرسالة من لوحة التحكم في قسم "رسائل الاتصال"
              </p>
            </div>
          </div>
        `,
      });
    }
  } catch (error) {
    console.error('Failed to send email notification:', error);
    // Don't fail the request if email fails
  }

  res.status(201).json({
    success: true,
    message: 'تم إرسال رسالتك بنجاح، سنتواصل معك قريباً',
    contactMessage,
  });
});

/**
 * Get all contact messages (Admin only) or user's own messages
 */
export const getMessages = catchAsync(async (req, res, next) => {
  const { status, search } = req.query;
  
  const query = {};
  
  // If user is not admin, only show their own messages
  if (req.user.role !== 'admin') {
    query.email = req.user.email;
  }
  
  if (status && status !== 'all') {
    query.status = status;
  }
  
  if (search) {
    query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
      { subject: { $regex: search, $options: 'i' } },
      { message: { $regex: search, $options: 'i' } },
    ];
  }

  const messages = await ContactMessage.find(query)
    .populate('repliedBy', 'name email')
    .sort({ createdAt: -1 });

  res.json({
    success: true,
    messages,
  });
});

/**
 * Get single message
 */
export const getMessage = catchAsync(async (req, res, next) => {
  const message = await ContactMessage.findById(req.params.id)
    .populate('repliedBy', 'name email');

  if (!message) {
    return res.status(404).json({
      success: false,
      message: 'الرسالة غير موجودة',
    });
  }

  // Mark as read if new
  if (message.status === 'new') {
    message.status = 'read';
    await message.save();
  }

  res.json({
    success: true,
    message,
  });
});

/**
 * Update message status
 */
export const updateStatus = catchAsync(async (req, res, next) => {
  const { status } = req.body;
  
  const message = await ContactMessage.findByIdAndUpdate(
    req.params.id,
    { status },
    { new: true }
  );

  if (!message) {
    return res.status(404).json({
      success: false,
      message: 'الرسالة غير موجودة',
    });
  }

  res.json({
    success: true,
    message,
  });
});

/**
 * Reply to message
 */
export const replyToMessage = catchAsync(async (req, res, next) => {
  const { replyMessage } = req.body;
  
  if (!replyMessage) {
    return res.status(400).json({
      success: false,
      message: 'رسالة الرد مطلوبة',
    });
  }

  const contactMessage = await ContactMessage.findById(req.params.id);
  
  if (!contactMessage) {
    return res.status(404).json({
      success: false,
      message: 'الرسالة غير موجودة',
    });
  }

  contactMessage.status = 'replied';
  contactMessage.repliedAt = new Date();
  contactMessage.repliedBy = req.user.id;
  contactMessage.replyMessage = replyMessage;

  await contactMessage.save();

  // Send reply email
  try {
    await sendEmail({
      email: contactMessage.email,
      subject: `رد على رسالتك: ${contactMessage.subject}`,
      html: `
        <div dir="rtl" style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #4F46E5;">شكراً لتواصلك معنا</h2>
          <p>عزيزي/عزيزتي ${contactMessage.name},</p>
          <div style="background: #FFFFFF; padding: 20px; border: 1px solid #E5E7EB; border-radius: 8px; margin: 20px 0;">
            <p style="line-height: 1.6; color: #4B5563;">${replyMessage.replace(/\n/g, '<br>')}</p>
          </div>
          <p style="color: #6B7280; font-size: 14px;">مع تحيات فريق الدعم</p>
        </div>
      `,
    });
  } catch (error) {
    console.error('Failed to send reply email:', error);
    // Don't fail the request if email fails
  }

  res.json({
    success: true,
    message: contactMessage,
  });
});

/**
 * Delete message
 */
export const deleteMessage = catchAsync(async (req, res, next) => {
  const message = await ContactMessage.findByIdAndDelete(req.params.id);

  if (!message) {
    return res.status(404).json({
      success: false,
      message: 'الرسالة غير موجودة',
    });
  }

  res.json({
    success: true,
    message: 'تم حذف الرسالة بنجاح',
  });
});

