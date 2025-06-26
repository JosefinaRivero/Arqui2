import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { SearchIcon, LocationMarkerIcon, CalendarIcon, StarIcon, UserGroupIcon, ShieldCheckIcon, CurrencyDollarIcon } from '@heroicons/react/outline';

const Home = () => {
  const [searchData, setSearchData] = useState({
    city: '',
    checkIn: '',
    checkOut: '',
    guests: 2,
    rooms: 1
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
      image: 'https://images.unsplash.com/photo-1589909202802-8f4aadce1849?w=800&h=600&fit=crop',
      hotels: '250+ hoteles',
      price: 'Desde $120/noche',
      description: 'La capital vibrante con tango y cultura'
    },
    {
      name: 'Córdoba',
      image: 'https://images.unsplash.com/photo-1562133072-8c7b8d3b0ed2?w=800&h=600&fit=crop',
      hotels: '120+ hoteles',
      price: 'Desde $80/noche',
      description: 'Ciudad universitaria llena de historia'
    },
    {
      name: 'Mendoza',
      image: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=600&fit=crop',
      hotels: '90+ hoteles',
      price: 'Desde $100/noche',
      description: 'Tierra del vino y los Andes'
    },
    {
      name: 'Bariloche',
      image: 'https://images.unsplash.com/photo-1516026672322-bc52d61a55d5?w=800&h=600&fit=crop',
      hotels: '75+ hoteles',
      price: 'Desde $150/noche',
      description: 'Paraíso patagónico junto a los lagos'
    }
  ];

  const features = [
    {
      icon: <SearchIcon className="w-12 h-12 text-blue-600" />,
      title: 'Búsqueda Inteligente',
      description: 'Encuentra el hotel perfecto con filtros avanzados y disponibilidad en tiempo real',
      color: 'bg-blue-50'
    },
    {
      icon: <ShieldCheckIcon className="w-12 h-12 text-green-600" />,
      title: 'Reservas Seguras',
      description: 'Sistema de reservas confiable con confirmación instantánea y protección al cliente',
      color: 'bg-green-50'
    },
    {
      icon: <CurrencyDollarIcon className="w-12 h-12 text-purple-600" />,
      title: 'Mejores Precios',
      description: 'Garantizamos los mejores precios del mercado con ofertas exclusivas',
      color: 'bg-purple-50'
    }
  ];

  const testimonials = [
    {
      name: 'María González',
      rating: 5,
      comment: 'Excelente servicio, encontré el hotel perfecto para mi luna de miel en Bariloche.',
      location: 'Buenos Aires'
    },
    {
      name: 'Carlos Rodríguez',
      rating: 5,
      comment: 'La plataforma es súper fácil de usar y los precios son inmejorables.',
      location: 'Córdoba'
    },
    {
      name: 'Ana Martínez',
      rating: 5,
      comment: 'Reservé para toda mi familia, el proceso fue rápido y sin complicaciones.',
      location: 'Mendoza'
    }
  ];

  const today = new Date().toISOString().split('T')[0];
  const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <div className="relative min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-900 via-blue-800 to-purple-900">
        {/* Background Video Effect */}
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-black opacity-40"></div>
          <div 
            className="w-full h-full bg-cover bg-center bg-fixed"
            style={{
              backgroundImage: `url('https://images.unsplash.com/photo-1564501049412-61c2a3083791?w=1920&h=1080&fit=crop')`
            }}
          ></div>
        </div>
        
        <div className="relative z-10 text-center text-white px-4 max-w-6xl mx-auto">
          <div className="animate-fade-in">
            <h1 className="text-6xl md:text-8xl font-bold mb-6 bg-gradient-to-r from-white to-blue-200 bg-clip-text text-transparent">
              Tu Hotel Perfecto
            </h1>
            <p className="text-2xl md:text-3xl mb-4 font-light">
              Descubre experiencias únicas en los mejores destinos
            </p>
            <p className="text-lg md:text-xl mb-12 text-blue-100 max-w-3xl mx-auto">
              Más de 500 hoteles verificados • Reserva instantánea • Cancelación gratuita
            </p>
          </div>
          
          {/* Enhanced Search Form */}
          <div className="bg-white/95 backdrop-blur-lg p-8 rounded-3xl shadow-2xl max-w-5xl mx-auto animate-fade-in">
            <form onSubmit={handleSearch}>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
                <div className="lg:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    ¿A dónde vas?
                  </label>
                  <div className="relative">
                    <LocationMarkerIcon className="absolute left-4 top-4 h-5 w-5 text-gray-400" />
                    <input
                      type="text"
                      name="city"
                      value={searchData.city}
                      onChange={handleInputChange}
                      placeholder="Ciudad o destino"
                      className="w-full pl-12 pr-4 py-4 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all text-gray-900"
                      required
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Check-in
                  </label>
                  <div className="relative">
                    <CalendarIcon className="absolute left-4 top-4 h-5 w-5 text-gray-400" />
                    <input
                      type="date"
                      name="checkIn"
                      value={searchData.checkIn}
                      onChange={handleInputChange}
                      min={today}
                      className="w-full pl-12 pr-4 py-4 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all text-gray-900"
                      required
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Check-out
                  </label>
                  <div className="relative">
                    <CalendarIcon className="absolute left-4 top-4 h-5 w-5 text-gray-400" />
                    <input
                      type="date"
                      name="checkOut"
                      value={searchData.checkOut}
                      onChange={handleInputChange}
                      min={searchData.checkIn || tomorrow}
                      className="w-full pl-12 pr-4 py-4 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all text-gray-900"
                      required
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Huéspedes
                  </label>
                  <div className="relative">
                    <UserGroupIcon className="absolute left-4 top-4 h-5 w-5 text-gray-400" />
                    <select
                      name="guests"
                      value={searchData.guests}
                      onChange={handleInputChange}
                      className="w-full pl-12 pr-4 py-4 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all text-gray-900 appearance-none"
                    >
                      {[1,2,3,4,5,6,7,8].map(num => (
                        <option key={num} value={num}>{num} huésped{num > 1 ? 'es' : ''}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
              
              <button
                type="submit"
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold py-4 px-8 rounded-xl transition-all duration-300 transform hover:scale-105 flex items-center justify-center space-x-3 shadow-lg"
              >
                <SearchIcon className="w-6 h-6" />
                <span className="text-lg">Buscar Hoteles</span>
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <section className="py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <h2 className="text-5xl font-bold text-gray-900 mb-6">
              ¿Por qué elegir HotelBook?
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Somos la plataforma líder en reservas hoteleras con más de 10 años de experiencia
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            {features.map((feature, index) => (
              <div key={index} className={`${feature.color} p-8 rounded-2xl hover:transform hover:scale-105 transition-all duration-300 shadow-lg`}>
                <div className="flex justify-center mb-6">
                  {feature.icon}
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4 text-center">
                  {feature.title}
                </h3>
                <p className="text-gray-700 text-center leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Popular Destinations */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <h2 className="text-5xl font-bold text-gray-900 mb-6">
              Destinos Populares
            </h2>
            <p className="text-xl text-gray-600">
              Los lugares más elegidos por nuestros viajeros
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {popularDestinations.map((destination, index) => (
              <div key={index} className="group cursor-pointer">
                <div className="relative overflow-hidden rounded-2xl shadow-lg group-hover:shadow-2xl transition-all duration-300">
                  <img
                    src={destination.image}
                    alt={destination.name}
                    className="w-full h-80 object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
                  <div className="absolute bottom-6 left-6 right-6 text-white">
                    <h3 className="text-2xl font-bold mb-2">{destination.name}</h3>
                    <p className="text-sm mb-2 text-gray-200">{destination.description}</p>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">{destination.hotels}</span>
                      <span className="text-sm font-bold bg-white/20 px-3 py-1 rounded-full">
                        {destination.price}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-24 bg-gradient-to-br from-blue-50 to-purple-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <h2 className="text-5xl font-bold text-gray-900 mb-6">
              Lo que dicen nuestros huéspedes
            </h2>
            <p className="text-xl text-gray-600">
              Miles de viajeros satisfechos respaldan nuestra calidad
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <div key={index} className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300">
                <div className="flex items-center mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <StarIcon key={i} className="w-5 h-5 text-yellow-400 fill-current" />
                  ))}
                </div>
                <p className="text-gray-700 mb-6 italic leading-relaxed">
                  "{testimonial.comment}"
                </p>
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold mr-4">
                    {testimonial.name.charAt(0)}
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">{testimonial.name}</h4>
                    <p className="text-gray-600 text-sm">{testimonial.location}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-gradient-to-r from-blue-600 to-purple-600">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-5xl font-bold text-white mb-6">
            ¿Listo para tu próxima aventura?
          </h2>
          <p className="text-xl text-blue-100 mb-10 max-w-2xl mx-auto">
            Únete a más de 100,000 viajeros que confían en nosotros para encontrar los mejores hoteles
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => document.querySelector('form').scrollIntoView({ behavior: 'smooth' })}
              className="bg-white text-blue-600 hover:bg-gray-100 font-bold py-4 px-8 rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg"
            >
              Buscar Hoteles Ahora
            </button>
            <button className="border-2 border-white text-white hover:bg-white hover:text-blue-600 font-bold py-4 px-8 rounded-xl transition-all duration-300 transform hover:scale-105">
              Ver Ofertas Especiales
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;