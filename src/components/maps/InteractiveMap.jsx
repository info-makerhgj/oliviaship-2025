import { useEffect, useRef, useState } from 'react';
import { FiMapPin, FiLoader } from 'react-icons/fi';

export default function InteractiveMap({ 
  initialLat = 15.3694, 
  initialLng = 44.1910,
  onLocationSelect,
  zoom = 15,
  height = '400px'
}) {
  const mapRef = useRef(null);
  const markerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentLocation, setCurrentLocation] = useState({ lat: initialLat, lng: initialLng });

  useEffect(() => {
    // Check if Google Maps is loaded
    if (!window.google || !window.google.maps) {
      setError('Google Maps API غير محمل. يرجى التأكد من إضافة Google Maps API key.');
      setLoading(false);
      return;
    }

    // Initialize map
    const mapOptions = {
      center: { lat: initialLat, lng: initialLng },
      zoom: zoom,
      mapTypeId: window.google.maps.MapTypeId.ROADMAP,
      language: 'ar',
      disableDefaultUI: false,
      zoomControl: true,
      mapTypeControl: true,
      scaleControl: true,
      streetViewControl: false,
      rotateControl: false,
      fullscreenControl: true,
    };

    const map = new window.google.maps.Map(mapRef.current, mapOptions);
    mapInstanceRef.current = map;

    // Create marker
    const marker = new window.google.maps.Marker({
      position: { lat: initialLat, lng: initialLng },
      map: map,
      draggable: true,
      animation: window.google.maps.Animation.DROP,
      title: 'حدد موقع النقطة',
      icon: {
        url: 'data:image/svg+xml;base64,' + btoa(`
          <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="#EF4444">
            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
          </svg>
        `),
        scaledSize: new window.google.maps.Size(40, 40),
        anchor: new window.google.maps.Point(20, 40),
      },
    });
    markerRef.current = marker;

    // Add click listener to map
    map.addListener('click', (e) => {
      const lat = e.latLng.lat();
      const lng = e.latLng.lng();
      
      // Move marker to clicked location
      marker.setPosition({ lat, lng });
      setCurrentLocation({ lat, lng });
      
      // Call callback
      if (onLocationSelect) {
        onLocationSelect({ latitude: lat, longitude: lng });
      }
    });

    // Add drag listener to marker
    marker.addListener('dragend', (e) => {
      const lat = e.latLng.lat();
      const lng = e.latLng.lng();
      setCurrentLocation({ lat, lng });
      
      if (onLocationSelect) {
        onLocationSelect({ latitude: lat, longitude: lng });
      }
    });

    // Update location when initialLat/Lng changes
    const updateLocation = () => {
      if (initialLat && initialLng) {
        const newPos = { lat: initialLat, lng: initialLng };
        marker.setPosition(newPos);
        map.setCenter(newPos);
        setCurrentLocation(newPos);
      }
    };

    updateLocation();
    setLoading(false);

    return () => {
      // Cleanup
      if (marker) {
        window.google.maps.event.clearInstanceListeners(marker);
      }
      if (map) {
        window.google.maps.event.clearInstanceListeners(map);
      }
    };
  }, [initialLat, initialLng, zoom, onLocationSelect]);

  // Update marker position when props change
  useEffect(() => {
    if (mapInstanceRef.current && markerRef.current && initialLat && initialLng) {
      const newPos = { lat: initialLat, lng: initialLng };
      markerRef.current.setPosition(newPos);
      mapInstanceRef.current.setCenter(newPos);
      setCurrentLocation(newPos);
    }
  }, [initialLat, initialLng]);

  if (error) {
    return (
      <div className="flex items-center justify-center h-full bg-gray-100 rounded-lg p-4">
        <div className="text-center">
          <FiMapPin className="text-2xl text-gray-400 mx-auto mb-2" />
          <p className="text-sm text-gray-600">{error}</p>
          <p className="text-xs text-gray-500 mt-2">
            يرجى إضافة Google Maps API key في index.html
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative" style={{ height }}>
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 bg-opacity-75 z-10 rounded-lg">
          <div className="text-center">
            <FiLoader className="animate-spin text-primary-600 text-2xl mx-auto mb-2" />
            <p className="text-sm text-gray-600">جاري تحميل الخريطة...</p>
          </div>
        </div>
      )}
      <div ref={mapRef} className="w-full h-full rounded-lg" style={{ minHeight: height }} />
      <div className="absolute bottom-4 left-4 bg-white rounded-lg shadow-lg px-3 py-2 text-xs">
        <div className="flex items-center gap-2">
          <FiMapPin className="text-red-500" />
          <span className="text-gray-700">
            خط العرض: <span className="font-mono">{currentLocation.lat.toFixed(6)}</span>
          </span>
        </div>
        <div className="flex items-center gap-2 mt-1">
          <FiMapPin className="text-red-500" />
          <span className="text-gray-700">
            خط الطول: <span className="font-mono">{currentLocation.lng.toFixed(6)}</span>
          </span>
        </div>
        <p className="text-gray-500 text-xs mt-2">💡 انقر على الخريطة أو اسحب الدبوس لتحديد الموقع</p>
      </div>
    </div>
  );
}


