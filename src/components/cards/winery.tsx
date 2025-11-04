"use client";
import { useEffect, useState } from "react";
import { Winery } from "@/app/interfaces";
import { BookingData } from "@/store/itinerary";

interface WineryCardProps {
  winery: Winery;
  onUpdate: (id: string, data: BookingData) => void;
  onRemove: (id: string) => void;
}

export default function WineryBookingCard({ winery, onUpdate, onRemove }: WineryCardProps) {
  // Get the first tasting info for backward compatibility, or use the first one from the array
  const primaryTastingInfo = winery.tasting_info?.[0] || winery.tasting_info;
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [selectedTime, setSelectedTime] = useState<string>("");
  const [selectedTastingIndex, setSelectedTastingIndex] = useState<number>(0);
  const [availableTimes, setAvailableTimes] = useState<string[]>([]);
  const [selections, setSelections] = useState({
    tasting: true, // Auto-select tasting by default
    foodPairings: [] as { name: string; price: number }[],
    tours: [] as { description: string; price: number }[],
    otherFeature: [] as { description: string; price: number }[],
  });

  // Get current tasting info based on selection
  const currentTastingInfo = winery.tasting_info?.[selectedTastingIndex] || primaryTastingInfo;
  
  // Get available slots from the currently selected tasting
  const availableSlots = currentTastingInfo?.booking_info?.available_slots || [];
  const uniqueDatesSet = new Set(availableSlots.map((slot) => new Date(slot).toISOString().split("T")[0]));
  const availableDates = Array.from(uniqueDatesSet).sort();
  const minDate = availableDates.length > 0 ? availableDates[0] : "";
  const maxDate = availableDates.length > 0 ? availableDates[availableDates.length - 1] : "";
  const initialDate = availableDates.length > 0 ? availableDates[0] : "";

  // Update selected date when available dates change
  useEffect(() => {
    if (availableDates.length > 0 && !availableDates.includes(selectedDate)) {
      setSelectedDate(initialDate);
    }
  }, [availableDates, selectedDate, initialDate]);

  useEffect(() => {
    if (selectedDate) {
      const timesForDate = availableSlots
        .filter((slot) => new Date(slot).toISOString().split("T")[0] === selectedDate)
        .sort((a, b) => new Date(a).getTime() - new Date(b).getTime());
      setAvailableTimes(timesForDate);
      if (!timesForDate.includes(selectedTime)) {
        setSelectedTime(timesForDate[0] || "");
      }
    } else {
      setAvailableTimes([]);
      setSelectedTime("");
    }
  }, [selectedDate, availableSlots, selectedTime]);

  useEffect(() => {
    onUpdate(winery._id || winery.name, {
      selectedDate,
      selectedTime,
      selectedTastingIndex,
      tasting: selections.tasting,
      foodPairings: selections.foodPairings,
      tours: selections.tours || [],
      otherFeature: selections.otherFeature || [],
    });
  }, [selectedDate, selectedTime, selectedTastingIndex, selections, winery._id, winery.name, onUpdate]);

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const dateValue = e.target.value;
    if (availableDates.includes(dateValue)) {
      setSelectedDate(dateValue);
    } else {
      alert("Selected date is not available for booking.");
      setSelectedDate(initialDate);
    }
  };

  const handleSelectionChange = (key: "tasting", value: boolean) => {
    setSelections((prev) => ({ ...prev, [key]: value }));
  };

  const handleFoodPairingChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedValue = e.target.value;

    if (!selectedValue) {
      setSelections((prev) => ({ ...prev, foodPairings: [] }));
      return;
    }

    const selectedOptions = Array.from(e.target.selectedOptions, (option) => ({
      name: option.value,
      price: Number(option.dataset.price) || 0,
    }));

    setSelections((prev) => ({ ...prev, foodPairings: selectedOptions }));
  };

  const handleTourChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedValue = e.target.value;

    if (!selectedValue) {
      setSelections((prev) => ({ ...prev, tours: [] }));
      return;
    }

    const selectedOptions = Array.from(e.target.selectedOptions, (option) => ({
      description: option.value,
      price: Number(option.dataset.price) || 0,
    }));

    setSelections((prev) => ({ ...prev, tours: selectedOptions }));
  };

  const handleChangeOther = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedValue = e.target.value;

    if (!selectedValue) {
      setSelections((prev) => ({ ...prev, otherFeature: [] }));
      return;
    }

    const selectedOptions = Array.from(e.target.selectedOptions, (option) => ({
      description: option.value,
      price: Number(option.dataset.price) || 0,
    }));

    setSelections((prev) => ({ ...prev, otherFeature: selectedOptions }));
  };

  useEffect(() => {
    setSelections((prev) => ({ ...prev, foodPairings: [], tours: [], otherFeature: [] }));
  }, [currentTastingInfo]);

  const hasExternal = !!currentTastingInfo?.booking_info?.external_booking_link || winery?.payment_method?.type === 'external_booking';

  return (
    <div className="card shadow-sm bg-white rounded-xl p-4 md:p-6 flex flex-col md:flex-row gap-4 items-start w-full">
      <div className="flex-grow bg-white w-full">
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-semibold text-gray-800 truncate">{winery.name}</h2>
          <button
            onClick={() => onRemove(winery._id || winery.name)}
            className="text-red-500 text-sm hover:text-red-600 transition"
          >
            Remove
          </button>
        </div>
        <p className="text-xs text-gray-500">{winery.location?.address ?? "Address not available"}</p>

        {/* Multiple Tasting Selection */}
        {winery.tasting_info && winery.tasting_info.length > 1 && (
          <div className="mt-2">
            <label className="block text-xs font-medium text-gray-600">Select Tasting Experience</label>
            <select
              className="w-full text-sm rounded-md h-10 p-2 box-border"
              value={selectedTastingIndex}
              onChange={(e) => {
                const newIndex = Number(e.target.value);
                setSelectedTastingIndex(newIndex);
                // Reset date and time when tasting changes
                setSelectedDate("");
                setSelectedTime("");
              }}
            >
              {winery.tasting_info.map((tasting, index) => (
                <option key={index} value={index}>
                  {tasting.tasting_title} - ${tasting.tasting_price.toFixed(2)}
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="flex items-center justify-between text-sm text-gray-700 mt-2 gap-2">
          <span className="flex items-center gap-1">
            ✅ Tasting: ${currentTastingInfo?.tasting_price?.toFixed(2) ?? "N/A"} (Selected)
          </span>
          <span className="flex items-center gap-1">
            ⏰ {currentTastingInfo?.available_times?.slice(0, 3).join(", ") ?? "No times available"}
            {currentTastingInfo?.available_times?.length > 3 && "..."}
          </span>
        </div>

        <div className="mt-4 flex flex-wrap md:flex-nowrap gap-4">
          {hasExternal ? (
            <div className="w-full">
              <a
                href={currentTastingInfo?.booking_info?.external_booking_link || '#'}
                target="_blank"
                rel="noopener noreferrer"
                className="btn bg-wine-primary text-white w-full"
              >
                Book via External Site
              </a>
            </div>
          ) : (
            <>
          <div className="w-full md:w-1/3">
            <label className="block text-xs font-medium text-gray-600">Date</label>
            <input
              type="date"
              value={selectedDate}
              onChange={handleDateChange}
              min={minDate}
              max={maxDate}
              className="w-full text-sm rounded-md h-10 p-2 box-border"
              disabled={availableDates.length === 0}
            />
          </div>

          <div className="w-full md:w-1/3">
            <label className="block text-xs font-medium text-gray-600">Time</label>
            <select
              className="w-full text-sm rounded-md h-10 p-2 box-border appearance-none"
              value={selectedTime}
              onChange={(e) => setSelectedTime(e.target.value)}
              disabled={!selectedDate || availableTimes.length === 0}
            >
              <option value="" disabled>
                Select a time
              </option>
              {availableTimes.map((time, idx) => (
                <option key={idx} value={time}>
                  {new Date(time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </option>
              ))}
            </select>
          </div>

          {currentTastingInfo?.food_pairing_options?.length > 0 && (

          <div className="w-full md:w-1/3">
            <label className="block text-xs font-medium text-gray-600">Food Available</label>
            <select
              className="select select-bordered w-full text-sm h-10"
              onChange={handleFoodPairingChange}
            >
                  <option value="">
                    Select food available
                  </option>
                  {currentTastingInfo.food_pairing_options.map((option) => (
                    <option key={option.name} value={option.name} data-price={option.price}>
                      {option.name} (${option.price.toFixed(2)})
                    </option>
                  ))}
            
            </select>
          </div>
            )}

          {currentTastingInfo?.tours?.tour_options?.length >  0 &&  (

          <div className="w-full md:w-1/3">
            <label className="block text-xs font-medium text-gray-600">Tour</label>
            <select
              className="select select-bordered w-full text-sm h-10"
              onChange={handleTourChange}
            >
   
                  <option value="">
                    Select Tour
                  </option>
                  {currentTastingInfo.tours.tour_options?.map((option) => (
                    <option key={option.description} value={option.description} data-price={option.cost}>
                      {option.description} (${option.cost.toFixed(2)})
                    </option>
                  ))}
               
            </select>
          </div>
            )}


          {currentTastingInfo?.other_features?.length > 0 && (
          <div className="w-full md:w-1/3">
            <label className="block text-xs font-medium text-gray-600">Other Features</label>
            <select
              className="select select-bordered w-full text-sm h-10"
              onChange={handleChangeOther}
            >
                  <option value="">
                    Select Other Feature
                  </option>
                  {currentTastingInfo.other_features?.map((option) => (
                    <option key={option.description} value={option.description} data-price={option.cost}>
                      {option.description} (${option.cost.toFixed(2)})
                    </option>
                  ))}
            </select>
          </div>
           )}
            </>
          )}

        </div>
      </div>
    </div>
  );
}