// Generate a placeholder image as data URL (SVG)
export const getPlaceholderImage = (width = 200, height = 200) => {
  const svg = `
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <rect width="100%" height="100%" fill="#f3f4f6"/>
      <text x="50%" y="50%" font-family="Arial, sans-serif" font-size="14" fill="#9ca3af" text-anchor="middle" dominant-baseline="middle">
        لا توجد صورة
      </text>
    </svg>
  `.trim();
  return `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(svg)))}`;
};

export const formatCurrency = (amount, currency = 'YER') => {
  // Use 'en-US' to force Western/English numerals
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 0,
  }).format(amount);
};

export const formatDate = (date) => {
  return new Intl.DateTimeFormat('ar-YE', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(new Date(date));
};

export const getStatusColor = (status) => {
  const colors = {
    pending: 'bg-yellow-100 text-yellow-800',
    confirmed: 'bg-blue-100 text-blue-700',
    processing: 'bg-purple-100 text-purple-700',
    purchased: 'bg-indigo-100 text-indigo-800',
    shipped: 'bg-cyan-100 text-cyan-800',
    in_transit: 'bg-teal-100 text-teal-800',
    arrived: 'bg-green-100 text-green-800',
    arrived_at_point: 'bg-emerald-100 text-emerald-800',
    ready_for_pickup: 'bg-lime-100 text-lime-800',
    delivered: 'bg-green-200 text-green-900',
    cancelled: 'bg-red-100 text-red-800',
    agent_pending: 'bg-amber-100 text-amber-800',
    agent_confirmed: 'bg-blue-100 text-blue-700',
    agent_processing: 'bg-violet-100 text-violet-800',
  };
  return colors[status] || 'bg-gray-100 text-gray-800';
};

export const getStatusText = (status) => {
  const texts = {
    draft: 'مسودة',
    pending: 'قيد الانتظار',
    confirmed: 'مؤكد',
    processing: 'قيد المعالجة',
    purchased: 'تم الشراء',
    shipped: 'تم الشحن',
    in_transit: 'في الطريق',
    arrived: 'وصل',
    arrived_at_point: 'وصل لنقطة التسليم',
    ready_for_pickup: 'جاهز للاستلام',
    delivered: 'تم التسليم',
    cancelled: 'ملغى',
    agent_pending: 'قيد الانتظار (وكيل)',
    agent_confirmed: 'مؤكد من الوكيل',
    agent_processing: 'قيد المعالجة (وكيل)',
  };
  return texts[status] || status;
};
