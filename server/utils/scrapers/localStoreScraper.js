import axios from 'axios';
import * as cheerio from 'cheerio';

/**
 * Universal scraper for local stores (Saudi Arabia)
 * Works with any store by detecting common HTML patterns
 */
export const scrapeLocalStore = async (url, storeName = 'local') => {
  try {
    console.log(`🏪 Scraping local store: ${storeName} - ${url}`);
    
    // Special handling for Laverne store
    const isLaverne = url.toLowerCase().includes('laverne.com');
    
    // Fetch HTML
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'ar-SA,ar;q=0.9,en-US;q=0.8,en;q=0.7',
        'Accept-Encoding': 'gzip, deflate, br',
        'Referer': 'https://www.google.com/',
        'sec-ch-ua': '"Not_A Brand";v="8", "Chromium";v="120", "Google Chrome";v="120"',
        'sec-ch-ua-mobile': '?0',
        'sec-ch-ua-platform': '"Windows"',
        'sec-fetch-dest': 'document',
        'sec-fetch-mode': 'navigate',
        'sec-fetch-site': 'none',
        'sec-fetch-user': '?1',
        'Upgrade-Insecure-Requests': '1',
      },
      timeout: 30000,
      maxRedirects: 5,
    });

    const html = response.data;
    if (!html || html.length < 100) {
      throw new Error('فشل في جلب محتوى الصفحة');
    }

    const $ = cheerio.load(html);

    // Extract product name - try multiple selectors
    let title = '';
    const titleSelectors = [
      'h1.product-title',
      'h1[class*="product"]',
      'h1[class*="title"]',
      '.product-name',
      '.product-title',
      '[class*="product-name"]',
      '[class*="product-title"]',
      'meta[property="og:title"]',
      'title',
      'h1',
    ];

    for (const selector of titleSelectors) {
      const element = $(selector).first();
      if (element.length) {
        title = element.attr('content') || element.text() || '';
        if (title) {
          title = title.trim();
          break;
        }
      }
    }

    // Extract price - prioritize current/discounted price over original price
    let price = 0;
    let priceText = '';
    let currency = 'SAR'; // Default currency
    
    // Special handling for Laverne - Laverne shows current price in h2 or h4
    // Format: "45.27 €" (current) and "81.25 €" (original, usually with strikethrough)
    if (isLaverne) {
      console.log('🔍 Laverne detected - using direct price extraction from h2/h4');
      const allLavernePrices = [];
      
      // FIRST: Check h2 and h4 directly (Laverne shows current price here)
      $('h2, h4').each((_, el) => {
        const $el = $(el);
        const text = $el.text().trim() || $el.html() || '';
        
        // Skip if strikethrough (original price)
        const hasStrikethrough = $el.css('text-decoration')?.includes('line-through') ||
                                 $el.closest('[style*="line-through"]').length > 0 ||
                                 $el.parent().css('text-decoration')?.includes('line-through');
        
        if (hasStrikethrough) {
          console.log(`⏭️ Skipping strikethrough element: ${text.substring(0, 30)}`);
          return;
        }
        
        // Look for EUR price pattern: "45.27 €"
        const eurMatch = text.match(/([\d,]+\.?\d*)\s*€/);
        if (eurMatch) {
          const price = parseFloat(eurMatch[1].replace(/,/g, ''));
          if (price > 0) {
            allLavernePrices.push({
              price: price,
              currency: 'EUR',
              element: $el.prop('tagName'),
              text: text.substring(0, 50),
              isStrikethrough: false,
            });
            console.log(`✅ Found EUR price in ${$el.prop('tagName')}: ${price} €`);
          }
        }
        
        // Also check for SAR directly: "195" or "195 ر.س"
        const sarMatch = text.match(/([\d,]+\.?\d*)\s*(?:ر\.س|SAR|ريال)?/);
        if (sarMatch) {
          const price = parseFloat(sarMatch[1].replace(/,/g, ''));
          // Only accept if it's a reasonable price (100-500 SAR) and smaller than EUR equivalent
          if (price >= 100 && price <= 500) {
            allLavernePrices.push({
              price: price,
              currency: 'SAR',
              element: $el.prop('tagName'),
              text: text.substring(0, 50),
              isStrikethrough: false,
            });
            console.log(`✅ Found SAR price in ${$el.prop('tagName')}: ${price} SAR`);
          }
        }
      });
      
      // Function to extract price from text (fallback)
      const extractPricesFromText = (text, elementType = 'unknown') => {
        // Remove strikethrough text (usually original price)
        const withoutStrikethrough = text.replace(/<s>.*?<\/s>/gi, '').replace(/<del>.*?<\/del>/gi, '');
        
        // Convert Arabic numerals to English first
        const arabicToEnglish = {'٠':'0','١':'1','٢':'2','٣':'3','٤':'4','٥':'5','٦':'6','٧':'7','٨':'8','٩':'9'};
        let normalizedText = text.replace(/[٠-٩]/g, (char) => arabicToEnglish[char] || char);
        
        // Look for all price patterns: USD ($), EUR (€), SAR (ر.س), or numbers with currency symbols
        const patterns = [
          /([\d,]+\.?\d*)\s*€/,            // EUR: "45.27 €"
          /([\d,]+\.?\d*)\s*EUR/i,         // EUR: "45.27 EUR"
          /([\d,]+\.?\d*)\s*\$/,           // USD: "53.06 $"
          /([\d,]+\.?\d*)\s*USD/i,         // USD: "53.06 USD"
          /([\d,]+\.?\d*)\s*ر\.س/,         // SAR: "199 ر.س"
          /([\d,]+\.?\d*)\s*SAR/i,         // SAR: "199 SAR"
          /([\d,]+\.?\d*)\s*ريال/i,        // SAR: "199 ريال"
          /([\d,]+\.?\d*)\s*ر\.س/i,        // SAR with Arabic: "١٩٩ ر.س" (after conversion)
        ];
        
        for (const pattern of patterns) {
          const matches = [...normalizedText.matchAll(new RegExp(pattern.source, 'gi'))];
          for (const match of matches) {
            let foundPrice = parseFloat((match[1] || match[0].match(/[\d,]+\.?\d*/)?.[0] || '0').replace(/,/g, ''));
            
            // Also try to extract from original text if normalized didn't work
            if (isNaN(foundPrice) || foundPrice === 0) {
              const originalMatch = text.match(/[٠-٩,]+/);
              if (originalMatch) {
                let arabicNum = originalMatch[0].replace(/[٠-٩]/g, (char) => arabicToEnglish[char] || char);
                foundPrice = parseFloat(arabicNum.replace(/,/g, ''));
              }
            }
            
            if (foundPrice > 0 && !isNaN(foundPrice)) {
              const isEUR = pattern.source.includes('€') || pattern.source.includes('EUR');
              const isUSD = pattern.source.includes('\\$') || pattern.source.includes('USD');
              const isSAR = pattern.source.includes('ر') || pattern.source.includes('SAR') || pattern.source.includes('ريال');
              
              let detectedCurrency = 'SAR'; // Default
              if (isEUR) detectedCurrency = 'EUR';
              else if (isUSD) detectedCurrency = 'USD';
              else if (isSAR) detectedCurrency = 'SAR';
              
              allLavernePrices.push({
                price: foundPrice,
                currency: detectedCurrency,
                element: elementType,
                text: text.substring(0, 100),
                isStrikethrough: text.includes('<s>') || text.includes('<del>') || text.includes('text-decoration: line-through'),
              });
            }
          }
        }
      };
      
      // Search in ALL text elements on the page
      $('*').each((_, el) => {
        const $el = $(el);
        const text = $el.html() || $el.text() || '';
        const tagName = $el.prop('tagName') || 'unknown';
        
        // Skip script and style tags
        if (tagName === 'SCRIPT' || tagName === 'STYLE') return;
        
        // Skip if it's a child of a price element we already processed
        if ($el.closest('[class*="price"]').length > 0 && $el.parent().find('[class*="price"]').length > 1) {
          return;
        }
        
        // Check if element has strikethrough style (original price)
        const hasStrikethrough = $el.css('text-decoration')?.includes('line-through') ||
                                 $el.css('text-decoration-line')?.includes('line-through') ||
                                 $el.hasClass('line-through') ||
                                 $el.closest('.line-through').length > 0;
        
        if (text && text.length < 200) { // Only check short text snippets
          // Pass strikethrough info to extraction function
          const modifiedText = hasStrikethrough ? `<s>${text}</s>` : text;
          extractPricesFromText(modifiedText, tagName);
        }
      });
      
      // Also check specific selectors - prioritize h2 and large price elements
      // Laverne shows current price in h2 as "45.27 €" or "195" (SAR directly)
      // Look for elements that contain prices - prioritize those without strikethrough
      $('h1, h2, h3, h4, h5, h6, [class*="price"], [id*="price"], [class*="Price"], [id*="Price"], span, div').each((_, el) => {
        const $el = $(el);
        const text = $el.html() || $el.text() || '';
        const tagName = $el.prop('tagName') || 'unknown';
        
        // Skip if too long (not a price element)
        if (text.length > 200) return;
        
        // Check if this element has strikethrough (skip if it does - it's original price)
        const hasStrikethrough = $el.css('text-decoration')?.includes('line-through') ||
                                 $el.css('text-decoration-line')?.includes('line-through') ||
                                 $el.hasClass('line-through') ||
                                 $el.closest('.line-through').length > 0 ||
                                 $el.closest('[style*="line-through"]').length > 0 ||
                                 text.includes('<s>') || text.includes('<del>') ||
                                 $el.parent().css('text-decoration')?.includes('line-through');
        
        // Skip strikethrough elements (original prices)
        if (hasStrikethrough) return;
        
        // Look for numbers that could be prices
        const numbers = text.match(/([\d,]+\.?\d*)/g);
        if (numbers && numbers.length > 0) {
          numbers.forEach(numStr => {
            const num = parseFloat(numStr.replace(/,/g, ''));
            // If number is reasonable and could be a price (between 10 and 1000)
            if (num >= 10 && num <= 1000 && !isNaN(num)) {
              // Check if text contains currency indicators
              const hasEUR = text.includes('€') || text.includes('EUR');
              const hasUSD = text.includes('$') || text.includes('USD');
              const hasSAR = text.includes('ر.س') || text.includes('SAR') || text.includes('ريال');
              
              if (hasEUR || hasUSD || hasSAR) {
                extractPricesFromText(text, tagName);
              } else {
                // If no currency symbol, check if it's in a price-related element
                // and if there's a larger number nearby (indicating original price)
                const parentText = $el.parent().html() || $el.parent().text() || '';
                const allNumbersInContext = parentText.match(/([\d,]+\.?\d*)/g)?.map(n => parseFloat(n.replace(/,/g, ''))) || [];
                if (allNumbersInContext.length > 1) {
                  const largerNumber = Math.max(...allNumbersInContext);
                  // If this number is significantly smaller than the largest, it's likely the current price
                  if (largerNumber > num * 1.3 && num < 300) {
                    // This is likely the current price in SAR (no currency symbol shown)
                    allLavernePrices.push({
                      price: num,
                      currency: 'SAR',
                      element: tagName,
                      text: text.substring(0, 100),
                      isStrikethrough: false,
                    });
                  }
                }
              }
            }
          });
        } else {
          // If no numbers found, still try extractPricesFromText in case it has currency symbols
          extractPricesFromText(text, tagName);
        }
      });
      
      // Remove duplicate - we already processed these above
      
      console.log(`📊 Found ${allLavernePrices.length} prices in Laverne:`, allLavernePrices.map(p => `${p.price} ${p.currency} from ${p.element}`));
      
      if (allLavernePrices.length > 0) {
        // Filter out strikethrough prices (original prices)
        const nonStrikethrough = allLavernePrices.filter(p => !p.isStrikethrough);
        
        // Prioritize prices from h2 (usually current price in Laverne)
        const h2Prices = nonStrikethrough.filter(p => p.element === 'H2');
        const h4Prices = nonStrikethrough.filter(p => p.element === 'H4');
        
        // Use h2 prices first, then h4, then all non-strikethrough
        let pricesToUse = nonStrikethrough;
        if (h2Prices.length > 0) {
          pricesToUse = h2Prices;
          console.log(`🎯 Using H2 prices (current price):`, h2Prices.map(p => `${p.price} ${p.currency}`));
        } else if (h4Prices.length > 0) {
          pricesToUse = h4Prices;
          console.log(`🎯 Using H4 prices (current price):`, h4Prices.map(p => `${p.price} ${p.currency}`));
        } else if (nonStrikethrough.length > 0) {
          pricesToUse = nonStrikethrough;
          console.log(`✅ Using non-strikethrough prices:`, nonStrikethrough.map(p => `${p.price} ${p.currency}`));
        }
        
        // Convert all to SAR for comparison
        // Exchange rates: 1 USD = 3.75 SAR, 1 EUR = 4.30 SAR (approximate, based on Laverne pricing)
        const pricesInSAR = pricesToUse.map(p => {
          let priceInSAR = p.price;
          if (p.currency === 'USD') {
            priceInSAR = p.price * 3.75;
          } else if (p.currency === 'EUR') {
            priceInSAR = p.price * 4.30; // 1 EUR ≈ 4.30 SAR (45.27 € = 195 ر.س)
          }
          // SAR stays as is
          return {
            ...p,
            priceInSAR: priceInSAR,
          };
        });
        
        // Use the smallest price (current/discounted price)
        const smallest = pricesInSAR.reduce((min, p) => p.priceInSAR < min.priceInSAR ? p : min);
        
        price = smallest.price;
        currency = smallest.currency;
        
        console.log(`✅ Selected Laverne price: ${price} ${currency} (${smallest.priceInSAR.toFixed(2)} SAR) from ${smallest.element}`);
        console.log(`   Context: ${smallest.text.substring(0, 80)}`);
        console.log(`   All prices considered:`, pricesInSAR.map(p => `${p.price} ${p.currency} = ${p.priceInSAR.toFixed(2)} SAR`));
      } else {
        console.log(`⚠️ No prices found in Laverne page!`);
      }
    }
    
    // Priority selectors - prefer current/discounted price selectors first
    const currentPriceSelectors = [
      '[class*="current-price"]',
      '[class*="CurrentPrice"]',
      '[class*="price-now"]',
      '[class*="sale-price"]',
      '[class*="discounted-price"]',
      '[class*="final-price"]',
      '[class*="price-final"]',
      '[data-current-price]',
      '[data-sale-price]',
      '[data-final-price]',
    ];
    
    // Try current price selectors first
    for (const selector of currentPriceSelectors) {
      const elements = $(selector);
      if (elements.length) {
        // Get all matching prices and prefer the smallest (current/discounted price)
        const prices = [];
        elements.each((_, el) => {
          const text = $(el).attr('content') || $(el).attr('data-current-price') || $(el).attr('data-sale-price') || $(el).attr('data-final-price') || $(el).text() || '';
          if (text) {
            const priceMatch = text.match(/[\d,]+\.?\d*/);
            if (priceMatch) {
              const p = parseFloat(priceMatch[0].replace(/,/g, ''));
              if (p > 0) prices.push(p);
            }
          }
        });
        if (prices.length > 0) {
          // Use the smallest price (current/discounted price)
          price = Math.min(...prices);
          if (price > 0) break;
        }
      }
    }
    
    // If current price not found, try general price selectors
    if (price === 0) {
      const priceSelectors = [
        '[class*="price"]',
        '[class*="Price"]',
        '[id*="price"]',
        '[id*="Price"]',
        '.product-price',
        '.price',
        '[data-price]',
        '[itemprop="price"]',
        'meta[property="product:price:amount"]',
      ];

      // Try selectors - collect all prices and prefer the smallest (current price)
      const allPrices = [];
      for (const selector of priceSelectors) {
        const elements = $(selector);
        if (elements.length) {
          elements.each((_, el) => {
            const text = $(el).attr('content') || $(el).attr('data-price') || $(el).text() || '';
            if (text) {
              // Skip if it contains "original" or "old" keywords
              const textLower = text.toLowerCase();
              if (textLower.includes('original') || textLower.includes('old') || textLower.includes('was')) {
                return; // Skip original/old prices
              }
              
              const priceMatch = text.match(/[\d,]+\.?\d*/);
              if (priceMatch) {
                const p = parseFloat(priceMatch[0].replace(/,/g, ''));
                if (p > 0) allPrices.push(p);
              }
            }
          });
        }
      }
      
      // If we found multiple prices, use the smallest (current/discounted price)
      if (allPrices.length > 0) {
        price = Math.min(...allPrices);
      }
    }

    // Try JSON-LD structured data - prefer lowPrice (discounted) over price (original)
    if (price === 0) {
      const jsonLdScripts = $('script[type="application/ld+json"]');
      const allPrices = [];
      jsonLdScripts.each((_, script) => {
        try {
          const jsonData = JSON.parse($(script).html());
          if (jsonData && typeof jsonData === 'object') {
            const findPrices = (obj) => {
              if (typeof obj !== 'object' || obj === null) return [];
              
              const prices = [];
              
              // Prefer lowPrice (discounted/current price) over price
              if (obj.offers) {
                if (Array.isArray(obj.offers)) {
                  obj.offers.forEach(offer => {
                    if (offer.lowPrice) prices.push(parseFloat(offer.lowPrice));
                    else if (offer.price) prices.push(parseFloat(offer.price));
                  });
                } else {
                  if (obj.offers.lowPrice) prices.push(parseFloat(obj.offers.lowPrice));
                  else if (obj.offers.price) prices.push(parseFloat(obj.offers.price));
                }
              } else if (obj.price) {
                prices.push(parseFloat(obj.price));
              }
              
              // Recursively search in nested objects
              for (const key in obj) {
                if (key !== 'offers' && key !== 'price') {
                  const nestedPrices = findPrices(obj[key]);
                  prices.push(...nestedPrices);
                }
              }
              
              return prices;
            };
            
            const foundPrices = findPrices(jsonData);
            allPrices.push(...foundPrices);
          }
        } catch (e) {
          // Ignore JSON parsing errors
        }
      });
      
      // Use the smallest price (current/discounted price)
      if (allPrices.length > 0) {
        price = Math.min(...allPrices.filter(p => p > 0));
      }
    }

    // Try to find price in script tags (JavaScript data) - prefer current/discounted prices
    if (price === 0) {
      const scripts = $('script');
      const allScriptPrices = [];
      
      scripts.each((_, script) => {
        const scriptContent = $(script).html() || '';
        
        // Prioritize current/discounted price patterns
        const currentPricePatterns = [
          /currentPrice["\s:]*["\s]*(\d+\.?\d*)/i,
          /salePrice["\s:]*["\s]*(\d+\.?\d*)/i,
          /discountedPrice["\s:]*["\s]*(\d+\.?\d*)/i,
          /finalPrice["\s:]*["\s]*(\d+\.?\d*)/i,
          /priceNow["\s:]*["\s]*(\d+\.?\d*)/i,
          /lowPrice["\s:]*["\s]*(\d+\.?\d*)/i,
        ];
        
        // General price patterns (as fallback)
        const generalPricePatterns = [
          /price["\s:]*["\s]*(\d+\.?\d*)/i,
          /priceAmount["\s:]*["\s]*(\d+\.?\d*)/i,
          /"price"["\s:]*["\s]*(\d+\.?\d*)/i,
        ];
        
        // Try current price patterns first
        for (const pattern of currentPricePatterns) {
          const match = scriptContent.match(pattern);
          if (match && match[1]) {
            const foundPrice = parseFloat(match[1]);
            if (foundPrice > 0) {
              allScriptPrices.push(foundPrice);
            }
          }
        }
        
        // If no current price found, try general patterns but skip if contains "original" or "old"
        if (allScriptPrices.length === 0) {
          for (const pattern of generalPricePatterns) {
            const matches = [...scriptContent.matchAll(new RegExp(pattern.source, 'gi'))];
            matches.forEach(match => {
              if (match && match[1]) {
                // Check context - skip if it's clearly an original/old price
                const context = scriptContent.substring(Math.max(0, match.index - 50), match.index + 50).toLowerCase();
                if (!context.includes('original') && !context.includes('old') && !context.includes('was') && !context.includes('before')) {
                  const foundPrice = parseFloat(match[1]);
                  if (foundPrice > 0) {
                    allScriptPrices.push(foundPrice);
                  }
                }
              }
            });
          }
        }
      });
      
      // Use the smallest price (current/discounted price)
      if (allScriptPrices.length > 0) {
        price = Math.min(...allScriptPrices);
      }
    }

    // Extract from price text if still not found
    if (price === 0 && priceText) {
      let cleanPrice = priceText.replace(/[^\d.,]/g, '').replace(/,/g, '').trim();
      const arabicToEnglish = {
        '٠': '0', '١': '1', '٢': '2', '٣': '3', '٤': '4',
        '٥': '5', '٦': '6', '٧': '7', '٨': '8', '٩': '9'
      };
      cleanPrice = cleanPrice.replace(/[٠-٩]/g, (char) => arabicToEnglish[char] || char);
      const priceMatch = cleanPrice.match(/[\d]+\.?\d*/);
      if (priceMatch) {
        price = parseFloat(priceMatch[0]);
      }
    }

    // Try meta tags
    if (price === 0) {
      const metaPrice = $('meta[property="product:price:amount"]').attr('content');
      if (metaPrice) {
        price = parseFloat(metaPrice);
      }
    }

    // Extract image
    let image = '';
    const imageSelectors = [
      'meta[property="og:image"]',
      '[class*="product-image"] img',
      '[class*="product-img"] img',
      '.product-image img',
      '.product-img img',
      '[data-product-image]',
      '[itemprop="image"]',
      'img[class*="product"]',
      'img[class*="Product"]',
    ];

    for (const selector of imageSelectors) {
      const element = $(selector).first();
      if (element.length) {
        image = element.attr('content') || element.attr('src') || element.attr('data-src') || element.attr('data-product-image') || '';
        if (image) {
          // Clean image URL
          if (!image.startsWith('http')) {
            try {
              const urlObj = new URL(url);
              if (image.startsWith('//')) {
                image = urlObj.protocol + image;
              } else if (image.startsWith('/')) {
                image = urlObj.origin + image;
              }
            } catch (e) {
              // Keep original
            }
          }
          break;
        }
      }
    }

    if (!title || title === '') {
      throw new Error('لم يتم العثور على اسم المنتج');
    }

    if (price === 0 || !price) {
      throw new Error('لم يتم العثور على سعر المنتج');
    }

    // Convert currency if needed
    let finalPrice = price;
    if (currency === 'USD' && price > 0) {
      // Convert USD to SAR (1 USD = 3.75 SAR)
      finalPrice = price * 3.75;
      currency = 'SAR';
      console.log(`💰 Converted ${price} USD to ${finalPrice.toFixed(2)} SAR`);
    } else if (currency === 'EUR' && price > 0) {
      // Convert EUR to SAR (1 EUR ≈ 4.30 SAR, based on Laverne pricing)
      finalPrice = price * 4.30;
      currency = 'SAR';
      console.log(`💰 Converted ${price} EUR to ${finalPrice.toFixed(2)} SAR`);
    }
    
    return {
      success: true,
      product: {
        name: title,
        price: finalPrice,
        currency: currency,
        image: image || '',
        store: storeName,
        url: url,
      },
    };
  } catch (error) {
    console.error('Local store scraping error:', {
      message: error.message,
      code: error.code,
      url: url,
      storeName: storeName,
    });

    let errorMessage = 'فشل في جلب بيانات المنتج من المتجر المحلي';
    let suggestion = null;

    if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT') {
      errorMessage = 'فشل الاتصال بموقع المتجر. يرجى المحاولة مرة أخرى.';
    } else if (error.response) {
      const status = error.response.status;
      if (status === 403 || status === 401) {
        errorMessage = 'تم رفض الوصول للمنتج. يرجى التحقق من صحة الرابط.';
      } else if (status === 404) {
        errorMessage = 'المنتج غير موجود. يرجى التحقق من صحة الرابط.';
      } else if (status >= 500) {
        errorMessage = 'خطأ في خادم المتجر. يرجى المحاولة لاحقاً.';
      }
    } else if (error.message && error.message.includes('اسم المنتج')) {
      errorMessage = 'لم يتم العثور على اسم المنتج في الصفحة';
      suggestion = 'يرجى التأكد من أن الرابط يشير إلى صفحة منتج صحيحة';
    } else if (error.message && error.message.includes('سعر المنتج')) {
      errorMessage = 'لم يتم العثور على سعر المنتج في الصفحة';
      suggestion = 'يرجى التأكد من أن الرابط يشير إلى صفحة منتج صحيحة وأن السعر متوفر';
    }

    return {
      success: false,
      error: errorMessage,
      details: error.message,
      suggestion: suggestion,
    };
  }
};

