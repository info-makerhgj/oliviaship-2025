# تفعيل Puppeteer على Render

## المشكلة:
Puppeteer معطل لأن Render ما عنده Chrome/Chromium بشكل افتراضي.

## الحل:

### 1. أنشئ ملف `render.yaml` في root المشروع:

```yaml
services:
  - type: web
    name: oliviaship-2025
    env: node
    buildCommand: npm install && npx puppeteer browsers install chrome
    startCommand: node server/index.js
    envVars:
      - key: PUPPETEER_SKIP_CHROMIUM_DOWNLOAD
        value: false
      - key: PUPPETEER_EXECUTABLE_PATH
        value: /opt/render/.cache/puppeteer/chrome/linux-*/chrome-linux*/chrome
```

### 2. فعّل puppeteer في الكود:

في `server/utils/scrapers/sheinScraperPuppeteer.js`:
- احذف السطر: `throw new Error(...)`
- أرجع الكود الأصلي

في `server/utils/invoicePDF.js`:
- احذف السطر: `throw new Error(...)`
- أرجع الكود الأصلي

### 3. ارفع التحديثات:
```bash
git add .
git commit -m "Enable puppeteer on Render"
git push origin main
```

---

## البديل الأسهل (بدون puppeteer):

استخدم ScraperAPI فقط - يشتغل مع معظم المتاجر ما عدا Shein.

**هل تحتاج Shein بالضرورة؟**
