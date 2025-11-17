import { useState, useEffect, useCallback } from "react";
import { Winery } from "@/app/interfaces";
import BottomSheet from "../bottom-sheet";
import { FilterIcon } from "lucide-react";
import { MdRestore } from "react-icons/md";
import { FilterBlock } from "./FilterBlock";
import { Filters, useFilterStore } from "@/hooks/useFilterStore";

interface FilterProps {
  wineries: Winery[];
  onFilterApply: (filteredWineries: Winery[]) => void;
}

const Filter = ({ wineries, onFilterApply }: FilterProps) => {
  const { filters, setFilters } = useFilterStore();

  const [isLoading, setIsLoading] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const [isFeaturesOpen, setIsFeaturesOpen] = useState(true);

  const applyFilters = useCallback(() => {
    setIsLoading(true);
    let filtered = wineries;

    console.log('Applying filters:', filters);

    // Filter by tasting price range
    filtered = filtered.filter((winery) => {
      if (!winery.tasting_info || !Array.isArray(winery.tasting_info) || winery.tasting_info.length === 0) return false;
      
      // Check if any tasting falls within the price range
      return winery.tasting_info.some(tasting => 
        tasting && typeof tasting.tasting_price === 'number' &&
        tasting.tasting_price >= filters.priceRange[0] && 
        tasting.tasting_price <= filters.priceRange[1]
      );
    });

    // Filter by tasting price specifically
    if (filters.tastingPrice !== undefined) {
      filtered = filtered.filter((winery) => {
        if (!winery.tasting_info || !Array.isArray(winery.tasting_info) || winery.tasting_info.length === 0) return false;
        
        // Check if any tasting is within the tasting price range
        return winery.tasting_info.some(tasting => 
          tasting && typeof tasting.tasting_price === 'number' &&
          tasting.tasting_price <= filters.tastingPrice
        );
      });
    }

    // Filter by number of wines per tasting
    filtered = filtered.filter((winery) => {
      if (!winery.tasting_info || !Array.isArray(winery.tasting_info) || winery.tasting_info.length === 0) return false;
      
      // Check if any tasting has the required number of wines
      return winery.tasting_info.some(tasting => {
        if (!tasting) return false;
        const numWines = tasting.number_of_wines_per_tasting || 1;
        return numWines >= filters.numberOfWines[0] && numWines <= filters.numberOfWines[1];
      });
    });

    // Filter by number of people
    filtered = filtered.filter((winery) => {
      if (!winery.tasting_info || !Array.isArray(winery.tasting_info) || winery.tasting_info.length === 0) return false;
      
      // Check if any tasting has the required number of people
      return winery.tasting_info.some(tasting => {
        if (!tasting || !tasting.booking_info?.number_of_people || !Array.isArray(tasting.booking_info.number_of_people)) {
          return false;
        }
        
        return tasting.booking_info.number_of_people.some(people => {
          const numPeople = people || 1;
          return numPeople >= filters.numberOfPeople[0] && numPeople <= filters.numberOfPeople[1];
        });
      });
    });
    // Filter by wine type
    if (Object.values(filters.wineType).some((value) => value)) {
      filtered = filtered.filter((winery) => {
        if (!winery.tasting_info || !Array.isArray(winery.tasting_info) || winery.tasting_info.length === 0) return false;
        
        // Check if any tasting has the required wine types
        return winery.tasting_info.some(tasting => {
          if (!tasting || !tasting.wine_types || !Array.isArray(tasting.wine_types)) return false;
          
          // Get selected wine types
          const selectedTypes = Object.keys(filters.wineType).filter(
            (type) => filters.wineType[type as keyof typeof filters.wineType]
          );
          
          // Check if any of the selected types match the tasting's wine types
          return selectedTypes.some(selectedType => 
            tasting.wine_types.some(wineType => {
              // Normalize both strings for comparison
              const normalizedSelected = selectedType.toLowerCase().trim();
              const normalizedWineType = wineType.toLowerCase().trim();
              return normalizedSelected === normalizedWineType;
            })
          );
        });
      });
    }

    // Filter by AVA
    if (filters.ava.length > 0) {
      filtered = filtered.filter((winery) => {
        if (!winery.tasting_info || winery.tasting_info.length === 0) return false;
        
        // Check if any tasting is in the selected AVA
        return winery.tasting_info.some(tasting => 
          tasting.ava && filters.ava.includes(tasting.ava)
        );
      });
    }

    // Filter by available time
    if (filters.time) {
      filtered = filtered.filter((winery) => {
        if (!winery.tasting_info || winery.tasting_info.length === 0) return false;
        
        // Check if any tasting has the required time
        return winery.tasting_info.some(tasting => {
          if (!tasting.available_times || !Array.isArray(tasting.available_times)) return false;
          
          return tasting.available_times.some((time) => filters.time.toLowerCase() === time.toLowerCase());
        });
      });
    }

    // Filter by special features
    if (filters.specialFeatures.length > 0) {
      filtered = filtered.filter((winery) => {
        if (!winery.tasting_info || winery.tasting_info.length === 0) return false;
        
        // Check if any tasting has all the required special features
        return winery.tasting_info.some(tasting => {
          if (!tasting.special_features || !Array.isArray(tasting.special_features)) return false;
          
          return filters.specialFeatures.every((feature) => tasting.special_features.includes(feature));
        });
      });
    }

    // Filter by multiple tastings availability
    if (filters.multipleTastings) {
      filtered = filtered.filter((winery) => 
        winery.tasting_info && winery.tasting_info.length > 1
      );
    }

    // Filter by food pairings availability
    if (filters.foodPairings) {
      filtered = filtered.filter((winery) => {
        if (!winery.tasting_info || winery.tasting_info.length === 0) return false;
        
        // Check if any tasting has food pairings
        return winery.tasting_info.some(tasting =>
          tasting.food_pairing_options && tasting.food_pairing_options.length > 0
        );
      });
    }

    // Filter by tour availability
    if (filters.toursAvailable) {
      filtered = filtered.filter((winery) => {
        if (!winery.tasting_info || winery.tasting_info.length === 0) return false;
        
        // Check if any tasting has tours available
        return winery.tasting_info.some(tasting =>
          tasting.tours && tasting.tours.available
        );
      });
    }

    console.log('Filtered results:', filtered.length, 'wineries');
    onFilterApply(filtered);
    setIsLoading(false);
  }, [filters, wineries, onFilterApply]);

  useEffect(() => {
    applyFilters();
  }, [filters, applyFilters]);

  const handleFilterChange = (key: string, value: any) => {
    setFilters({ ...filters, [key]: value });
  };

  const handleSpecialFeatureChange = (feature: string, checked: boolean) => {
    if (checked) {
      filters.specialFeatures.push(feature);
    } else {
      const index = filters.specialFeatures.findIndex((spf) => spf === feature);
      filters.specialFeatures.splice(index, 1);
    }
    setFilters({ ...filters, specialFeatures: [...filters.specialFeatures] });
  };

  const resetFilters = () => {
    setFilters({
      priceRange: [0, 1000],
      numberOfWines: [1, 10],
      wineType: { red: false, rosé: false, white: false, sparkling: false, dessert: false },
      ava: [],
      time: "",
      specialFeatures: [],
      numberOfPeople: [1, 20],
      toursAvailable: false,
      tastingPrice: 200,
      multipleTastings: false,
      foodPairings: false
    });
    setShowResetModal(false);
  };

  const [isBottomSheetOpen, setBottomSheetOpen] = useState(false);
  return (
    <>
      <div className="md:hidden flex flex-row gap-2 w-full">
        <button
          className="flex-1 flex items-center justify-center space-x-2 px-4 py-2 rounded-md transition-all duration-300 ease-in-out bg-primary text-white shadow-glassmorphism text-sm"
          onClick={() => setBottomSheetOpen(true)}
          disabled={isLoading}
          aria-label="Apply Filters"
        >
          <span className="font-medium">Apply Filters</span>
          <FilterIcon size={20} />
        </button>

        <button
          className="flex-3 flex items-center justify-center space-x-2 px-4 py-2 rounded-md border border-wine-primary text-wine-primary bg-transparent hover:bg-wine-primary hover:text-white hover:shadow-neumorphism transition duration-300 ease-in-out text-sm"
          onClick={() => setShowResetModal(true)}
          aria-label="Reset Filters"
        >
          <MdRestore size={20} />
          <span className="font-medium">Reset</span>
        </button>
      </div>

      <BottomSheet isOpen={isBottomSheetOpen} onClose={() => setBottomSheetOpen(false)}>
        <FilterBlock
          filters={filters}
          handleFilterChange={handleFilterChange}
          handleSpecialFeatureChange={handleSpecialFeatureChange}
          isFeaturesOpen={isFeaturesOpen}
          setIsFeaturesOpen={setIsFeaturesOpen}
          onSearch={applyFilters}
          isSearching={isLoading}
        />
      </BottomSheet>
      <div className="hidden md:block p-4 bg-white shadow-lg rounded-lg w-full max-w-sm sm:max-w-md space-y-4 md:space-y-6">
        <h2 className="text-lg font-semibold text-gray-800">Filter Wineries</h2>
        <FilterBlock
          filters={filters}
          handleFilterChange={handleFilterChange}
          handleSpecialFeatureChange={handleSpecialFeatureChange}
          isFeaturesOpen={isFeaturesOpen}
          setIsFeaturesOpen={setIsFeaturesOpen}
          onSearch={applyFilters}
          isSearching={isLoading}
        />

        {/* Tasting Price Range Filter */}
        <div className="space-y-4">
          <label className="text-lg font-medium text-neutral">Price Range of Tasting</label>
          <div className="relative">
            <input
              type="range"
              name="tastingPrice"
              min="0"
              max="200"
              value={filters.tastingPrice || 200}
              onChange={(e) => handleFilterChange(e.target.name, Number(e.target.value))}
              className="range range-primary w-full"
              aria-label="Select tasting price range"
            />
          </div>
        </div>

        <button
          className="flex-3 w-full flex items-center justify-center space-x-2 px-4 py-2 rounded-md border border-wine-primary text-wine-primary bg-transparent hover:bg-wine-primary hover:text-white hover:shadow-neumorphism transition duration-300 ease-in-out text-sm"
          onClick={() => setShowResetModal(true)}
          aria-label="Reset Filters"
        >
          <MdRestore size={20} />
          <span className="font-medium">Reset</span>
        </button>
      </div>

      {showResetModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50">
          <div className="modal modal-open">
            <div className="modal-box p-4 max-w-md bg-white rounded-lg shadow-lg">
              <h2 className="text-lg font-semibold">Are you sure?</h2>
              <p className="text-gray-500 mt-2 text-sm">This will reset all the filters.</p>
              <div className="modal-action space-x-3">
                <button className="btn btn-ghost text-xs hover:bg-gray-200" onClick={() => setShowResetModal(false)}>
                  Cancel
                </button>
                <button className="btn btn-primary text-xs hover:bg-indigo-500" onClick={resetFilters}>
                  Reset
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {isLoading && (
        <div className="mt-4 space-y-2">
          <div className="w-full h-4 bg-neutral-200 rounded animate-pulse"></div>
          <div className="w-full h-4 bg-neutral-200 rounded animate-pulse"></div>
          <div className="w-full h-4 bg-neutral-200 rounded animate-pulse"></div>
        </div>
      )}
    </>
  );
};

export default Filter;