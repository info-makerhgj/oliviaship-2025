import { useEffect, useState, useRef } from 'react';
import { posAPI, walletAPI, userAPI } from '../../utils/api';
import { formatDate, formatCurrency } from '../../utils/helpers';
import {
  FiMapPin,
  FiLoader,
  FiPlus,
  FiEye,
  FiEdit,
  FiTrash2,
  FiSearch,
  FiFilter,
  FiMap,
  FiCreditCard,
  FiPackage,
  FiCheckCircle,
  FiXCircle,
  FiMail,
  FiPhone,
  FiUser,
  FiExternalLink,
  FiPause,
  FiPlay,
  FiClock,
  FiDollarSign,
} from 'react-icons/fi';
import ConfirmationModal from '../../components/modals/ConfirmationModal';
import ToastNotification from '../../components/modals/ToastNotification';
import InteractiveMap from '../../components/maps/InteractiveMap';

export default function PointsOfSale() {
  const [points, setPoints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDistributeModal, setShowDistributeModal] = useState(false);
  const [showManagerModal, setShowManagerModal] = useState(false);
  const [showCommissionsModal, setShowCommissionsModal] = useState(false);
  const [selectedPoint, setSelectedPoint] = useState(null);
  const [commissions, setCommissions] = useState([]);
  const [loadingCommissions, setLoadingCommissions] = useState(false);
  const [commissionPagination, setCommissionPagination] = useState({ page: 1, limit: 20, total: 0, pages: 0 });
  const [commissionStatusFilter, setCommissionStatusFilter] = useState('all');
  const [selectedCommission, setSelectedCommission] = useState(null);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [newStatus, setNewStatus] = useState('');
  const [statusNote, setStatusNote] = useState('');
  const [updatingStatus, setUpdatingStatus] = useState(null);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, pages: 0 });
  const [users, setUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [pointsStats, setPointsStats] = useState({}); // { pointId: { totalOrders, delivered, pending, ... } }
  const [loadingStats, setLoadingStats] = useState({});
  
  // Modal states
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmModalData, setConfirmModalData] = useState({});
  const [toast, setToast] = useState({ isOpen: false, message: '', type: 'info', duration: 3000 });
  
  // Default coordinates (Sana'a, Yemen)
  const initialLat = 15.3694;
  const initialLng = 44.1910;
  
  // Helper function to get coordinates from address using Geocoding API
  const [geocodingLoading, setGeocodingLoading] = useState(false);
  const [mapLinkProcessing, setMapLinkProcessing] = useState(false);
  
  // Function to extract coordinates from Google Maps link
  const extractCoordsFromGoogleMapsLink = async (link) => {
    if (!link || typeof link !== 'string') return null;
    
    try {
      console.log('🔗 معالجة رابط خرائط Google:', link);
      
      // For short links (maps.app.goo.gl), resolve to full URL first
      if (link.includes('maps.app.goo.gl')) {
        try {
          // Extract the short code
          const shortCodeMatch = link.match(/maps\.app\.goo\.gl\/([a-zA-Z0-9]+)/);
          if (shortCodeMatch && shortCodeMatch[1]) {
            const shortCode = shortCodeMatch[1];
            console.log('🔗 حل العناوين القصيرة:', shortCode);
            
            const response = await fetch(link, { redirect: 'manual' });
            const finalUrl = response.headers.get('location') || response.url;
            console.log('📍 الرابط النهائي:', finalUrl);
            
            // Now extract from the final URL
            const coordMatch = finalUrl.match(/@(-?\d+\.?\d*),(-?\d+\.?\d*)/);
            if (coordMatch && coordMatch.length >= 3) {
              const lat = parseFloat(coordMatch[1]);
              const lng = parseFloat(coordMatch[2]);
              if (!isNaN(lat) && !isNaN(lng)) {
                console.log('✅ تم استخراج الإحداثيات:', { lat, lng });
                return { latitude: lat.toString(), longitude: lng.toString() };
              }
            }
          }
        } catch (error) {
          console.warn('❌ فشل حل العناوين القصيرة:', error);
        }
      }
      
      // For full URLs, extract directly
      const urlPatterns = [
        // Format 1: @lat,lng (most common)
        /@(-?\d+\.?\d*),(-?\d+\.?\d*)/,
        // Format 2: q=lat,lng
        /[?&]q=(-?\d+\.?\d*),(-?\d+\.?\d*)/,
        // Format 3: ll=lat,lng
        /[?&]ll=(-?\d+\.?\d*),(-?\d+\.?\d*)/,
        // Format 4: center=lat,lng
        /center=(-?\d+\.?\d*),(-?\d+\.?\d*)/,
      ];
      
      for (const pattern of urlPatterns) {
        const match = link.match(pattern);
        if (match && match.length >= 3) {
          const lat = parseFloat(match[1]);
          const lng = parseFloat(match[2]);
          
          if (!isNaN(lat) && !isNaN(lng)) {
            console.log('✅ تم استخراج الإحداثيات مباشرة:', { lat, lng });
            return { latitude: lat.toString(), longitude: lng.toString() };
          }
        }
      }
      
      console.warn('❌ لم يتم العثور على إحداثيات في الرابط');
      return null;
    } catch (error) {
      console.error('❌ خطأ في استخراج الإحداثيات:', error);
      return null;
    }
  };
  
  const geocodeAddress = async (address, retryCount = 0) => {
    if (!address || address.length < 3) {
      setGeocodingLoading(false);
      return;
    }

    setGeocodingLoading(true);
    
    try {
      // Using Nominatim (OpenStreetMap) as free alternative
      // Add a delay to respect rate limits (1 second minimum between requests)
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address + ', Yemen')}&limit=1&accept-language=ar`,
        {
          headers: {
            'User-Agent': 'YemenDeliveryApp/1.0', // Required by Nominatim
          }
        }
      );
      
      if (!response.ok) {
        // If rate limited or server error, retry once after delay
        if (response.status === 429 || response.status >= 500) {
          if (retryCount < 1) {
            setGeocodingLoading(false);
            setTimeout(() => geocodeAddress(address, retryCount + 1), 2000);
            return;
          }
        }
        throw new Error('Geocoding failed');
      }

      const data = await response.json();
      
      if (data && data.length > 0) {
        const result = data[0];
        const lat = parseFloat(result.lat);
        const lng = parseFloat(result.lon);
        
        // Validate coordinates are valid
        if (isNaN(lat) || isNaN(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
          throw new Error('Invalid coordinates received');
        }
        
        // Extract city from address
        setFormData(prev => {
          let city = prev.location.city;
          if (result.address) {
            city = result.address.city || result.address.town || result.address.state || prev.location.city;
          }

          return {
            ...prev,
            location: {
              address: address,
              city: city || prev.location.city,
              coordinates: {
                latitude: lat.toString(),
                longitude: lng.toString(),
              },
            },
          };
        });
        setGeocodingLoading(false);
      } else {
        setGeocodingLoading(false);
        console.warn('No results found for address:', address);
      }
    } catch (error) {
      console.warn('Geocoding failed, user can enter coordinates manually:', error);
      setGeocodingLoading(false);
    }
  };

  // Debounce function for address search
  const [geocodeTimeout, setGeocodeTimeout] = useState(null);
  
  const handleAddressChange = (e) => {
    const input = e.target.value;
    setFormData(prev => ({
      ...prev,
      location: { ...prev.location, address: input }
    }));

    // Clear previous timeout
    if (geocodeTimeout) {
      clearTimeout(geocodeTimeout);
    }

    // Debounce geocoding - wait 1 second after user stops typing (reduced from 1.5s)
    if (input.length > 5) {
      const timeout = setTimeout(() => {
        geocodeAddress(input);
      }, 1000);
      setGeocodeTimeout(timeout);
    } else if (input.length < 3) {
      // Clear coordinates if input is too short (only if no map link provided)
      if (!formData.location.mapLink) {
        setFormData(prev => ({
          ...prev,
          location: {
            ...prev.location,
            coordinates: {
              latitude: '',
              longitude: '',
            },
          },
        }));
        setGeocodingLoading(false);
      }
    }
  };

  // Handle map link input separately
  const handleMapLinkChange = (e) => {
    const link = e.target.value;
    setFormData(prev => ({
      ...prev,
      location: { ...prev.location, mapLink: link }
    }));

    // Clear previous timeout
    if (geocodeTimeout) {
      clearTimeout(geocodeTimeout);
    }

    // Check if input is a Google Maps link
    const isGoogleMapsLink = link.includes('maps.app.goo.gl') || 
                            link.includes('google.com/maps') ||
                            link.includes('maps.google.com');
    
    if (isGoogleMapsLink && link.length > 10) {
      // Extract coordinates from Google Maps link
      setMapLinkProcessing(true);
      const timeout = setTimeout(async () => {
        const coords = await extractCoordsFromGoogleMapsLink(link);
        setMapLinkProcessing(false);
        
        if (coords && coords.latitude && coords.longitude) {
          console.log('✅ تم استخراج الإحداثيات من رابط خرائط Google:', coords);
          setFormData(prev => ({
            ...prev,
            location: {
              ...prev.location,
              coordinates: coords
            }
          }));
          formDataRef.current = {
            ...formDataRef.current,
            location: {
              ...formDataRef.current.location,
              coordinates: coords
            }
          };
          setToast({
            isOpen: true,
            message: `✅ تم استخراج الإحداثيات من رابط الخريطة! ${String(coords.latitude).substring(0, 8)}, ${String(coords.longitude).substring(0, 8)}`,
            type: 'success',
            duration: 3000
          });
        } else {
          console.warn('❌ لم يتم العثور على إحداثيات في الرابط');
          setToast({
            isOpen: true,
            message: '⚠️ لم يتم العثور على إحداثيات في الرابط. تأكد أن الرابط يحتوي على موقع محدد.',
            type: 'warning',
            duration: 3000
          });
        }
      }, 800);
      setGeocodeTimeout(timeout);
    }
  };

  // Create form
  const formDataRef = useRef(null);
  const [formData, setFormData] = useState({
    name: '',
    type: 'both',
    location: {
      address: '',
      mapLink: '', // رابط الخريطة منفصل عن العنوان
      city: 'صنعاء',
      coordinates: {
        latitude: '',
        longitude: '',
      },
    },
    contact: {
      phone: '',
      whatsapp: '',
      email: '',
    },
    operatingHours: {
      from: '09:00',
      to: '22:00',
      days: [],
    },
    settings: {
      commission: 0,
      codeCommission: 0,
      discountOnCodes: 0,
    },
    manager: '',
    notes: '',
  });

  // Keep formDataRef in sync with formData
  useEffect(() => {
    formDataRef.current = formData;
  }, [formData]);

  useEffect(() => {
    loadPoints(pagination.page);
  }, [statusFilter, typeFilter, pagination.page]);

  const loadPoints = async (page = 1) => {
    try {
      setLoading(true);
      const params = {
        page,
        limit: 20,
        ...(statusFilter !== 'all' && { status: statusFilter }),
        ...(typeFilter !== 'all' && { type: typeFilter }),
        ...(searchTerm && { search: searchTerm }),
      };
      const res = await posAPI.getAll(params);
      const loadedPoints = res.data.points || [];
      setPoints(loadedPoints);
      setPagination(res.data.pagination || { page: 1, limit: 20, total: 0, pages: 0 });
      
      // Load stats for all points
      loadedPoints.forEach(point => {
        loadPointStats(point._id);
      });
    } catch (error) {
      console.error('Failed to load points', error);
    } finally {
      setLoading(false);
    }
  };

  const loadPointStats = async (pointId) => {
    if (loadingStats[pointId]) return; // Avoid duplicate requests
    
    setLoadingStats(prev => ({ ...prev, [pointId]: true }));
    try {
      const res = await posAPI.getAdminStats(pointId);
      setPointsStats(prev => ({
        ...prev,
        [pointId]: res.data.stats,
      }));
    } catch (error) {
      console.error(`Failed to load stats for point ${pointId}`, error);
    } finally {
      setLoadingStats(prev => ({ ...prev, [pointId]: false }));
    }
  };

  const loadCommissions = async (pointId, page = 1, status = 'all') => {
    if (!pointId) return;
    
    setLoadingCommissions(true);
    try {
      const params = { page, limit: 20 };
      if (status !== 'all') {
        params.status = status;
      }
      const res = await posAPI.getCommissions(pointId, params);
      setCommissions(res.data.commissions || []);
      setCommissionPagination(res.data.pagination || { page: 1, limit: 20, total: 0, pages: 0 });
    } catch (error) {
      console.error('Failed to load commissions', error);
      setToast({ isOpen: true, message: 'فشل في تحميل العمولات', type: 'error' });
    } finally {
      setLoadingCommissions(false);
    }
  };

  const handleStatusChange = (commission) => {
    setSelectedCommission(commission);
    setNewStatus(commission.status);
    setStatusNote('');
    setShowStatusModal(true);
  };

  const updateCommissionStatus = async () => {
    if (!selectedCommission || !newStatus) return;

    try {
      setUpdatingStatus(selectedCommission._id);
      await posAPI.updateCommissionStatus(selectedCommission._id, {
        status: newStatus,
        paymentNotes: statusNote,
      });
      
      // Reload commissions
      await loadCommissions(selectedPoint._id, commissionPagination.page, commissionStatusFilter);
      
      // Reload stats
      await loadPointStats(selectedPoint._id);
      
      setShowStatusModal(false);
      setSelectedCommission(null);
      setToast({ isOpen: true, message: '✅ تم تحديث حالة العمولة بنجاح', type: 'success' });
    } catch (error) {
      setToast({ isOpen: true, message: error.response?.data?.message || 'فشل في تحديث حالة العمولة', type: 'error' });
    } finally {
      setUpdatingStatus(null);
    }
  };

  useEffect(() => {
    console.log('🔄 State changed:', { 
      showCommissionsModal, 
      hasSelectedPoint: !!selectedPoint, 
      selectedPointId: selectedPoint?._id,
      selectedPointName: selectedPoint?.name 
    });
    if (showCommissionsModal && selectedPoint && selectedPoint._id) {
      console.log('📊 Loading commissions for point:', selectedPoint._id, selectedPoint.name);
      loadCommissions(selectedPoint._id, 1, commissionStatusFilter);
    } else if (showCommissionsModal && !selectedPoint) {
      console.error('⚠️ Modal is open but selectedPoint is null/undefined');
    }
  }, [showCommissionsModal, selectedPoint]);
  
  // Reset filter when modal closes
  useEffect(() => {
    if (!showCommissionsModal) {
      setCommissionStatusFilter('all');
      setCommissions([]);
    }
  }, [showCommissionsModal]);

  const handleCreatePoint = async (e, isRetry = false) => {
    e.preventDefault();
    if (!formData.name || !formData.location.address || !formData.contact.phone) {
      setToast({ isOpen: true, message: 'يرجى إدخال البيانات المطلوبة', type: 'warning' });
      return;
    }

    // Check if geocoding is still in progress - give it a chance to complete
    if (geocodingLoading && !isRetry) {
      setToast({ isOpen: true, message: '⏳ جاري البحث عن الإحداثيات... يرجى الانتظار قليلاً', type: 'info', duration: 3000 });
      
      // Wait a bit more for geocoding to complete (up to 3 more seconds)
      const maxWait = 3000; // 3 seconds
      const startTime = Date.now();
      
      const checkCoordinates = () => {
        const elapsed = Date.now() - startTime;
        
        // Use ref to get latest formData value
        const currentFormData = formDataRef.current;
        const currentLat = currentFormData?.location?.coordinates?.latitude;
        const currentLng = currentFormData?.location?.coordinates?.longitude;
        
        if (currentLat && currentLng && !geocodingLoading) {
          // Coordinates found - proceed with submission
          const syntheticEvent = { preventDefault: () => {} };
          handleCreatePoint(syntheticEvent, true);
          return;
        }
        
        // If still within wait time and geocoding is still loading, check again
        if (elapsed < maxWait && geocodingLoading) {
          setTimeout(checkCoordinates, 500);
        } else {
          // Timeout or geocoding stopped but no coordinates found
          setToast({ 
            isOpen: true, 
            message: '⚠️ لم يتم تحديد الإحداثيات تلقائياً. يرجى إدخال الإحداثيات يدوياً من الخريطة أدناه أو من خرائط Google.', 
            type: 'warning',
            duration: 5000 
          });
          // Scroll to coordinates input section
          setTimeout(() => {
            const coordsSection = document.querySelector('[data-coords-section]');
            if (coordsSection) {
              coordsSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
          }, 100);
        }
      };
      
      // Start checking after a short delay
      setTimeout(checkCoordinates, 500);
      return;
    }

    // Double check coordinates - also check from ref for latest value
    const coordsLat = formData.location.coordinates.latitude || formDataRef.current?.location?.coordinates?.latitude;
    const coordsLng = formData.location.coordinates.longitude || formDataRef.current?.location?.coordinates?.longitude;
    
    console.log('🔍 التحقق من الإحداثيات قبل الحفظ:', {
      fromFormData: {
        lat: formData.location.coordinates.latitude,
        lng: formData.location.coordinates.longitude
      },
      fromRef: {
        lat: formDataRef.current?.location?.coordinates?.latitude,
        lng: formDataRef.current?.location?.coordinates?.longitude
      },
      final: { lat: coordsLat, lng: coordsLng }
    });
    
    if (!coordsLat || !coordsLng) {
      setToast({ 
        isOpen: true, 
        message: '⚠️ لم يتم تحديد الإحداثيات. يرجى تحديد الموقع من الخريطة أدناه (انقر على الخريطة) أو أدخل الإحداثيات يدوياً.', 
        type: 'warning',
        duration: 6000 
      });
      // Scroll to coordinates input section
      setTimeout(() => {
        const coordsSection = document.querySelector('[data-coords-section]');
        if (coordsSection) {
          coordsSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
        } else {
          // If manual input section not visible, scroll to map
          const mapSection = document.querySelector('[data-map-section]');
          if (mapSection) {
            mapSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        }
      }, 100);
      return;
    }

    if (!formData.operatingHours.from || !formData.operatingHours.to) {
      setToast({ isOpen: true, message: 'يرجى تحديد ساعات العمل (من وإلى)', type: 'warning' });
      return;
    }

    try {
      // Use latest coordinates from ref if available
      const finalLat = formData.location.coordinates.latitude || formDataRef.current?.location?.coordinates?.latitude;
      const finalLng = formData.location.coordinates.longitude || formDataRef.current?.location?.coordinates?.longitude;
      
      const data = {
        ...formData,
        location: {
          ...formData.location,
          coordinates: {
            latitude: parseFloat(finalLat),
            longitude: parseFloat(finalLng),
          },
        },
        settings: {
          commission: parseFloat(formData.settings.commission) || 0,
          codeCommission: parseFloat(formData.settings.codeCommission) || 0,
          discountOnCodes: parseFloat(formData.settings.discountOnCodes) || 0,
        },
        manager: formData.manager || undefined,
      };

      await posAPI.create(data);
      setToast({ isOpen: true, message: '✅ تم إنشاء النقطة بنجاح!', type: 'success' });
      setShowCreateModal(false);
      resetForm();
      loadPoints(1);
    } catch (error) {
      setToast({ isOpen: true, message: error.response?.data?.message || 'فشل في إنشاء النقطة', type: 'error' });
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      type: 'both',
      location: {
        address: '',
        mapLink: '',
        city: 'صنعاء',
        coordinates: {
          latitude: '',
          longitude: '',
        },
      },
      contact: {
        phone: '',
        whatsapp: '',
        email: '',
      },
      operatingHours: {
        from: '09:00',
        to: '22:00',
        days: [],
      },
      settings: {
        commission: 0,
        codeCommission: 0,
        discountOnCodes: 0,
      },
      manager: '',
      notes: '',
    });
  };

  const handleDelete = async (id) => {
    const point = points.find(p => p._id === id);
    const pointName = point?.name || 'هذه النقطة';
    
    setConfirmModalData({
      title: 'حذف النقطة',
      message: `هل أنت متأكد من حذف ${pointName}؟\n\nملاحظة: لا يمكن حذف النقطة إذا كانت تحتوي على طلبات نشطة أو أكواد موزعة.`,
      type: 'danger',
      onConfirm: async () => {
        setShowConfirmModal(false);
        try {
          await posAPI.delete(id);
          setToast({ isOpen: true, message: '✅ تم حذف النقطة بنجاح', type: 'success' });
          loadPoints(pagination.page);
        } catch (error) {
          const errorMsg = error.response?.data?.message || 'فشل في حذف النقطة';
          setToast({ isOpen: true, message: `❌ ${errorMsg}`, type: 'error' });
        }
      },
    });
    setShowConfirmModal(true);
  };

  const handleToggleStatus = async (id) => {
    const point = points.find(p => p._id === id);
    const isActive = point?.status === 'active';
    const action = isActive ? 'تعطيل' : 'تفعيل';
    
    setConfirmModalData({
      title: `${action} النقطة`,
      message: `هل أنت متأكد من ${action} ${point?.name || 'هذه النقطة'}؟`,
      type: 'warning',
      onConfirm: async () => {
        setShowConfirmModal(false);
        try {
          await posAPI.toggleStatus(id);
          setToast({ isOpen: true, message: `✅ تم ${action} النقطة بنجاح`, type: 'success' });
          loadPoints(pagination.page);
        } catch (error) {
          setToast({ isOpen: true, message: error.response?.data?.message || `فشل في ${action} النقطة`, type: 'error' });
        }
      },
    });
    setShowConfirmModal(true);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'inactive':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'suspended':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'active':
        return 'نشطة';
      case 'inactive':
        return 'غير نشطة';
      case 'suspended':
        return 'موقوفة';
      default:
        return status;
    }
  };

  const getTypeText = (type) => {
    switch (type) {
      case 'codes_only':
        return 'أكواد فقط';
      case 'pickup_only':
        return 'استلام فقط';
      case 'both':
        return 'كليهما';
      default:
        return type;
    }
  };

  if (loading && points.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <FiLoader className="animate-spin text-xl md:text-2xl text-primary-600" />
      </div>
    );
  }

  return (
    <>
    <div className="p-3 md:p-6 space-y-4 md:space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-xl font-bold mb-2 text-gradient">نقاط البيع والاستلام</h1>
          <p className="text-sm text-gray-600">إدارة شبكة نقاط البيع والاستلام</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="btn-primary flex items-center gap-2 px-4 py-2 text-sm md:text-base"
        >
          <FiPlus />
          إضافة نقطة
        </button>
      </div>

      {/* Filters */}
      <div className="card p-3 md:p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="relative">
            <FiSearch className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="البحث بالاسم، الكود، أو العنوان..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setPagination(prev => ({ ...prev, page: 1 }));
              }}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  loadPoints(1);
                }
              }}
              className="w-full pr-10 pl-4 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPagination(prev => ({ ...prev, page: 1 }));
            }}
            className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
          >
            <option value="all">جميع الحالات</option>
            <option value="active">نشطة</option>
            <option value="inactive">غير نشطة</option>
            <option value="suspended">موقوفة</option>
          </select>
          <select
            value={typeFilter}
            onChange={(e) => {
              setTypeFilter(e.target.value);
              setPagination(prev => ({ ...prev, page: 1 }));
            }}
            className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
          >
            <option value="all">جميع الأنواع</option>
            <option value="codes_only">أكواد فقط</option>
            <option value="pickup_only">استلام فقط</option>
            <option value="both">كليهما</option>
          </select>
        </div>
      </div>

      {/* Points Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {points.map((point) => (
          <div key={point._id} className="card p-4 hover:shadow-lg transition-shadow">
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <h3 className="text-lg font-bold text-gray-900 mb-1">{point.name}</h3>
                <p className="text-xs text-gray-500 font-mono">{point.code}</p>
              </div>
              <span className={`px-2 py-1 rounded text-xs font-medium border ${getStatusColor(point.status)}`}>
                {getStatusText(point.status)}
              </span>
            </div>

            <div className="space-y-2 mb-4">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <FiMapPin className="text-primary-600" />
                <span className="line-clamp-1">{point.location.address}</span>
              </div>
              {point.location.mapLink && (
                <div className="flex items-center gap-2 text-sm">
                  <FiMap className="text-blue-600" />
                  <a 
                    href={point.location.mapLink} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-600 underline truncate max-w-[200px]"
                    title={point.location.mapLink}
                  >
                    رابط الخريطة
                  </a>
                </div>
              )}
              {point.location.coordinates?.latitude && point.location.coordinates?.longitude && (
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <FiMapPin className="text-green-600" />
                  <span className="font-mono">
                    {String(point.location.coordinates.latitude).substring(0, 8)}, {String(point.location.coordinates.longitude).substring(0, 8)}
                  </span>
                </div>
              )}
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <span className="text-gray-400">•</span>
                <span>{point.location.city}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <span className={`px-2 py-0.5 rounded text-xs ${
                  point.type === 'both' ? 'bg-blue-100 text-blue-700' :
                  point.type === 'codes_only' ? 'bg-green-100 text-green-800' :
                  'bg-purple-100 text-purple-700'
                }`}>
                  {getTypeText(point.type)}
                </span>
              </div>
            </div>

            {/* Stats - Codes & Sales */}
            <div className="grid grid-cols-3 gap-2 mb-3 pt-3 border-t border-gray-200">
              <div className="text-center">
                <p className="text-xs text-gray-600 mb-0.5">الأكواد</p>
                <p className="text-sm font-bold text-primary-600">{point.inventory?.availableCodes || 0}</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-gray-600 mb-0.5">المبيعات</p>
                <p className="text-sm font-bold text-green-600">{point.inventory?.totalSales || 0}</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-gray-600 mb-0.5">التقييم</p>
                <p className="text-sm font-bold text-yellow-600">
                  {point.rating?.average ? point.rating.average.toFixed(1) : '0.0'}
                </p>
              </div>
            </div>

            {/* Orders Stats */}
            {loadingStats[point._id] ? (
              <div className="flex justify-center py-2 mb-3">
                <FiLoader className="animate-spin text-sm text-gray-400" />
              </div>
            ) : pointsStats[point._id] ? (
              <>
                <div className="mb-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="flex items-center gap-2 mb-2">
                    <FiPackage className="text-primary-600 text-sm" />
                    <p className="text-xs font-bold text-gray-700">إحصائيات الطلبات</p>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-gray-600">إجمالي الطلبات:</span>
                      <span className="font-bold text-gray-900">{pointsStats[point._id].totalOrders || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">تم التسليم:</span>
                      <span className="font-bold text-green-600">{pointsStats[point._id].deliveredOrders || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">قيد الانتظار:</span>
                      <span className="font-bold text-yellow-600">{pointsStats[point._id].pendingOrders || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">جاهزة للاستلام:</span>
                      <span className="font-bold text-blue-600">{pointsStats[point._id].readyOrders || 0}</span>
                    </div>
                    {pointsStats[point._id].awaitingPickup > 0 && (
                      <div className="col-span-2 flex justify-between pt-1 border-t border-gray-300">
                        <span className="text-gray-600 font-semibold">في انتظار العميل:</span>
                        <span className="font-bold text-orange-600">{pointsStats[point._id].awaitingPickup}</span>
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Commissions Stats */}
                {pointsStats[point._id].commissions !== undefined && (
                  <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <FiDollarSign className="text-blue-600 text-sm" />
                        <p className="text-xs font-bold text-gray-700">العمولات</p>
                      </div>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          console.log('🖱️ Clicked عرض السجل for point:', point._id, point.name);
                          console.log('📦 Point object:', point);
                          
                          // Set both states together
                          setSelectedPoint({ ...point });
                          setShowCommissionsModal(true);
                          
                          console.log('✅ States set - should trigger re-render');
                        }}
                        className="text-xs text-blue-600 hover:text-blue-600 underline cursor-pointer hover:font-medium"
                        style={{ pointerEvents: 'auto' }}
                      >
                        عرض السجل
                      </button>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="flex justify-between">
                        <span className="text-gray-600">إجمالي العمولات:</span>
                        <span className="font-bold text-blue-900">{formatCurrency(pointsStats[point._id].commissions.total || 0, 'SAR')}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">معلقة:</span>
                        <span className="font-bold text-yellow-600">{formatCurrency(pointsStats[point._id].commissions.pending || 0, 'SAR')}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">معتمدة:</span>
                        <span className="font-bold text-green-600">{formatCurrency(pointsStats[point._id].commissions.approved || 0, 'SAR')}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">مدفوعة:</span>
                        <span className="font-bold text-primary-600">{formatCurrency(pointsStats[point._id].commissions.paid || 0, 'SAR')}</span>
                      </div>
                      {pointsStats[point._id].commissions.count > 0 && (
                        <div className="col-span-2 flex justify-between pt-1 border-t border-blue-300">
                          <span className="text-gray-600 font-semibold">عدد العمولات:</span>
                          <span className="font-bold text-blue-900">{pointsStats[point._id].commissions.count}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </>
            ) : null}

            {/* Actions */}
            <div className="flex flex-wrap gap-2 pt-3 border-t border-gray-200">
              <button
                onClick={() => {
                  window.open(`/pos/${point._id}`, '_blank');
                }}
                className="flex-1 btn-primary px-3 py-1.5 text-xs flex items-center justify-center gap-1 min-w-[120px]"
                title={`الوصول: /pos/${point._id}`}
              >
                <FiExternalLink />
                لوحة التحكم
              </button>
              
              <button
                onClick={() => handleToggleStatus(point._id)}
                className={`px-3 py-1.5 text-xs border rounded-lg transition-colors flex items-center justify-center gap-1 ${
                  point.status === 'active'
                    ? 'border-orange-300 text-orange-600 hover:bg-orange-50'
                    : 'border-green-300 text-green-600 hover:bg-green-50'
                }`}
                title={point.status === 'active' ? 'تعطيل النقطة' : 'تفعيل النقطة'}
              >
                {point.status === 'active' ? (
                  <>
                    <FiPause />
                    تعطيل
                  </>
                ) : (
                  <>
                    <FiPlay />
                    تفعيل
                  </>
                )}
              </button>
              
              <button
                onClick={() => {
                  setSelectedPoint(point);
                  setShowManagerModal(true);
                }}
                className="px-3 py-1.5 text-xs border border-gray-300 text-gray-600 rounded-lg hover:bg-gray-50 transition-colors"
                title="تعيين مدير"
              >
                <FiUser />
              </button>
              
              <button
                onClick={() => {
                  setSelectedPoint(point);
                  setShowDistributeModal(true);
                }}
                className="flex-1 btn-secondary px-3 py-1.5 text-xs flex items-center justify-center gap-1 min-w-[100px]"
              >
                <FiCreditCard />
                توزيع أكواد
              </button>
              
              <button
                onClick={() => handleDelete(point._id)}
                className="px-3 py-1.5 text-xs border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                title="حذف النقطة"
              >
                <FiTrash2 />
              </button>
            </div>
          </div>
        ))}
      </div>

      {points.length === 0 && !loading && (
        <div className="card text-center py-12">
          <FiMapPin className="text-3xl md:text-4xl text-gray-300 mx-auto mb-4" />
          <p className="text-lg text-gray-600">لا توجد نقاط</p>
        </div>
      )}

      {/* Pagination */}
      {pagination.pages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => loadPoints(pagination.page - 1)}
            disabled={pagination.page === 1}
            className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
          >
            السابق
          </button>
          <span className="text-sm text-gray-600">
            صفحة {pagination.page} من {pagination.pages}
          </span>
          <button
            onClick={() => loadPoints(pagination.page + 1)}
            disabled={pagination.page === pagination.pages}
            className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
          >
            التالي
          </button>
        </div>
      )}

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-4 md:p-6">
              <h2 className="text-lg font-bold mb-4">إضافة نقطة بيع/استلام</h2>
              <form onSubmit={handleCreatePoint} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">اسم النقطة *</label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                      placeholder="مثال: نقطة صنعاء - شارع الزبيري"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">نوع الخدمات *</label>
                    <select
                      value={formData.type}
                      onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    >
                      <option value="both">كليهما (أكواد + استلام)</option>
                      <option value="codes_only">أكواد فقط</option>
                      <option value="pickup_only">استلام فقط</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    العنوان الكامل * 
                    <span className="text-gray-500 font-normal mr-1">(مثال: بقالة فلان، شارع الزبيري)</span>
                  </label>
                  <input
                    type="text"
                    value={formData.location.address}
                    onChange={handleAddressChange}
                    required
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    placeholder="أدخل العنوان النصي (مثال: بقالة فلان، شارع الزبيري، صنعاء)"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    رابط خرائط Google (اختياري)
                    <span className="text-gray-500 font-normal mr-1">(للاستخراج التلقائي للإحداثيات)</span>
                  </label>
                  <input
                    type="url"
                    value={formData.location.mapLink}
                    onChange={handleMapLinkChange}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    placeholder="الصق رابط من خرائط Google (مثال: https://maps.app.goo.gl/...)"
                  />
                  <div className="flex items-center gap-2 mt-1">
                    {mapLinkProcessing ? (
                      <div className="flex items-center gap-2 text-primary-600 text-xs">
                        <FiLoader className="animate-spin" />
                        <span>جاري استخراج الإحداثيات من رابط الخريطة...</span>
                      </div>
                    ) : geocodingLoading ? (
                      <div className="flex items-center gap-2 text-primary-600 text-xs">
                        <FiLoader className="animate-spin" />
                        <span>جاري البحث عن الإحداثيات تلقائياً من العنوان...</span>
                      </div>
                    ) : formData.location.coordinates.latitude && formData.location.coordinates.longitude ? (
                      <div className="flex items-center gap-2 text-green-600 text-xs">
                        <FiCheckCircle />
                        <span>✅ تم تحديد الإحداثيات: {String(formData.location.coordinates.latitude).substring(0, 8)}, {String(formData.location.coordinates.longitude).substring(0, 8)}</span>
                      </div>
                    ) : formData.location.address && formData.location.address.length > 5 ? (
                      <div className="flex items-center gap-2 text-blue-600 text-xs">
                        <FiMap />
                        <span>💡 أدخل رابط الخريطة أعلاه، أو حدد الموقع من الخريطة أدناه، أو أدخل الإحداثيات يدوياً</span>
                      </div>
                    ) : (
                      <p className="text-xs text-gray-500">
                        💡 اكتب العنوان أو أدخل رابط من خرائط Google - سيتم استخراج الإحداثيات تلقائياً
                      </p>
                    )}
                  </div>
                </div>

                {/* Map Preview */}
                {formData.location.coordinates.latitude && formData.location.coordinates.longitude && (
                  <div className="border border-gray-200 rounded-lg overflow-hidden">
                    <div className="bg-gray-50 px-3 py-2 border-b border-gray-200">
                      <p className="text-xs font-medium text-gray-700">معاينة الموقع على الخريطة</p>
                    </div>
                    <div className="relative w-full" style={{ height: '250px' }}>
                      <iframe
                        width="100%"
                        height="100%"
                        style={{ border: 0 }}
                        loading="lazy"
                        allowFullScreen
                        referrerPolicy="no-referrer-when-downgrade"
                        src={`https://www.google.com/maps?q=${formData.location.coordinates.latitude},${formData.location.coordinates.longitude}&output=embed&zoom=17`}
                      />
                    </div>
                  </div>
                )}

                {/* Interactive Map Picker */}
                <div className="border border-gray-200 rounded-lg overflow-hidden" data-map-section>
                  <div className="bg-gray-50 px-3 py-2 border-b border-gray-200 flex items-center justify-between">
                    <p className="text-xs font-medium text-gray-700">اختر الموقع من الخريطة</p>
                    <button
                      type="button"
                      onClick={() => window.open(`https://www.google.com/maps?q=${formData.location.coordinates.latitude || initialLat},${formData.location.coordinates.longitude || initialLng}`, '_blank')}
                      className="text-xs text-primary-600 hover:text-primary-700"
                    >
                      فتح في خرائط Google
                    </button>
                  </div>
                  {window.google && window.google.maps ? (
                    <InteractiveMap
                      initialLat={formData.location.coordinates.latitude ? parseFloat(formData.location.coordinates.latitude) : initialLat}
                      initialLng={formData.location.coordinates.longitude ? parseFloat(formData.location.coordinates.longitude) : initialLng}
                      onLocationSelect={(location) => {
                        console.log('📍 تم تحديد موقع جديد من الخريطة:', location);
                        const lat = location.latitude?.toString() || location.lat?.toString() || '';
                        const lng = location.longitude?.toString() || location.lng?.toString() || '';
                        
                        if (lat && lng) {
                          setFormData(prev => {
                            const updated = {
                              ...prev,
                              location: {
                                ...prev.location,
                                coordinates: {
                                  latitude: lat,
                                  longitude: lng,
                                },
                              },
                            };
                            // Update ref immediately
                            formDataRef.current = updated;
                            console.log('✅ تم حفظ الإحداثيات:', { lat, lng });
                            
                            // Show success message
                            setToast({
                              isOpen: true,
                              message: `✅ تم تحديد الموقع بنجاح! الإحداثيات: ${lat}, ${lng}`,
                              type: 'success',
                              duration: 3000
                            });
                            
                            return updated;
                          });
                          setGeocodingLoading(false);
                        } else {
                          console.error('❌ إحداثيات غير صحيحة:', location);
                          setToast({
                            isOpen: true,
                            message: '❌ خطأ في الإحداثيات. يرجى المحاولة مرة أخرى.',
                            type: 'error',
                            duration: 3000
                          });
                        }
                      }}
                      zoom={15}
                      height="400px"
                    />
                  ) : (
                    <div className="relative w-full" style={{ height: '400px' }}>
                      <iframe
                        width="100%"
                        height="100%"
                        style={{ border: 0 }}
                        loading="lazy"
                        allowFullScreen
                        referrerPolicy="no-referrer-when-downgrade"
                        src={`https://www.google.com/maps?q=${encodeURIComponent(formData.location.address || 'صنعاء، اليمن')}&output=embed&zoom=13&language=ar`}
                      />
                      <div className="absolute top-2 right-2 bg-yellow-100 border border-yellow-300 rounded-lg px-3 py-2 text-xs text-yellow-800 max-w-xs">
                        <p className="font-semibold mb-1">⚠️ خريطة للعرض فقط</p>
                        <p className="mb-2">للحصول على خريطة تفاعلية يمكنك النقر عليها لتحديد الموقع:</p>
                        <ol className="list-decimal list-inside space-y-1 text-xs">
                          <li>أضف Google Maps API key في index.html</li>
                          <li>أو استخدم الإدخال اليدوي للإحداثيات أدناه</li>
                        </ol>
                      </div>
                      <div className="absolute bottom-4 left-4 bg-white rounded-lg shadow-lg px-3 py-2 text-xs">
                        <p className="text-gray-700 mb-1">💡 للحصول على الإحداثيات:</p>
                        <p className="text-gray-600">1. افتح الخريطة في نافذة جديدة</p>
                        <p className="text-gray-600">2. انقر بزر الماوس الأيمن على الموقع</p>
                        <p className="text-gray-600">3. اختر "ما هذا؟" لنسخ الإحداثيات</p>
                        <p className="text-gray-600">4. الصقها في الحقول أدناه</p>
                      </div>
                    </div>
                  )}
                  <div className="bg-gray-50 px-3 py-2 border-t border-gray-200">
                    <p className="text-xs text-gray-600 mb-2">
                      💡 طريقة الحصول على الإحداثيات الدقيقة:
                    </p>
                    <ol className="text-xs text-gray-600 list-decimal list-inside space-y-1">
                      <li>اكتب العنوان في حقل البحث أعلاه</li>
                      <li>انقر على الخريطة أدناه لفتح Google Maps</li>
                      <li>ابحث عن الموقع وحدده</li>
                      <li>انقر بزر الماوس الأيمن على الموقع → "ما هذا؟"</li>
                      <li>انسخ الإحداثيات والصقهما في الحقول أدناه</li>
                    </ol>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">المدينة *</label>
                  <select
                    value={formData.location.city}
                    onChange={(e) => setFormData({
                      ...formData,
                      location: { ...formData.location, city: e.target.value }
                    })}
                    required
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="">اختر المدينة</option>
                    <option value="صنعاء">صنعاء</option>
                    <option value="عدن">عدن</option>
                    <option value="تعز">تعز</option>
                    <option value="إب">إب</option>
                    <option value="الحديدة">الحديدة</option>
                    <option value="المكلا">المكلا</option>
                    <option value="مأرب">مأرب</option>
                    <option value="الجوف">الجوف</option>
                    <option value="حجة">حجة</option>
                    <option value="ذمار">ذمار</option>
                    <option value="الضالع">الضالع</option>
                    <option value="لحج">لحج</option>
                    <option value="أبين">أبين</option>
                    <option value="شبوة">شبوة</option>
                    <option value="حضرموت">حضرموت</option>
                    <option value="المهرة">المهرة</option>
                    <option value="سقطرى">سقطرى</option>
                    <option value="بيحان">بيحان</option>
                    <option value="يريم">يريم</option>
                    <option value="زنجبار">زنجبار</option>
                    <option value="البيضاء">البيضاء</option>
                    <option value="عمران">عمران</option>
                    <option value="صعدة">صعدة</option>
                    <option value="ريمة">ريمة</option>
                    <option value="أخرى">أخرى</option>
                  </select>
                  {formData.location.city === 'أخرى' && (
                    <input
                      type="text"
                      placeholder="أدخل اسم المدينة"
                      className="w-full mt-2 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                      onChange={(e) => setFormData({
                        ...formData,
                        location: { ...formData.location, city: e.target.value }
                      })}
                    />
                  )}
                </div>

                {/* Coordinates - Hidden (filled automatically) */}
                {formData.location.coordinates.latitude && formData.location.coordinates.longitude && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <p className="text-xs text-blue-600 mb-1">
                      ✅ تم تحديد الإحداثيات تلقائياً من العنوان
                    </p>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="text-gray-600">خط العرض:</span>
                        <span className="font-mono text-blue-600 mr-1">{formData.location.coordinates.latitude}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">خط الطول:</span>
                        <span className="font-mono text-blue-600 mr-1">{formData.location.coordinates.longitude}</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Manual coordinates input (optional - only show if address entered but no coordinates found after reasonable time) */}
                {formData.location.address && formData.location.address.length > 5 && 
                 !formData.location.coordinates.latitude && 
                 !formData.location.coordinates.longitude && 
                 !geocodingLoading ? (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3" data-coords-section>
                    <p className="text-xs text-blue-600 mb-2">
                      💡 لا توجد إحداثيات بعد. يمكنك:
                    </p>
                    <ol className="text-xs text-blue-600 list-decimal list-inside space-y-1 mb-3">
                      <li>الانتظار - سيتم البحث تلقائياً عند كتابة العنوان</li>
                      <li>أو تحديد الموقع من الخريطة أعلاه</li>
                      <li>أو إدخال الإحداثيات يدوياً من خرائط Google</li>
                    </ol>
                    <details className="text-xs">
                      <summary className="text-blue-600 cursor-pointer hover:text-blue-700 font-medium">
                        إدخال الإحداثيات يدوياً (انقر للتوسيع)
                      </summary>
                      <div className="mt-2 grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-xs text-gray-600 mb-1 block">خط العرض:</label>
                          <input
                            type="number"
                            step="any"
                            value={formData.location.coordinates.latitude}
                            onChange={(e) => setFormData({
                              ...formData,
                              location: {
                                ...formData.location,
                                coordinates: {
                                  ...formData.location.coordinates,
                                  latitude: e.target.value
                                }
                              }
                            })}
                            placeholder="مثال: 15.3694"
                            className="w-full px-2 py-1 text-xs border border-blue-300 rounded focus:ring-1 focus:ring-blue-500"
                          />
                        </div>
                        <div>
                          <label className="text-xs text-gray-600 mb-1 block">خط الطول:</label>
                          <input
                            type="number"
                            step="any"
                            value={formData.location.coordinates.longitude}
                            onChange={(e) => setFormData({
                              ...formData,
                              location: {
                                ...formData.location,
                                coordinates: {
                                  ...formData.location.coordinates,
                                  longitude: e.target.value
                                }
                              }
                            })}
                            placeholder="مثال: 44.1910"
                            className="w-full px-2 py-1 text-xs border border-blue-300 rounded focus:ring-1 focus:ring-blue-500"
                          />
                        </div>
                      </div>
                      <p className="text-xs text-gray-500 mt-2">
                        💡 للحصول على الإحداثيات: افتح خرائط Google → ابحث عن الموقع → انقر بزر الماوس الأيمن → "ما هذا؟" → انسخ الإحداثيات
                      </p>
                    </details>
                  </div>
                ) : null}

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">الهاتف *</label>
                    <input
                      type="tel"
                      value={formData.contact.phone}
                      onChange={(e) => setFormData({
                        ...formData,
                        contact: { ...formData.contact, phone: e.target.value }
                      })}
                      required
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">واتساب</label>
                    <input
                      type="tel"
                      value={formData.contact.whatsapp}
                      onChange={(e) => setFormData({
                        ...formData,
                        contact: { ...formData.contact, whatsapp: e.target.value }
                      })}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">البريد الإلكتروني</label>
                    <input
                      type="email"
                      value={formData.contact.email}
                      onChange={(e) => setFormData({
                        ...formData,
                        contact: { ...formData.contact, email: e.target.value }
                      })}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                </div>

                {/* Operating Hours Section */}
                <div className="border-t border-gray-200 pt-4 space-y-4">
                  <h3 className="text-sm font-bold text-gray-700 flex items-center gap-2">
                    <FiClock className="text-primary-600" />
                    ساعات العمل
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">من (وقت الفتح) *</label>
                      <input
                        type="time"
                        value={formData.operatingHours.from}
                        onChange={(e) => setFormData({
                          ...formData,
                          operatingHours: { ...formData.operatingHours, from: e.target.value }
                        })}
                        required
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">إلى (وقت الإغلاق) *</label>
                      <input
                        type="time"
                        value={formData.operatingHours.to}
                        onChange={(e) => setFormData({
                          ...formData,
                          operatingHours: { ...formData.operatingHours, to: e.target.value }
                        })}
                        required
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-2">أيام العمل</label>
                    <div className="grid grid-cols-7 gap-2">
                      {[
                        { key: 'saturday', label: 'السبت' },
                        { key: 'sunday', label: 'الأحد' },
                        { key: 'monday', label: 'الاثنين' },
                        { key: 'tuesday', label: 'الثلاثاء' },
                        { key: 'wednesday', label: 'الأربعاء' },
                        { key: 'thursday', label: 'الخميس' },
                        { key: 'friday', label: 'الجمعة' },
                      ].map((day) => (
                        <label
                          key={day.key}
                          className="flex items-center justify-center p-2 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
                        >
                          <input
                            type="checkbox"
                            checked={formData.operatingHours.days?.includes(day.key) || false}
                            onChange={(e) => {
                              const currentDays = formData.operatingHours.days || [];
                              if (e.target.checked) {
                                setFormData({
                                  ...formData,
                                  operatingHours: {
                                    ...formData.operatingHours,
                                    days: [...currentDays, day.key]
                                  }
                                });
                              } else {
                                setFormData({
                                  ...formData,
                                  operatingHours: {
                                    ...formData.operatingHours,
                                    days: currentDays.filter(d => d !== day.key)
                                  }
                                });
                              }
                            }}
                            className="mr-2"
                          />
                          <span className="text-xs">{day.label}</span>
                        </label>
                      ))}
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                      اختر أيام العمل. إذا لم تختر أي أيام، سيتم اعتبار جميع الأيام أيام عمل.
                    </p>
                  </div>
                </div>

                {/* Settings Section */}
                <div className="border-t border-gray-200 pt-4 space-y-4">
                  <h3 className="text-sm font-bold text-gray-700">الإعدادات المالية</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        نسبة العمولة على الطلبات (%) *
                      </label>
                      <input
                        type="number"
                        value={formData.settings.commission}
                        onChange={(e) => setFormData({
                          ...formData,
                          settings: {
                            ...formData.settings,
                            commission: parseFloat(e.target.value) || 0
                          }
                        })}
                        min="0"
                        max="100"
                        step="0.1"
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                        placeholder="مثال: 5"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        نسبة مئوية من إجمالي الطلب. مثال: 5% يعني إذا كان الطلب 1000 ريال، العمولة = 50 ريال
                      </p>
                    </div>
                    
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        نسبة العمولة على بيع الأكواد (%) *
                      </label>
                      <input
                        type="number"
                        value={formData.settings.codeCommission}
                        onChange={(e) => setFormData({
                          ...formData,
                          settings: {
                            ...formData.settings,
                            codeCommission: parseFloat(e.target.value) || 0
                          }
                        })}
                        min="0"
                        max="100"
                        step="0.1"
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                        placeholder="مثال: 3"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        نسبة مئوية من سعر بيع الكود. مثال: 3% يعني إذا بيع الكود بـ 100 ريال، العمولة = 3 ريال
                      </p>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      خصم على الأكواد (%)
                    </label>
                      <input
                        type="number"
                        value={formData.settings.discountOnCodes}
                        onChange={(e) => setFormData({
                          ...formData,
                          settings: {
                            ...formData.settings,
                            discountOnCodes: parseFloat(e.target.value) || 0
                          }
                        })}
                        min="0"
                        max="100"
                        step="0.1"
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                        placeholder="مثال: 3"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        نسبة الخصم عند شراء النقطة للأكواد من الإدارة
                      </p>
                    </div>
                </div>

                <div className="flex gap-3">
                  <button
                    type="submit"
                    className="flex-1 btn-primary px-4 py-2 text-sm"
                  >
                    إنشاء
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowCreateModal(false);
                      resetForm();
                    }}
                    className="flex-1 px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    إلغاء
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Distribute Codes Modal */}
      {showDistributeModal && selectedPoint && (
        <DistributeCodesModal
          point={selectedPoint}
          onClose={() => {
            setShowDistributeModal(false);
            setSelectedPoint(null);
          }}
          onSuccess={() => {
            setShowDistributeModal(false);
            setSelectedPoint(null);
            setToast({ isOpen: true, message: '✅ تم توزيع الأكواد بنجاح!', type: 'success' });
            loadPoints(pagination.page);
          }}
          onError={(error) => {
            setToast({ isOpen: true, message: error.response?.data?.message || 'فشل في توزيع الأكواد', type: 'error' });
          }}
        />
      )}

      {/* Assign Manager Modal */}
      {showManagerModal && selectedPoint && (
        <AssignManagerModal
          point={selectedPoint}
          onClose={() => {
            setShowManagerModal(false);
            setSelectedPoint(null);
          }}
          onSuccess={() => {
            setShowManagerModal(false);
            setSelectedPoint(null);
            setToast({ isOpen: true, message: '✅ تم تعيين المدير بنجاح!', type: 'success' });
            loadPoints(pagination.page);
          }}
          onError={(error) => {
            setToast({ isOpen: true, message: error.response?.data?.message || 'فشل في تعيين المدير', type: 'error' });
          }}
        />
      )}

      {/* Modals */}
      <ConfirmationModal
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        onConfirm={confirmModalData.onConfirm || (() => {})}
        title={confirmModalData.title || 'تأكيد العملية'}
        message={confirmModalData.message || ''}
        type={confirmModalData.type || 'warning'}
        confirmText={confirmModalData.confirmText || 'موافق'}
        cancelText={confirmModalData.cancelText || 'إلغاء'}
        loading={confirmModalData.loading || false}
      />

      <ToastNotification
        isOpen={toast.isOpen}
        message={toast.message}
        type={toast.type}
        onClose={() => setToast({ ...toast, isOpen: false })}
        duration={toast.duration}
      />
    </div>

      {/* Commissions Modal */}
      {showCommissionsModal && selectedPoint && (
        <div 
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black bg-opacity-50"
          style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 9999 }}
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowCommissionsModal(false);
              setSelectedPoint(null);
            }
          }}
        >
          <div 
            className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 md:p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-lg font-bold text-gray-900">
                    سجل العمولات - {selectedPoint?.name || 'غير معروف'}
                  </h2>
                  <p className="text-sm text-gray-600 mt-1">{selectedPoint?.code || ''}</p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setShowCommissionsModal(false);
                    setCommissions([]);
                    setSelectedPoint(null);
                  }}
                  className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
                >
                  <FiXCircle className="text-xl" />
                </button>
              </div>

              {/* Filter */}
              <div className="mb-4">
                <select
                  value={commissionStatusFilter}
                  onChange={(e) => {
                    setCommissionStatusFilter(e.target.value);
                    loadCommissions(selectedPoint._id, 1, e.target.value);
                  }}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                >
                  <option value="all">جميع الحالات</option>
                  <option value="pending">معلقة</option>
                  <option value="approved">معتمدة</option>
                  <option value="paid">مدفوعة</option>
                  <option value="cancelled">ملغاة</option>
                </select>
              </div>

              {/* Commissions List */}
              {loadingCommissions ? (
                <div className="flex justify-center py-8">
                  <FiLoader className="animate-spin text-2xl text-primary-600" />
                </div>
              ) : commissions.length === 0 ? (
                <div className="text-center py-12">
                  <FiDollarSign className="text-4xl text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-600">لا توجد عمولات</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {commissions.map((commission) => (
                    <div key={commission._id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-bold text-gray-900">
                              {commission.orderType === 'code' 
                                ? `كود: ${commission.codeDistribution?.walletCode?.code || commission.orderNumber}`
                                : `طلب #${commission.orderNumber}`}
                            </span>
                            <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                              commission.status === 'paid' ? 'bg-green-100 text-green-800' :
                              commission.status === 'approved' ? 'bg-blue-100 text-blue-700' :
                              commission.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {commission.status === 'paid' ? 'مدفوعة' :
                               commission.status === 'approved' ? 'معتمدة' :
                               commission.status === 'pending' ? 'معلقة' : 'ملغاة'}
                            </span>
                          </div>
                          <p className="text-xs text-gray-500">
                            {commission.orderType === 'code' ? 'عمولة على بيع كود' : 
                             commission.orderType === 'smartCart' ? 'عمولة على طلب سمارت كارت' : 
                             'عمولة على طلب عادي'}
                          </p>
                        </div>
                        <div className="text-left">
                          <p className="text-lg font-bold text-blue-600">
                            {formatCurrency(commission.commissionAmount, 'SAR')}
                          </p>
                          <p className="text-xs text-gray-500">
                            من {formatCurrency(commission.orderTotal, 'SAR')} ({commission.commissionRate}%)
                          </p>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-2 text-xs text-gray-600 mt-2 pt-2 border-t border-gray-100">
                        <div>
                          <span className="font-medium">تاريخ الإنشاء:</span>
                          <span className="mr-1">{formatDate(commission.createdAt)}</span>
                        </div>
                        {commission.paidAt && (
                          <div>
                            <span className="font-medium">تاريخ الدفع:</span>
                            <span className="mr-1">{formatDate(commission.paidAt)}</span>
                          </div>
                        )}
                      </div>
                      
                      {commission.notes && (
                        <p className="text-xs text-gray-600 mt-2 italic">{commission.notes}</p>
                      )}
                      
                      {/* Status Change Button */}
                      {commission.status !== 'paid' && commission.status !== 'cancelled' && (
                        <div className="mt-3 pt-3 border-t border-gray-200">
                          <button
                            onClick={() => handleStatusChange(commission)}
                            disabled={updatingStatus === commission._id}
                            className="w-full px-3 py-2 text-xs bg-primary-50 text-primary-700 rounded-lg hover:bg-primary-100 transition-colors disabled:opacity-50"
                          >
                            {updatingStatus === commission._id ? 'جاري التحديث...' : 'تغيير الحالة'}
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Pagination */}
              {commissionPagination.pages > 1 && (
                <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200">
                  <div className="text-sm text-gray-700">
                    صفحة {commissionPagination.page} من {commissionPagination.pages}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => loadCommissions(selectedPoint._id, commissionPagination.page - 1)}
                      disabled={commissionPagination.page === 1}
                      className="px-3 py-1 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
                    >
                      السابق
                    </button>
                    <button
                      onClick={() => loadCommissions(selectedPoint._id, commissionPagination.page + 1)}
                      disabled={commissionPagination.page === commissionPagination.pages}
                      className="px-3 py-1 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
                    >
                      التالي
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Commission Status Change Modal */}
      {showStatusModal && selectedCommission && (
        <div className="fixed inset-0 z-[9999] bg-black bg-opacity-50 flex items-center justify-center p-4" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 9999 }}>
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">تغيير حالة العمولة</h3>
            
            <div className="space-y-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  العمولة
                </label>
                <p className="text-sm text-gray-600">
                  {selectedCommission.orderType === 'code' 
                    ? `كود: ${selectedCommission.codeDistribution?.walletCode?.code || selectedCommission.orderNumber}`
                    : `طلب #${selectedCommission.orderNumber}`}
                </p>
                <p className="text-lg font-bold text-blue-600 mt-1">
                  {formatCurrency(selectedCommission.commissionAmount, 'SAR')}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  الحالة الحالية
                </label>
                <span className={`inline-block px-3 py-1 rounded text-sm font-medium ${
                  selectedCommission.status === 'paid' ? 'bg-green-100 text-green-800' :
                  selectedCommission.status === 'approved' ? 'bg-blue-100 text-blue-700' :
                  selectedCommission.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {selectedCommission.status === 'paid' ? 'مدفوعة' :
                   selectedCommission.status === 'approved' ? 'معتمدة' :
                   selectedCommission.status === 'pending' ? 'معلقة' : 'ملغاة'}
                </span>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  الحالة الجديدة *
                </label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                >
                  <option value="pending">معلقة</option>
                  <option value="approved">معتمدة</option>
                  <option value="paid">مدفوعة</option>
                  <option value="cancelled">ملغاة</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  ملاحظات (اختياري)
                </label>
                <textarea
                  value={statusNote}
                  onChange={(e) => setStatusNote(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  placeholder="ملاحظات حول تغيير الحالة..."
                />
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={updateCommissionStatus}
                disabled={!newStatus || updatingStatus === selectedCommission._id}
                className="flex-1 btn-primary px-4 py-2 text-sm disabled:opacity-50"
              >
                {updatingStatus === selectedCommission._id ? 'جاري الحفظ...' : 'حفظ'}
              </button>
              <button
                onClick={() => {
                  setShowStatusModal(false);
                  setSelectedCommission(null);
                  setNewStatus('');
                  setStatusNote('');
                }}
                className="flex-1 px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// Assign Manager Modal Component
function AssignManagerModal({ point, onClose, onSuccess, onError }) {
  const [users, setUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [selectedUserId, setSelectedUserId] = useState(point.manager?._id || point.manager || '');
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setLoadingUsers(true);
      const res = await userAPI.getAll();
      setUsers(res.data.users || []);
    } catch (error) {
      console.error('Failed to load users', error);
    } finally {
      setLoadingUsers(false);
    }
  };

  const handleAssign = async () => {
    setSaving(true);
    try {
      await posAPI.update(point._id, {
        managerId: selectedUserId || null,
      });
      // Success will be handled by closing the modal and refreshing the list
      onSuccess();
    } catch (error) {
      // Error handling - show in parent component via callback if needed
      console.error('Failed to assign manager:', error);
      if (onError) {
        onError(error);
      }
    } finally {
      setSaving(false);
    }
  };

  const filteredUsers = users.filter(user => 
    user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.phone?.includes(searchTerm)
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full">
        <div className="p-4 md:p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold">تعيين مدير للنقطة</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <FiXCircle className="text-xl" />
            </button>
          </div>

          <div className="mb-4">
            <p className="text-sm text-gray-600 mb-2">
              نقطة: <span className="font-medium">{point.name}</span>
            </p>
            {point.manager && (
              <p className="text-xs text-gray-500 mb-3">
                المدير الحالي: {point.manager.name || point.manager.email || 'غير معروف'}
              </p>
            )}
          </div>

          <div className="mb-4">
            <input
              type="text"
              placeholder="البحث عن مستخدم..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 mb-3"
            />

            {loadingUsers ? (
              <div className="flex justify-center py-4">
                <FiLoader className="animate-spin text-lg md:text-xl text-primary-600" />
              </div>
            ) : (
              <div className="max-h-60 overflow-y-auto border border-gray-200 rounded-lg">
                <label className="block p-3 border-b border-gray-200 hover:bg-gray-50 cursor-pointer">
                  <input
                    type="radio"
                    name="manager"
                    value=""
                    checked={selectedUserId === ''}
                    onChange={() => setSelectedUserId('')}
                    className="mr-2"
                  />
                  <span className="text-sm text-gray-600">إزالة المدير</span>
                </label>
                {filteredUsers.map((user) => (
                  <label
                    key={user._id}
                    className="block p-3 border-b border-gray-200 hover:bg-gray-50 cursor-pointer"
                  >
                    <input
                      type="radio"
                      name="manager"
                      value={user._id}
                      checked={selectedUserId === user._id}
                      onChange={() => setSelectedUserId(user._id)}
                      className="mr-2"
                    />
                    <div className="flex-1">
                      <span className="text-sm font-medium">{user.name}</span>
                      <p className="text-xs text-gray-500">{user.email}</p>
                    </div>
                  </label>
                ))}
                {filteredUsers.length === 0 && (
                  <div className="p-4 text-center text-sm text-gray-500">
                    لا توجد نتائج
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleAssign}
              disabled={saving}
              className="flex-1 btn-primary px-4 py-2 text-sm disabled:opacity-50"
            >
              {saving ? 'جاري الحفظ...' : 'حفظ'}
            </button>
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              إلغاء
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Distribute Codes Modal Component
function DistributeCodesModal({ point, onClose, onSuccess, onError }) {
  const [codes, setCodes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCodes, setSelectedCodes] = useState([]);
  const [discount, setDiscount] = useState('');
  const [distributing, setDistributing] = useState(false);

  useEffect(() => {
    loadAvailableCodes();
  }, []);

  const loadAvailableCodes = async () => {
    try {
      setLoading(true);
      const res = await walletAPI.getAllCodes({ isUsed: false, page: 1, limit: 100 });
      setCodes(res.data.codes || []);
    } catch (error) {
      console.error('Failed to load codes', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleCodeSelection = (codeId) => {
    setSelectedCodes(prev =>
      prev.includes(codeId)
        ? prev.filter(id => id !== codeId)
        : [...prev, codeId]
    );
  };

  const handleDistribute = async () => {
    if (selectedCodes.length === 0) {
      // This will be handled in the modal itself
      return;
    }

    setDistributing(true);
    try {
      await posAPI.distributeCodes(point._id, {
        walletCodeIds: selectedCodes,
        discount: discount ? parseFloat(discount) : undefined,
      });
      // Success will be handled by closing the modal and refreshing the list
      onSuccess();
    } catch (error) {
      // Error handling - show in parent component via callback if needed
      console.error('Failed to distribute codes:', error);
      if (onError) {
        onError(error);
      }
    } finally {
      setDistributing(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-4 md:p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold">توزيع أكواد على {point.name}</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <FiXCircle className="text-xl" />
            </button>
          </div>

          <div className="mb-4">
            <label className="block text-xs font-medium text-gray-700 mb-1">
              خصم عند الشراء (اختياري - %)
            </label>
            <input
              type="number"
              value={discount}
              onChange={(e) => setDiscount(e.target.value)}
              min="0"
              max="100"
              placeholder="مثال: 5"
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
            />
            <p className="text-xs text-gray-500 mt-1">
              النقطة ستشتري الأكواد بخصم {discount || point.settings?.discountOnCodes || 0}%
            </p>
          </div>

          {loading ? (
            <div className="flex justify-center py-8">
              <FiLoader className="animate-spin text-lg md:text-xl text-primary-600" />
            </div>
          ) : (
            <>
              <div className="mb-4">
                <p className="text-sm text-gray-600 mb-2">
                  اختيار {selectedCodes.length} كود
                </p>
                <div className="max-h-96 overflow-y-auto border border-gray-200 rounded-lg p-2 space-y-2">
                  {codes.map((code) => (
                    <label
                      key={code._id}
                      className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={selectedCodes.includes(code._id)}
                        onChange={() => toggleCodeSelection(code._id)}
                        className="w-4 h-4 text-primary-600"
                      />
                      <div className="flex-1">
                        <p className="font-mono font-bold text-primary-600">{code.code}</p>
                        <p className="text-sm text-gray-600">
                          {formatCurrency(code.amount, code.currency)}
                          {code.expiresAt && (
                            <span className="text-xs text-gray-400">
                              {' '}• ينتهي: {formatDate(code.expiresAt)}
                            </span>
                          )}
                        </p>
                      </div>
                      {code.isUsed && (
                        <FiCheckCircle className="text-green-600" />
                      )}
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handleDistribute}
                  disabled={selectedCodes.length === 0 || distributing}
                  className="flex-1 btn-primary px-4 py-2 text-sm disabled:opacity-50"
                >
                  {distributing ? 'جاري التوزيع...' : `توزيع ${selectedCodes.length} كود`}
                </button>
                <button
                  onClick={onClose}
                  className="flex-1 px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  إلغاء
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
