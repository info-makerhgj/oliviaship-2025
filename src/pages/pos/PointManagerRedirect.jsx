import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { posAPI } from '../../utils/api';
import { FiLoader } from 'react-icons/fi';

export default function PointManagerRedirect() {
  const navigate = useNavigate();

  useEffect(() => {
    loadMyPoint();
  }, []);

  const loadMyPoint = async () => {
    try {
      const res = await posAPI.getMyPoint();
      if (res.data.point?._id) {
        navigate(`/pos/${res.data.point._id}`, { replace: true });
      } else {
        navigate('/dashboard', { replace: true });
      }
    } catch (error) {
      navigate('/dashboard', { replace: true });
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen">
      <FiLoader className="animate-spin text-xl md:text-2xl text-primary-600" />
    </div>
  );
}

