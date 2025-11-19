"use client";
import { useEffect, useState } from "react";
import { useItinerary, BookingData, ItineraryWinery } from "@/store/itinerary";
import AuthModal from "@/components/modal/AuthModal";
import { Car, Loader2, Wine } from "lucide-react";
import { Button } from "@/components/buttons/button";
import Modal from "@/components/modal";
import { useRouter } from "next/navigation";
import WineryBookingCard from "@/components/cards/winery";
import axios from "axios";
import { useAuthStore } from "@/store/authStore";
import { loadStripe } from "@stripe/stripe-js";
import { isUser21OrOlder } from "@/lib/ageVerification";
import { toast } from "react-toastify";
import DateOfBirthModal from "@/components/modal/DateOfBirthModal";

// Initialize Stripe with your publishable key
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || "");

export default function ItineraryPage() {
  const [isLottieLoaded, setIsLottieLoaded] = useState(false);
  const { itinerary, setItinerary } = useItinerary();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showRideModal, setShowRideModal] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [loadingLocation, setLoadingLocation] = useState(false);
  const [loadingPayment, setLoadingPayment] = useState(false);
  const [showDateOfBirthModal, setShowDateOfBirthModal] = useState(false);
  const { user } = useAuthStore();
  const router = useRouter();

  const handleUpdate = (id: string, data: BookingData) => {
    const updatedItinerary = itinerary.map((winery) => {
      if ((winery._id || winery.name) === id) {
        // Only update if bookingDetails has changed
        if (JSON.stringify(winery.bookingDetails) !== JSON.stringify(data)) {
          return { ...winery, bookingDetails: data };
        }
      }
      return winery;
    });

    // Only call setItinerary if there are actual changes
    if (JSON.stringify(updatedItinerary) !== JSON.stringify(itinerary)) {
      setItinerary(updatedItinerary);
    }
  };

  const handleRemove = (id: string) => setItinerary(itinerary.filter((winery) => winery._id !== id));

  const handleClearAll = () => {
    setShowRideModal(false);
    setItinerary([]);
  };

  const getUserLocation = async () => {
    setLoadingLocation(true);
    return new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const location = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          };
          setCurrentLocation(location);
          setLoadingLocation(false);
          resolve(location);
        },
        (error) => {
          setLoadingLocation(false);
          reject(error);
        }
      );
    });
  };
const handleConfirmBooking = async () => {
  console.log("Starting confirmation process...");
  console.log("User:", user);
  console.log("Itinerary:", itinerary);
  
  if (!user) {
    console.log("No user found, showing auth modal");
    return setShowAuthModal(true);
  }

  // Check age verification for alcohol-related bookings
  console.log("Checking age verification...");
  console.log("User date of birth:", user.dateOfBirth);
  
  if (user.dateOfBirth && !isUser21OrOlder(user.dateOfBirth)) {
    console.log("User is under 21, blocking booking");
    toast.error("You must be 21 or older to book wine tastings and alcohol-related services.");
    return;
  } else if (!user.dateOfBirth) {
    console.log("User has no date of birth, showing age verification modal");
    setShowDateOfBirthModal(true);
    return;
  }

  console.log("Age verification passed");

  const data = itinerary.map((winery) => {
    const selectedTastingIndex = winery.bookingDetails?.selectedTastingIndex || 0;
    const currentTastingInfo = winery.tasting_info?.[selectedTastingIndex];
    
    return {
      wineryId: winery._id,
      dateTime: winery.bookingDetails?.selectedTime,
      tastingIndex: selectedTastingIndex,
      tasting: winery.bookingDetails?.tasting && currentTastingInfo?.tasting_price ? currentTastingInfo.tasting_price : null,
      foodPairings: winery.bookingDetails?.foodPairings || [],
    };
  });

  try {
    console.log("Itinerary data:", itinerary);
    console.log("Payment methods:", itinerary.map(w => ({ name: w.name, payment_method: w.payment_method })));
    
    const requiresStripe = itinerary.some((winery) => winery?.payment_method?.type === "pay_stripe");
    const hasExternalBooking = itinerary.some((winery) => winery?.payment_method?.type === "external_booking");
    
    console.log("Requires Stripe:", requiresStripe);
    console.log("Has External Booking:", hasExternalBooking);

    if (requiresStripe) {
      setLoadingPayment(true);
      const lineItems = itinerary
        .filter((winery) => winery?.payment_method?.type === "pay_stripe")
        .map((winery) => {
          let totalCost = 0;
          const items = [];
          const selectedTastingIndex = winery.bookingDetails?.selectedTastingIndex || 0;
          const currentTastingInfo = winery.tasting_info?.[selectedTastingIndex];

          // Add tasting price if selected
          if (currentTastingInfo?.tasting_price) {
            totalCost += currentTastingInfo.tasting_price;
          }

          // Add food pairing prices
          if (winery.bookingDetails?.foodPairings?.length) {
            totalCost += winery.bookingDetails.foodPairings.reduce((sum, foodItem) => {
              return foodItem.price ? sum + foodItem.price : sum;
            }, 0);
          }

          // Add tour prices
          if (winery.bookingDetails?.tours?.length) {
            totalCost += winery.bookingDetails.tours.reduce((sum, tour) => {
              return tour.price ? sum + tour.price : sum;
            }, 0);
          }

          // Add other features prices
          if (winery.bookingDetails?.otherFeature?.length) {
            totalCost += winery.bookingDetails.otherFeature.reduce((sum, feature) => {
              return feature.price ? sum + feature.price : sum;
            }, 0);
          }

          // Create a single line item if there's a cost
          if (totalCost > 0) {
            items.push({
              price_data: {
                currency: "usd",
                product_data: {
                  name: `${winery.name} - ${currentTastingInfo?.tasting_title || 'Booking'} (Tasting & Food Pairings)`,
                },
                unit_amount: Math.round(totalCost * 100), // Convert to cents
              },
              quantity: 1,
            });
          }

          return items;
        })
        .flat();

      // Validate lineItems
      if (!lineItems.length) {
        console.error("No valid line items for Stripe checkout. Itinerary:", itinerary);
        throw new Error("No items selected for payment. Please add a tasting or food pairing.");
      }

      const response = await axios.post("/api/stripe/create-checkout-session", {
        line_items: lineItems,
        success_url: `${window.location.origin}/itinerary?success=true`,
        cancel_url: `${window.location.origin}/itinerary?cancel=true`,
        metadata: { itinerary: JSON.stringify(data) },
        bookData: data,
      });

      const { sessionId } = response.data;
      const stripe = await stripePromise;
      if (stripe) {
        await stripe.redirectToCheckout({ sessionId });
      } else {
        throw new Error("Stripe failed to initialize");
      }
    } else {
      // Check if any wineries use external booking links
      // Check both payment_method level and tasting booking_info level
      const hasExternalBooking = itinerary.some((winery) => {
        const selectedTastingIndex = winery.bookingDetails?.selectedTastingIndex || 0;
        const currentTastingInfo = winery.tasting_info?.[selectedTastingIndex];
        return winery?.payment_method?.type === "external_booking" || 
               !!currentTastingInfo?.booking_info?.external_booking_link;
      });
      
      if (hasExternalBooking) {
        // Handle external booking links
        // Find the first winery with an external booking link
        const firstExternalBooking = itinerary.find((winery) => {
          const selectedTastingIndex = winery.bookingDetails?.selectedTastingIndex || 0;
          const currentTastingInfo = winery.tasting_info?.[selectedTastingIndex];
          return winery?.payment_method?.type === "external_booking" || 
                 !!currentTastingInfo?.booking_info?.external_booking_link;
        });
        
        if (firstExternalBooking) {
          const selectedTastingIndex = firstExternalBooking.bookingDetails?.selectedTastingIndex || 0;
          const currentTastingInfo = firstExternalBooking.tasting_info?.[selectedTastingIndex];
          
          // Get external link from either payment_method or booking_info
          const externalLink = firstExternalBooking.payment_method?.external_booking_link || 
                               currentTastingInfo?.booking_info?.external_booking_link;
          
          if (externalLink && externalLink !== '#' && externalLink.trim() !== '') {
            // Validate and format the URL
            let validUrl: string;
            try {
              const url = new URL(externalLink);
              validUrl = url.toString();
            } catch {
              // If it's not a valid absolute URL, try to construct one
              if (externalLink.startsWith('/')) {
                toast.error('Invalid external booking link. Please contact the winery for booking information.');
                return;
              } else {
                // Try to add protocol if missing
                validUrl = externalLink.startsWith('http') ? externalLink : `https://${externalLink}`;
              }
            }
            
            // Still send confirmation to our system (no payment processing)
            await axios.post("/api/itinerary/book", { data });
            toast.success("Booking confirmed! Redirecting to winery booking page...");
            window.open(validUrl, '_blank', 'noopener,noreferrer');
            return;
          }
        }
      }
      
      // Pay at winery - no payment processing needed
      console.log("Processing pay at winery booking...");
      const response = await axios.post("/api/itinerary/book", { data });
      console.log("Booking response:", response);
      if (response.status === 201) {
        console.log("Booking successful, showing ride modal");
        setShowRideModal(true);
      }
    }
  } catch (error: any) {
    console.error("Booking error:", error);
    if (error.response?.status === 404) {
      alert("Payment processing is currently unavailable. Please try again later or contact support.");
    } else if (error.message.includes("Stripe")) {
      alert("Failed to initialize payment. Please check your connection and try again.");
    } else if (error.message.includes("No items selected")) {
      alert(error.message);
    } else {
      alert("Failed to process booking. Please try again later.");
    }
  } finally {
    setLoadingPayment(false);
  }
};

  const handleDateOfBirthSuccess = () => {
    // Retry the booking process after date of birth is updated
    handleConfirmBooking();
  };

  const handleRideClick = async (service: "uber" | "lyft") => {
    if (!currentLocation) {
      try {
        const location: any = await getUserLocation();
        openRideLink(service, location);
      } catch {
        alert("Location access denied. Unable to book ride.");
      }
    } else {
      openRideLink(service, currentLocation);
    }
  };

  const openRideLink = (service: "uber" | "lyft", location: { latitude: number; longitude: number }) => {
    const earliestWinery = itinerary[0];
    if (!earliestWinery || !earliestWinery.location) {
      toast.error("Winery location not available. Unable to book ride.");
      return;
    }

    // Validate location coordinates
    if (!location.latitude || !location.longitude || isNaN(location.latitude) || isNaN(location.longitude)) {
      toast.error("Invalid location coordinates. Please enable location access.");
      return;
    }

    if (!earliestWinery.location.latitude || !earliestWinery.location.longitude || 
        isNaN(earliestWinery.location.latitude) || isNaN(earliestWinery.location.longitude)) {
      toast.error("Invalid winery location. Unable to book ride.");
      return;
    }

    let rideURL = "";
    try {
      if (service === "uber") {
        // Construct Uber URL - coordinates don't need encoding, just ensure they're numbers
        const pickupLat = location.latitude;
        const pickupLng = location.longitude;
        const dropoffLat = earliestWinery.location.latitude;
        const dropoffLng = earliestWinery.location.longitude;
        
        // Use literal square brackets as Uber expects them in parameter names
        rideURL = `https://m.uber.com/ul/?action=setPickup&pickup[latitude]=${pickupLat}&pickup[longitude]=${pickupLng}&dropoff[latitude]=${dropoffLat}&dropoff[longitude]=${dropoffLng}`;
      } else if (service === "lyft") {
        const pickupLat = location.latitude;
        const pickupLng = location.longitude;
        const destination = earliestWinery.location.address ? encodeURIComponent(earliestWinery.location.address) : "";
        
        rideURL = `https://ride.lyft.com/?id=lyft&pickup[latitude]=${pickupLat}&pickup[longitude]=${pickupLng}${destination ? `&destination=${destination}` : ""}`;
      }
      
      if (rideURL) {
        console.log("Opening ride URL:", rideURL);
        // Create an anchor element and click it - this avoids popup blockers
        const link = document.createElement("a");
        link.href = rideURL;
        link.target = "_blank";
        link.rel = "noopener noreferrer";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else {
        toast.error("Failed to generate ride URL. Please try again.");
      }
    } catch (error) {
      console.error("Error constructing ride URL:", error);
      toast.error("Failed to open ride booking. Please try again.");
    }
  };

  // Sort itinerary without causing infinite loop
  useEffect(() => {
    const sortedItinerary = [...itinerary].sort((a, b) => {
      const timeA = a.bookingDetails?.selectedTime ? new Date(a.bookingDetails.selectedTime).getTime() : Infinity;
      const timeB = b.bookingDetails?.selectedTime ? new Date(b.bookingDetails.selectedTime).getTime() : Infinity;
      return timeA - timeB;
    });
    // Only update if the order has changed to prevent infinite loop
    if (JSON.stringify(sortedItinerary) !== JSON.stringify(itinerary)) {
      setItinerary(sortedItinerary);
    }
  }, [itinerary, setItinerary]);

  return (
    <div className="bg-gray-100 min-h-screen py-12 px-4 sm:px-6 lg:px-8 relative md:top-10 top-5">
      <div className="max-w-7xl mx-auto">
        <h1 className="md:text-2xl font-bold text-gray-900">Your Itinerary</h1>
        <p className="text-gray-600 mb-4 md:text-md text-sm">Plan your perfect wine-tasting experience.</p>

        {itinerary.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-80 text-center text-gray-500">
            <Wine size={50} className="text-gray-400 mb-4" />
            <p className="text-lg font-semibold">Your itinerary is empty</p>
            <p className="text-sm text-gray-600">Start adding wineries to create your perfect wine tour!</p>
            <Button variant="secondary" className="mt-4" onClick={() => router.push("/")}>
              Browse Wineries
            </Button>
          </div>
        ) : (
          <div className="flex gap-10 flex-wrap lg:flex-nowrap mb-10">
            <div className="lg:w-4/5 w-full">
              {itinerary.map((winery) => (
                <div key={winery._id || winery.name} className="mb-4 w-full">
                  <WineryBookingCard winery={winery} onUpdate={handleUpdate} onRemove={handleRemove} />
                </div>
              ))}
            </div>

            <div className="lg:w-2/5 w-full">
              <div className="flex gap-4 mt-6">
                <Button variant="destructive" onClick={handleClearAll}>
                  Clear All
                </Button>
                <Button onClick={() => router.push("/")} variant="outline">
                  Back to Wineries
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>

      <Modal
        isOpen={showRideModal}
        onClose={() => {
          setShowRideModal(false);
          handleClearAll();
        }}
      >
        <div className="flex flex-col items-center p-0">
          {!isLottieLoaded && <Loader2 className="w-8 h-8 text-gray-500 animate-spin mb-4" />}
          <iframe
            src="https://lottie.host/embed/303f3d0b-e50a-4592-894a-474164e44c5d/f4rpyUChZF.lottie"
            className={`transition-opacity duration-300 ${isLottieLoaded ? "opacity-100" : "opacity-0"}`}
            onLoad={() => setIsLottieLoaded(true)}
          ></iframe>

          {isLottieLoaded && (
            <>
              <h2 className="lg:text-2xl text-xl font-bold text-gray-900 mt-4 text-center">Your Wine Tour is Confirmed! 🍷</h2>
              <p className="text-gray-600 mt-2 text-center">
                You’ve successfully planned your winery itinerary. Get ready to explore amazing wineries and enjoy premium
                tastings!
              </p>

              <p className="text-gray-500 text-sm mt-4 text-center">
                A confirmation email has been sent to <strong>{user?.email || "your email"}</strong> with all your booking
                details. Be sure to check your schedule and arrive on time for your reservations.
              </p>

              <div className="border-t w-full my-4"></div>

              <h3 className="text-lg font-semibold text-gray-900 text-left w-full">What’s Next?</h3>
              <ul className="text-gray-600 text-sm mt-2 space-y-2 text-left w-full">
                <li>📍 Review your itinerary details in your email.</li>
                <li>🍷 Make sure to bring your ID if required by the wineries.</li>
                <li>🚗 Need a ride? Book an Uber or Lyft below.</li>
                <li>📸 Don’t forget to take pictures and share your experience!</li>
              </ul>

              <div className="flex gap-4 mt-6">
                <Button onClick={() => handleRideClick("uber")} className="bg-black text-white">
                  🚗 Book an Uber
                </Button>
                <Button onClick={() => handleRideClick("lyft")} className="bg-[#FF00BF] text-white">
                  🚖 Book a Lyft
                </Button>
              </div>
            </>
          )}
        </div>
      </Modal>

      {showAuthModal && <AuthModal setShowPopup={setShowAuthModal} showLoginForm={true} />}
      <DateOfBirthModal 
        isOpen={showDateOfBirthModal}
        onClose={() => setShowDateOfBirthModal(false)}
        onSuccess={handleDateOfBirthSuccess}
      />
    </div>
  );
}
