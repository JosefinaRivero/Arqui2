import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { CheckCircleIcon, XCircleIcon, CalendarIcon, HomeIcon, UserGroupIcon, CurrencyDollarIcon } from '@heroicons/react/outline';

const Confirmation = () => {
  const location = useLocation();
  const { success, hotel, reservation, error, totalPrice } = location.state || {};

  if (success) {
    const nights = reservation && reservation.check_in && reservation.check_out ? 
      Math.ceil((new Date(reservation.check_out) - new Date(reservation.check_in)) / (1000 * 60 * 60 * 24)) : 1;

    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl w-full">
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
            {/* Success Header */}
            <div className="bg-gradient-to-r from-green-500 to-green-600 px-8 py-12 text-center">
              <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircleIcon className="w-12 h-12 text-green-500" />
              </div>
              <h1 className="text-3xl font-bold text-white mb-2">¡Reserva Confirmada!</h1>
              <p className="text-green-100 text-lg">Tu reserva ha sido procesada exitosamente</p>
              <div className="mt-4 bg-white/20 rounded-lg px-4 py-2 inline-block">
                <span className="text-white font-semibold">Confirmación #</span>
                <span className="text-white font-mono">{Math.random().toString(36).substr(2, 9).toUpperCase()}</span>
              </div>
            </div>

            {/* Reservation Details */}
            <div className="px-8 py-8">
              {hotel && (
                <div className="mb-8">
                  <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                    <HomeIcon className="w-6 h-6 mr-2 text-blue-600" />
                    Detalles del Hotel
                  </h2>
                  <div className="bg-gray-50 rounded-xl p-6">
                    <div className="flex items-start space-x-4">
                      <img 
                        src={hotel.thumbnail || 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=100'} 
                        alt={hotel.name}
                        className="w-20 h-20 rounded-lg object-cover"
                      />
                      <div className="flex-1">
                        <h3 className="text-lg font-bold text-gray-900 mb-1">{hotel.name}</h3>
                        <p className="text-gray-600 mb-2">{hotel.address}</p>
                        <div className="flex items-center">
                          <div className="flex text-yellow-400 mr-2">
                            {[...Array(5)].map((_, i) => (
                              <span key={i}>★</span>
                            ))}
                          </div>
                          <span className="text-sm text-gray-600">Excelente ubicación</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {reservation && (
                <div className="mb-8">
                  <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                    <CalendarIcon className="w-6 h-6 mr-2 text-blue-600" />
                    Detalles de la Reserva
                  </h2>
                  <div className="bg-gray-50 rounded-xl p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <div>
                          <label className="text-sm font-medium text-gray-600">Check-in</label>
                          <p className="text-lg font-semibold text-gray-900">
                            {new Date(reservation.check_in).toLocaleDateString('es-ES', {
                              weekday: 'long',
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                            })}
                          </p>
                          <p className="text-sm text-gray-600">A partir de las 15:00</p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-600">Check-out</label>
                          <p className="text-lg font-semibold text-gray-900">
                            {new Date(reservation.check_out).toLocaleDateString('es-ES', {
                              weekday: 'long',
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                            })}
                          </p>
                          <p className="text-sm text-gray-600">Hasta las 11:00</p>
                        </div>
                      </div>
                      <div className="space-y-4">
                        <div>
                          <label className="text-sm font-medium text-gray-600">Duración</label>
                          <p className="text-lg font-semibold text-gray-900">
                            {nights} noche{nights > 1 ? 's' : ''}
                          </p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-600">Huéspedes</label>
                          <p className="text-lg font-semibold text-gray-900 flex items-center">
                            <UserGroupIcon className="w-5 h-5 mr-1" />
                            {reservation.guests} persona{reservation.guests > 1 ? 's' : ''}
                          </p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-600">Habitaciones</label>
                          <p className="text-lg font-semibold text-gray-900">
                            {reservation.rooms} habitación{reservation.rooms > 1 ? 'es' : ''}
                          </p>
                          {reservation.room_type && (
                            <p className="text-sm text-gray-600">{reservation.room_type}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {totalPrice && (
                <div className="mb-8">
                  <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                    <CurrencyDollarIcon className="w-6 h-6 mr-2 text-blue-600" />
                    Resumen de Pago
                  </h2>
                  <div className="bg-gray-50 rounded-xl p-6">
                    <div className="flex justify-between items-center text-2xl font-bold text-gray-900">
                      <span>Total Pagado</span>
                      <span className="text-green-600">${totalPrice.toLocaleString()}</span>
                    </div>
                    <p className="text-sm text-gray-600 mt-2">Incluye todos los impuestos y tasas</p>
                  </div>
                </div>
              )}

              <div className="bg-blue-50 rounded-xl p-6 mb-8">
                <h3 className="font-bold text-blue-900 mb-3">📋 Información Importante:</h3>
                <ul className="text-blue-800 text-sm space-y-2">
                  <li>• Se enviará un email de confirmación a tu correo electrónico</li>
                  <li>• Presenta tu documento de identidad al hacer check-in</li>
                  <li>• Puedes cancelar sin costo hasta 24 horas antes del check-in</li>
                  <li>• El hotel cuenta con WiFi gratuito y estacionamiento</li>
                  <li>• Para cambios en tu reserva, contacta directamente al hotel</li>
                </ul>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Link
                  to="/reservations"
                  className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-4 px-6 rounded-xl text-center transition-all transform hover:scale-105"
                >
                  Ver Mis Reservas
                </Link>
                <Link
                  to="/"
                  className="bg-gray-100 hover:bg-gray-200 text-gray-900 font-semibold py-4 px-6 rounded-xl text-center transition-all"
                >
                  Buscar Más Hoteles
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-lg w-full">
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          {/* Error Header */}
          <div className="bg-gradient-to-r from-red-500 to-red-600 px-8 py-12 text-center">
            <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-6">
              <XCircleIcon className="w-12 h-12 text-red-500" />
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">Reserva No Procesada</h1>
            <p className="text-red-100 text-lg">Hubo un problema al procesar tu reserva</p>
          </div>

          {/* Error Details */}
          <div className="px-8 py-8">
            <div className="bg-red-50 rounded-xl p-6 mb-8">
              <h3 className="font-bold text-red-900 mb-3">❌ Error:</h3>
              <p className="text-red-800">
                {error || 'Error desconocido. Por favor intenta nuevamente.'}
              </p>
            </div>

            <div className="bg-yellow-50 rounded-xl p-6 mb-8">
              <h3 className="font-bold text-yellow-900 mb-3">💡 ¿Qué puedes hacer?</h3>
              <ul className="text-yellow-800 text-sm space-y-2">
                <li>• Verifica que las fechas estén disponibles</li>
                <li>• Intenta con fechas diferentes</li>
                <li>• Asegúrate de que hay habitaciones suficientes</li>
                <li>• Revisa tu conexión a internet</li>
                <li>• Contacta a nuestro equipo de soporte si el problema persiste</li>
              </ul>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button
                onClick={() => window.history.back()}
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-4 px-6 rounded-xl transition-all transform hover:scale-105"
              >
                Intentar Nuevamente
              </button>
              <Link
                to="/"
                className="bg-gray-100 hover:bg-gray-200 text-gray-900 font-semibold py-4 px-6 rounded-xl text-center transition-all"
              >
                Volver al Inicio
              </Link>
            </div>

            <div className="mt-8 p-4 bg-gray-50 rounded-xl text-center">
              <p className="text-sm text-gray-600 mb-2">¿Necesitas ayuda?</p>
              <p className="text-sm font-medium text-gray-900">
                📞 Soporte: +54 11 1234-5678 | 📧 ayuda@hotelbook.com
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Confirmation;