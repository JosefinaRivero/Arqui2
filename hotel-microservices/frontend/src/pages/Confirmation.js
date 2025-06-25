import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { CheckCircleIcon, XCircleIcon } from '@heroicons/react/outline';

const Confirmation = () => {
  const location = useLocation();
  const { success, hotel, reservation, error } = location.state || {};

  if (success) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full">
          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            {/* Success Header */}
            <div className="bg-green-500 px-6 py-8 text-center">
              <CheckCircleIcon className="mx-auto h-16 w-16 text-white mb-4" />
              <h1 className="text-2xl font-bold text-white">¡Reserva Confirmada!</h1>
              <p className="text-green-100 mt-2">Tu reserva ha sido procesada exitosamente</p>
            </div>

            {/* Reservation Details */}
            <div className="px-6 py-6">
              {hotel && (
                <div className="mb-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-2">Detalles del Hotel</h2>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="font-medium text-gray-900">{hotel.name}</h3>
                    <p className="text-gray-600 text-sm mt-1">{hotel.address}</p>
                  </div>
                </div>
              )}

              {reservation && (
                <div className="mb-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-2">Detalles de la Reserva</h2>
                  <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Check-in:</span>
                      <span className="font-medium">{new Date(reservation.check_in).toLocaleDateString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Check-out:</span>
                      <span className="font-medium">{new Date(reservation.check_out).toLocaleDateString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Noches:</span>
                      <span className="font-medium">
                        {Math.ceil((new Date(reservation.check_out) - new Date(reservation.check_in)) / (1000 * 60 * 60 * 24))}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              <div className="bg-blue-50 rounded-lg p-4 mb-6">
                <h3 className="font-medium text-blue-900 mb-2">Próximos pasos:</h3>
                <ul className="text-blue-800 text-sm space-y-1">
                  <li>• Recibirás un email de confirmación</li>
                  <li>• Puedes ver tus reservas en tu perfil</li>
                  <li>• Presenta tu ID al hacer check-in</li>
                </ul>
              </div>

              <div className="space-y-3">
                <Link
                  to="/reservations"
                  className="w-full btn-primary text-center block"
                >
                  Ver Mis Reservas
                </Link>
                <Link
                  to="/"
                  className="w-full btn-secondary text-center block"
                >
                  Volver al Inicio
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
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          {/* Error Header */}
          <div className="bg-red-500 px-6 py-8 text-center">
            <XCircleIcon className="mx-auto h-16 w-16 text-white mb-4" />
            <h1 className="text-2xl font-bold text-white">Reserva No Procesada</h1>
            <p className="text-red-100 mt-2">Hubo un problema al procesar tu reserva</p>
          </div>

          {/* Error Details */}
          <div className="px-6 py-6">
            <div className="bg-red-50 rounded-lg p-4 mb-6">
              <h3 className="font-medium text-red-900 mb-2">Error:</h3>
              <p className="text-red-800 text-sm">
                {error || 'Error desconocido. Por favor intenta nuevamente.'}
              </p>
            </div>

            <div className="bg-yellow-50 rounded-lg p-4 mb-6">
              <h3 className="font-medium text-yellow-900 mb-2">¿Qué puedes hacer?</h3>
              <ul className="text-yellow-800 text-sm space-y-1">
                <li>• Verifica que las fechas estén disponibles</li>
                <li>• Intenta con fechas diferentes</li>
                <li>• Contacta a nuestro equipo de soporte</li>
              </ul>
            </div>

            <div className="space-y-3">
              <button
                onClick={() => window.history.back()}
                className="w-full btn-primary"
              >
                Intentar Nuevamente
              </button>
              <Link
                to="/"
                className="w-full btn-secondary text-center block"
              >
                Volver al Inicio
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Confirmation;