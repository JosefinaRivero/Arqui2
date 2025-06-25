import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { searchService } from '../services/api';
import { LocationMarkerIcon, StarIcon, WifiIcon, UserGroupIcon } from '@heroicons/react/outline';

const SearchResults = () => {
  const [searchParams] = useSearchParams();
  const [hotels, setHotels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const city = searchParams.get('city');
  const checkIn = searchParams.get('checkIn');
  const checkOut = searchParams.get('checkOut');

  useEffect(() => {
    const fetchHotels = async () => {
      try {
        setLoading(true);
        const params = { city };
        if (checkIn) params.check_in = checkIn;
        if (checkOut) params.check_out = checkOut;

        const response = await searchService.searchHotels(params);
        setHotels(response.data.hotels || []);
      } catch (err) {
        setError('Error al buscar hoteles');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    if (city) {
      fetchHotels();
    }
  }, [city, checkIn, checkOut]);

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
        {/* Search Summary */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Hoteles en {city}
          </h1>
          <div className="flex flex-wrap items-center gap-4 text-gray-600">
            {checkIn && checkOut && (
              <p>
                {new Date(checkIn).toLocaleDateString()} - {new Date(checkOut).toLocaleDateString()}
              </p>
            )}
            <p>{hotels.length} hoteles encontrados</p>
          </div>
        </div>

        {/* Results Grid */}
        {hotels.length === 0 ? (
          <div className="text-center py-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              No se encontraron hoteles
            </h2>
            <p className="text-gray-600 mb-6">
              Prueba ajustando tu búsqueda o eligiendo otra ciudad
            </p>
            <Link to="/" className="btn-primary">
              Nueva Búsqueda
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {hotels.map((hotel) => (
              <Link
                key={hotel.id}
                to={`/hotel/${hotel.id}`}
                className="card-hover bg-white rounded-xl shadow-md overflow-hidden"
              >
                <div className="relative">
                  <img
                    src={hotel.thumbnail || 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400'}
                    alt={hotel.name}
                    className="w-full h-48 object-cover"
                  />
                  {!hotel.available && checkIn && checkOut && (
                    <div className="absolute top-2 right-2 bg-red-500 text-white px-2 py-1 rounded text-sm">
                      No Disponible
                    </div>
                  )}
                  {hotel.available && checkIn && checkOut && (
                    <div className="absolute top-2 right-2 bg-green-500 text-white px-2 py-1 rounded text-sm">
                      Disponible
                    </div>
                  )}
                </div>
                
                <div className="p-6">
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    {hotel.name}
                  </h3>
                  
                  <div className="flex items-center text-gray-600 mb-2">
                    <LocationMarkerIcon className="w-4 h-4 mr-1" />
                    <span className="text-sm">{hotel.address}</span>
                  </div>
                  
                  <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                    {hotel.description}
                  </p>
                  
                  {/* Amenities */}
                  <div className="flex flex-wrap gap-2 mb-4">
                    {hotel.amenities?.slice(0, 3).map((amenity, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                      >
                        {amenity === 'WiFi' && <WifiIcon className="w-3 h-3 mr-1" />}
                        {amenity === 'Pool' && <UserGroupIcon className="w-3 h-3 mr-1" />}
                        {amenity}
                      </span>
                    ))}
                    {hotel.amenities?.length > 3 && (
                      <span className="text-xs text-gray-500">
                        +{hotel.amenities.length - 3} más
                      </span>
                    )}
                  </div>
                  
                  {/* Rating */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      {[...Array(5)].map((_, i) => (
                        <StarIcon
                          key={i}
                          className={`w-4 h-4 ${
                            i < 4 ? 'text-yellow-400 fill-current' : 'text-gray-300'
                          }`}
                        />
                      ))}
                      <span className="ml-2 text-sm text-gray-600">(4.0)</span>
                    </div>
                    
                    <button className="text-blue-600 hover:text-blue-700 font-medium text-sm">
                      Ver detalles →
                    </button>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default SearchResults;