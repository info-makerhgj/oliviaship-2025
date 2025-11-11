import { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ActivityIndicator,
  TouchableOpacity,
  Image,
  Animated,
  PanResponder,
  Dimensions,
  Alert,
  Linking,
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { WebView } from 'react-native-webview';
import { StatusBar } from 'expo-status-bar';

const WEBSITE_URL = 'http://192.168.1.111:5174';
const { height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function App() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [showSplash, setShowSplash] = useState(true);
  const [storeUrl, setStoreUrl] = useState(null);
  const [storeHeight, setStoreHeight] = useState(SCREEN_HEIGHT * 0.4); // Start at 40%
  const fadeAnim = new Animated.Value(0);
  const mainWebViewRef = useRef(null);
  const storeWebViewRef = useRef(null);
  const pan = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 1000,
      useNativeDriver: true,
    }).start();

    const timer = setTimeout(() => {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }).start(() => {
        setShowSplash(false);
      });
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderMove: (_, gestureState) => {
        const newHeight = storeHeight - gestureState.dy;
        if (newHeight > 100 && newHeight < SCREEN_HEIGHT - 100) {
          setStoreHeight(newHeight);
        }
      },
    })
  ).current;

  const handleMessage = async (event) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === 'OPEN_STORE' && data.url) {
        setStoreUrl(data.url);
      } else if (data.type === 'CLOSE_STORE') {
        setStoreUrl(null);
      } else if (data.type === 'CURRENT_URL' && data.url) {
        // Copy URL to clipboard
        await Clipboard.setStringAsync(data.url);
        Alert.alert('✓', 'تم نسخ الرابط بنجاح');
      } else if (data.type === 'OPEN_URL' && data.url) {
        // Open URL in external browser (for PDFs, etc.)
        const canOpen = await Linking.canOpenURL(data.url);
        if (canOpen) {
          await Linking.openURL(data.url);
        } else {
          Alert.alert('خطأ', 'لا يمكن فتح الرابط');
        }
      }
    } catch (error) {
      console.log('Error handling message:', error);
    }
  };

  const injectedJavaScript = `
    (function() {
      // Intercept clicks on ALL external links
      document.addEventListener('click', function(e) {
        const link = e.target.closest('a');
        if (link && link.href) {
          const url = link.href;
          const currentDomain = window.location.hostname;
          const linkDomain = new URL(url).hostname;
          
          // Check if it's an external link (different domain)
          if (linkDomain !== currentDomain && linkDomain !== 'localhost' && linkDomain !== '192.168.1.111') {
            e.preventDefault();
            window.ReactNativeWebView.postMessage(JSON.stringify({
              type: 'OPEN_STORE',
              url: url
            }));
          }
        }
      }, true);
      
      true;
    })();
  `;

  if (showSplash) {
    return (
      <View style={styles.splashContainer}>
        <StatusBar style="light" />
        <Animated.View style={[styles.splashContent, { opacity: fadeAnim }]}>
          <Image
            source={require('./assets/logo.png')}
            style={styles.logoImage}
            resizeMode="contain"
          />
          <Text style={styles.splashTitle}>أوليفيا شيب</Text>
          <Text style={styles.splashTitleEn}>Olivia Ship</Text>
          <Text style={styles.splashSubtitle}>خدمة التوصيل العالمية</Text>
          <ActivityIndicator size="large" color="#fff" style={styles.splashLoader} />
        </Animated.View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar style="auto" />

      {/* Main Website */}
      <View style={[styles.mainWebView, storeUrl && { height: SCREEN_HEIGHT - storeHeight - 40 }]}>
        {loading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#d946ef" />
            <Text style={styles.loadingText}>جاري التحميل...</Text>
          </View>
        )}

        {error ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorEmoji}>😕</Text>
            <Text style={styles.errorTitle}>خطأ في الاتصال</Text>
            <Text style={styles.errorMessage}>تأكد من اتصالك بالإنترنت</Text>
            <TouchableOpacity
              style={styles.retryButton}
              onPress={() => {
                setError(false);
                setLoading(true);
              }}
            >
              <Text style={styles.retryButtonText}>إعادة المحاولة</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <WebView
            ref={mainWebViewRef}
            source={{ uri: WEBSITE_URL }}
            style={styles.webview}
            onLoadEnd={() => setLoading(false)}
            onError={() => {
              setLoading(false);
              setError(true);
            }}
            onMessage={handleMessage}
            injectedJavaScript={injectedJavaScript}
            javaScriptEnabled={true}
            domStorageEnabled={true}
            onShouldStartLoadWithRequest={(request) => {
              // Check if it's an external link
              const currentDomain = WEBSITE_URL.includes('localhost') ? 'localhost' : '192.168.1.111';
              const isExternal = !request.url.includes(currentDomain) && 
                                !request.url.startsWith('about:') &&
                                !request.url.startsWith('data:');
              
              if (isExternal && request.url.startsWith('http')) {
                // Open in bottom sheet instead
                setStoreUrl(request.url);
                return false; // Prevent navigation in main WebView
              }
              
              return true; // Allow navigation
            }}
          />
        )}
      </View>

      {/* Store Browser (Bottom Sheet) */}
      {storeUrl && (
        <View style={[styles.storeContainer, { height: storeHeight }]}>
          {/* Drag Handle */}
          <View style={styles.dragHandleContainer} {...panResponder.panHandlers}>
            <TouchableOpacity
              style={styles.copyButton}
              onPress={() => {
                // Copy URL to clipboard
                if (storeWebViewRef.current) {
                  // Get current URL from WebView
                  storeWebViewRef.current.injectJavaScript(`
                    window.ReactNativeWebView.postMessage(JSON.stringify({
                      type: 'CURRENT_URL',
                      url: window.location.href
                    }));
                    true;
                  `);
                }
              }}
            >
              <Text style={styles.copyButtonText}>📋 نسخ</Text>
            </TouchableOpacity>
            <View style={styles.dragHandle} />
            <Text style={styles.storeTitle}>متصفح المتجر</Text>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setStoreUrl(null)}
            >
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Store WebView */}
          <WebView
            ref={storeWebViewRef}
            source={{ uri: storeUrl }}
            style={styles.storeWebView}
            javaScriptEnabled={true}
            domStorageEnabled={true}
            allowsBackForwardNavigationGestures={true}
            startInLoadingState={true}
            onMessage={handleMessage}
            renderLoading={() => (
              <View style={styles.storeLoading}>
                <ActivityIndicator size="small" color="#d946ef" />
              </View>
            )}
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  splashContainer: {
    flex: 1,
    backgroundColor: '#1a1a2e',
    justifyContent: 'center',
    alignItems: 'center',
  },
  splashContent: {
    alignItems: 'center',
  },
  logoImage: {
    width: 150,
    height: 150,
    marginBottom: 30,
  },
  splashTitle: {
    fontSize: 42,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 5,
  },
  splashTitleEn: {
    fontSize: 32,
    fontWeight: '600',
    color: '#d946ef',
    marginBottom: 15,
  },
  splashSubtitle: {
    fontSize: 18,
    color: '#fff',
    opacity: 0.8,
  },
  splashLoader: {
    marginTop: 40,
  },
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingTop: 40,
  },
  mainWebView: {
    flex: 1,
  },
  webview: {
    flex: 1,
  },
  loadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    zIndex: 1,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorEmoji: {
    fontSize: 80,
    marginBottom: 20,
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  errorMessage: {
    fontSize: 16,
    color: '#666',
    marginBottom: 30,
  },
  retryButton: {
    backgroundColor: '#d946ef',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 10,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  storeContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 10,
  },
  dragHandleContainer: {
    height: 50,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    backgroundColor: '#f9fafb',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 15,
  },
  dragHandle: {
    width: 40,
    height: 5,
    backgroundColor: '#d1d5db',
    borderRadius: 3,
    position: 'absolute',
    top: 10,
    left: '50%',
    marginLeft: -20,
  },
  storeTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    position: 'absolute',
    left: 0,
    right: 0,
    textAlign: 'center',
  },
  copyButton: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: '#dbeafe',
    borderRadius: 8,
    zIndex: 1,
  },
  copyButtonText: {
    fontSize: 11,
    color: '#1e40af',
    fontWeight: '600',
  },
  closeButton: {
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fee2e2',
    borderRadius: 15,
    zIndex: 1,
  },
  closeButtonText: {
    fontSize: 18,
    color: '#dc2626',
    fontWeight: 'bold',
  },
  storeWebView: {
    flex: 1,
  },
  storeLoading: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
});
