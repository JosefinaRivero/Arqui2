import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { userService } from '../services/api';
import { CalendarIcon, LocationMarkerIcon, ClockIcon } from '@heroicons/react/outline';

const UserReservations = () => {
  const { user } = useAuth();
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchReservations = async () => {
      try {
        setLoading(true);
        const response = await userService.getUserReservations(user.id);
        setReservations(response.data);
      } catch (err) {
        setError('Error al cargar las reservas');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    if (user?.id) {
      fetchReservations();
    }
  }, [user]);

  const getStatusColor = (status) => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'confirmed':
        return 'Confirmada';
      case 'pending':
        return 'Pendiente';
      case 'cancelled':
        return 'Cancelada';
      default:
        return status;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Error</h2>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Mis Reservas</h1>
          <p className="text-gray-600">Gestiona y revisa todas tus reservas de hotel</p>
        </div>

        {reservations.length === 0 ? (
          <div className="text-center py-12">
            <CalendarIcon className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              No tienes reservas
            </h2>
            <p className="text-gray-600 mb-6">
              ¡Empieza a explorar y haz tu primera reserva!
            </p>
            <a href="/" className="btn-primary">
              Buscar Hoteles
            </a>
          </div>
        ) : (
          <div className="space-y-6">
            {reservations.map((reservation) => (
              <div key={reservation.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-1">
                        Reserva #{reservation.id}
                      </h3>
                      <div className="flex items-center text-gray-600 text-sm">
                        <ClockIcon className="w-4 h-4 mr-1" />
                        <span>Creada el {new Date(reservation.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(reservation.status)}`}>
                      {getStatusText(reservation.status)}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Hotel Info */}
                    <div className="md:col-span-2">
                      <div className="flex items-start space-x-4">
                        <img
                          src="https://images.unsplash.com/photo-1566073771259-6a8506099945?w=100"
                          alt="Hotel"
                          className="w-16 h-16 rounded-lg object-cover"
                        />
                        <div>
                          <h4 className="font-medium text-gray-900 mb-1">
                            Hotel ID: {reservation.hotel_id}
                          </h4>
                          <div className="flex items-center text-gray-600 text-sm">
                            <LocationMarkerIcon className="w-4 h-4 mr-1" />
                            <span>Ubicación del hotel</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Dates Info */}
                    <div className="space-y-4">
                      <div>
                        <h5 className="text-sm font-medium text-gray-700 mb-2">Fechas de estadía</h5>
                        <div className="space-y-1">
                          <div className="flex items-center text-sm">
                            <CalendarIcon className="w-4 h-4 mr-2 text-gray-400" />
                            <span>Check-in: {new Date(reservation.check_in).toLocaleDateString()}</span>
                          </div>
                          <div className="flex items-center text-sm">
                            <CalendarIcon className="w-4 h-4 mr-2 text-gray-400" />
                            <span>Check-out: {new Date(reservation.check_out).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </div>

                      <div>
                        <h5 className="text-sm font-medium text-gray-700 mb-1">Duración</h5>
                        <p className="text-sm text-gray-600">
                          {Math.ceil((new Date(reservation.check_out) - new Date(reservation.check_in)) / (1000 * 60 * 60 * 24))} noches
                        </p>
                      </div>
                    </div>
                  </div>

                  {reservation.amadeus_id && (
                    <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                      <p className="text-sm text-blue-800">
                        <strong>ID de confirmación:</strong> {reservation.amadeus_id}
                      </p>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="mt-6 flex flex-wrap gap-3">
                    <button className="btn-secondary text-sm">
                      Ver Detalles
                    </button>
                    {reservation.status === 'confirmed' && (
                      <button className="text-red-600 hover:text-red-700 text-sm font-medium">
                        Cancelar Reserva
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default UserReservations;