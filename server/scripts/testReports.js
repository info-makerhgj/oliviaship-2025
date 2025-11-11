import mongoose from 'mongoose';
import reportService from '../services/reportService.js';
import Report from '../models/Report.js';
import dotenv from 'dotenv';

dotenv.config();

async function testReports() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // تحديد فترة الاختبار (آخر 6 أشهر)
    const end = new Date();
    const start = new Date();
    start.setMonth(start.getMonth() - 6);

    const period = { start, end };

    console.log(`📅 Testing period: ${start.toLocaleDateString()} to ${end.toLocaleDateString()}\n`);

    // اختبار تقرير الإيرادات
    console.log('💰 Testing Revenue Report...');
    try {
      const revenueReport = await reportService.calculateRevenueReport(period, {});
      console.log('✅ Revenue Report Generated:');
      console.log(`   Total Revenue: ${revenueReport.summary.totalRevenue.toLocaleString()} YER`);
      console.log(`   Total Orders: ${revenueReport.summary.totalOrders}`);
      console.log(`   Average Order Value: ${revenueReport.summary.averageOrderValue.toFixed(2)} YER`);
      console.log(`   Growth Rate: ${revenueReport.summary.growthRate.toFixed(2)}%`);
      console.log('   Revenue by Store:');
      Object.entries(revenueReport.details.revenueByStore).forEach(([store, data]) => {
        console.log(`     ${store}: ${data.revenue.toLocaleString()} YER (${data.orders} orders)`);
      });
    } catch (error) {
      console.error('❌ Revenue Report Error:', error.message);
    }

    console.log('\n📊 Testing Sales Report...');
    try {
      const salesReport = await reportService.calculateSalesReport(period, {});
      console.log('✅ Sales Report Generated:');
      console.log(`   Total Orders: ${salesReport.summary.totalOrders}`);
      console.log(`   Completed Orders: ${salesReport.summary.completedOrders}`);
      console.log(`   Cancelled Orders: ${salesReport.summary.cancelledOrders}`);
      console.log(`   Pending Orders: ${salesReport.summary.pendingOrders}`);
      console.log(`   Conversion Rate: ${salesReport.summary.conversionRate.toFixed(2)}%`);
      console.log(`   Cancellation Rate: ${salesReport.summary.cancellationRate.toFixed(2)}%`);
      console.log('   Orders by Status:');
      Object.entries(salesReport.details.ordersByStatus).forEach(([status, count]) => {
        console.log(`     ${status}: ${count}`);
      });
      if (salesReport.details.topProducts.length > 0) {
        console.log('   Top Products:');
        salesReport.details.topProducts.slice(0, 5).forEach((product, i) => {
          console.log(`     ${i + 1}. ${product.name}: ${product.count} orders`);
        });
      }
    } catch (error) {
      console.error('❌ Sales Report Error:', error.message);
    }

    console.log('\n👥 Testing Customer Report...');
    try {
      const customerReport = await reportService.calculateCustomerReport(period, {});
      console.log('✅ Customer Report Generated:');
      console.log(`   Total Customers: ${customerReport.summary.totalCustomers}`);
      console.log(`   New Customers: ${customerReport.summary.newCustomers}`);
      console.log(`   Active Customers: ${customerReport.summary.activeCustomers}`);
      console.log(`   Retention Rate: ${customerReport.summary.retentionRate.toFixed(2)}%`);
      console.log(`   Customer Lifetime Value: ${customerReport.summary.customerLifetimeValue.toFixed(2)} YER`);
      if (customerReport.details.topCustomers.length > 0) {
        console.log('   Top Customers:');
        customerReport.details.topCustomers.slice(0, 5).forEach((customer, i) => {
          console.log(`     ${i + 1}. ${customer.name}: ${customer.totalSpent.toLocaleString()} YER (${customer.orderCount} orders)`);
        });
      }
    } catch (error) {
      console.error('❌ Customer Report Error:', error.message);
    }

    console.log('\n📈 Testing Performance Report...');
    try {
      const performanceReport = await reportService.calculatePerformanceReport(period, {});
      console.log('✅ Performance Report Generated:');
      console.log(`   Avg Processing Time: ${performanceReport.summary.avgProcessingTime.toFixed(2)} days`);
      console.log(`   Total Employees: ${performanceReport.summary.totalEmployees}`);
      console.log(`   Avg Orders/Employee: ${performanceReport.summary.avgOrdersPerEmployee.toFixed(2)}`);
      if (performanceReport.details.employeePerformance.length > 0) {
        console.log('   Top Employees:');
        performanceReport.details.employeePerformance.slice(0, 5).forEach((emp, i) => {
          console.log(`     ${i + 1}. ${emp.name}: ${emp.completedOrders}/${emp.totalOrders} completed`);
        });
      }
    } catch (error) {
      console.error('❌ Performance Report Error:', error.message);
    }

    console.log('\n✅ All tests completed!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

testReports();
