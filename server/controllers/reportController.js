import reportService from '../services/reportService.js';
import Report from '../models/Report.js';
import excelExport from '../utils/excelExport.js';
import pdfExport from '../utils/pdfExport.js';
import { catchAsync } from '../utils/catchAsync.js';
import { AppError } from '../utils/appError.js';

/**
 * الحصول على تقرير الإيرادات
 */
export const getRevenueReport = catchAsync(async (req, res) => {
  const { periodType, startDate, endDate, store, status } = req.query;

  // تحديد الفترة
  let period;
  if (startDate && endDate) {
    period = {
      start: new Date(startDate),
      end: new Date(endDate),
    };
  } else {
    period = Report.getPeriod(periodType || 'this_month');
  }

  // الفلاتر
  const filters = {};
  if (store) filters.store = store;
  if (status) filters.status = status;

  // حساب التقرير
  const data = await reportService.calculateRevenueReport(period, filters);

  res.status(200).json({
    success: true,
    data,
  });
});

/**
 * الحصول على تقرير المبيعات
 */
export const getSalesReport = catchAsync(async (req, res) => {
  const { periodType, startDate, endDate, store, status } = req.query;

  let period;
  if (startDate && endDate) {
    period = {
      start: new Date(startDate),
      end: new Date(endDate),
    };
  } else {
    period = Report.getPeriod(periodType || 'this_month');
  }

  const filters = {};
  if (store) filters.store = store;
  if (status) filters.status = status;

  const data = await reportService.calculateSalesReport(period, filters);

  res.status(200).json({
    success: true,
    data,
  });
});

/**
 * الحصول على تقرير العملاء
 */
export const getCustomerReport = catchAsync(async (req, res) => {
  const { periodType, startDate, endDate } = req.query;

  let period;
  if (startDate && endDate) {
    period = {
      start: new Date(startDate),
      end: new Date(endDate),
    };
  } else {
    period = Report.getPeriod(periodType || 'this_month');
  }

  const data = await reportService.calculateCustomerReport(period);

  res.status(200).json({
    success: true,
    data,
  });
});

/**
 * الحصول على تقرير الأداء
 */
export const getPerformanceReport = catchAsync(async (req, res) => {
  const { periodType, startDate, endDate, employeeId } = req.query;

  let period;
  if (startDate && endDate) {
    period = {
      start: new Date(startDate),
      end: new Date(endDate),
    };
  } else {
    period = Report.getPeriod(periodType || 'this_month');
  }

  const filters = {};
  if (employeeId) filters.employeeId = employeeId;

  const data = await reportService.calculatePerformanceReport(period, filters);

  res.status(200).json({
    success: true,
    data,
  });
});

/**
 * توليد وحفظ تقرير
 */
export const generateReport = catchAsync(async (req, res) => {
  const { type, periodType, startDate, endDate, filters } = req.body;

  if (!type) {
    throw new AppError('نوع التقرير مطلوب', 400);
  }

  // تحديد الفترة
  let period;
  if (startDate && endDate) {
    period = {
      start: new Date(startDate),
      end: new Date(endDate),
    };
  } else {
    period = Report.getPeriod(periodType || 'this_month');
  }

  // توليد التقرير
  const report = await reportService.generateReport(type, period, filters || {}, req.user._id);

  res.status(201).json({
    success: true,
    message: 'تم توليد التقرير بنجاح',
    data: report,
  });
});

/**
 * الحصول على قائمة التقارير المحفوظة
 */
export const getReports = catchAsync(async (req, res) => {
  const { type, status, page = 1, limit = 10 } = req.query;

  const query = {};
  if (type) query.type = type;
  if (status) query.status = status;

  const skip = (page - 1) * limit;

  const reports = await Report.find(query)
    .populate('generatedBy', 'name email')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(parseInt(limit));

  const total = await Report.countDocuments(query);

  res.status(200).json({
    success: true,
    data: reports,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / limit),
    },
  });
});

/**
 * الحصول على تقرير محدد
 */
export const getReport = catchAsync(async (req, res) => {
  const report = await Report.findById(req.params.id).populate('generatedBy', 'name email');

  if (!report) {
    throw new AppError('التقرير غير موجود', 404);
  }

  res.status(200).json({
    success: true,
    data: report,
  });
});

/**
 * حذف تقرير
 */
export const deleteReport = catchAsync(async (req, res) => {
  const report = await Report.findById(req.params.id);

  if (!report) {
    throw new AppError('التقرير غير موجود', 404);
  }

  await report.deleteOne();

  res.status(200).json({
    success: true,
    message: 'تم حذف التقرير بنجاح',
  });
});

/**
 * تصدير تقرير (Excel أو PDF)
 */
export const exportReport = catchAsync(async (req, res) => {
  const { id } = req.params;
  const { format } = req.query; // 'excel' or 'pdf'

  const report = await Report.findById(id);

  if (!report) {
    throw new AppError('التقرير غير موجود', 404);
  }

  if (!['excel', 'pdf'].includes(format)) {
    throw new AppError('صيغة التصدير غير صحيحة. استخدم excel أو pdf', 400);
  }

  let result;
  if (format === 'excel') {
    result = await excelExport.exportReport(report);
  } else {
    result = await pdfExport.exportReport(report);
  }

  // تحديث التقرير بمعلومات الملف
  report.format = format;
  report.fileUrl = result.fileUrl;
  await report.save();

  res.status(200).json({
    success: true,
    message: `تم تصدير التقرير بصيغة ${format} بنجاح`,
    data: {
      reportId: id,
      format,
      fileUrl: result.fileUrl,
      fileName: result.fileName,
    },
  });
});

/**
 * حذف التقارير القديمة (أكثر من 90 يوم)
 */
export const cleanOldReports = catchAsync(async (req, res) => {
  const result = await Report.cleanOldReports();

  res.status(200).json({
    success: true,
    message: `تم حذف ${result.deletedCount} تقرير قديم`,
    data: {
      deletedCount: result.deletedCount,
    },
  });
});
