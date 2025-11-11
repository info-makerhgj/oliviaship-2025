import Order from '../models/Order.js';
import Payment from '../models/Payment.js';
import User from '../models/User.js';
import Report from '../models/Report.js';

class ReportService {
  /**
   * حساب تقرير الإيرادات
   */
  async calculateRevenueReport(period, filters = {}) {
    const { start, end } = period;

    console.log('📊 Calculating Revenue Report:', { start, end, filters });

    // بناء query للطلبات
    const query = {
      createdAt: { $gte: start, $lte: end },
    };

    if (filters.store) query['product.store'] = filters.store;
    if (filters.status) query.status = filters.status;

    // جلب الطلبات
    const orders = await Order.find(query);

    console.log('📦 Found orders:', orders.length);

    // حساب الإيرادات - دعم كلا الحقلين القديم والجديد
    const totalRevenue = orders.reduce((sum, order) => {
      const revenue = order.pricing?.totalInYER || order.pricing?.totalCost || order.totalAmount || 0;
      return sum + revenue;
    }, 0);
    const totalOrders = orders.length;
    const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    // تجميع حسب المتجر
    const revenueByStore = {};
    orders.forEach((order) => {
      const store = order.product?.store || 'other';
      if (!revenueByStore[store]) {
        revenueByStore[store] = { revenue: 0, orders: 0 };
      }
      const orderRevenue = order.pricing?.totalInYER || order.pricing?.totalCost || order.totalAmount || 0;
      revenueByStore[store].revenue += orderRevenue;
      revenueByStore[store].orders += 1;
    });

    // تجميع حسب اليوم/الشهر
    const revenueByPeriod = this._groupByPeriod(orders, start, end);

    // حساب معدل النمو
    const previousPeriod = this._getPreviousPeriod(start, end);
    const previousOrders = await Order.find({
      createdAt: { $gte: previousPeriod.start, $lte: previousPeriod.end },
    });
    const previousRevenue = previousOrders.reduce((sum, order) => {
      const revenue = order.pricing?.totalInYER || order.pricing?.totalCost || order.totalAmount || 0;
      return sum + revenue;
    }, 0);
    const growthRate =
      previousRevenue > 0 ? ((totalRevenue - previousRevenue) / previousRevenue) * 100 : 0;

    return {
      summary: {
        totalRevenue,
        totalOrders,
        averageOrderValue,
        growthRate,
        previousRevenue,
      },
      details: {
        revenueByStore,
        revenueByPeriod,
      },
      charts: {
        revenueOverTime: revenueByPeriod,
        revenueByStore: Object.entries(revenueByStore).map(([store, data]) => ({
          store,
          ...data,
        })),
      },
    };
  }

  /**
   * حساب تقرير المبيعات
   */
  async calculateSalesReport(period, filters = {}) {
    const { start, end } = period;

    const query = {
      createdAt: { $gte: start, $lte: end },
    };

    if (filters.store) query['product.store'] = filters.store;
    if (filters.status) query.status = filters.status;

    const orders = await Order.find(query);

    // حساب الإحصائيات
    const totalOrders = orders.length;
    const completedOrders = orders.filter((o) => o.status === 'delivered').length;
    const cancelledOrders = orders.filter((o) => o.status === 'cancelled').length;
    const pendingOrders = orders.filter((o) =>
      ['pending', 'confirmed', 'processing'].includes(o.status)
    ).length;

    const conversionRate = totalOrders > 0 ? (completedOrders / totalOrders) * 100 : 0;
    const cancellationRate = totalOrders > 0 ? (cancelledOrders / totalOrders) * 100 : 0;

    // تجميع حسب الحالة
    const ordersByStatus = {};
    orders.forEach((order) => {
      const status = order.status || 'unknown';
      ordersByStatus[status] = (ordersByStatus[status] || 0) + 1;
    });

    // أكثر المنتجات طلباً
    const productCounts = {};
    orders.forEach((order) => {
      const productName = order.product?.name || 'Unknown';
      productCounts[productName] = (productCounts[productName] || 0) + 1;
    });

    const topProducts = Object.entries(productCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([name, count]) => ({ name, count }));

    // تجميع حسب الفترة
    const ordersByPeriod = this._groupByPeriod(orders, start, end, 'count');

    return {
      summary: {
        totalOrders,
        completedOrders,
        cancelledOrders,
        pendingOrders,
        conversionRate,
        cancellationRate,
      },
      details: {
        ordersByStatus,
        topProducts,
        ordersByPeriod,
      },
      charts: {
        ordersOverTime: ordersByPeriod,
        ordersByStatus: Object.entries(ordersByStatus).map(([status, count]) => ({
          status,
          count,
        })),
        topProducts,
      },
    };
  }

  /**
   * حساب تقرير العملاء
   */
  async calculateCustomerReport(period, filters = {}) {
    const { start, end } = period;

    // عملاء جدد
    const newCustomers = await User.find({
      role: 'customer',
      createdAt: { $gte: start, $lte: end },
    });

    // جميع العملاء
    const allCustomers = await User.find({ role: 'customer' });

    // العملاء النشطين (لديهم طلبات في الفترة)
    const activeCustomerIds = await Order.distinct('user', {
      createdAt: { $gte: start, $lte: end },
    });

    // أفضل العملاء (حسب الإنفاق)
    const topCustomers = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: start, $lte: end },
          status: { $ne: 'cancelled' },
        },
      },
      {
        $addFields: {
          orderValue: {
            $ifNull: [
              '$pricing.totalInYER',
              { $ifNull: ['$pricing.totalCost', { $ifNull: ['$totalAmount', 0] }] }
            ]
          }
        }
      },
      {
        $group: {
          _id: '$user',
          totalSpent: { $sum: '$orderValue' },
          orderCount: { $sum: 1 },
        },
      },
      { $sort: { totalSpent: -1 } },
      { $limit: 10 },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'customerInfo',
        },
      },
      { $unwind: '$customerInfo' },
      {
        $project: {
          customerId: '$_id',
          name: '$customerInfo.name',
          email: '$customerInfo.email',
          totalSpent: 1,
          orderCount: 1,
        },
      },
    ]);

    // معدل الاحتفاظ بالعملاء
    const previousPeriod = this._getPreviousPeriod(start, end);
    const previousActiveCustomers = await Order.distinct('user', {
      createdAt: { $gte: previousPeriod.start, $lte: previousPeriod.end },
    });

    const retainedCustomers = activeCustomerIds.filter((id) =>
      previousActiveCustomers.includes(id)
    );
    const retentionRate =
      previousActiveCustomers.length > 0
        ? (retainedCustomers.length / previousActiveCustomers.length) * 100
        : 0;

    // القيمة الدائمة للعميل (LTV)
    const avgOrderValue = await Order.aggregate([
      { $match: { status: { $ne: 'cancelled' } } },
      {
        $addFields: {
          orderValue: {
            $ifNull: [
              '$pricing.totalInYER',
              { $ifNull: ['$pricing.totalCost', { $ifNull: ['$totalAmount', 0] }] }
            ]
          }
        }
      },
      { $group: { _id: null, avg: { $avg: '$orderValue' } } },
    ]);

    const avgOrdersPerCustomer = await Order.aggregate([
      { $match: { status: { $ne: 'cancelled' } } },
      { $group: { _id: '$user', count: { $sum: 1 } } },
      { $group: { _id: null, avg: { $avg: '$count' } } },
    ]);

    const customerLifetimeValue =
      (avgOrderValue[0]?.avg || 0) * (avgOrdersPerCustomer[0]?.avg || 0);

    return {
      summary: {
        totalCustomers: allCustomers.length,
        newCustomers: newCustomers.length,
        activeCustomers: activeCustomerIds.length,
        retentionRate,
        customerLifetimeValue,
      },
      details: {
        topCustomers,
        newCustomersByPeriod: this._groupByPeriod(newCustomers, start, end, 'count'),
      },
      charts: {
        newCustomersOverTime: this._groupByPeriod(newCustomers, start, end, 'count'),
        topCustomers: topCustomers.slice(0, 5),
      },
    };
  }

  /**
   * حساب تقرير الأداء
   */
  async calculatePerformanceReport(period, filters = {}) {
    const { start, end } = period;

    const orders = await Order.find({
      createdAt: { $gte: start, $lte: end },
    }).populate('assignedTo', 'name email');

    // متوسط وقت معالجة الطلب
    const processingTimes = orders
      .filter((o) => o.statusHistory && o.statusHistory.length > 1)
      .map((o) => {
        const created = new Date(o.createdAt);
        const completed = o.statusHistory.find((h) => h.status === 'delivered');
        if (completed) {
          return (new Date(completed.date) - created) / (1000 * 60 * 60 * 24); // أيام
        }
        return null;
      })
      .filter((t) => t !== null);

    const avgProcessingTime =
      processingTimes.length > 0
        ? processingTimes.reduce((a, b) => a + b, 0) / processingTimes.length
        : 0;

    // أداء الموظفين
    const employeePerformance = {};
    orders.forEach((order) => {
      if (order.assignedTo) {
        const empId = order.assignedTo._id.toString();
        if (!employeePerformance[empId]) {
          employeePerformance[empId] = {
            name: order.assignedTo.name,
            email: order.assignedTo.email,
            totalOrders: 0,
            completedOrders: 0,
            cancelledOrders: 0,
          };
        }
        employeePerformance[empId].totalOrders += 1;
        if (order.status === 'delivered') employeePerformance[empId].completedOrders += 1;
        if (order.status === 'cancelled') employeePerformance[empId].cancelledOrders += 1;
      }
    });

    const topEmployees = Object.values(employeePerformance)
      .sort((a, b) => b.completedOrders - a.completedOrders)
      .slice(0, 10);

    // معدل رضا العملاء (من المراجعات إن وجدت)
    // سيتم تحديثه بعد إضافة نظام المراجعات

    return {
      summary: {
        avgProcessingTime,
        totalEmployees: Object.keys(employeePerformance).length,
        avgOrdersPerEmployee:
          Object.keys(employeePerformance).length > 0
            ? orders.length / Object.keys(employeePerformance).length
            : 0,
      },
      details: {
        employeePerformance: topEmployees,
        processingTimeDistribution: this._getDistribution(processingTimes),
      },
      charts: {
        topEmployees: topEmployees.slice(0, 5),
      },
    };
  }

  /**
   * إنشاء تقرير وحفظه
   */
  async generateReport(type, period, filters, userId) {
    try {
      // إنشاء سجل التقرير
      const report = await Report.create({
        type,
        title: this._getReportTitle(type, period),
        description: this._getReportDescription(type, period),
        period,
        filters,
        generatedBy: userId,
        status: 'generating',
      });

      // حساب البيانات حسب النوع
      let data;
      switch (type) {
        case 'revenue':
          data = await this.calculateRevenueReport(period, filters);
          break;
        case 'sales':
          data = await this.calculateSalesReport(period, filters);
          break;
        case 'customer':
          data = await this.calculateCustomerReport(period, filters);
          break;
        case 'performance':
          data = await this.calculatePerformanceReport(period, filters);
          break;
        default:
          throw new Error('نوع تقرير غير صحيح');
      }

      // تحديث التقرير بالبيانات
      report.data = data;
      report.status = 'completed';
      await report.save();

      return report;
    } catch (error) {
      console.error('خطأ في توليد التقرير:', error);
      throw error;
    }
  }

  /**
   * دوال مساعدة
   */

  _groupByPeriod(items, start, end, mode = 'revenue') {
    const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
    const result = [];

    if (days <= 31) {
      // تجميع يومي
      for (let i = 0; i <= days; i++) {
        const date = new Date(start);
        date.setDate(date.getDate() + i);
        const dateStr = date.toISOString().split('T')[0];

        const dayItems = items.filter((item) => {
          const itemDate = new Date(item.createdAt).toISOString().split('T')[0];
          return itemDate === dateStr;
        });

        result.push({
          date: dateStr,
          value:
            mode === 'revenue'
              ? dayItems.reduce((sum, item) => {
                  const revenue = item.pricing?.totalInYER || item.pricing?.totalCost || item.totalAmount || 0;
                  return sum + revenue;
                }, 0)
              : dayItems.length,
        });
      }
    } else {
      // تجميع شهري
      const months = Math.ceil(days / 30);
      for (let i = 0; i < months; i++) {
        const monthStart = new Date(start);
        monthStart.setMonth(monthStart.getMonth() + i);
        const monthEnd = new Date(monthStart);
        monthEnd.setMonth(monthEnd.getMonth() + 1);

        const monthItems = items.filter((item) => {
          const itemDate = new Date(item.createdAt);
          return itemDate >= monthStart && itemDate < monthEnd;
        });

        result.push({
          date: monthStart.toISOString().split('T')[0],
          value:
            mode === 'revenue'
              ? monthItems.reduce((sum, item) => {
                  const revenue = item.pricing?.totalInYER || item.pricing?.totalCost || item.totalAmount || 0;
                  return sum + revenue;
                }, 0)
              : monthItems.length,
        });
      }
    }

    return result;
  }

  _getPreviousPeriod(start, end) {
    const duration = end - start;
    return {
      start: new Date(start - duration),
      end: new Date(start),
    };
  }

  _getDistribution(values) {
    if (values.length === 0) return [];

    const min = Math.min(...values);
    const max = Math.max(...values);
    const range = max - min;
    const bucketSize = range / 5;

    const buckets = Array(5)
      .fill(0)
      .map((_, i) => ({
        range: `${(min + i * bucketSize).toFixed(1)}-${(min + (i + 1) * bucketSize).toFixed(1)}`,
        count: 0,
      }));

    values.forEach((value) => {
      const bucketIndex = Math.min(Math.floor((value - min) / bucketSize), 4);
      buckets[bucketIndex].count += 1;
    });

    return buckets;
  }

  _getReportTitle(type, period) {
    const typeNames = {
      revenue: 'تقرير الإيرادات',
      sales: 'تقرير المبيعات',
      customer: 'تقرير العملاء',
      performance: 'تقرير الأداء',
    };

    const startDate = new Date(period.start).toLocaleDateString('ar-SA');
    const endDate = new Date(period.end).toLocaleDateString('ar-SA');

    return `${typeNames[type]} من ${startDate} إلى ${endDate}`;
  }

  _getReportDescription(type, period) {
    const descriptions = {
      revenue: 'تقرير شامل للإيرادات والمبيعات خلال الفترة المحددة',
      sales: 'تقرير تفصيلي للطلبات والمبيعات',
      customer: 'تقرير عن العملاء الجدد والنشطين',
      performance: 'تقرير أداء الموظفين ومعالجة الطلبات',
    };

    return descriptions[type];
  }
}

export default new ReportService();
