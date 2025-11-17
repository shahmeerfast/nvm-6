import { Range } from "react-range";
import Select from "react-select";
import { wineTypes, regions, timeOptions, specialFeatures, mountainAVAs, avaOrder, avaInfo } from "@/data/data";
import React from "react";
import { FaMapMarkerAlt } from "react-icons/fa";

type Filters = {
  priceRange: [number, number];
  numberOfWines: [number, number];
  wineType: {
    red: boolean;
    rosé: boolean;
    white: boolean;
    sparkling: boolean;
    dessert: boolean;
  };
  ava: string[];
  time: string;
  specialFeatures: string[];
  numberOfPeople: [number, number];
  mountainLocation: boolean;
};

interface FilterBlockProps {
  filters: Filters;
  handleFilterChange: (key: string, value: any) => void;
  handleSpecialFeatureChange: (feature: string, checked: boolean) => void;
  isFeaturesOpen: boolean;
  setIsFeaturesOpen: (value: boolean) => void;
  onSearch?: () => void;
  isSearching?: boolean;
}

export const FilterBlock = ({
  filters,
  handleFilterChange,
  handleSpecialFeatureChange,
  isFeaturesOpen,
  setIsFeaturesOpen,
  onSearch,
  isSearching,
}: FilterBlockProps) => {
  return (
    <>
      {/* Total Price Range Filter */}
      <div className="grid gap-4 mt-8 mb-5">
        <label className="text-sm text-gray-900 font-extrabold">Price Range of Tasting</label>
        <Range
          step={10}
          min={0}
          max={1000}
          values={filters.priceRange}
          onChange={(newValues: any) => handleFilterChange("priceRange", newValues)}
          renderTrack={({ props, children }) => (
            <div {...props} className="w-full h-1 bg-neutral-300 rounded-full">{children}</div>
          )}
          renderThumb={({ props }) => {
            const { key, ...thumbProps } = props as any;
            return <div key={key} {...thumbProps} className="w-4 h-4 bg-primary rounded-full shadow-lg focus:outline-none" />;
          }}
        />
        <div className="flex justify-between text-xs">
          <span>${filters.priceRange[0]}</span>
          <span>${filters.priceRange[1]}</span>
        </div>
      </div>

      {/* Number of Wines per Tasting Filter */}
      <div className="grid gap-4">
        <label className="text-sm text-gray-900 font-extrabold">Number of Wines per Tasting</label>
        <Range
          step={1}
          min={1}
          max={10}
          values={filters.numberOfWines}
          onChange={(newValues) => handleFilterChange("numberOfWines", newValues)}
          renderTrack={({ props, children }) => (
            <div {...props} className="w-full h-1 bg-neutral-300 rounded-full">{children}</div>
          )}
          renderThumb={({ props }) => {
            const { key, ...thumbProps } = props as any;
            return <div key={key} {...thumbProps} className="w-4 h-4 bg-primary rounded-full shadow-lg focus:outline-none" />;
          }}
        />
        <div className="flex justify-between text-xs">
          <span>{filters.numberOfWines[0]} wines</span>
          <span>{filters.numberOfWines[1]} wines</span>
        </div>
      </div>

      {/* Number of People per Tasting Filter */}
      <div className="grid gap-4 mt-4">
        <label className="text-sm text-gray-900 font-extrabold">Number of People per Tasting</label>
        <Range
          step={1}
          min={1}
          max={20}
          values={filters.numberOfPeople}
          onChange={(newValues) => handleFilterChange("numberOfPeople", newValues)}
          renderTrack={({ props, children }) => (
            <div {...props} className="w-full h-1 bg-neutral-300 rounded-full">{children}</div>
          )}
          renderThumb={({ props }) => {
            const { key, ...thumbProps } = props as any;
            return <div key={key} {...thumbProps} className="w-4 h-4 bg-primary rounded-full shadow-lg focus:outline-none" />;
          }}
        />
        <div className="flex justify-between text-xs">
          <span>{filters.numberOfPeople[0]} people</span>
          <span>{filters.numberOfPeople[1]} people</span>
        </div>
      </div>

      {/* Wine Types of Tasting Filter */}
      <div className="mt-4">
        <label className="text-sm text-gray-900 font-extrabold">Wine Types of Tasting</label>
        <div className="mt-2 flex flex-wrap gap-3">
          {wineTypes.map((type) => (
            <label key={type} className="flex items-center space-x-2 text-xs sm:text-sm">
              <input
                type="checkbox"
                className="checkbox checkbox-primary"
                checked={filters.wineType[type as keyof typeof filters.wineType]}
                onChange={(e) => handleFilterChange("wineType", { ...filters.wineType, [type]: e.target.checked })}
              />
              <span className="capitalize">{type}</span>
            </label>
          ))}
        </div>
      </div>

      {/* AVA Filter with info box and ordered options */}
      <div className="mt-4">
        <label className="text-sm font-extrabold text-gray-900 flex items-center gap-1">
          American Viticultural Area (AVA)
         <FaMapMarkerAlt style={{ color: "#5A0C2C" }} />
        </label>
        <Select
          menuPlacement="top"
          isMulti
          options={[...avaOrder.map((region) => ({ value: region, label: region }))]}
          value={filters.ava.map((ava) => ({ value: ava, label: ava }))}
          onChange={(selectedOptions) =>
            handleFilterChange(
              "ava",
              selectedOptions.map((opt) => opt.value)
            )
          }
          className="w-full mt-2 mb-0"
          classNamePrefix="select"
        />
        {filters.ava.length > 0 && (
          <div className="mt-2 p-2 rounded-md bg-base-200 text-[11px] sm:text-xs">
            {filters.ava.map((selected) => (
              <div key={selected} className="mb-1">
                <strong>{selected}:</strong> {avaInfo[selected] || "Details coming soon."}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Time Filter */}
      <div style={{ marginTop: 10 }}>
        <label className="text-sm text-gray-900 font-extrabold">Preferred Time</label>
        <select
          value={filters.time}
          onChange={(e) => handleFilterChange("time", e.target.value)}
          className="select select-bordered w-full mt-2 focus:ring-2 focus:ring-indigo-500 text-xs p-2 sm:text-sm"
        >
          <option value="">Select Time</option>
          {timeOptions.map((time) => (
            <option key={time} value={time}>
              {time}
            </option>
          ))}
        </select>
      </div>


      {/* Special Features Filter */}
      <div className="my-10">
        <button
          onClick={() => setIsFeaturesOpen(!isFeaturesOpen)}
          className="flex justify-between items-center w-full text-sm font-semibold"
        >
          Special Features
          <span>{isFeaturesOpen ? "-" : "+"}</span>
        </button>
        {isFeaturesOpen && (
          <div className="mt-2 flex flex-wrap gap-2">
            {specialFeatures.map((feature) => (
              <label key={feature} className="flex items-center space-x-2 text-xs sm:text-sm">
                <input
                  type="checkbox"
                  className="checkbox checkbox-primary"
                  checked={filters.specialFeatures.includes(feature)}
                  onChange={(e) => handleSpecialFeatureChange(feature, e.target.checked)}
                />
                <span>{feature}</span>
              </label>
            ))}
            
            {/* Mountain Location Filter - Now inside Special Features */}
            <label className="flex items-center space-x-2 text-xs sm:text-sm">
              <input
                type="checkbox"
                className="checkbox checkbox-primary"
                checked={filters.mountainLocation}
                onChange={(e) => handleFilterChange("mountainLocation", e.target.checked)}
              />
              <span>Only show mountain AVAs</span>
            </label>
            
            {filters.mountainLocation && (
              <div className="w-full mt-2 text-[11px] sm:text-xs text-gray-600">
                Mountain AVAs: {mountainAVAs.join(", ")}
              </div>
            )}
          </div>
        )}
      </div>

      {onSearch && (
        <button
          type="button"
          className="w-full flex items-center justify-center px-4 py-2 rounded-md bg-wine-primary text-white hover:bg-wine-primary/90 hover:shadow-neumorphism transition duration-300 ease-in-out text-sm font-medium"
          onClick={onSearch}
          disabled={isSearching}
        >
          {isSearching ? "Searching..." : "Search"}
        </button>
      )}
    </>
  );
};