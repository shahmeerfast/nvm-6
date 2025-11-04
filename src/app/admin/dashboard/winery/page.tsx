"use client";
import React, { useRef, useState, useEffect } from "react";
import { Winery } from "@/app/interfaces";
import { BasicInfoForm } from "@/components/winery-stepper/basic-info-step";
import { TastingBookingForm } from "@/components/winery-stepper/tasting-booking-step";
import { fileUpload } from "@/lib/fileUpload";
import axios from "axios";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useRouter, useSearchParams } from "next/navigation";

const initialState: Winery = {
  name: "",
  description: "",
  location: { address: "", latitude: 0, longitude: 0, is_mountain_location: false },
  contact_info: { email: "", phone: "", website: "" },
  tasting_info: [
    {
      tasting_title: "",
      tasting_description: "",
      tasting_price: 0,
      available_times: [],
      wine_types: [],
      number_of_wines_per_tasting: 1,
      special_features: [],
      images: [],
      food_pairing_options: [],
      ava: "",
      tours: {
        available: false,
        tour_price: 0,
        tour_options: [],
      },
      wine_details: [],
      booking_info: {
        booking_enabled: false,
        max_guests_per_slot: 0,
        number_of_people: [1, 10],
        dynamic_pricing: { enabled: false, weekend_multiplier: 1 },
        available_slots: [],
        external_booking_link: "",
      },
      other_features: [],
    },
  ],
  amenities: { virtual_sommelier: false, augmented_reality_tours: false, handicap_accessible: false },
  user_reviews: [],
  transportation: { uber_availability: false, lyft_availability: false, distance_from_user: 0 },
  payment_method: { type: "pay_winery" },
};

export default function WineryAdminStepperPage() {
  const [formData, setFormData] = useState<Winery>(initialState);
  const [activeStep, setActiveStep] = useState(0);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [availableSlotDates, setAvailableSlotDates] = useState<Date[]>([]);
  const [loading, setLoading] = useState(false);
  const [tastingImages, setTastingImages] = useState<{ [key: number]: File[] }>({});
  const formRef = useRef<HTMLFormElement>(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  const wineryId = searchParams.get("id");

  useEffect(() => {
    if (wineryId) {
      setLoading(true);
      axios
        .get(`/api/winery/${wineryId}`)
        .then((res) => {
          if (res.data && res.data.winery) {
            const wineryData = res.data.winery;
            
            // Migrate old payment_method format to new format
            if (typeof wineryData.payment_method === 'string') {
              wineryData.payment_method = { 
                type: wineryData.payment_method,
                external_booking_link: ''
              };
            }
            
            setFormData(wineryData);
          }
        })
        .catch(() => toast.error("Failed to load winery for editing."))
        .finally(() => setLoading(false));
    }
  }, [wineryId]);

  const validateBasicInfo = () => {
    const { name, description, contact_info, location } = formData;
    
    if (!name || name.trim() === "") {
      toast.error("Winery name is required");
      return false;
    }
    
    if (!description || description.trim() === "") {
      toast.error("Description is required");
      return false;
    }
    
    if (!contact_info.email || contact_info.email.trim() === "") {
      toast.error("Email is required");
      return false;
    }
    
    if (!contact_info.phone || contact_info.phone.trim() === "") {
      toast.error("Phone number is required");
      return false;
    }
    
    if (!location.address || location.address.trim() === "") {
      toast.error("Address is required");
      return false;
    }
    
    return true;
  };

  const validateTastingInfo = () => {
    if (formData.tasting_info.length === 0) {
      toast.error("At least one tasting must be added");
      return false;
    }

    for (let i = 0; i < formData.tasting_info.length; i++) {
      const tasting = formData.tasting_info[i];
      
      if (!tasting.tasting_title || tasting.tasting_title.trim() === "") {
        toast.error(`Tasting #${i + 1}: Tasting title is required`);
        return false;
      }
      
      if (!tasting.tasting_description || tasting.tasting_description.trim() === "") {
        toast.error(`Tasting #${i + 1}: Tasting description is required`);
        return false;
      }
      
      // Allow free tastings (0) and only enforce positive price when needed
      if (tasting.tasting_price === undefined || tasting.tasting_price === null || tasting.tasting_price < 0) {
        toast.error(`Tasting #${i + 1}: Tasting price must be 0 or greater`);
        return false;
      }
      
      // If external booking link is provided, times are not required
      const hasExternalLink = !!tasting.booking_info?.external_booking_link;
      if (!hasExternalLink) {
        if (!tasting.available_times || tasting.available_times.length === 0) {
          toast.error(`Tasting #${i + 1}: At least one available time must be selected`);
          return false;
        }
      }
      
      if (!tasting.wine_types || tasting.wine_types.length === 0) {
        toast.error(`Tasting #${i + 1}: At least one wine type must be selected`);
        return false;
      }
      
      if (!tasting.ava || tasting.ava.trim() === "") {
        toast.error(`Tasting #${i + 1}: AVA selection is required`);
        return false;
      }
      
      // Check if there are any images (either existing or newly uploaded)
      const hasExistingImages = tasting.images && tasting.images.length > 0;
      const hasNewImages = tastingImages[i] && tastingImages[i].length > 0;
      
      if (!hasExistingImages && !hasNewImages) {
        toast.error(`Tasting #${i + 1}: At least one image is required`);
        return false;
      }
    }
    
    return true;
  };

  const handleNext = () => {
    if (activeStep === 0 && !validateBasicInfo()) {
      return;
    }
    setActiveStep((prev) => prev + 1);
  };
  
  const handleBack = () => setActiveStep((prev) => prev - 1);

  const handleSubmit = async () => {
    // Validate both steps before submitting
    if (!validateBasicInfo()) {
      return;
    }
    
    if (!validateTastingInfo()) {
      return;
    }
    
    setLoading(true);
    try {
      // Collect all files from global uploads and individual tastings
      const allFiles: File[] = [...uploadedFiles];
      
      // Add files from individual tastings
      Object.values(tastingImages).forEach(files => {
        allFiles.push(...files);
      });
      
      // Upload all files to ImgBB
      const filesUrls = await fileUpload(allFiles);
      
      const updatedFormData = { ...formData };
      
      if (filesUrls.length > 0) {
        // Distribute URLs properly to each tasting
        let urlIndex = 0;
        updatedFormData.tasting_info = updatedFormData.tasting_info.map((tasting, index) => {
          const filesForThisTasting = tastingImages[index] || [];
          const urlsForThisTasting: string[] = [];
          
          // Get URLs for this tasting's files
          for (let i = 0; i < filesForThisTasting.length && urlIndex < filesUrls.length; i++) {
            urlsForThisTasting.push(filesUrls[urlIndex]);
            urlIndex++;
          }
          
          // Combine with existing images
          const existingImages = tasting.images || [];
          return {
            ...tasting,
            images: [...existingImages, ...urlsForThisTasting]
          };
        });
      }

      if (wineryId) {
        // Update existing winery
        await axios.patch(`/api/admin/wineries/${wineryId}`, updatedFormData);
        toast.success("Winery updated successfully!", {
          position: "top-right",
          autoClose: 3000,
          hideProgressBar: true,
        });
      } else {
        // Create new winery
        await axios.post("/api/winery", updatedFormData);
        toast.success("Winery added successfully!", {
          position: "top-right",
          autoClose: 3000,
          hideProgressBar: true,
        });
      }
      setFormData({ ...initialState });
      setUploadedFiles([]);
      setTastingImages({});
      setAvailableSlotDates([]);
      setActiveStep(0);
      router.push("/admin/dashboard/winery/list");
    } catch (error) {
      console.error("Error saving winery:", error);
      toast.error("Error saving winery. Please try again.", {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: true,
      });
    } finally {
      setLoading(false);
    }
  };

  const renderStep = () => {
    switch (activeStep) {
      case 0:
        return <BasicInfoForm formData={formData} setFormData={setFormData} />;
      case 1:
        return (
          <TastingBookingForm
            formData={formData}
            setFormData={setFormData}
            uploadedFiles={uploadedFiles}
            setUploadedFiles={setUploadedFiles}
            availableSlotDates={availableSlotDates}
            setAvailableSlotDates={setAvailableSlotDates}
            tastingImages={tastingImages}
            setTastingImages={setTastingImages}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen p-4 bg-gray-100 relative top-20">
      <div className="container mx-auto max-w-4xl bg-base-100 p-5 relative">
        <h1 className="text-3xl font-bold text-center mb-6">{wineryId ? "Edit Winery" : "Add New Winery"}</h1>
        <div className="steps mb-4">
          <div className={`step ${activeStep >= 0 ? "step-primary" : ""}`}>Basic Info</div>
          <div className={`step ${activeStep >= 1 ? "step-primary" : ""}`}>Tasting & Booking</div>
        </div>

        {loading && (
          <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex justify-center items-center z-50">
            <div className="loader border-t-4 border-b-4 border-white w-12 h-12 rounded-full animate-spin"></div>
          </div>
        )}

        <ToastContainer />

        <form ref={formRef} onSubmit={(e) => e.preventDefault()} className="space-y-6" id="winery-form">
          {renderStep()}
          <div className="flex justify-between" style={{ marginBottom: "40px" }}>
            {activeStep > 0 && (
              <button type="button" onClick={handleBack} className="btn">
                Back
              </button>
            )}
            {activeStep < 1 ? (
              <button type="button" onClick={handleNext} className="btn btn-primary ml-auto">
                Next
              </button>
            ) : (
              <button onClick={handleSubmit} className="btn btn-success ml-auto" disabled={loading}>
                {wineryId ? "Update Winery" : "Submit Winery"}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}