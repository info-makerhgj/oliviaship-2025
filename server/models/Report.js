import mongoose from 'mongoose';

const reportSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      required: true,
      enum: ['revenue', 'sales', 'customer', 'performance', 'custom'],
      index: true,
    },
    title: {
      type: String,
      required: true,
    },
    description: String,
    period: {
      start: {
        type: Date,
        required: true,
        index: true,
      },
      end: {
        type: Date,
        required: true,
        index: true,
      },
    },
    filters: {
      store: String,
      status: String,
      paymentMethod: String,
      customerId: mongoose.Schema.Types.ObjectId,
      employeeId: mongoose.Schema.Types.ObjectId,
    },
    data: {
      // البيانات المحسوبة للتقرير
      summary: {
        totalRevenue: Number,
        totalOrders: Number,
        totalCustomers: Number,
        averageOrderValue: Number,
        conversionRate: Number,
      },
      details: mongoose.Schema.Types.Mixed, // بيانات تفصيلية حسب نوع التقرير
      charts: mongoose.Schema.Types.Mixed, // بيانات الرسوم البيانية
    },
    format: {
      type: String,
      enum: ['json', 'excel', 'pdf'],
      default: 'json',
    },
    fileUrl: String, // رابط الملف المُصدّر (Excel أو PDF)
    generatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: ['generating', 'completed', 'failed'],
      default: 'generating',
      index: true,
    },
    error: String, // رسالة الخطأ إن وجدت
  },
  {
    timestamps: true,
  }
);

// Indexes للبحث السريع
reportSchema.index({ type: 1, 'period.start': -1 });
reportSchema.index({ generatedBy: 1, createdAt: -1 });
reportSchema.index({ status: 1, createdAt: -1 });

// دالة مساعدة لحساب الفترة
reportSchema.statics.getPeriod = function (periodType) {
  const now = new Date();
  let start, end;

  switch (periodType) {
    case 'today':
      start = new Date(now);
      start.setHours(0, 0, 0, 0);
      end = new Date(now);
      end.setHours(23, 59, 59, 999);
      break;
    case 'yesterday':
      start = new Date(now);
      start.setDate(start.getDate() - 1);
      start.setHours(0, 0, 0, 0);
      end = new Date(start);
      end.setHours(23, 59, 59, 999);
      break;
    case 'this_week':
      start = new Date(now);
      start.setDate(start.getDate() - start.getDay());
      start.setHours(0, 0, 0, 0);
      end = new Date(now);
      end.setHours(23, 59, 59, 999);
      break;
    case 'last_week':
      start = new Date(now);
      start.setDate(start.getDate() - start.getDay() - 7);
      start.setHours(0, 0, 0, 0);
      end = new Date(start);
      end.setDate(end.getDate() + 6);
      end.setHours(23, 59, 59, 999);
      break;
    case 'this_month':
      start = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
      end = new Date(now);
      end.setHours(23, 59, 59, 999);
      break;
    case 'last_month':
      start = new Date(now.getFullYear(), now.getMonth() - 1, 1, 0, 0, 0, 0);
      end = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
      break;
    case 'this_year':
      start = new Date(now.getFullYear(), 0, 1, 0, 0, 0, 0);
      end = new Date(now);
      end.setHours(23, 59, 59, 999);
      break;
    case 'last_year':
      start = new Date(now.getFullYear() - 1, 0, 1, 0, 0, 0, 0);
      end = new Date(now.getFullYear() - 1, 11, 31, 23, 59, 59, 999);
      break;
    case 'all_time':
      start = new Date(2020, 0, 1, 0, 0, 0, 0); // من 2020
      end = new Date(now);
      end.setHours(23, 59, 59, 999);
      break;
    default:
      // آخر 30 يوم
      start = new Date(now);
      start.setDate(start.getDate() - 30);
      start.setHours(0, 0, 0, 0);
      end = new Date(now);
      end.setHours(23, 59, 59, 999);
  }

  console.log(`📅 Period for ${periodType}:`, { start, end });
  return { start, end };
};

// دالة لحذف التقارير القديمة (أكثر من 90 يوم)
reportSchema.statics.cleanOldReports = async function () {
  const ninetyDaysAgo = new Date();
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

  return await this.deleteMany({
    createdAt: { $lt: ninetyDaysAgo },
    status: 'completed',
  });
};

export default mongoose.model('Report', reportSchema);
