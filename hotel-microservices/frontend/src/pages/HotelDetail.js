import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { hotelService, reservationService } from '../services/api';
import { 
  LocationMarkerIcon, 
  StarIcon, 
  WifiIcon, 
  UserGroupIcon,
  CheckCircleIcon,
  CalendarIcon
} from '@heroicons/react/outline';

const HotelDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  const [hotel, setHotel] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [reservationData, setReservationData] = useState({
    checkIn: '',
    checkOut: ''
  });
  const [reservationLoading, setReservationLoading] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  useEffect(() => {
    const fetchHotel = async () => {
      try {
        setLoading(true);
        const response = await hotelService.getHotel(id);
        setHotel(response.data);
      } catch (err) {
        setError('Error al cargar el hotel');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchHotel();
  }, [id]);

  const handleReservation = async (e) => {
    e.preventDefault();
    
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    if (!reservationData.checkIn || !reservationData.checkOut) {
      alert('Por favor selecciona las fechas de check-in y check-out');
      return;
    }

    try {
      setReservationLoading(true);
      
      const reservation = {
        hotel_id: hotel.id,
        check_in: reservationData.checkIn,
        check_out: reservationData.checkOut
      };

      await reservationService.createReservation(reservation);
      navigate('/confirmation', { 
        state: { 
          success: true, 
          hotel: hotel,
          reservation: reservation 
        } 
      });
    } catch (err) {
      navigate('/confirmation', { 
        state: { 
          success: false, 
          error: err.response?.data?.error || 'Error al procesar la reserva' 
        } 
      });
    } finally {
      setReservationLoading(false);
    }
  };

  const amenityIcons = {
    WiFi: <WifiIcon className="w-5 h-5" />,
    Pool: <UserGroupIcon className="w-5 h-5" />,
    Gym: <UserGroupIcon className="w-5 h-5" />,
    Spa: <CheckCircleIcon className="w-5 h-5" />,
    Restaurant: <CheckCircleIcon className="w-5 h-5" />,
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error || !hotel) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Error</h2>
          <p className="text-gray-600">{error || 'Hotel no encontrado'}</p>
        </div>
      </div>
    );
  }

  const images = hotel.images && hotel.images.length > 0 ? hotel.images : [
    'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800',
    'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=800',
    'https://images.unsplash.com/photo-1560347876-aeef00ee58a1?w=800'
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Image Gallery */}
      <div className="relative h-96 bg-gray-900">
        <img
          src={images[currentImageIndex]}
          alt={hotel.name}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-black opacity-30"></div>
        
        {/* Image Navigation */}
        {images.length > 1 && (
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2">
            <div className="flex space-x-2">
              {images.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentImageIndex(index)}
                  className={`w-3 h-3 rounded-full ${
                    index === currentImageIndex ? 'bg-white' : 'bg-white/50'
                  }`}
                />
              ))}
            </div>
          </div>
        )}
        
        {/* Hotel Title Overlay */}
        <div className="absolute bottom-8 left-8 text-white">
          <h1 className="text-4xl font-bold mb-2">{hotel.name}</h1>
          <div className="flex items-center">
            <LocationMarkerIcon className="w-5 h-5 mr-2" />
            <span className="text-lg">{hotel.address}</span>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Hotel Information */}
          <div className="lg:col-span-2">
            {/* Rating */}
            <div className="flex items-center mb-6">
              <div className="flex items-center">
                {[...Array(5)].map((_, i) => (
                  <StarIcon
                    key={i}
                    className={`w-5 h-5 ${
                      i < 4 ? 'text-yellow-400 fill-current' : 'text-gray-300'
                    }`}
                  />
                ))}
                <span className="ml-2 text-lg font-medium text-gray-700">(4.0)</span>
              </div>
            </div>

            {/* Description */}
            <div className="bg-white rounded-xl p-6 shadow-sm mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Acerca del Hotel</h2>
              <p className="text-gray-600 leading-relaxed">{hotel.description}</p>
            </div>

            {/* Amenities */}
            <div className="bg-white rounded-xl p-6 shadow-sm mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Amenidades</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {hotel.amenities?.map((amenity, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <div className="text-blue-600">
                      {amenityIcons[amenity] || <CheckCircleIcon className="w-5 h-5" />}
                    </div>
                    <span className="text-gray-700">{amenity}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Image Thumbnails */}
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Galería</h2>
              <div className="grid grid-cols-3 gap-4">
                {images.map((image, index) => (
                  <img
                    key={index}
                    src={image}
                    alt={`${hotel.name} - Image ${index + 1}`}
                    className={`w-full h-24 object-cover rounded-lg cursor-pointer border-2 ${
                      index === currentImageIndex ? 'border-blue-600' : 'border-transparent'
                    }`}
                    onClick={() => setCurrentImageIndex(index)}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Reservation Card */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl p-6 shadow-lg sticky top-8">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Hacer Reserva</h3>
              
              <form onSubmit={handleReservation}>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Check-in
                    </label>
                    <div className="relative">
                      <CalendarIcon className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                      <input
                        type="date"
                        value={reservationData.checkIn}
                        onChange={(e) => setReservationData({
                          ...reservationData,
                          checkIn: e.target.value
                        })}
                        className="input-field pl-10"
                        min={new Date().toISOString().split('T')[0]}
                        required
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Check-out
                    </label>
                    <div className="relative">
                      <CalendarIcon className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                      <input
                        type="date"
                        value={reservationData.checkOut}
                        onChange={(e) => setReservationData({
                          ...reservationData,
                          checkOut: e.target.value
                        })}
                        className="input-field pl-10"
                        min={reservationData.checkIn || new Date().toISOString().split('T')[0]}
                        required
                      />
                    </div>
                  </div>
                </div>

                <div className="mt-6 pt-6 border-t border-gray-200">
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-lg font-medium text-gray-700">Precio por noche</span>
                    <span className="text-2xl font-bold text-gray-900">$150</span>
                  </div>
                  
                  {reservationData.checkIn && reservationData.checkOut && (
                    <div className="flex justify-between items-center mb-4">
                      <span className="text-sm text-gray-600">Total</span>
                      <span className="text-lg font-semibold text-gray-900">
                        ${150 * Math.ceil((new Date(reservationData.checkOut) - new Date(reservationData.checkIn)) / (1000 * 60 * 60 * 24))}
                      </span>
                    </div>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={reservationLoading}
                  className={`w-full mt-6 ${
                    reservationLoading 
                      ? 'bg-gray-400 cursor-not-allowed' 
                      : 'btn-primary'
                  }`}
                >
                  {reservationLoading ? 'Procesando...' : 'Reservar Ahora'}
                </button>
              </form>

              {!isAuthenticated && (
                <p className="text-sm text-gray-600 text-center mt-4">
                  <span>¿No tienes cuenta? </span>
                  <button
                    onClick={() => navigate('/register')}
                    className="text-blue-600 hover:text-blue-700 font-medium"
                  >
                    Regístrate aquí
                  </button>
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HotelDetail;