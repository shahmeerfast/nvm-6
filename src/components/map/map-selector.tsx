import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import React, { useState, useEffect } from "react";

// Configure default icon for Leaflet markers
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

type MapSelectorProps = {
  latitude: number;
  longitude: number;
  onChange: (lat: number, lng: number, address: string) => void;
};

// Component that smoothly changes the map view when coordinates update
function ChangeMapView({ coords }: { coords: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.flyTo(coords, map.getZoom(), { animate: true, duration: 1.5 });
  }, [coords, map]);
  return null;
}

export const MapSelector: React.FC<MapSelectorProps> = ({ latitude, longitude, onChange }) => {
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<any[]>([]);

  // Fetch suggestions using hybrid approach (Nominatim + Google Places fallback)
  const fetchSuggestions = async () => {
    if (!query) {
      setSuggestions([]);
      return;
    }
    try {
      const searchQuery = query.trim();
      
      // First try Nominatim API
      const nominatimResults = await fetchNominatimSuggestions(searchQuery);
      
      // Check if we have a house number in the query
      const words = searchQuery.split(' ');
      const hasHouseNumber = words.length > 1 && /^\d+/.test(words[0]);
      
      if (hasHouseNumber) {
        // Check if Nominatim results include the house number
        const resultsIncludeHouseNumber = nominatimResults.some((result: any) => 
          result.display_name.toLowerCase().includes(words[0].toLowerCase())
        );
        
        if (!resultsIncludeHouseNumber && nominatimResults.length > 0) {
          // Enhance Nominatim results with house number
          const enhancedData = nominatimResults.map((result: any) => ({
            ...result,
            display_name: `${words[0]} ${result.display_name}`,
            address: {
              ...result.address,
              house_number: words[0]
            }
          }));
          setSuggestions(enhancedData);
          return;
        } else if (nominatimResults.length === 0) {
          // No Nominatim results, try Google Places API as fallback
          const googleResults = await fetchGooglePlacesSuggestions(searchQuery);
          if (googleResults.length > 0) {
            setSuggestions(googleResults);
            return;
          }
          
          // If Google also fails, try broader Nominatim search
          const broaderQuery = words.slice(1).join(' ');
          const broaderResults = await fetchNominatimSuggestions(broaderQuery);
          const enhancedData = broaderResults.map((result: any) => ({
            ...result,
            display_name: `${words[0]} ${result.display_name}`,
            address: {
              ...result.address,
              house_number: words[0]
            }
          }));
          setSuggestions(enhancedData);
          return;
        }
      }
      
      // If no house number or Nominatim results are good, use them
      if (nominatimResults.length > 0) {
        setSuggestions(nominatimResults);
      } else {
        // Try Google Places as fallback
        const googleResults = await fetchGooglePlacesSuggestions(searchQuery);
        setSuggestions(googleResults);
      }
    } catch (error) {
      console.error("Search error:", error);
      setSuggestions([]);
    }
  };

  // Fetch suggestions from Nominatim API
  const fetchNominatimSuggestions = async (searchQuery: string) => {
    const params = new URLSearchParams({
      format: 'json',
      q: searchQuery,
      countrycodes: 'us',
      addressdetails: '1',
      limit: '10',
      dedupe: '1'
    });
    
    const response = await fetch(`https://nominatim.openstreetmap.org/search?${params}`);
    return await response.json();
  };

  // Fetch suggestions from Google Places API (fallback) via server-side route
  const fetchGooglePlacesSuggestions = async (searchQuery: string) => {
    try {
      const params = new URLSearchParams({
        input: searchQuery
      });

      const response = await fetch(`/api/places/search?${params}`);
      const data = await response.json();

      if (data.results) {
        return data.results;
      }
      
      return [];
    } catch (error) {
      console.error('Google Places API error:', error);
      return [];
    }
  };

  // Debounce the search input so that it fetches after a short delay
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (query.length > 1) { // Reduced from 2 to 1 character
        fetchSuggestions();
      } else {
        setSuggestions([]);
      }
    }, 300); // Reduced from 500ms to 300ms
    return () => clearTimeout(timeoutId);
  }, [query]);

  // Handle manual geocoding for exact addresses
  const handleManualGeocode = async () => {
    if (!query.trim()) return;
    
    try {
      // First try Nominatim
      const nominatimResults = await fetchNominatimSuggestions(query.trim());
      
      if (nominatimResults.length > 0) {
        const result = nominatimResults[0];
        const lat = parseFloat(result.lat);
        const lon = parseFloat(result.lon);
        // Prefer provider-formatted address for consistency
        const formatted = result.display_name as string;
        setQuery(formatted);
        onChange(lat, lon, formatted);
        setSuggestions([]);
        return;
      }
      
      // If Nominatim fails, try Google Places
      const googleResults = await fetchGooglePlacesSuggestions(query.trim());
      if (googleResults.length > 0) {
        // For Google results, we need to geocode the place_id to get coordinates
        try {
          const placeId = googleResults[0].place_id;
          const geocodeResponse = await fetch(`/api/places/geocode?place_id=${placeId}`);
          const geocodeData = await geocodeResponse.json();
          
          if (geocodeData.lat && geocodeData.lon) {
            setQuery(geocodeData.address);
            onChange(geocodeData.lat, geocodeData.lon, geocodeData.address);
            setSuggestions([]);
            return;
          }
        } catch (error) {
          console.error('Google geocoding error:', error);
        }
      }
      
      // If both fail, try broader Nominatim search
      const words = query.trim().split(' ');
      if (words.length > 1) {
        const broaderQuery = words.slice(1).join(' ');
        const broaderResults = await fetchNominatimSuggestions(broaderQuery);
        
        if (broaderResults.length > 0) {
          const result = broaderResults[0];
          const lat = parseFloat(result.lat);
          const lon = parseFloat(result.lon);
          // Keep the original query with house number
          onChange(lat, lon, query.trim());
          setSuggestions([]);
          return;
        }
      }
      
      // If all else fails, keep the address as entered
      onChange(0, 0, query.trim());
      setSuggestions([]);
    } catch (error) {
      console.error("Manual geocoding error:", error);
    }
  };

  // Handle user selecting a suggestion from the dropdown
  const handleSelectSuggestion = async (suggestion: any) => {
    if (suggestion.source === 'google') {
      // Handle Google Places results
      try {
        const geocodeResponse = await fetch(`/api/places/geocode?place_id=${suggestion.place_id}`);
        const geocodeData = await geocodeResponse.json();
        
        if (geocodeData.lat && geocodeData.lon) {
          setQuery(suggestion.display_name);
          setSuggestions([]);
          onChange(geocodeData.lat, geocodeData.lon, geocodeData.address);
          return;
        }
      } catch (error) {
        console.error('Google geocoding error:', error);
      }
    } else {
      // Handle Nominatim results
      const lat = parseFloat(suggestion.lat);
      const lon = parseFloat(suggestion.lon);
      setQuery(suggestion.display_name);
      setSuggestions([]);
      onChange(lat, lon, suggestion.display_name);
    }
  };

  // Allow map clicks to update location
  function LocationMarker() {
    useMapEvents({
      async click(e) {
        try {
          // Reverse geocode to get a formatted address
          const params = new URLSearchParams({
            format: 'json',
            lat: e.latlng.lat.toString(),
            lon: e.latlng.lng.toString(),
            addressdetails: '1'
          });
          const resp = await fetch(`https://nominatim.openstreetmap.org/reverse?${params}`);
          const data = await resp.json();
          const formatted = data?.display_name || query;
          setQuery(formatted);
          onChange(e.latlng.lat, e.latlng.lng, formatted);
        } catch (_err) {
          onChange(e.latlng.lat, e.latlng.lng, query);
        }
      },
    });
    return latitude && longitude ? <Marker position={[latitude, longitude]} /> : null;
  }

  return (
    <div className="relative">
      {/* Search Field with Suggestions Dropdown */}
      <div className="mb-4 relative">
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Search location..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="input input-bordered flex-1"
          />
          <button
            type="button"
            onClick={handleManualGeocode}
            className="btn btn-primary"
            disabled={!query.trim()}
          >
            Find
          </button>
        </div>
        {suggestions.length > 0 && (
          <ul className="absolute z-50 bg-white border border-gray-300 w-full max-h-60 overflow-auto mt-1">
            {suggestions.map((suggestion, index) => (
              <li key={index} onClick={() => handleSelectSuggestion(suggestion)} className="p-2 hover:bg-gray-200 cursor-pointer">
                {suggestion.display_name}
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Map Container */}
      <MapContainer center={[latitude || 51.505, longitude || -0.09]} zoom={13} className="w-full h-64 rounded z-0">
        <TileLayer attribution="&copy; OpenStreetMap contributors" url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        <ChangeMapView coords={[latitude || 51.505, longitude || -0.09]} />
        <LocationMarker />
      </MapContainer>

      {/* Display Selected Coordinates */}
      <div className="mt-2 grid grid-cols-2 gap-2">
        <input type="text" readOnly className="input input-bordered" value={`Lat: ${latitude.toFixed(4)}`} />
        <input type="text" readOnly className="input input-bordered" value={`Lng: ${longitude.toFixed(4)}`} />
      </div>
    </div>
  );
};
