import React from "react";
import { CalendarDays } from "lucide-react";
import { Card } from "./cards/card";
import { Button } from "./buttons/button";

interface BookingCalendarProps {
  slots: string[];
  maxGuests: number;
  weekendMultiplier: number;
  onSlotSelect?: (slot: string) => void;
  selectedSlot?: string;
}

const BookingCalendar = ({ slots, maxGuests, weekendMultiplier, onSlotSelect, selectedSlot }: BookingCalendarProps) => {
  // Group slots by date
  const slotsByDate = slots?.reduce((acc, slot) => {
    const dateKey = new Date(slot).toISOString().split("T")[0];
    if (!acc[dateKey]) {
      acc[dateKey] = [];
    }
    acc[dateKey].push(slot);
    return acc;
  }, {} as Record<string, string[]>) || {};

  return (
    <Card className="p-6">
      <div className="flex items-center gap-2 mb-4">
        <CalendarDays className="h-5 w-5 text-wine-primary" />
        <h3 className="font-serif text-xl">Available Booking Slots</h3>
      </div>
      <div className="space-y-4">
        {Object.entries(slotsByDate).map(([dateKey, dateSlots]) => {
          const date = new Date(dateKey);
          const isSelected = selectedSlot && new Date(selectedSlot).toISOString().split("T")[0] === dateKey;
          
          return (
            <div key={dateKey} className="border-b pb-4">
              <h4 className="font-medium mb-2">
                {date.toLocaleDateString("en-US", {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </h4>
              <div className="grid grid-cols-1 gap-2">
                {dateSlots.map((slot) => {
                  const slotDate = new Date(slot);
                  const isSlotSelected = selectedSlot === slot;
                  
                  return (
                    <Button
                      key={slot}
                      variant={isSlotSelected ? "default" : "outline"}
                      className={`hover:bg-wine-primary hover:text-white ${
                        isSlotSelected ? "bg-wine-primary text-white" : ""
                      }`}
                      onClick={() => onSlotSelect?.(slot)}
                      disabled={maxGuests === 0}
                    >
                      {slotDate.toLocaleDateString("en-US", {
                        weekday: "long",
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}{" "}
                      {slotDate.toLocaleTimeString("en-US", {
                        hour: "numeric",
                        minute: "2-digit",
                        hour12: true,
                      })}
                    </Button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
      <div className="mt-4 text-sm text-gray-600">
        <p>Maximum {maxGuests} guests per session</p>
        <p>Weekend pricing: {(weekendMultiplier * 100 - 100).toFixed(0)}% premium</p>
      </div>
    </Card>
  );
};

export default BookingCalendar;
