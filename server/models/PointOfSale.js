import mongoose from 'mongoose';

const pointOfSaleSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  code: {
    type: String,
    unique: true,
    required: true,
    uppercase: true,
    trim: true,
    index: true,
  },
  type: {
    type: String,
    enum: ['codes_only', 'pickup_only', 'both'],
    default: 'both',
  },
  location: {
    address: {
      type: String,
      required: true,
    },
    mapLink: {
      type: String,
      default: '',
    },
    city: {
      type: String,
      required: true,
    },
    coordinates: {
      latitude: {
        type: Number,
        required: true,
      },
      longitude: {
        type: Number,
        required: true,
      },
    },
  },
  contact: {
    phone: {
      type: String,
      required: true,
    },
    whatsapp: String,
    email: String,
  },
  operatingHours: {
    from: String, // "09:00"
    to: String, // "22:00"
    days: [{
      type: String,
      enum: ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'],
    }],
  },
  inventory: {
    availableCodes: {
      type: Number,
      default: 0,
    },
    totalCodesDistributed: {
      type: Number,
      default: 0,
    },
    totalSales: {
      type: Number,
      default: 0,
    },
  },
  settings: {
    commission: {
      type: Number,
      default: 0, // نسبة العمولة على الطلبات (%)
      min: 0,
      max: 100,
    },
    codeCommission: {
      type: Number,
      default: 0, // نسبة العمولة على الأكواد (%)
      min: 0,
      max: 100,
    },
    discountOnCodes: {
      type: Number,
      default: 0, // خصم عند شراء النقطة للأكواد من الإدارة
    },
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'suspended'],
    default: 'active',
  },
  manager: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  qrCode: {
    type: String, // URL or data for QR code
  },
  rating: {
    average: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },
    count: {
      type: Number,
      default: 0,
    },
  },
  notes: String,
}, {
  timestamps: true,
});

// Generate unique code for point
pointOfSaleSchema.statics.generateCode = async function () {
  let code;
  let exists = true;
  while (exists) {
    const num = Math.floor(1000 + Math.random() * 9000);
    code = `POS-${num}`;
    const existing = await this.findOne({ code });
    exists = !!existing;
  }
  return code;
};

// Calculate distance between two coordinates (Haversine formula)
pointOfSaleSchema.methods.calculateDistance = function (lat, lng) {
  const R = 6371; // Earth's radius in km
  const dLat = (lat - this.location.coordinates.latitude) * Math.PI / 180;
  const dLon = (lng - this.location.coordinates.longitude) * Math.PI / 180;
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(this.location.coordinates.latitude * Math.PI / 180) *
    Math.cos(lat * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // Distance in km
};

// Index for location queries
pointOfSaleSchema.index({ 'location.coordinates.latitude': 1, 'location.coordinates.longitude': 1 });
pointOfSaleSchema.index({ status: 1 });
pointOfSaleSchema.index({ type: 1 });

export default mongoose.model('PointOfSale', pointOfSaleSchema);


