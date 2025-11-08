"use client";
import { useState, useCallback, useEffect, useRef } from "react";
import {
  FaMapMarkerAlt,
  FaArrowLeft,
  FaArrowRight,
  FaStar,
  FaPhoneAlt,
  FaEnvelope,
  FaWineGlass,
  FaDollarSign,
  FaClock,
  FaGlassCheers,
  FaWhatsapp,
  FaUsers,
} from "react-icons/fa";
import { useParams } from "next/navigation";
import { Button } from "@/components/buttons/button";
import { Card } from "@/components/cards/card";
import BookingCalendar from "@/components/booking-calendar";
import { Winery } from "@/app/interfaces";
import Map from "@/components/map";
import { useItinerary } from "@/store/itinerary";
import { toast } from "react-toastify";
import axios from "axios";

const WineryDetail = () => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [userLocation, setUserLocation] = useState<GeolocationCoordinates | null>(null);
  const [selectedTastingIndex, setSelectedTastingIndex] = useState<number>(0);
  const [selectedFoodPairingOption, setSelectedFoodPairingOption] = useState<string | null>(null);
  const [selectedNumberOfPeople, setSelectedNumberOfPeople] = useState<number | string>(1);
  const [selectedSlot, setSelectedSlot] = useState<string>("");
  const { id } = useParams() as { id: string };
  const { itinerary, setItinerary } = useItinerary();
  const [winery, setWinery] = useState<Winery>(undefined as any);
  const hasFetchedWinery = useRef(false);

  // Get current tasting info based on selection
  const currentTastingInfo = winery?.tasting_info?.[selectedTastingIndex];
  
  // Get images from the current tasting or fallback to first tasting
  const currentImages = currentTastingInfo?.images || winery?.tasting_info?.[0]?.images || [];

  const addToItinerary = () => {
    if (!itinerary.includes(id as any)) {
      setItinerary([...itinerary, winery]);
      toast.success(`${winery?.name} added to your itinerary!`);
    } else {
      toast.error("Winery already in itinerary!");
    }
  };

  const handleSlotSelect = (slot: string) => {
    if (currentTastingInfo?.booking_info?.max_guests_per_slot === 0) {
      toast.error("This winery is not accepting bookings at this time.");
      return;
    }

    if (!selectedNumberOfPeople || Number(selectedNumberOfPeople) === 0) {
      toast.error("Please select the number of people before choosing a date.");
      return;
    }

    setSelectedSlot(slot);
    
    // Check if winery is already in itinerary
    const isInItinerary = itinerary.some((w) => (w._id || w.name) === (winery._id || winery.name));
    
    if (!isInItinerary) {
      // Add winery to itinerary with booking details
      const wineryWithBooking = {
        ...winery,
        bookingDetails: {
          selectedDate: new Date(slot).toISOString().split("T")[0],
          selectedTime: slot,
          selectedTastingIndex,
          tasting: true,
          foodPairings: selectedFoodPairingOption 
            ? currentTastingInfo?.food_pairing_options?.filter(fp => fp.name === selectedFoodPairingOption).map(fp => ({ name: fp.name, price: fp.price })) || []
            : [],
          tours: [],
          otherFeature: [],
        },
      };
      setItinerary([...itinerary, wineryWithBooking]);
      toast.success(`${winery?.name} added to your itinerary with selected date!`);
    } else {
      // Update existing winery in itinerary with new slot
      const updatedItinerary = itinerary.map((w) => {
        if ((w._id || w.name) === (winery._id || winery.name)) {
          return {
            ...w,
            bookingDetails: {
              ...w.bookingDetails,
              selectedDate: new Date(slot).toISOString().split("T")[0],
              selectedTime: slot,
              selectedTastingIndex,
            },
          };
        }
        return w;
      });
      setItinerary(updatedItinerary);
      toast.success("Booking date updated!");
    }
  };

  const handleLocationPermission = useCallback(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation(position.coords);
          toast.success("We can now show you directions to the winery.");
        },
        (error) => {
          toast.error("Location error");
        }
      );
    }
  }, []);

  const changeImage = (direction: "next" | "prev") => {
    setCurrentImageIndex((prevIndex) => {
      if (direction === "next") {
        return (prevIndex + 1) % currentImages.length;
      }
      return (prevIndex - 1 + currentImages.length) % currentImages.length;
    });
  };

  useEffect(() => {
    if (!hasFetchedWinery.current) {
      const fetchWinery = async () => {
        try {
          const response = await axios.get(`/api/winery/${id}`);
          console.log("Winery Data:", response.data);
          
          const wineryData = response.data.winery;
          
          // Migrate old payment_method format to new format
          if (typeof wineryData.payment_method === 'string') {
            wineryData.payment_method = { 
              type: wineryData.payment_method,
              external_booking_link: ''
            };
          }
          
          setWinery(wineryData);
          hasFetchedWinery.current = true;
        } catch (error) {
          console.error("Error fetching winery:", error);
        }
      };

      fetchWinery();
    }

    return () => {
      hasFetchedWinery.current = false;
    };
  }, [id]);

  // Persist Number of People selection across refreshes per winery/tasting
  useEffect(() => {
    try {
      const storageKey = `winery:${id}:people:${selectedTastingIndex}`;
      const saved = localStorage.getItem(storageKey);
      if (saved !== null && saved !== undefined) {
        const parsed = parseInt(saved);
        if (!isNaN(parsed)) {
          setSelectedNumberOfPeople(parsed);
        }
      } else {
        // Default to 1 when nothing saved (or 0 if max is 0)
        setSelectedNumberOfPeople(1);
      }
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, selectedTastingIndex]);

  // Sync selectedSlot with itinerary if winery is already in itinerary
  useEffect(() => {
    if (winery) {
      const wineryInItinerary = itinerary.find((w) => (w._id || w.name) === (winery._id || winery.name));
      if (wineryInItinerary?.bookingDetails?.selectedTime) {
        setSelectedSlot(wineryInItinerary.bookingDetails.selectedTime);
      }
    }
  }, [itinerary, winery]);

  if (!winery) {
    return <div>Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-wine-background md:top-20 top-16 relative">
      {/* Hero Section */}
      <div className="relative h-[80vh] overflow-hidden">
        {currentImages.length > 0 ? (
          <img src={currentImages[currentImageIndex]} alt={winery.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-gray-300 flex items-center justify-center">
            <span className="text-gray-500">No images available</span>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/30 to-black/50 flex items-center justify-center">
          <div className="text-center text-white max-w-4xl px-4">
            <h1 className="font-serif text-6xl mb-6 leading-tight">{winery.name}</h1>
            <p className="text-xl max-w-2xl mx-auto font-light leading-relaxed">{winery.description}</p>
            <div className="mt-8">
              <Button className="bg-wine-primary hover:bg-wine-primary/90 text-white px-8 py-6 text-lg" onClick={addToItinerary}>
                Add to Itinerary
              </Button>
            </div>
          </div>
        </div>
        {currentImages.length > 1 && (
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex space-x-4">
            <Button
              variant="outline"
              size="icon"
              onClick={() => changeImage("prev")}
              className="bg-white/80 hover:bg-white backdrop-blur-sm"
            >
              <FaArrowLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => changeImage("next")}
              className="bg-white/80 hover:bg-white backdrop-blur-sm"
            >
              <FaArrowRight className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>

      {/* Content Section */}
      <div className="max-w-7xl mx-auto px-4 py-16 space-y-16">
        {/* Multiple Tasting Selection */}
        {winery.tasting_info && winery.tasting_info.length > 1 && (
          <div className="bg-white rounded-xl p-8 shadow-lg">
            <h2 className="font-serif text-3xl mb-6 text-wine-primary">Choose Your Tasting Experience</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {winery.tasting_info.map((tasting, index) => (
                <Card 
                  key={index} 
                  className={`p-6 cursor-pointer transition-all duration-300 hover:shadow-lg ${
                    selectedTastingIndex === index ? 'ring-2 ring-wine-primary bg-wine-primary/5' : ''
                  }`}
                  onClick={() => setSelectedTastingIndex(index)}
                >
                  <h3 className="font-serif text-xl mb-3 text-wine-primary">{tasting.tasting_title}</h3>
                  <p className="text-gray-600 mb-4 text-sm">{tasting.tasting_description}</p>
                  <div className="space-y-2 text-sm">
                    <p className="font-semibold text-lg">${tasting.tasting_price.toFixed(2)}</p>
                    <p className="text-gray-500">{tasting.number_of_wines_per_tasting} wines included</p>
                    <p className="text-gray-500">{tasting.ava}</p>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Quick Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="p-6 hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-wine-primary/10 rounded-full">
                <FaWineGlass className="h-6 w-6 text-wine-primary" />
              </div>
              <div>
                <h3 className="font-serif text-lg mb-1">Wine Types</h3>
                <p className="text-gray-600 text-sm capitalize">{currentTastingInfo?.wine_types?.join(", ") || "N/A"}</p>
              </div>
            </div>
          </Card>
          <Card className="p-6 hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-wine-primary/10 rounded-full">
                <FaClock className="h-6 w-6 text-wine-primary" />
              </div>
              <div>
                <h3 className="font-serif text-lg mb-1">Times</h3>
                <p className="text-gray-600 text-sm capitalize">{currentTastingInfo?.available_times?.join(", ") || "N/A"}</p>
              </div>
            </div>
          </Card>
          <Card className="p-6 hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-wine-primary/10 rounded-full">
                <FaDollarSign className="h-6 w-6 text-wine-primary" />
              </div>
              <div>
                <h3 className="font-serif text-lg mb-1">Price</h3>
                <p className="text-gray-600 text-sm">${currentTastingInfo?.tasting_price?.toFixed(2) ?? "N/A"}</p>
              </div>
            </div>
          </Card>
          <Card className="p-6 hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-wine-primary/10 rounded-full">
                <FaMapMarkerAlt className="h-6 w-6 text-wine-primary" />
              </div>
              <div>
                <h3 className="font-serif text-lg mb-1">Location</h3>
                <p className="text-gray-600 text-sm">{currentTastingInfo?.ava}</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Form Data Section */}
        <div className="bg-white rounded-lg p-8 shadow-lg">
          <h2 className="font-serif text-3xl mb-6 text-wine-primary">Featured Wine</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Wine Section */}
            <div>
              <h3 className="font-serif text-xl mb-4">Wine</h3>
              {currentTastingInfo?.wine_details?.map((wine, index) => (
                <div key={wine.id} className="mb-4">
                  {wine.photo && /^https?:\/\//.test(wine.photo) && (
                    <div className="mb-4">
                      <img 
                        src={wine.photo} 
                        alt={wine.name}
                        className="w-full h-48 object-cover rounded-lg shadow-md"
                      />
                    </div>
                  )}
                  <p>
                    <strong>Wine Name:</strong> {wine.name}
                  </p>
                  <p>
                    <strong>Wine Description:</strong> {wine.description}
                  </p>
                </div>
              )) || <p className="text-gray-500">No wine details available</p>}
            </div>

            {/* Tour Options Section */}
            {currentTastingInfo?.tours?.tour_options && currentTastingInfo.tours.tour_options.length > 0 && (
              <div>
                <h3 className="font-serif text-xl mb-4">Tour Options</h3>
                {currentTastingInfo.tours.tour_options.map((tour, index) => (
                  <div key={index + 1} className="mb-4">
                    <p>
                      <strong>Tour Option:</strong> {tour.description}
                    </p>
                    <p>
                      <strong>Tour Cost:</strong> ${tour.cost}
                    </p>
                  </div>
                ))}
              </div>
            )}

            {/* Additional Guests Section */}
            {currentTastingInfo?.other_features && currentTastingInfo.other_features.length > 0 && (
              <div>
                <h3 className="font-serif text-xl mb-4">Other Features</h3>
                {currentTastingInfo.other_features.map((feature, index) => (
                  <div key={index + 1} className="mb-4">
                    <p>
                      <strong>Feature:</strong> {feature.description}
                    </p>
                    <p>
                      <strong>Feature Cost:</strong> ${feature.cost}
                    </p>
                  </div>
                ))}
              </div>
            )}

            {/* Food Pairings Section */}
            {currentTastingInfo?.food_pairing_options && currentTastingInfo.food_pairing_options.length > 0 && (
              <div>
                <h3 className="font-serif text-xl mb-4">Food Pairings</h3>
                {currentTastingInfo.food_pairing_options.map((pairing, index) => (
                  <div key={index + 1} className="mb-4">
                    <p>
                      <strong>Food Pairing:</strong> {pairing.name}
                    </p>
                    <p>
                      <strong>Price:</strong> ${pairing.price}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Tasting Experience Section */}
        <div className="bg-white rounded-xl p-8 shadow-lg">
          <div className="flex items-center gap-3 mb-8">
            <FaGlassCheers className="h-8 w-8 text-wine-primary" />
            <h2 className="font-serif text-3xl text-wine-primary">Tasting Experience</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <Card className="p-6">
              <h3 className="font-serif text-xl mb-4">What to Expect</h3>
              <div className="space-y-4">
                <p className="flex items-center gap-2">
                  <FaWineGlass className="text-wine-primary" />
                  <span>{currentTastingInfo?.number_of_wines_per_tasting} wines per tasting</span>
                </p>
                <p className="flex items-center gap-2">
                  <FaUsers className="text-wine-primary" />
                  <span>Group size: {currentTastingInfo?.booking_info?.number_of_people?.join('-') || "N/A"} people</span>
                </p>
                <div>
                  <h4 className="font-medium mb-3">Special Features:</h4>
                  <div className="flex flex-wrap gap-2">
                    {currentTastingInfo?.special_features?.map((feature, index) => (
                      <span
                        key={index}
                        className="bg-wine-primary/10 text-wine-primary px-4 py-2 rounded-full text-sm font-medium"
                      >
                        {feature}
                      </span>
                    )) || <span className="text-gray-500">No special features</span>}
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>

        {/* Book a Tasting Section */}
        <div className="bg-white rounded-lg p-8 shadow-lg">
          <h2 className="font-serif text-3xl mb-6 text-wine-primary">Book a Tasting</h2>
          <div className="space-y-6">
            {/* Food Pairing Option Selection */}
            {!currentTastingInfo?.booking_info?.external_booking_link && (
            <div>
              <label className="text-sm text-gray-900 font-extrabold">Select Food Pairing (Optional)</label>
              <select
                value={selectedFoodPairingOption || ""}
                onChange={(e) => setSelectedFoodPairingOption(e.target.value)}
                className="select select-bordered w-full mt-2 text-sm"
              >
                <option value="">No food pairing</option>
                {currentTastingInfo?.food_pairing_options?.map((option) => (
                  <option key={option.name} value={option.name} data-price={option.price}>
                    {option.name} (${option.price.toFixed(2)})
                  </option>
                ))}
              </select>
            </div>
            )}

            {/* Number of People Selection */}
            {!currentTastingInfo?.booking_info?.external_booking_link && (
            <div>
              <label className="text-sm text-gray-900 font-extrabold">Number of People</label>
              <input
                type="number"
                min={0}
                max={currentTastingInfo?.booking_info?.max_guests_per_slot || 20}
                value={selectedNumberOfPeople}
                onChange={(e) => {
                  const value = e.target.value;
                  if (value === '') {
                    setSelectedNumberOfPeople('');
                  } else {
                    const numValue = parseInt(value);
                    if (!isNaN(numValue) && numValue >= 0) {
                      setSelectedNumberOfPeople(numValue);
                      try {
                        const storageKey = `winery:${id}:people:${selectedTastingIndex}`;
                        localStorage.setItem(storageKey, String(numValue));
                      } catch {}
                    }
                  }
                }}
                className="input input-bordered w-full mt-2 text-sm"
              />
            </div>
            )}

            {/* External Booking Link */}
            {currentTastingInfo?.booking_info?.external_booking_link && (
              <div>
                <Button
                  className="bg-wine-primary hover:bg-wine-primary/90 text-white w-full py-6 text-lg"
                  onClick={() => window.open(currentTastingInfo.booking_info.external_booking_link, "_blank")}
                >
                  Book via External Site
                </Button>
              </div>
            )}

            {/* Booking Calendar */}
            {!currentTastingInfo?.booking_info?.external_booking_link && (
              <BookingCalendar
                slots={currentTastingInfo?.booking_info?.available_slots}
                maxGuests={currentTastingInfo?.booking_info?.max_guests_per_slot}
                weekendMultiplier={currentTastingInfo?.booking_info?.dynamic_pricing?.weekend_multiplier}
                onSlotSelect={handleSlotSelect}
                selectedSlot={selectedSlot}
              />
            )}
          </div>
        </div>

        {/* Reviews Section */}
        <div className="bg-white rounded-xl p-8 shadow-lg">
          <h2 className="font-serif text-3xl mb-8 text-wine-primary flex items-center gap-3">
            <FaStar className="h-7 w-7" />
            Guest Reviews
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {winery?.user_reviews.map((review) => (
              <Card key={review.review_id} className="p-6 hover:shadow-lg transition-all">
                <div className="flex items-center space-x-2 mb-4">
                  <div className="flex items-center">
                    {[...Array(5)].map((_, i) => (
                      <FaStar
                        key={i}
                        className={`h-5 w-5 ${i < Math.floor(review.rating) ? "text-wine-secondary" : "text-gray-300"}`}
                      />
                    ))}
                  </div>
                  <span className="font-medium ml-2">{review.rating.toFixed(1)}</span>
                </div>
                <p className="text-gray-600 italic">{review.comment}</p>
              </Card>
            ))}
          </div>
        </div>

        {/* Contact & Directions Section */}
        <div className="bg-white rounded-xl p-8 shadow-lg">
          <h2 className="font-serif text-3xl mb-8 text-wine-primary">Contact & Directions</h2>
          
          {/* Hours of Operation */}
          <div className="mb-8">
            <h3 className="font-serif text-2xl mb-4 text-wine-primary">Hours of Operation</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
            <div className="space-y-6 ">
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-wine-primary/10 rounded-full">
                  <FaPhoneAlt className="h-5 w-5 text-wine-primary" />
                </div>
                <div>
                  <h3 className="font-serif text-xl mb-1">Phone</h3>
                  <p className="text-gray-600">{winery?.contact_info.phone}</p>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-wine-primary/10 rounded-full">
                  <FaEnvelope className="h-5 w-5 text-wine-primary" />
                </div>
                <div className="break-all">
                  <h3 className="font-serif text-xl mb-1">Email</h3>
                  <p className="text-gray-600">{winery?.contact_info.email}</p>
                </div>
              </div>
              {winery?.contact_info.phone && (
                <a
                  href={`https://wa.me/${winery?.contact_info.phone.replace(/\D/g, "")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center space-x-4"
                >
                  <div className="p-3 bg-wine-primary/10 rounded-full">
                    <FaWhatsapp className="h-5 w-5 text-wine-primary" />
                  </div>
                  <div>
                    <h3 className="font-serif text-xl mb-1">WhatsApp</h3>
                    <p className="text-gray-600">Chat with us</p>
                  </div>
                </a>
              )}
            </div>
            <div className="flex flex-col justify-center">
              <Button
                onClick={handleLocationPermission}
                className="bg-wine-primary hover:bg-wine-primary/90 text-white w-full py-6 text-lg"
              >
                Get Directions
              </Button>
              {userLocation && (
                <p className="text-center mt-4 text-gray-600">
                  {winery?.transportation.distance_from_user.toFixed(1)} miles away
                </p>
              )}
            </div>
          </div>
          {userLocation && <Map userLocation={userLocation} wineryLocation={winery?.location} />}
        </div>
      </div>
    </div>
  );
};

export default WineryDetail;
