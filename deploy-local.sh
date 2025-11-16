#!/bin/bash

# 🚀 سكريبت التحديث من الجهاز المحلي

echo "🔨 بناء المشروع..."
npm run build

echo "📤 رفع التحديثات على GitHub..."
git add .
git commit -m "تحديث التصميم - $(date '+%Y-%m-%d %H:%M')"
git push origin main

echo ""
echo "✅ تم رفع التحديث على GitHub!"
echo ""
echo "🌐 الآن على السيرفر، شغل:"
echo "   cd ~/oliviaship-2025"
echo "   bash deploy-update.sh"
