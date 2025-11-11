import mongoose from 'mongoose';

const invoiceSchema = new mongoose.Schema(
  {
    invoiceNumber: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
      required: true,
      index: true,
    },
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    issueDate: {
      type: Date,
      default: Date.now,
      required: true,
    },
    dueDate: {
      type: Date,
      required: true,
    },
    items: [
      {
        description: {
          type: String,
          required: true,
        },
        quantity: {
          type: Number,
          required: true,
          default: 1,
        },
        unitPrice: {
          type: Number,
          required: true,
        },
        total: {
          type: Number,
          required: true,
        },
      },
    ],
    subtotal: {
      type: Number,
      required: true,
    },
    tax: {
      rate: {
        type: Number,
        default: 15, // 15% VAT
      },
      amount: {
        type: Number,
        required: true,
      },
    },
    discount: {
      type: Number,
      default: 0,
    },
    total: {
      type: Number,
      required: true,
    },
    currency: {
      type: String,
      default: 'SAR',
    },
    totalInYER: {
      type: Number,
    },
    conversionRate: {
      type: Number,
    },
    status: {
      type: String,
      enum: ['draft', 'sent', 'paid', 'overdue', 'cancelled'],
      default: 'draft',
      index: true,
    },
    paidAt: Date,
    paymentMethod: String,
    notes: String,
    companyInfo: {
      name: {
        type: String,
        default: 'Olivia Ship - أوليفيا شيب',
      },
      address: String,
      taxId: String,
      phone: String,
      email: String,
      logo: String,
    },
    customerInfo: {
      name: String,
      email: String,
      phone: String,
      address: String,
    },
    pdfUrl: String, // رابط ملف PDF
    sentAt: Date, // تاريخ الإرسال بالإيميل
  },
  {
    timestamps: true,
  }
);

// Indexes
invoiceSchema.index({ status: 1, createdAt: -1 });
invoiceSchema.index({ customerId: 1, createdAt: -1 });
invoiceSchema.index({ orderId: 1 });

// دالة توليد رقم فاتورة تلقائي
invoiceSchema.statics.generateInvoiceNumber = async function () {
  const year = new Date().getFullYear();
  const prefix = `INV-${year}-`;

  // البحث عن آخر فاتورة في هذه السنة
  const lastInvoice = await this.findOne({
    invoiceNumber: new RegExp(`^${prefix}`),
  }).sort({ createdAt: -1 });

  let number = 1;
  if (lastInvoice) {
    const lastNumber = parseInt(lastInvoice.invoiceNumber.split('-')[2]);
    number = lastNumber + 1;
  }

  return `${prefix}${number.toString().padStart(5, '0')}`;
};

// دالة حساب الإجمالي
invoiceSchema.methods.calculateTotal = function () {
  // حساب المجموع الفرعي
  this.subtotal = this.items.reduce((sum, item) => sum + item.total, 0);

  // حساب الضريبة
  this.tax.amount = (this.subtotal * this.tax.rate) / 100;

  // حساب الإجمالي
  this.total = this.subtotal + this.tax.amount - (this.discount || 0);

  return this.total;
};

// دالة تحديث حالة الفاتورة تلقائياً
invoiceSchema.methods.updateStatus = function () {
  if (this.status === 'paid' || this.status === 'cancelled') {
    return; // لا تغيير للحالات النهائية
  }

  const now = new Date();

  if (this.paidAt) {
    this.status = 'paid';
  } else if (this.dueDate < now && this.status === 'sent') {
    this.status = 'overdue';
  }
};

// Middleware: حساب الإجمالي قبل الحفظ
invoiceSchema.pre('save', function (next) {
  if (this.isModified('items') || this.isModified('tax') || this.isModified('discount')) {
    this.calculateTotal();
  }
  this.updateStatus();
  next();
});

export default mongoose.model('Invoice', invoiceSchema);
