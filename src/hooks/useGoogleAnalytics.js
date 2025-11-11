import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { settingsAPI } from '../utils/api';
import { initGA, trackPageView } from '../utils/analytics';

export const useGoogleAnalytics = () => {
  const location = useLocation();

  useEffect(() => {
    // Load settings and initialize GA
    const loadAnalytics = async () => {
      try {
        const res = await settingsAPI.get();
        const analytics = res.data.settings?.analytics?.googleAnalytics;
        
        if (analytics?.enabled && analytics?.measurementId) {
          initGA(analytics.measurementId);
        }
      } catch (error) {
        console.error('Failed to load analytics settings:', error);
      }
    };

    loadAnalytics();
  }, []);

  // Track page views on route change
  useEffect(() => {
    trackPageView(location.pathname + location.search);
  }, [location]);
};
