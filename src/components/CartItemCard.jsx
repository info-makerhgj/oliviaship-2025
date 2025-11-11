import { useState } from 'react';
import { formatCurrency, getPlaceholderImage } from '../utils/helpers';
import { 
  FiTrash2, 
  FiPlus, 
  FiMinus,
  FiExternalLink,
} from 'react-icons/fi';

export default function CartItemCard({ item, onUpdateQuantity, onRemove, onUpdateOptions }) {
  const [color, setColor] = useState(item.options?.color || '');
  const [size, setSize] = useState(item.options?.size || '');
  const [notes, setNotes] = useState(item.options?.specifications || '');
  const [saving, setSaving] = useState(false);

  const handleOptionsChange = async (field, value) => {
    const newOptions = {
      color: field === 'color' ? value : color,
      size: field === 'size' ? value : size,
      notes: field === 'notes' ? value : notes,
    };

    if (field === 'color') setColor(value);
    if (field === 'size') setSize(value);
    if (field === 'notes') setNotes(value);

    // Debounce: wait 1 second before saving
    setSaving(true);
    setTimeout(async () => {
      try {
        await onUpdateOptions(newOptions);
      } catch (error) {
        console.error('Failed to save options', error);
      } finally {
        setSaving(false);
      }
    }, 1000);
  };

  return (
    <div className="card p-4">
      <div className="flex gap-3 md:gap-4">
        {/* Product Image - Small Square */}
        {item.image && (
          <div className="flex-shrink-0">
            <img
              src={item.image}
              alt={item.name}
              className="w-20 h-20 md:w-24 md:h-24 object-cover rounded-lg border border-gray-200"
              onError={(e) => {
                e.target.src = getPlaceholderImage(200, 200);
              }}
            />
          </div>
        )}

        {/* Product Info - Main Content */}
        <div className="flex-1 min-w-0">
          {/* Product Name - Compact */}
          <h3 
            className="font-bold text-sm md:text-base mb-2 line-clamp-2 break-words" 
            title={item.name}
          >
            {item.name}
          </h3>

          {/* Store & Price - Compact */}
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <span className="px-2 py-0.5 bg-primary-100 text-primary-700 rounded text-xs font-medium">
              {item.store}
            </span>
            <span className="text-gray-700 font-semibold text-xs md:text-sm">
              {formatCurrency(item.price, item.currency)} / قطعة
            </span>
          </div>

          {/* Options Input Fields */}
          <div className="space-y-2 mb-3 pt-2 border-t border-gray-200">
            <div className="grid grid-cols-2 gap-2">
              {/* Color Input */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  اللون (اختياري)
                </label>
                <input
                  type="text"
                  value={color}
                  onChange={(e) => handleOptionsChange('color', e.target.value)}
                  placeholder="مثال: أسود..."
                  className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>

              {/* Size Input */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  المقاس (اختياري)
                </label>
                <input
                  type="text"
                  value={size}
                  onChange={(e) => handleOptionsChange('size', e.target.value)}
                  placeholder="مثال: XL..."
                  className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Notes Input */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                ملاحظات (اختياري)
              </label>
              <textarea
                value={notes}
                onChange={(e) => handleOptionsChange('notes', e.target.value)}
                placeholder="أي ملاحظات إضافية..."
                rows={2}
                className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
              />
              {saving && (
                <p className="text-xs text-gray-400 mt-0.5">جاري الحفظ...</p>
              )}
            </div>
          </div>

          {/* Product Link */}
          {item.productUrl && (
            <a
              href={item.productUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary-600 hover:underline text-xs inline-flex items-center gap-1 mb-3"
            >
              <FiExternalLink className="text-xs" />
              عرض المنتج الأصلي
            </a>
          )}

          {/* Bottom Row: Delete, Quantity, Total - Mobile Optimized */}
          <div className="flex items-center justify-between pt-2 border-t border-gray-200">
            {/* Delete Button */}
            <button
              onClick={onRemove}
              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              title="حذف المنتج"
            >
              <FiTrash2 className="text-base" />
            </button>

            {/* Quantity Controls */}
            <div className="flex items-center gap-1 border border-gray-200 rounded-lg">
              <button
                onClick={() => onUpdateQuantity(item.quantity - 1)}
                className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
                disabled={item.quantity <= 1}
              >
                <FiMinus className="text-sm" />
              </button>
              <span className="px-3 font-bold text-sm">{item.quantity}</span>
              <button
                onClick={() => onUpdateQuantity(item.quantity + 1)}
                className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <FiPlus className="text-sm" />
              </button>
            </div>

            {/* Total Price */}
            <div className="text-left">
              <p className="text-gray-500 text-xs mb-0.5">المجموع</p>
              <p className="text-base md:text-lg font-bold text-primary-600">
                {formatCurrency(item.price * item.quantity, item.currency)}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

