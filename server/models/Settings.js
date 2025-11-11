import mongoose from 'mongoose';

const settingsSchema = new mongoose.Schema({
  general: {
    siteName: {
      type: String,
      default: 'Olivia Ship - أوليفيا شيب',
    },
    siteDescription: {
      type: String,
      default: 'أوليفيا شيب - خدمة التوصيل الفاخر من المتاجر العالمية إلى اليمن. نوصل منتجاتك من أمازون، نون، شي إن، علي إكسبريس والمزيد بسهولة وأمان.',
    },
    siteUrl: String,
    contactEmail: String,
    contactPhone: String,
    address: String,
    currency: {
      type: String,
      default: 'YER',
    },
    timezone: {
      type: String,
      default: 'Asia/Aden',
    },
    language: {
      type: String,
      default: 'ar',
    },
    logo: {
      type: String, // URL or base64
    },
    favicon: {
      type: String, // URL or base64
    },
    metaTitle: {
      type: String,
      default: 'Olivia Ship - أوليفيا شيب | خدمة التوصيل الفاخر إلى اليمن',
    },
    metaDescription: {
      type: String,
      default: 'أوليفيا شيب - خدمة التوصيل الفاخر من المتاجر العالمية إلى اليمن. نوصل منتجاتك من أمازون، نون، شي إن، علي إكسبريس والمزيد.',
    },
    metaKeywords: {
      type: String,
      default: 'أوليفيا شيب، Olivia Ship، توصيل من أمازون إلى اليمن، توصيل من نون إلى اليمن، توصيل من شي إن إلى اليمن، توصيل من علي إكسبريس إلى اليمن، توصيل من Temu إلى اليمن، شحن من أمازون إلى اليمن، شحن من نون إلى اليمن، طلب من أمازون إلى اليمن، تسوق من المتاجر العالمية إلى اليمن، خدمة توصيل فاخر إلى اليمن، شراء من أمازون إلى اليمن، شراء من نون إلى اليمن، شراء من شي إن إلى اليمن، توصيل دولي إلى اليمن، شحن دولي إلى اليمن، استيراد من أمازون إلى اليمن، استيراد من نون إلى اليمن، جلب منتجات من أمازون إلى اليمن، جلب منتجات من نون إلى اليمن، توصيل منتجات من أمازون إلى اليمن، توصيل منتجات من نون إلى اليمن، خدمة توصيل إلى اليمن، شركة توصيل إلى اليمن، منصة توصيل إلى اليمن، شي إن اليمن، شي إن صنعاء، شي إن عدن، شي إن الحديدة، شي إن تعز، شي إن إب، شي إن ذمار، شي إن حجة، شي إن مأرب، شي إن سيئون، شي إن المكلا، شي إن زبيد، شي إن الحوطة، شي إن يريم، شي إن ردفان، شي إن البيضاء، شي إن عمران، شي إن صعدة، شي إن حضرموت، أمازون اليمن، أمازون صنعاء، أمازون عدن، أمازون الحديدة، أمازون تعز، نون اليمن، نون صنعاء، نون عدن، نون الحديدة، نون تعز، علي إكسبريس اليمن، علي إكسبريس صنعاء، علي إكسبريس عدن، علي إكسبريس الحديدة، علي إكسبريس تعز، Temu اليمن، Temu صنعاء، Temu عدن، Temu الحديدة، Temu تعز، توصيل من شي إن إلى صنعاء، توصيل من شي إن إلى عدن، توصيل من شي إن إلى الحديدة، توصيل من شي إن إلى تعز، توصيل من أمازون إلى صنعاء، توصيل من أمازون إلى عدن، توصيل من أمازون إلى الحديدة، توصيل من أمازون إلى تعز، توصيل من نون إلى صنعاء، توصيل من نون إلى عدن، توصيل من نون إلى الحديدة، توصيل من نون إلى تعز، شحن من شي إن إلى صنعاء، شحن من شي إن إلى عدن، شحن من شي إن إلى الحديدة، شحن من شي إن إلى تعز، شحن من أمازون إلى صنعاء، شحن من أمازون إلى عدن، شحن من أمازون إلى الحديدة، شحن من أمازون إلى تعز، شحن من نون إلى صنعاء، شحن من نون إلى عدن، شحن من نون إلى الحديدة، شحن من نون إلى تعز، شراء من شي إن إلى صنعاء، شراء من شي إن إلى عدن، شراء من شي إن إلى الحديدة، شراء من شي إن إلى تعز، شراء من أمازون إلى صنعاء، شراء من أمازون إلى عدن، شراء من أمازون إلى الحديدة، شراء من أمازون إلى تعز، شراء من نون إلى صنعاء، شراء من نون إلى عدن، شراء من نون إلى الحديدة، شراء من نون إلى تعز، طلب من شي إن إلى صنعاء، طلب من شي إن إلى عدن، طلب من شي إن إلى الحديدة، طلب من شي إن إلى تعز، طلب من أمازون إلى صنعاء، طلب من أمازون إلى عدن، طلب من أمازون إلى الحديدة، طلب من أمازون إلى تعز، طلب من نون إلى صنعاء، طلب من نون إلى عدن، طلب من نون إلى الحديدة، طلب من نون إلى تعز، استيراد من شي إن إلى صنعاء، استيراد من شي إن إلى عدن، استيراد من شي إن إلى الحديدة، استيراد من شي إن إلى تعز، استيراد من أمازون إلى صنعاء، استيراد من أمازون إلى عدن، استيراد من أمازون إلى الحديدة، استيراد من أمازون إلى تعز، استيراد من نون إلى صنعاء، استيراد من نون إلى عدن، استيراد من نون إلى الحديدة، استيراد من نون إلى تعز، جلب منتجات من شي إن إلى صنعاء، جلب منتجات من شي إن إلى عدن، جلب منتجات من شي إن إلى الحديدة، جلب منتجات من شي إن إلى تعز، جلب منتجات من أمازون إلى صنعاء، جلب منتجات من أمازون إلى عدن، جلب منتجات من أمازون إلى الحديدة، جلب منتجات من أمازون إلى تعز، جلب منتجات من نون إلى صنعاء، جلب منتجات من نون إلى عدن، جلب منتجات من نون إلى الحديدة، جلب منتجات من نون إلى تعز، توصيل منتجات من شي إن إلى صنعاء، توصيل منتجات من شي إن إلى عدن، توصيل منتجات من شي إن إلى الحديدة، توصيل منتجات من شي إن إلى تعز، توصيل منتجات من أمازون إلى صنعاء، توصيل منتجات من أمازون إلى عدن، توصيل منتجات من أمازون إلى الحديدة، توصيل منتجات من أمازون إلى تعز، توصيل منتجات من نون إلى صنعاء، توصيل منتجات من نون إلى عدن، توصيل منتجات من نون إلى الحديدة، توصيل منتجات من نون إلى تعز، خدمة توصيل إلى صنعاء، خدمة توصيل إلى عدن، خدمة توصيل إلى الحديدة، خدمة توصيل إلى تعز، شركة توصيل إلى صنعاء، شركة توصيل إلى عدن، شركة توصيل إلى الحديدة، شركة توصيل إلى تعز، منصة توصيل إلى صنعاء، منصة توصيل إلى عدن، منصة توصيل إلى الحديدة، منصة توصيل إلى تعز، تسوق من شي إن إلى صنعاء، تسوق من شي إن إلى عدن، تسوق من شي إن إلى الحديدة، تسوق من شي إن إلى تعز، تسوق من أمازون إلى صنعاء، تسوق من أمازون إلى عدن، تسوق من أمازون إلى الحديدة، تسوق من أمازون إلى تعز، تسوق من نون إلى صنعاء، تسوق من نون إلى عدن، تسوق من نون إلى الحديدة، تسوق من نون إلى تعز، Amazon to Yemen, Noon to Yemen, Shein to Yemen, AliExpress to Yemen, Temu to Yemen, shipping to Yemen, delivery to Yemen, online shopping Yemen, international shipping Yemen, Shein to Sanaa, Shein to Aden, Amazon to Sanaa, Amazon to Aden, Noon to Sanaa, Noon to Aden, AliExpress to Sanaa, AliExpress to Aden, Temu to Sanaa, Temu to Aden, shipping to Sanaa, shipping to Aden, delivery to Sanaa, delivery to Aden',
    },
    showInFooter: {
      type: Boolean,
      default: true,
    },
  },
  theme: {
    primaryColor: {
      type: String,
      default: '#93c5fd', // Pastel blue
    },
    secondaryColor: {
      type: String,
      default: '#f9a8d4', // Pastel pink
    },
    darkMode: {
      type: Boolean,
      default: false,
    },
    headingFont: {
      type: String,
      default: 'Cairo',
    },
    bodyFont: {
      type: String,
      default: 'Tajawal',
    },
  },
  footer: {
    copyrightText: {
      type: String,
      default: 'جميع الحقوق محفوظة',
    },
    showSocialLinks: {
      type: Boolean,
      default: true,
    },
    socialLinks: {
      facebook: String,
      instagram: String,
      twitter: String,
      linkedin: String,
      whatsapp: String,
      youtube: String,
    },
    footerLinks: {
      services: [{
        label: String,
        url: String,
      }],
      information: [{
        label: String,
        url: String,
      }],
    },
    footerDescription: {
      type: String,
      default: 'أوليفيا شيب - خدمة التوصيل الفاخر من المتاجر العالمية إلى اليمن. نوصل منتجاتك من أمازون، نون، شي إن، علي إكسبريس والمزيد بسهولة وأمان.',
    },
    showContactInfo: {
      type: Boolean,
      default: true,
    },
    showFooterLinks: {
      type: Boolean,
      default: true,
    },
  },
  legalPages: {
    terms: {
      type: String,
      default: '', // HTML content for Terms page
    },
    privacy: {
      type: String,
      default: '', // HTML content for Privacy page
    },
    cookies: {
      type: String,
      default: '', // HTML content for Cookies page
    },
  },
  pricing: {
    commissionPercentage: {
      type: Number,
      default: 15,
    },
    customsPercentage: {
      type: Number,
      default: 5,
    },
    shippingRate: {
      type: Number,
      default: 10,
    },
    processingFeePercentage: {
      type: Number,
      default: 2,
    },
    handlingFee: {
      type: Number,
      default: 5,
    },
    insuranceFeePercentage: {
      type: Number,
      default: 1,
    },
    packagingFee: {
      type: Number,
      default: 3,
    },
    currencyRates: {
      USD: {
        type: Number,
        default: 250,
      },
      SAR: {
        type: Number,
        default: 67,
      },
      EUR: {
        type: Number,
        default: 270,
      },
    },
  },
  stores: {
    amazon: {
      enabled: {
        type: Boolean,
        default: true,
      },
      commissionRate: {
        type: Number,
        default: 15,
      },
      minOrderValue: {
        type: Number,
        default: 0,
      },
      maxOrderValue: Number,
      shippingFee: {
        type: Number,
        default: 0,
      },
    },
    noon: {
      enabled: {
        type: Boolean,
        default: true,
      },
      commissionRate: {
        type: Number,
        default: 15,
      },
      minOrderValue: {
        type: Number,
        default: 0,
      },
      maxOrderValue: Number,
      shippingFee: {
        type: Number,
        default: 0,
      },
    },
    shein: {
      enabled: {
        type: Boolean,
        default: true,
      },
      commissionRate: {
        type: Number,
        default: 15,
      },
      minOrderValue: {
        type: Number,
        default: 0,
      },
      maxOrderValue: Number,
      shippingFee: {
        type: Number,
        default: 0,
      },
    },
    aliexpress: {
      enabled: {
        type: Boolean,
        default: true,
      },
      commissionRate: {
        type: Number,
        default: 15,
      },
      minOrderValue: {
        type: Number,
        default: 0,
      },
      maxOrderValue: Number,
      shippingFee: {
        type: Number,
        default: 0,
      },
    },
    temu: {
      enabled: {
        type: Boolean,
        default: true,
      },
      commissionRate: {
        type: Number,
        default: 15,
      },
      minOrderValue: {
        type: Number,
        default: 0,
      },
      maxOrderValue: Number,
      shippingFee: {
        type: Number,
        default: 0,
      },
    },
    iherb: {
      enabled: {
        type: Boolean,
        default: true,
      },
      commissionRate: {
        type: Number,
        default: 15,
      },
      minOrderValue: {
        type: Number,
        default: 0,
      },
      maxOrderValue: Number,
      shippingFee: {
        type: Number,
        default: 0,
      },
    },
    niceonesa: {
      enabled: {
        type: Boolean,
        default: true,
      },
      commissionRate: {
        type: Number,
        default: 15,
      },
      minOrderValue: {
        type: Number,
        default: 0,
      },
      maxOrderValue: Number,
      shippingFee: {
        type: Number,
        default: 0,
      },
      availableCategories: {
        type: [String],
        default: ['perfume', 'makeup', 'care', 'devices', 'premium', 'nails', 'gifts', 'lenses', 'home-scents'],
      },
    },
    namshi: {
      enabled: {
        type: Boolean,
        default: true,
      },
      commissionRate: {
        type: Number,
        default: 15,
      },
      minOrderValue: {
        type: Number,
        default: 0,
      },
      maxOrderValue: Number,
      shippingFee: {
        type: Number,
        default: 0,
      },
    },
    trendyol: {
      enabled: {
        type: Boolean,
        default: true,
      },
      commissionRate: {
        type: Number,
        default: 15,
      },
      minOrderValue: {
        type: Number,
        default: 0,
      },
      maxOrderValue: Number,
      shippingFee: {
        type: Number,
        default: 0,
      },
    },
  },
  localStores: [{
    name: {
      type: String,
      required: true,
    },
    domain: {
      type: String,
      required: true,
    },
    enabled: {
      type: Boolean,
      default: true,
    },
    minOrderValue: {
      type: Number,
      default: 0,
    },
    maxOrderValue: Number,
    shippingFee: {
      type: Number,
      default: 0,
    },
  }],
  supportedStores: [{
    name: {
      type: String,
      required: true,
    },
    icon: {
      type: String, // URL or base64 for store icon/image
    },
    url: {
      type: String, // Store website URL
      required: true,
    },
    enabled: {
      type: Boolean,
      default: true,
    },
    order: {
      type: Number,
      default: 0,
    },
  }],
  mobileOffers: [{
    image: {
      type: String, // URL or base64 for offer image
      required: true,
    },
    couponCode: {
      type: String, // Coupon/discount code
      required: true,
    },
    title: {
      type: String, // Offer title
    },
    description: {
      type: String, // Offer description
    },
    storeUrl: {
      type: String, // Store URL to redirect
    },
    discount: {
      type: String, // Discount value (e.g., "20%" or "50 SAR")
    },
    terms: {
      type: String, // Terms and conditions
    },
    enabled: {
      type: Boolean,
      default: true,
    },
    order: {
      type: Number,
      default: 0,
    },
  }],
  payment: {
    stripeEnabled: {
      type: Boolean,
      default: false,
    },
    stripePublishableKey: String,
    stripeSecretKey: String,
    stripeWebhookSecret: String,
    cashPayEnabled: {
      type: Boolean,
      default: false,
    },
    cashPayApiKey: String,
    cashPayApiSecret: String,
    cashPayMerchantId: String,
    cashPayBaseUrl: String,
    cashPayEnvironment: {
      type: String,
      enum: ['sandbox', 'production'],
      default: 'sandbox',
    },
    cashOnDeliveryEnabled: {
      type: Boolean,
      default: true,
    },
    currency: {
      type: String,
      default: 'SAR',
    },
  },
  notifications: {
    emailNotifications: {
      type: Boolean,
      default: true,
    },
    emailService: String,
    smtpHost: String,
    smtpPort: Number,
    smtpUser: String,
    smtpPassword: String,
    smsNotifications: {
      type: Boolean,
      default: false,
    },
    whatsappNotifications: {
      type: Boolean,
      default: false,
    },
    notifyOnNewOrder: {
      type: Boolean,
      default: true,
    },
    notifyOnPayment: {
      type: Boolean,
      default: true,
    },
    notifyOnStatusChange: {
      type: Boolean,
      default: true,
    },
  },
  shipping: {
    estimatedDaysAbroad: {
      type: Number,
      default: 10,
    },
    estimatedDaysLocal: {
      type: Number,
      default: 5,
    },
    freeShippingThreshold: Number,
    maxWeight: Number,
    maxDimensions: {
      length: Number,
      width: Number,
      height: Number,
    },
    restrictedItems: [String],
    customsClearance: {
      enabled: {
        type: Boolean,
        default: true,
      },
      fee: {
        type: Number,
        default: 5,
      },
      estimatedDays: {
        type: Number,
        default: 3,
      },
    },
  },
  scraperAPI: {
    enabled: {
      type: Boolean,
      default: false,
    },
    apiKey: String,
  },
  analytics: {
    googleAnalytics: {
      enabled: {
        type: Boolean,
        default: false,
      },
      measurementId: String,
    },
  },
}, {
  timestamps: true,
});

// Ensure only one settings document
settingsSchema.statics.getSettings = async function() {
  try {
    let settings = await this.findOne();
    if (!settings) {
      settings = await this.create({});
    } else {
      // If metaKeywords is missing or empty, set default value
      if (!settings.general?.metaKeywords || settings.general.metaKeywords.trim() === '') {
        const defaultKeywords = 'أوليفيا شيب، Olivia Ship، توصيل من أمازون إلى اليمن، توصيل من نون إلى اليمن، توصيل من شي إن إلى اليمن، توصيل من علي إكسبريس إلى اليمن، توصيل من Temu إلى اليمن، شحن من أمازون إلى اليمن، شحن من نون إلى اليمن، طلب من أمازون إلى اليمن، تسوق من المتاجر العالمية إلى اليمن، خدمة توصيل فاخر إلى اليمن، شراء من أمازون إلى اليمن، شراء من نون إلى اليمن، شراء من شي إن إلى اليمن، توصيل دولي إلى اليمن، شحن دولي إلى اليمن، استيراد من أمازون إلى اليمن، استيراد من نون إلى اليمن، جلب منتجات من أمازون إلى اليمن، جلب منتجات من نون إلى اليمن، توصيل منتجات من أمازون إلى اليمن، توصيل منتجات من نون إلى اليمن، خدمة توصيل إلى اليمن، شركة توصيل إلى اليمن، منصة توصيل إلى اليمن، شي إن اليمن، شي إن صنعاء، شي إن عدن، شي إن الحديدة، شي إن تعز، شي إن إب، شي إن ذمار، شي إن حجة، شي إن مأرب، شي إن سيئون، شي إن المكلا، شي إن زبيد، شي إن الحوطة، شي إن يريم، شي إن ردفان، شي إن البيضاء، شي إن عمران، شي إن صعدة، شي إن حضرموت، أمازون اليمن، أمازون صنعاء، أمازون عدن، أمازون الحديدة، أمازون تعز، نون اليمن، نون صنعاء، نون عدن، نون الحديدة، نون تعز، علي إكسبريس اليمن، علي إكسبريس صنعاء، علي إكسبريس عدن، علي إكسبريس الحديدة، علي إكسبريس تعز، Temu اليمن، Temu صنعاء، Temu عدن، Temu الحديدة، Temu تعز، توصيل من شي إن إلى صنعاء، توصيل من شي إن إلى عدن، توصيل من شي إن إلى الحديدة، توصيل من شي إن إلى تعز، توصيل من أمازون إلى صنعاء، توصيل من أمازون إلى عدن، توصيل من أمازون إلى الحديدة، توصيل من أمازون إلى تعز، توصيل من نون إلى صنعاء، توصيل من نون إلى عدن، توصيل من نون إلى الحديدة، توصيل من نون إلى تعز، شحن من شي إن إلى صنعاء، شحن من شي إن إلى عدن، شحن من شي إن إلى الحديدة، شحن من شي إن إلى تعز، شحن من أمازون إلى صنعاء، شحن من أمازون إلى عدن، شحن من أمازون إلى الحديدة، شحن من أمازون إلى تعز، شحن من نون إلى صنعاء، شحن من نون إلى عدن، شحن من نون إلى الحديدة، شحن من نون إلى تعز، شراء من شي إن إلى صنعاء، شراء من شي إن إلى عدن، شراء من شي إن إلى الحديدة، شراء من شي إن إلى تعز، شراء من أمازون إلى صنعاء، شراء من أمازون إلى عدن، شراء من أمازون إلى الحديدة، شراء من أمازون إلى تعز، شراء من نون إلى صنعاء، شراء من نون إلى عدن، شراء من نون إلى الحديدة، شراء من نون إلى تعز، طلب من شي إن إلى صنعاء، طلب من شي إن إلى عدن، طلب من شي إن إلى الحديدة، طلب من شي إن إلى تعز، طلب من أمازون إلى صنعاء، طلب من أمازون إلى عدن، طلب من أمازون إلى الحديدة، طلب من أمازون إلى تعز، طلب من نون إلى صنعاء، طلب من نون إلى عدن، طلب من نون إلى الحديدة، طلب من نون إلى تعز، استيراد من شي إن إلى صنعاء، استيراد من شي إن إلى عدن، استيراد من شي إن إلى الحديدة، استيراد من شي إن إلى تعز، استيراد من أمازون إلى صنعاء، استيراد من أمازون إلى عدن، استيراد من أمازون إلى الحديدة، استيراد من أمازون إلى تعز، استيراد من نون إلى صنعاء، استيراد من نون إلى عدن، استيراد من نون إلى الحديدة، استيراد من نون إلى تعز، جلب منتجات من شي إن إلى صنعاء، جلب منتجات من شي إن إلى عدن، جلب منتجات من شي إن إلى الحديدة، جلب منتجات من شي إن إلى تعز، جلب منتجات من أمازون إلى صنعاء، جلب منتجات من أمازون إلى عدن، جلب منتجات من أمازون إلى الحديدة، جلب منتجات من أمازون إلى تعز، جلب منتجات من نون إلى صنعاء، جلب منتجات من نون إلى عدن، جلب منتجات من نون إلى الحديدة، جلب منتجات من نون إلى تعز، توصيل منتجات من شي إن إلى صنعاء، توصيل منتجات من شي إن إلى عدن، توصيل منتجات من شي إن إلى الحديدة، توصيل منتجات من شي إن إلى تعز، توصيل منتجات من أمازون إلى صنعاء، توصيل منتجات من أمازون إلى عدن، توصيل منتجات من أمازون إلى الحديدة، توصيل منتجات من أمازون إلى تعز، توصيل منتجات من نون إلى صنعاء، توصيل منتجات من نون إلى عدن، توصيل منتجات من نون إلى الحديدة، توصيل منتجات من نون إلى تعز، خدمة توصيل إلى صنعاء، خدمة توصيل إلى عدن، خدمة توصيل إلى الحديدة، خدمة توصيل إلى تعز، شركة توصيل إلى صنعاء، شركة توصيل إلى عدن، شركة توصيل إلى الحديدة، شركة توصيل إلى تعز، منصة توصيل إلى صنعاء، منصة توصيل إلى عدن، منصة توصيل إلى الحديدة، منصة توصيل إلى تعز، تسوق من شي إن إلى صنعاء، تسوق من شي إن إلى عدن، تسوق من شي إن إلى الحديدة، تسوق من شي إن إلى تعز، تسوق من أمازون إلى صنعاء، تسوق من أمازون إلى عدن، تسوق من أمازون إلى الحديدة، تسوق من أمازون إلى تعز، تسوق من نون إلى صنعاء، تسوق من نون إلى عدن، تسوق من نون إلى الحديدة، تسوق من نون إلى تعز، Amazon to Yemen, Noon to Yemen, Shein to Yemen, AliExpress to Yemen, Temu to Yemen, shipping to Yemen, delivery to Yemen, online shopping Yemen, international shipping Yemen, Shein to Sanaa, Shein to Aden, Amazon to Sanaa, Amazon to Aden, Noon to Sanaa, Noon to Aden, AliExpress to Sanaa, AliExpress to Aden, Temu to Sanaa, Temu to Aden, shipping to Sanaa, shipping to Aden, delivery to Sanaa, delivery to Aden';
        settings.general = settings.general || {};
        settings.general.metaKeywords = defaultKeywords;
        await settings.save();
      }
    }
    return settings;
  } catch (error) {
    console.error('❌ Error in getSettings:', error);
    // Return default settings structure if database error
    return {
      general: {},
      pricing: {
        commissionPercentage: 15,
        customsPercentage: 5,
        shippingRate: 10,
        currencyRates: {
          USD: 1,
          SAR: 3.75,
          YER: 67,
        },
      },
      stores: {},
      localStores: [],
      payment: {},
      notifications: {},
      shipping: {},
      scraperAPI: {},
    };
  }
};

export default mongoose.model('Settings', settingsSchema);
