#!/bin/bash

# سكريبت للتحقق من المساحة المستخدمة على AWS Lightsail

echo "🔍 فحص المساحة المستخدمة..."
echo "================================"
echo ""

echo "📊 المساحة الكلية:"
df -h /

echo ""
echo "📁 أكبر المجلدات:"
du -h --max-depth=1 / 2>/dev/null | sort -hr | head -20

echo ""
echo "📦 حجم node_modules:"
find . -name "node_modules" -type d -prune -exec du -sh {} \;

echo ""
echo "📝 حجم logs:"
du -sh /var/log 2>/dev/null

echo ""
echo "🗑️ ملفات مؤقتة:"
du -sh /tmp 2>/dev/null

echo ""
echo "💾 Docker (إن وجد):"
docker system df 2>/dev/null || echo "Docker غير مثبت"

echo ""
echo "================================"
echo "✅ انتهى الفحص"
