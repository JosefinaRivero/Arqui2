import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { hotelService, reservationService } from '../services/api';
import { 
  LocationMarkerIcon, 
  StarIcon, 
  WifiIcon, 
  UserGroupIcon,
  CheckCircleIcon,
  CalendarIcon,
  CurrencyDollarIcon,
  HomeIcon,
  ExclamationIcon,
  HeartIcon,
  ShareIcon
} from '@heroicons/react/outline';

const HotelDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { isAuthenticated, user } = useAuth();
  const [hotel, setHotel] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [reservationData, setReservationData] = useState({
    checkIn: searchParams.get('checkIn') || '',
    checkOut: searchParams.get('checkOut') || '',
    guests: searchParams.get('guests') || 2,
    rooms: searchParams.get('rooms') || 1
  });
  const [reservationLoading, setReservationLoading] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [showAllAmenities, setShowAllAmenities] = useState(false);

  useEffect(() => {
    const fetchHotel = async () => {
      try {
        setLoading(true);
        const response = await hotelService.getHotel(id);
        const hotelData = response.data;
        
        // Calcular disponibilidad real basada en fechas
        const calculateAvailability = (totalRooms, checkIn, checkOut) => {
          if (!checkIn || !checkOut) {
            return Math.floor(totalRooms * 0.7); // 70% disponible sin fechas específicas
          }
          
          // Simular reservas existentes (en producción esto vendría del backend)
          const occupancyRate = Math.random() * 0.4; // 0-40% ocupación
          const reservedRooms = Math.floor(totalRooms * occupancyRate);
          return Math.max(1, totalRooms - reservedRooms);
        };

        const totalRooms = hotelData.totalRooms || 30;
        const availableRooms = calculateAvailability(totalRooms, reservationData.checkIn, reservationData.checkOut);
        
        // Enriquecer datos del hotel
        const enrichedHotel = {
          ...hotelData,
          rating: hotelData.rating || (Math.random() * 1.5 + 3.5).toFixed(1),
          reviews: hotelData.reviews || Math.floor(Math.random() * 500) + 50,
          pricePerNight: hotelData.pricePerNight || Math.floor(Math.random() * 200) + 80,
          totalRooms: totalRooms,
          availableRooms: availableRooms,
          roomTypes: [
            {
              id: 1,
              name: 'Habitación Estándar',
              price: hotelData.pricePerNight || Math.floor(Math.random() * 50) + 80,
              available: Math.floor(availableRooms * 0.6), // 60% son estándar
              maxGuests: 2,
              features: ['Cama matrimonial', 'WiFi gratis', 'Aire acondicionado', 'TV 32"'],
              image: 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=400'
            },
            {
              id: 2,
              name: 'Habitación Deluxe',
              price: (hotelData.pricePerNight || 120) + 40,
              available: Math.floor(availableRooms * 0.3), // 30% son deluxe
              maxGuests: 3,
              features: ['Cama king size', 'Vista a la ciudad', 'Minibar', 'Balcón', 'WiFi gratis'],
              image: 'https://images.unsplash.com/photo-1578683010236-d716f9a3f461?w=400'
            },
            {
              id: 3,
              name: 'Suite Premium',
              price: (hotelData.pricePerNight || 200) + 100,
              available: Math.floor(availableRooms * 0.1) || 1, // 10% son suites
              maxGuests: 4,
              features: ['Sala separada', 'Jacuzzi', 'Vista panorámica', 'Servicio de habitación 24h'],
              image: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=400'
            }
          ],
          features: hotelData.amenities || [
            'WiFi gratuito en todo el hotel',
            'Piscina al aire libre',
            'Gimnasio 24 horas',
            'Spa y centro de bienestar',
            'Restaurante gourmet',
            'Servicio de habitaciones 24h',
            'Estacionamiento gratuito',
            'Centro de negocios',
            'Lavandería',
            'Recepción 24 horas',
            'Servicio de conserjería',
            'Traslado al aeropuerto'
          ]
        };
        
        setHotel(enrichedHotel);
        setSelectedRoom(enrichedHotel.roomTypes[0]);
      } catch (err) {
        setError('Error al cargar el hotel');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchHotel();
  }, [id, reservationData.checkIn, reservationData.checkOut]);

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

    if (!selectedRoom || selectedRoom.available < parseInt(reservationData.rooms)) {
      alert('No hay suficientes habitaciones disponibles del tipo seleccionado');
      return;
    }

    // Verificar que las fechas sean válidas
    const checkInDate = new Date(reservationData.checkIn);
    const checkOutDate = new Date(reservationData.checkOut);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (checkInDate < today) {
      alert('La fecha de check-in no puede ser anterior a hoy');
      return;
    }

    if (checkOutDate <= checkInDate) {
      alert('La fecha de check-out debe ser posterior al check-in');
      return;
    }

    try {
      setReservationLoading(true);
      
      // Verificar disponibilidad en tiempo real antes de crear la reserva
   // Verificar disponibilidad solo si es necesario
if (reservationData.checkIn && reservationData.checkOut) {
  try {
    const availabilityResponse = await reservationService.checkAvailability({
      hotel_id: hotel.id,
      check_in: reservationData.checkIn,
      check_out: reservationData.checkOut
    });
    
    if (!availabilityResponse.data.available) {
      alert('Lo sentimos, estas fechas ya no están disponibles. Por favor elige otras fechas.');
      return;
    }
  } catch (availError) {
    console.log('Availability check failed, proceeding with reservation');
  }
}
      
      const reservation = {
        hotel_id: hotel.id,
        check_in: reservationData.checkIn,
        check_out: reservationData.checkOut,
        room_type: selectedRoom.name,
        guests: parseInt(reservationData.guests),
        rooms: parseInt(reservationData.rooms),
        price_per_night: selectedRoom.price,
        total_price: calculateTotalPrice()
      };

      await reservationService.createReservation(reservation);
      
      // Actualizar disponibilidad local después de reserva exitosa
      setHotel(prevHotel => ({
        ...prevHotel,
        availableRooms: Math.max(0, prevHotel.availableRooms - parseInt(reservationData.rooms)),
        roomTypes: prevHotel.roomTypes.map(room => 
          room.id === selectedRoom.id 
            ? { ...room, available: Math.max(0, room.available - parseInt(reservationData.rooms)) }
            : room
        )
      }));

      navigate('/confirmation', { 
        state: { 
          success: true, 
          hotel: hotel,
          reservation: { ...reservation, room: selectedRoom },
          totalPrice: calculateTotalPrice()
        } 
      });
    } catch (err) {
      let errorMessage = 'Error al procesar la reserva';
      
      if (err.response?.status === 409) {
        errorMessage = 'Las fechas seleccionadas ya no están disponibles. Otro usuario realizó una reserva antes que tú.';
      } else if (err.response?.data?.error) {
        errorMessage = err.response.data.error;
      }
      
      navigate('/confirmation', { 
        state: { 
          success: false, 
          error: errorMessage
        } 
      });
    } finally {
      setReservationLoading(false);
    }
  };

  const calculateTotalPrice = () => {
    if (!reservationData.checkIn || !reservationData.checkOut || !selectedRoom) return 0;
    const nights = Math.ceil((new Date(reservationData.checkOut) - new Date(reservationData.checkIn)) / (1000 * 60 * 60 * 24));
    return selectedRoom.price * nights * parseInt(reservationData.rooms);
  };

  const amenityIcons = {
    'WiFi': <WifiIcon className="w-5 h-5" />,
    'Piscina': <UserGroupIcon className="w-5 h-5" />,
    'Gimnasio': <UserGroupIcon className="w-5 h-5" />,
    'Spa': <CheckCircleIcon className="w-5 h-5" />,
    'Restaurante': <CheckCircleIcon className="w-5 h-5" />,
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-600 border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">Cargando información del hotel...</p>
        </div>
      </div>
    );
  }

  if (error || !hotel) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">¡Oops!</h2>
          <p className="text-gray-600 text-lg">{error || 'Hotel no encontrado'}</p>
        </div>
      </div>
    );
  }

  const images = hotel.images && hotel.images.length > 0 ? hotel.images : [
    'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800',
    'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=800',
    'https://images.unsplash.com/photo-1560347876-aeef00ee58a1?w=800',
    'https://images.unsplash.com/photo-1578683010236-d716f9a3f461?w=800',
    'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=800'
  ];

  const nights = reservationData.checkIn && reservationData.checkOut ? 
    Math.ceil((new Date(reservationData.checkOut) - new Date(reservationData.checkIn)) / (1000 * 60 * 60 * 24)) : 1;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Image Gallery */}
      <div className="relative h-96 lg:h-[500px] bg-gray-900">
        <img
          src={images[currentImageIndex]}
          alt={hotel.name}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-black opacity-20"></div>
        
        {/* Image Navigation */}
        {images.length > 1 && (
          <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2">
            <div className="flex space-x-2">
              {images.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentImageIndex(index)}
                  className={`w-3 h-3 rounded-full transition-all ${
                    index === currentImageIndex ? 'bg-white' : 'bg-white/50'
                  }`}
                />
              ))}
            </div>
          </div>
        )}
        
        {/* Hotel Header */}
        <div className="absolute bottom-8 left-8 right-8 text-white">
          <div className="flex justify-between items-end">
            <div>
              <h1 className="text-4xl lg:text-5xl font-bold mb-2">{hotel.name}</h1>
              <div className="flex items-center mb-2">
                <LocationMarkerIcon className="w-5 h-5 mr-2" />
                <span className="text-lg">{hotel.address}</span>
              </div>
              <div className="flex items-center">
                <div className="flex items-center mr-4">
                  {[...Array(5)].map((_, i) => (
                    <StarIcon
                      key={i}
                      className={`w-5 h-5 ${
                        i < Math.floor(hotel.rating) ? 'text-yellow-400 fill-current' : 'text-gray-300'
                      }`}
                    />
                  ))}
                  <span className="ml-2 text-lg font-medium">{hotel.rating}</span>
                </div>
                <span className="text-sm">({hotel.reviews} reseñas)</span>
              </div>
            </div>
            <div className="flex space-x-3">
              <button className="p-3 bg-white/20 rounded-full hover:bg-white/30 transition-colors">
                <HeartIcon className="w-6 h-6" />
              </button>
              <button className="p-3 bg-white/20 rounded-full hover:bg-white/30 transition-colors">
                <ShareIcon className="w-6 h-6" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Hotel Information */}
          <div className="lg:col-span-2 space-y-8">
            {/* Description */}
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Acerca del Hotel</h2>
              <p className="text-gray-700 leading-relaxed mb-4">{hotel.description}</p>
              
              {/* Quick Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <HomeIcon className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                  <div className="text-lg font-bold text-gray-900">{hotel.totalRooms}</div>
                  <div className="text-sm text-gray-600">Habitaciones</div>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <CheckCircleIcon className="w-8 h-8 text-green-600 mx-auto mb-2" />
                  <div className="text-lg font-bold text-gray-900">{hotel.availableRooms}</div>
                  <div className="text-sm text-gray-600">Disponibles</div>
                </div>
                <div className="text-center p-4 bg-yellow-50 rounded-lg">
                  <StarIcon className="w-8 h-8 text-yellow-600 mx-auto mb-2" />
                  <div className="text-lg font-bold text-gray-900">{hotel.rating}</div>
                  <div className="text-sm text-gray-600">Calificación</div>
                </div>
                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <UserGroupIcon className="w-8 h-8 text-purple-600 mx-auto mb-2" />
                  <div className="text-lg font-bold text-gray-900">{hotel.reviews}</div>
                  <div className="text-sm text-gray-600">Reseñas</div>
                </div>
              </div>
            </div>

            {/* Room Types */}
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Tipos de Habitación</h2>
              <div className="space-y-4">
                {hotel.roomTypes.map((room) => (
                  <div 
                    key={room.id} 
                    className={`border-2 rounded-xl p-4 cursor-pointer transition-all ${
                      selectedRoom?.id === room.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => setSelectedRoom(room)}
                  >
                    <div className="flex flex-col md:flex-row gap-4">
                      <img 
                        src={room.image} 
                        alt={room.name}
                        className="w-full md:w-32 h-24 object-cover rounded-lg"
                      />
                      <div className="flex-1">
                        <div className="flex justify-between items-start mb-2">
                          <h3 className="text-lg font-semibold text-gray-900">{room.name}</h3>
                          <div className="text-right">
                            <div className="text-xl font-bold text-gray-900">${room.price}</div>
                            <div className="text-sm text-gray-600">por noche</div>
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-2 mb-3">
                          {room.features.map((feature, idx) => (
                            <span key={idx} className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
                              {feature}
                            </span>
                          ))}
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">
                            Hasta {room.maxGuests} huéspedes
                          </span>
                          <span className={`text-sm font-medium ${
                            room.available <= 2 ? 'text-red-600' : 'text-green-600'
                          }`}>
                            {room.available} disponibles
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Amenities */}
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Servicios y Comodidades</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {(showAllAmenities ? hotel.features : hotel.features.slice(0, 8)).map((amenity, index) => (
                  <div key={index} className="flex items-center space-x-3">
                    <div className="text-green-600">
                      {amenityIcons[amenity.split(' ')[0]] || <CheckCircleIcon className="w-5 h-5" />}
                    </div>
                    <span className="text-gray-700">{amenity}</span>
                  </div>
                ))}
              </div>
              {hotel.features.length > 8 && (
                <button 
                  onClick={() => setShowAllAmenities(!showAllAmenities)}
                  className="mt-4 text-blue-600 hover:text-blue-700 font-medium"
                >
                  {showAllAmenities ? 'Ver menos' : `Ver todos (${hotel.features.length})`}
                </button>
              )}
            </div>

            {/* Image Gallery Thumbnails */}
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Galería</h2>
              <div className="grid grid-cols-3 md:grid-cols-5 gap-4">
                {images.map((image, index) => (
                  <img
                    key={index}
                    src={image}
                    alt={`${hotel.name} - Imagen ${index + 1}`}
                    className={`w-full h-20 object-cover rounded-lg cursor-pointer border-2 transition-all ${
                      index === currentImageIndex ? 'border-blue-500' : 'border-transparent hover:border-gray-300'
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
              <div className="mb-6">
                <h3 className="text-xl font-bold text-gray-900 mb-2">Realizar Reserva</h3>
                {hotel.availableRooms <= 5 && (
                  <div className="flex items-center text-orange-600 text-sm mb-4">
                    <ExclamationIcon className="w-4 h-4 mr-1" />
                    ¡Solo quedan {hotel.availableRooms} habitaciones!
                  </div>
                )}
              </div>
              
              <form onSubmit={handleReservation} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
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
                        className="w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                        className="w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        min={reservationData.checkIn || new Date().toISOString().split('T')[0]}
                        required
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Huéspedes
                    </label>
                    <select
                      value={reservationData.guests}
                      onChange={(e) => setReservationData({
                        ...reservationData,
                        guests: e.target.value
                      })}
                      className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      {[1,2,3,4,5,6,7,8].map(num => (
                        <option key={num} value={num}>{num}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Habitaciones
                    </label>
                    <select
                      value={reservationData.rooms}
                      onChange={(e) => setReservationData({
                        ...reservationData,
                        rooms: e.target.value
                      })}
                      className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      {[1,2,3,4,5].map(num => (
                        <option key={num} value={num}>{num}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Price Breakdown */}
                <div className="border-t border-gray-200 pt-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Habitación seleccionada:</span>
                      <span className="font-medium">{selectedRoom?.name}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">${selectedRoom?.price} x {nights} noche{nights > 1 ? 's' : ''} x {reservationData.rooms} habitación{reservationData.rooms > 1 ? 'es' : ''}</span>
                      <span className="font-medium">${calculateTotalPrice().toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-lg font-bold border-t pt-2">
                      <span>Total</span>
                      <span>${calculateTotalPrice().toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={reservationLoading || !selectedRoom || selectedRoom.available < parseInt(reservationData.rooms)}
                  className={`w-full py-4 px-6 rounded-lg font-medium transition-all ${
                    reservationLoading || !selectedRoom || selectedRoom.available < parseInt(reservationData.rooms)
                      ? 'bg-gray-400 cursor-not-allowed text-white'
                      : 'bg-blue-600 hover:bg-blue-700 text-white transform hover:scale-105'
                  }`}
                >
                  {reservationLoading ? 'Procesando...' : 'Reservar Ahora'}
                </button>

                {selectedRoom && selectedRoom.available < parseInt(reservationData.rooms) && (
                  <p className="text-red-600 text-sm text-center">
                    Solo hay {selectedRoom.available} habitaciones disponibles de este tipo
                  </p>
                )}
              </form>

              {!isAuthenticated && (
                <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                  <p className="text-sm text-blue-800 text-center">
                    <span>¿No tienes cuenta? </span>
                    <button
                      onClick={() => navigate('/register')}
                      className="font-medium hover:underline"
                    >
                      Regístrate aquí
                    </button>
                  </p>
                </div>
              )}

              {/* Trust indicators */}
              <div className="mt-6 pt-6 border-t border-gray-200">
                <div className="flex items-center justify-center space-x-4 text-sm text-gray-600">
                  <div className="flex items-center">
                    <CheckCircleIcon className="w-4 h-4 text-green-500 mr-1" />
                    <span>Reserva segura</span>
                  </div>
                  <div className="flex items-center">
                    <CheckCircleIcon className="w-4 h-4 text-green-500 mr-1" />
                    <span>Sin cargos ocultos</span>
                  </div>
                </div>
                <p className="text-xs text-gray-500 text-center mt-2">
                  Cancelación gratuita hasta 24 horas antes
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HotelDetail;