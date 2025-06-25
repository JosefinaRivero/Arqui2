import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { SearchIcon, LocationMarkerIcon, CalendarIcon, StarIcon } from '@heroicons/react/outline';

const Home = () => {
  const [searchData, setSearchData] = useState({
    city: '',
    checkIn: '',
    checkOut: ''
  });
  const navigate = useNavigate();

  const handleInputChange = (e) => {
    setSearchData({
      ...searchData,
      [e.target.name]: e.target.value
    });
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (!searchData.city) {
      alert('Por favor ingresa una ciudad');
      return;
    }
    
    const params = new URLSearchParams(searchData);
    navigate(`/search?${params}`);
  };

  const popularDestinations = [
    {
      name: 'Buenos Aires',
      image: 'https://images.unsplash.com/photo-1576016404463-11c4de7f5ad5?w=800',
      hotels: '150+ hoteles'
    },
    {
      name: 'Córdoba',
      image: 'https://images.unsplash.com/photo-1562133072-8c7b8d3b0ed2?w=800',
      hotels: '80+ hoteles'
    },
    {
      name: 'Mendoza',
      image: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800',
      hotels: '60+ hoteles'
    },
    {
      name: 'Bariloche',
      image: 'https://images.unsplash.com/photo-1516026672322-bc52d61a55d5?w=800',
      hotels: '40+ hoteles'
    }
  ];

  const features = [
    {
      icon: <SearchIcon className="w-8 h-8 text-blue-600" />,
      title: 'Búsqueda Fácil',
      description: 'Encuentra el hotel perfecto con nuestra búsqueda avanzada'
    },
    {
      icon: <LocationMarkerIcon className="w-8 h-8 text-blue-600" />,
      title: 'Mejores Ubicaciones',
      description: 'Hoteles en las mejores zonas de cada ciudad'
    },
    {
      icon: <StarIcon className="w-8 h-8 text-blue-600" />,
      title: 'Calidad Garantizada',
      description: 'Solo trabajamos con hoteles de la más alta calidad'
    }
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <div className="hero-gradient relative min-h-screen flex items-center justify-center">
        <div className="absolute inset-0 bg-black opacity-20"></div>
        <div className="relative z-10 text-center text-white px-4 max-w-4xl mx-auto">
          <h1 className="text-5xl md:text-7xl font-bold mb-6 animate-fade-in">
            Encuentra tu Hotel Perfecto
          </h1>
          <p className="text-xl md:text-2xl mb-12 animate-fade-in">
            Descubre experiencias únicas en los mejores hoteles del mundo
          </p>
          
          {/* Search Form */}
          <form onSubmit={handleSearch} className="glass-effect p-8 rounded-2xl max-w-4xl mx-auto animate-fade-in">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
              <div className="text-left">
                <label className="block text-sm font-medium mb-2">Ciudad</label>
                <div className="relative">
                  <LocationMarkerIcon className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    name="city"
                    value={searchData.city}
                    onChange={handleInputChange}
                    placeholder="¿A dónde vas?"
                    className="input-field pl-10 bg-white/90"
                  />
                </div>
              </div>
              
              <div className="text-left">
                <label className="block text-sm font-medium mb-2">Check-in</label>
                <div className="relative">
                  <CalendarIcon className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                  <input
                    type="date"
                    name="checkIn"
                    value={searchData.checkIn}
                    onChange={handleInputChange}
                    className="input-field pl-10 bg-white/90"
                  />
                </div>
              </div>
              
              <div className="text-left">
                <label className="block text-sm font-medium mb-2">Check-out</label>
                <div className="relative">
                  <CalendarIcon className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                  <input
                    type="date"
                    name="checkOut"
                    value={searchData.checkOut}
                    onChange={handleInputChange}
                    className="input-field pl-10 bg-white/90"
                  />
                </div>
              </div>
              
              <button
                type="submit"
                className="btn-primary h-12 flex items-center justify-center space-x-2"
              >
                <SearchIcon className="w-5 h-5" />
                <span>Buscar</span>
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              ¿Por qué elegir HotelBook?
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Ofrecemos la mejor experiencia para encontrar y reservar hoteles
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="text-center p-8 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors">
                <div className="flex justify-center mb-4">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  {feature.title}
                </h3>
                <p className="text-gray-600">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Popular Destinations */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Destinos Populares
            </h2>
            <p className="text-xl text-gray-600">
              Descubre los destinos más buscados
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {popularDestinations.map((destination, index) => (
              <div key={index} className="card-hover cursor-pointer group">
                <div className="relative overflow-hidden rounded-xl">
                  <img
                    src={destination.image}
                    alt={destination.name}
                    className="w-full h-64 object-cover group-hover:scale-110 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                  <div className="absolute bottom-4 left-4 text-white">
                    <h3 className="text-xl font-semibold mb-1">{destination.name}</h3>
                    <p className="text-sm opacity-90">{destination.hotels}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-blue-600">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-bold text-white mb-4">
            ¿Listo para tu próxima aventura?
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            Únete a miles de viajeros que confían en nosotros
          </p>
          <button
            onClick={() => document.querySelector('form').scrollIntoView({ behavior: 'smooth' })}
            className="bg-white text-blue-600 hover:bg-gray-100 font-semibold py-4 px-8 rounded-lg transition-colors"
          >
            Buscar Hoteles Ahora
          </button>
        </div>
      </section>
    </div>
  );
};

export default Home;