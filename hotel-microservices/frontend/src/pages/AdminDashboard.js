import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { hotelService, userService, reservationService } from '../services/api';
import { 
  PlusIcon, 
  PencilIcon, 
  TrashIcon, 
  UserGroupIcon,
  HomeIcon,
  CalendarIcon,
  XIcon
} from '@heroicons/react/outline';

const AdminDashboard = () => {
  const { isAdmin } = useAuth();
  const [activeTab, setActiveTab] = useState('hotels');
  const [hotels, setHotels] = useState([]);
  const [users, setUsers] = useState([]);
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showHotelModal, setShowHotelModal] = useState(false);
  const [editingHotel, setEditingHotel] = useState(null);

  const [hotelForm, setHotelForm] = useState({
    name: '',
    description: '',
    city: '',
    address: '',
    amenities: '',
    thumbnail: ''
  });

  useEffect(() => {
    if (activeTab === 'hotels') {
      fetchHotels();
    } else if (activeTab === 'users') {
      fetchUsers();
    } else if (activeTab === 'reservations') {
      fetchReservations();
    }
  }, [activeTab]);

  const fetchHotels = async () => {
    try {
      setLoading(true);
      const response = await hotelService.getHotels();
      setHotels(response.data);
    } catch (error) {
      console.error('Error fetching hotels:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await userService.getUsers();
      setUsers(response.data);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchReservations = async () => {
    try {
      setLoading(true);
      const response = await reservationService.getReservations();
      setReservations(response.data);
    } catch (error) {
      console.error('Error fetching reservations:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateHotel = () => {
    setEditingHotel(null);
    setHotelForm({
      name: '',
      description: '',
      city: '',
      address: '',
      amenities: '',
      thumbnail: ''
    });
    setShowHotelModal(true);
  };

  const handleEditHotel = (hotel) => {
    setEditingHotel(hotel);
    setHotelForm({
      name: hotel.name,
      description: hotel.description,
      city: hotel.city,
      address: hotel.address,
      amenities: hotel.amenities?.join(', ') || '',
      thumbnail: hotel.thumbnail || ''
    });
    setShowHotelModal(true);
  };

  const handleSubmitHotel = async (e) => {
    e.preventDefault();
    try {
      const hotelData = {
        ...hotelForm,
        amenities: hotelForm.amenities.split(',').map(a => a.trim()).filter(a => a)
      };

      if (editingHotel) {
        await hotelService.updateHotel(editingHotel.id, hotelData);
      } else {
        await hotelService.createHotel(hotelData);
      }

      setShowHotelModal(false);
      fetchHotels();
    } catch (error) {
      console.error('Error saving hotel:', error);
      alert('Error al guardar el hotel');
    }
  };

  const handleDeleteHotel = async (hotelId) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar este hotel?')) {
      try {
        await hotelService.deleteHotel(hotelId);
        fetchHotels();
      } catch (error) {
        console.error('Error deleting hotel:', error);
        alert('Error al eliminar el hotel');
      }
    }
  };

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Acceso Denegado</h2>
          <p className="text-gray-600">No tienes permisos para acceder al panel de administración</p>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: 'hotels', name: 'Hoteles', icon: HomeIcon, count: hotels.length },
    { id: 'users', name: 'Usuarios', icon: UserGroupIcon, count: users.length },
    { id: 'reservations', name: 'Reservas', icon: CalendarIcon, count: reservations.length },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Panel de Administración</h1>
          <p className="text-gray-600">Gestiona hoteles, usuarios y reservas</p>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 mb-8">
          <nav className="-mb-px flex space-x-8">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span>{tab.name}</span>
                  <span className="bg-gray-100 text-gray-600 py-0.5 px-2 rounded-full text-xs">
                    {tab.count}
                  </span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <>
            {/* Hotels Tab */}
            {activeTab === 'hotels' && (
              <div>
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-semibold text-gray-900">Gestión de Hoteles</h2>
                  <button
                    onClick={handleCreateHotel}
                    className="btn-primary flex items-center space-x-2"
                  >
                    <PlusIcon className="w-4 h-4" />
                    <span>Nuevo Hotel</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {hotels.map((hotel) => (
                    <div key={hotel.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                      <img
                        src={hotel.thumbnail || 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400'}
                        alt={hotel.name}
                        className="w-full h-48 object-cover"
                      />
                      <div className="p-4">
                        <h3 className="font-semibold text-gray-900 mb-1">{hotel.name}</h3>
                        <p className="text-gray-600 text-sm mb-2">{hotel.city}</p>
                        <p className="text-gray-500 text-sm line-clamp-2 mb-4">{hotel.description}</p>
                        
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleEditHotel(hotel)}
                            className="flex-1 btn-secondary text-sm flex items-center justify-center space-x-1"
                          >
                            <PencilIcon className="w-4 h-4" />
                            <span>Editar</span>
                          </button>
                          <button
                            onClick={() => handleDeleteHotel(hotel.id)}
                            className="px-3 py-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <TrashIcon className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Users Tab */}
            {activeTab === 'users' && (
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-6">Gestión de Usuarios</h2>
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Usuario
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Email
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Tipo
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Fecha de Registro
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {users.map((user) => (
                          <tr key={user.id}>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                                  <span className="text-white text-sm font-medium">
                                    {user.username.charAt(0).toUpperCase()}
                                  </span>
                                </div>
                                <div className="ml-3">
                                  <div className="text-sm font-medium text-gray-900">{user.username}</div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {user.email}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                user.is_admin ? 'bg-purple-100 text-purple-800' : 'bg-green-100 text-green-800'
                              }`}>
                                {user.is_admin ? 'Admin' : 'Usuario'}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {new Date(user.created_at).toLocaleDateString()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* Reservations Tab */}
            {activeTab === 'reservations' && (
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-6">Gestión de Reservas</h2>
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            ID
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Usuario
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Hotel
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Fechas
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Estado
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Fecha de Creación
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {reservations.map((reservation) => (
                          <tr key={reservation.id}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              #{reservation.id}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              Usuario {reservation.user_id}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {reservation.hotel_id}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {new Date(reservation.check_in).toLocaleDateString()} - {new Date(reservation.check_out).toLocaleDateString()}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                reservation.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                                reservation.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                'bg-red-100 text-red-800'
                              }`}>
                                {reservation.status === 'confirmed' ? 'Confirmada' :
                                 reservation.status === 'pending' ? 'Pendiente' : 'Cancelada'}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {new Date(reservation.created_at).toLocaleDateString()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Hotel Modal */}
      {showHotelModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold text-gray-900">
                  {editingHotel ? 'Editar Hotel' : 'Nuevo Hotel'}
                </h3>
                <button
                  onClick={() => setShowHotelModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XIcon className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={handleSubmitHotel} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nombre del Hotel
                  </label>
                  <input
                    type="text"
                    value={hotelForm.name}
                    onChange={(e) => setHotelForm({...hotelForm, name: e.target.value})}
                    className="input-field"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Descripción
                  </label>
                  <textarea
                    value={hotelForm.description}
                    onChange={(e) => setHotelForm({...hotelForm, description: e.target.value})}
                    className="input-field"
                    rows="3"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Ciudad
                    </label>
                    <input
                      type="text"
                      value={hotelForm.city}
                      onChange={(e) => setHotelForm({...hotelForm, city: e.target.value})}
                      className="input-field"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Dirección
                    </label>
                    <input
                      type="text"
                      value={hotelForm.address}
                      onChange={(e) => setHotelForm({...hotelForm, address: e.target.value})}
                      className="input-field"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Amenidades (separadas por comas)
                  </label>
                  <input
                    type="text"
                    value={hotelForm.amenities}
                    onChange={(e) => setHotelForm({...hotelForm, amenities: e.target.value})}
                    className="input-field"
                    placeholder="WiFi, Pool, Spa, Gym, Restaurant"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    URL de Imagen Principal
                  </label>
                  <input
                    type="url"
                    value={hotelForm.thumbnail}
                    onChange={(e) => setHotelForm({...hotelForm, thumbnail: e.target.value})}
                    className="input-field"
                    placeholder="https://ejemplo.com/imagen.jpg"
                  />
                </div>

                <div className="flex space-x-3 pt-4">
                  <button
                    type="submit"
                    className="btn-primary flex-1"
                  >
                    {editingHotel ? 'Actualizar' : 'Crear'} Hotel
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowHotelModal(false)}
                    className="btn-secondary flex-1"
                  >
                    Cancelar
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;