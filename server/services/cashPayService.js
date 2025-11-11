import axios from 'axios';
import crypto from 'crypto';

/**
 * Cash Pay Service
 * خدمة تكامل Cash Pay للدفع الإلكتروني
 * 
 * TODO: استبدال القيم المبدئية بالقيم الحقيقية عند الحصول على API credentials
 */

/**
 * Generate signature for Cash Pay API requests
 * إنشاء توقيع للطلبات
 */
const generateSignature = (params, secret) => {
  // TODO: تعديل حسب طريقة التوقيع التي يطلبها Cash Pay
  const sortedParams = Object.keys(params)
    .sort()
    .map(key => `${key}=${params[key]}`)
    .join('&');
  
  const signature = crypto
    .createHmac('sha256', secret)
    .update(sortedParams)
    .digest('hex');
  
  return signature;
};

/**
 * Create payment request to Cash Pay
 * إنشاء طلب دفع عبر Cash Pay
 * 
 * @param {Object} paymentData - بيانات الدفع
 * @param {Number} paymentData.amount - المبلغ
 * @param {String} paymentData.currency - العملة (YER)
 * @param {String} paymentData.orderNumber - رقم الطلب
 * @param {String} paymentData.customerName - اسم العميل
 * @param {String} paymentData.customerPhone - رقم هاتف العميل
 * @param {String} paymentData.customerEmail - بريد العميل (اختياري)
 * @param {String} paymentData.description - وصف الدفعة
 * @param {String} paymentData.returnUrl - رابط العودة بعد الدفع
 * @param {String} paymentData.cancelUrl - رابط الإلغاء
 * @param {Object} config - إعدادات Cash Pay من قاعدة البيانات
 * @param {String} config.apiKey - API Key
 * @param {String} config.apiSecret - API Secret
 * @param {String} config.merchantId - Merchant ID
 * @param {String} config.baseUrl - Base URL
 * @returns {Promise<Object>} - Response from Cash Pay
 */
export const createPaymentRequest = async (paymentData, config) => {
  try {
    const {
      amount,
      currency = 'YER',
      orderNumber,
      customerName,
      customerPhone,
      customerEmail,
      description,
      returnUrl,
      cancelUrl,
    } = paymentData;

    // التحقق من البيانات المطلوبة
    if (!amount || !orderNumber || !customerName || !customerPhone) {
      throw new Error('البيانات المطلوبة غير مكتملة');
    }

    // التحقق من الإعدادات
    if (!config || !config.apiKey || !config.apiSecret || !config.merchantId) {
      throw new Error('إعدادات Cash Pay غير مكتملة. يرجى التحقق من الإعدادات.');
    }

    const baseUrl = config.baseUrl || 'https://api.cash.com.ye';

    // بناء بيانات الطلب
    const requestData = {
      merchant_id: config.merchantId,
      amount: amount,
      currency: currency,
      order_id: orderNumber,
      customer_name: customerName,
      customer_phone: customerPhone,
      customer_email: customerEmail || '',
      description: description || `دفعة للطلب رقم ${orderNumber}`,
      return_url: returnUrl,
      cancel_url: cancelUrl,
      timestamp: new Date().toISOString(),
    };

    // TODO: تعديل حسب طريقة التوقيع التي يطلبها Cash Pay
    const signature = generateSignature(requestData, config.apiSecret);
    requestData.signature = signature;

    // TODO: تعديل endpoint حسب الـ API الحقيقي
    const endpoint = `${baseUrl}/api/v1/payments/create`;
    
    // إرسال الطلب
    const response = await axios.post(endpoint, requestData, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.apiKey}`,
        // TODO: تعديل headers حسب متطلبات Cash Pay
      },
      timeout: 30000, // 30 seconds
    });

    return {
      success: true,
      data: response.data,
      paymentUrl: response.data.payment_url, // TODO: تعديل حسب استجابة Cash Pay
      transactionId: response.data.transaction_id, // TODO: تعديل حسب استجابة Cash Pay
    };
  } catch (error) {
    console.error('Cash Pay API Error:', error.response?.data || error.message);
    throw new Error(
      error.response?.data?.message || 
      error.message || 
      'حدث خطأ في الاتصال بخدمة الدفع'
    );
  }
};

/**
 * Verify payment status from Cash Pay
 * التحقق من حالة الدفعة من Cash Pay
 * 
 * @param {String} transactionId - رقم المعاملة
 * @param {Object} config - إعدادات Cash Pay من قاعدة البيانات
 * @returns {Promise<Object>} - Payment status
 */
export const verifyPaymentStatus = async (transactionId, config) => {
  try {
    if (!transactionId) {
      throw new Error('رقم المعاملة مطلوب');
    }

    if (!config || !config.apiKey || !config.apiSecret || !config.merchantId) {
      throw new Error('إعدادات Cash Pay غير مكتملة. يرجى التحقق من الإعدادات.');
    }

    const baseUrl = config.baseUrl || 'https://api.cash.com.ye';

    // TODO: تعديل endpoint حسب الـ API الحقيقي
    const endpoint = `${baseUrl}/api/v1/payments/verify/${transactionId}`;
    
    const params = {
      merchant_id: config.merchantId,
      transaction_id: transactionId,
      timestamp: new Date().toISOString(),
    };

    const signature = generateSignature(params, config.apiSecret);
    params.signature = signature;

    const response = await axios.get(endpoint, {
      params,
      headers: {
        'Authorization': `Bearer ${config.apiKey}`,
      },
      timeout: 30000,
    });

    return {
      success: true,
      status: response.data.status, // 'paid', 'pending', 'failed', 'cancelled'
      data: response.data,
    };
  } catch (error) {
    console.error('Cash Pay Verify Error:', error.response?.data || error.message);
    throw new Error(
      error.response?.data?.message || 
      error.message || 
      'حدث خطأ في التحقق من حالة الدفعة'
    );
  }
};

/**
 * Handle Cash Pay webhook callback
 * معالجة استدعاء webhook من Cash Pay
 * 
 * @param {Object} webhookData - بيانات الـ webhook
 * @param {Object} config - إعدادات Cash Pay من قاعدة البيانات
 * @returns {Promise<Object>} - Verification result
 */
export const handleWebhook = async (webhookData, config) => {
  try {
    if (!config || !config.apiSecret) {
      throw new Error('إعدادات Cash Pay غير مكتملة');
    }

    // TODO: التحقق من صحة التوقيع حسب طريقة Cash Pay
    const receivedSignature = webhookData.signature;
    const { signature, ...dataToVerify } = webhookData;
    
    const calculatedSignature = generateSignature(dataToVerify, config.apiSecret);
    
    // التحقق من التوقيع
    if (receivedSignature !== calculatedSignature) {
      throw new Error('توقيع غير صحيح');
    }

    // TODO: تعديل حسب بيانات webhook من Cash Pay
    return {
      success: true,
      transactionId: webhookData.transaction_id,
      orderId: webhookData.order_id,
      status: webhookData.status, // 'paid', 'failed', 'cancelled'
      amount: webhookData.amount,
      currency: webhookData.currency,
      data: webhookData,
    };
  } catch (error) {
    console.error('Cash Pay Webhook Error:', error.message);
    throw error;
  }
};

/**
 * Refund payment through Cash Pay
 * إرجاع دفعة عبر Cash Pay
 * 
 * @param {String} transactionId - رقم المعاملة
 * @param {Number} amount - المبلغ المراد إرجاعه (اختياري - للرجوع الجزئي)
 * @param {String} reason - سبب الإرجاع
 * @param {Object} config - إعدادات Cash Pay من قاعدة البيانات
 * @returns {Promise<Object>} - Refund result
 */
export const refundPayment = async (transactionId, amount = null, reason = '', config) => {
  try {
    if (!transactionId) {
      throw new Error('رقم المعاملة مطلوب');
    }

    if (!config || !config.apiKey || !config.apiSecret || !config.merchantId) {
      throw new Error('إعدادات Cash Pay غير مكتملة. يرجى التحقق من الإعدادات.');
    }

    const baseUrl = config.baseUrl || 'https://api.cash.com.ye';

    // TODO: تعديل endpoint حسب الـ API الحقيقي
    const endpoint = `${baseUrl}/api/v1/payments/refund`;
    
    const requestData = {
      merchant_id: config.merchantId,
      transaction_id: transactionId,
      amount: amount, // إذا كان null، يتم إرجاع المبلغ الكامل
      reason: reason || 'طلب إرجاع من العميل',
      timestamp: new Date().toISOString(),
    };

    const signature = generateSignature(requestData, config.apiSecret);
    requestData.signature = signature;

    const response = await axios.post(endpoint, requestData, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.apiKey}`,
      },
      timeout: 30000,
    });

    return {
      success: true,
      refundId: response.data.refund_id,
      status: response.data.status,
      data: response.data,
    };
  } catch (error) {
    console.error('Cash Pay Refund Error:', error.response?.data || error.message);
    throw new Error(
      error.response?.data?.message || 
      error.message || 
      'حدث خطأ في عملية الإرجاع'
    );
  }
};

/**
 * Get payment details from Cash Pay
 * الحصول على تفاصيل دفعة من Cash Pay
 * 
 * @param {String} transactionId - رقم المعاملة
 * @returns {Promise<Object>} - Payment details
 */
export const getPaymentDetails = async (transactionId) => {
  try {
    if (!transactionId) {
      throw new Error('رقم المعاملة مطلوب');
    }

    // TODO: تعديل endpoint حسب الـ API الحقيقي
    const endpoint = `${CASH_PAY_CONFIG.baseUrl}/api/v1/payments/${transactionId}`;
    
    const params = {
      merchant_id: CASH_PAY_CONFIG.merchantId,
      timestamp: new Date().toISOString(),
    };

    const signature = generateSignature(params, CASH_PAY_CONFIG.apiSecret);
    params.signature = signature;

    const response = await axios.get(endpoint, {
      params,
      headers: {
        'Authorization': `Bearer ${CASH_PAY_CONFIG.apiKey}`,
      },
      timeout: 30000,
    });

    return {
      success: true,
      data: response.data,
    };
  } catch (error) {
    console.error('Cash Pay Get Details Error:', error.response?.data || error.message);
    throw new Error(
      error.response?.data?.message || 
      error.message || 
      'حدث خطأ في الحصول على تفاصيل الدفعة'
    );
  }
};

export default {
  createPaymentRequest,
  verifyPaymentStatus,
  handleWebhook,
  refundPayment,
  getPaymentDetails,
};

