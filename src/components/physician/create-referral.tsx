"use client";

import { useState, useEffect, useRef } from "react";
import { useMutation, useQuery, useAction } from "convex/react";
import { api } from "@convex/_generated/api";
import { Id } from "@convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  User,
  Phone,
  Calendar,
  Activity,
  Building2,
  FileText,
  Send,
  Loader2,
  CheckCircle2,
  XCircle,
  Stethoscope,
  Clock,
  AlertTriangle,
  Info,
  ChevronRight,
  ChevronLeft,
  Search,
  MapPin,
  X,
  Upload,
  Link as LinkIcon,
  Sparkles,
  Eye,
} from "lucide-react";
import { REFERRAL_FEE } from "@/lib/mpesa-config";
import SummaryOutput from "@/app/dashboard/ai-dashboard/SummaryOutput";

// ============================================================================
// COMMON DIAGNOSES LIST (Kenya-specific)
// ============================================================================
const COMMON_DIAGNOSES = [
  // Infectious Diseases
  "Malaria",
  "Tuberculosis (TB)",
  "HIV/AIDS",
  "Pneumonia",
  "Typhoid Fever",
  "Cholera",
  "Dengue Fever",
  "Rift Valley Fever",
  "COVID-19",
  "Meningitis",
  // Non-Communicable Diseases
  "Diabetes Mellitus Type 2",
  "Diabetes Mellitus Type 1",
  "Hypertension",
  "Heart Failure",
  "Coronary Artery Disease",
  "Stroke",
  "Asthma",
  "Chronic Obstructive Pulmonary Disease (COPD)",
  "Chronic Kidney Disease",
  "Sickle Cell Disease",
  // Maternal & Child Health
  "Pre-eclampsia",
  "Eclampsia",
  "Postpartum Hemorrhage",
  "Obstructed Labor",
  "Premature Rupture of Membranes",
  "Neonatal Sepsis",
  "Low Birth Weight",
  "Malnutrition",
  "Kwashiorkor",
  "Marasmus",
  // Injuries & Orthopedic
  "Femur Fracture",
  "Tibia Fracture",
  "Humerus Fracture",
  "Pelvic Fracture",
  "Spinal Cord Injury",
  "Traumatic Brain Injury",
  "Burns",
  "Road Traffic Accident",
  "Open Wound",
  "Dislocation",
  // Surgical Conditions
  "Appendicitis",
  "Hernia",
  "Cholecystitis",
  "Intestinal Obstruction",
  "C-section Delivery",
  "Fracture Fixation",
  "Tumor Removal",
  "Prostate Enlargement",
  "Uterine Fibroids",
  "Ovarian Cyst",
  // Cardiovascular
  "Myocardial Infarction",
  "Angina",
  "Arrhythmia",
  "Deep Vein Thrombosis",
  "Peripheral Artery Disease",
  // Gastrointestinal
  "Gastritis",
  "Peptic Ulcer Disease",
  "Hepatitis B",
  "Hepatitis C",
  "Cirrhosis",
  "Pancreatitis",
  // Neurological
  "Epilepsy",
  "Cerebral Palsy",
  "Parkinson's Disease",
  "Multiple Sclerosis",
  "Guillain-Barré Syndrome",
  // Psychiatric
  "Depression",
  "Anxiety Disorder",
  "Bipolar Disorder",
  "Schizophrenia",
  "Substance Use Disorder",
  // Dermatological
  "Eczema",
  "Psoriasis",
  "Cellulitis",
  "Skin Abscess",
  // Ophthalmological
  "Cataracts",
  "Glaucoma",
  "Conjunctivitis",
  "Retinopathy",
  // Other Common Referrals
  "Anemia",
  "Thyroid Disorders",
  "Rheumatoid Arthritis",
  "Osteoarthritis",
  "Gout",
  "Cancer - Breast",
  "Cancer - Cervical",
  "Cancer - Prostate",
  "Cancer - Colorectal",
].sort();

interface CreateReferralPageProps {
  physician: any;
  onBack: () => void;
  token: string;
}

interface Facility {
  _id: Id<"facilities">;
  name: string;
  type: string;
  address: string;
  city: string;
  county: string;
  phone: string;
  email: string;
  services: string[];
  departments: string[];
  bedCapacity?: number;
  emergencyServices: boolean;
  operatingHours: string;
  status: string;
}

interface Physician {
  _id: Id<"physicianProfiles">;
  userId: Id<"users">;
  facilityId: Id<"facilities">;
  specialization: string;
  qualifications: string[];
  user?: {
    name: string;
  };
}

type FormStep = "patient" | "medical" | "facility" | "review";

export default function CreateReferralPage({
  physician,
  onBack,
  token,
}: CreateReferralPageProps) {
  const [currentStep, setCurrentStep] = useState<FormStep>("patient");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showSuccessAnimation, setShowSuccessAnimation] = useState(false);

  // Diagnosis autocomplete states
  const [diagnosisInput, setDiagnosisInput] = useState("");
  const [showDiagnosisDropdown, setShowDiagnosisDropdown] = useState(false);
  const [filteredDiagnoses, setFilteredDiagnoses] = useState<string[]>([]);
  const diagnosisInputRef = useRef<HTMLInputElement>(null);
  const diagnosisDropdownRef = useRef<HTMLDivElement>(null);

  // AI summarizer states
  const [aiInputMethod, setAiInputMethod] = useState<"text" | "file" | "url">(
    "text",
  );
  const [aiText, setAiText] = useState("");
  const [aiFile, setAiFile] = useState<File | null>(null);
  const [aiUrl, setAiUrl] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState("");
  const [generatedSummary, setGeneratedSummary] = useState("");
  const [showSummaryModal, setShowSummaryModal] = useState(false);

  const router = useRouter();

  // Search and filter states
  const [facilitySearch, setFacilitySearch] = useState("");
  const [selectedFacility, setSelectedFacility] = useState<Facility | null>(
    null,
  );
  const [showFacilityDropdown, setShowFacilityDropdown] = useState(false);
  const [selectedDepartment, setSelectedDepartment] = useState("");
  const [selectedPhysician, setSelectedPhysician] = useState<Physician | null>(
    null,
  );
  const [showPhysicianDropdown, setShowPhysicianDropdown] = useState(false);
  const [physicianSearch, setPhysicianSearch] = useState("");

  // Fetch real data from Convex
  const facilities = useQuery(api.facilities.queries.getActiveFacilities);
  const physiciansByFacility = useQuery(
    api.facilities.queries.getPhysiciansByFacility,
    selectedFacility ? { facilityId: selectedFacility._id } : "skip",
  );

  const createReferral = useMutation(api.referrals.mutations.createReferral);
  const summarizeAction = useAction(api.actions.ai_summarize.summarize);

  const [formData, setFormData] = useState({
    // Patient Information
    patientName: "",
    patientAge: "",
    patientGender: "",
    patientContact: "",
    patientNationalId: "",
    // Medical Information
    diagnosis: "",
    clinicalSummary: "",
    reasonForReferral: "",
    urgency: "routine",
    // Facility Information
    referredToFacility: "",
    referredToDepartment: "",
    referredToPhysician: "",
    // Additional
    physicianNotes: "",
  });

  // Filter active facilities
  const activeFacilities = facilities || [];

  const filteredFacilities = activeFacilities.filter(
    (f) =>
      f.name.toLowerCase().includes(facilitySearch.toLowerCase()) ||
      f.city.toLowerCase().includes(facilitySearch.toLowerCase()) ||
      f.county.toLowerCase().includes(facilitySearch.toLowerCase()),
  );

  const facilityDepartments = selectedFacility?.departments || [];
  const facilityPhysicians = physiciansByFacility || [];

  const filteredPhysicians = facilityPhysicians.filter(
    (p) =>
      p.user?.name?.toLowerCase().includes(physicianSearch.toLowerCase()) ||
      p.specialization.toLowerCase().includes(physicianSearch.toLowerCase()),
  );

  // Filter diagnoses based on input
  useEffect(() => {
    if (diagnosisInput.trim() === "") {
      setFilteredDiagnoses([]);
      setShowDiagnosisDropdown(false);
      return;
    }
    const inputLower = diagnosisInput.toLowerCase();
    const matches = COMMON_DIAGNOSES.filter((diagnosis) =>
      diagnosis.toLowerCase().includes(inputLower),
    ).slice(0, 10);
    setFilteredDiagnoses(matches);
    setShowDiagnosisDropdown(matches.length > 0);
  }, [diagnosisInput]);

  // Handle click outside diagnosis dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        diagnosisDropdownRef.current &&
        !diagnosisDropdownRef.current.contains(event.target as Node) &&
        diagnosisInputRef.current &&
        !diagnosisInputRef.current.contains(event.target as Node)
      ) {
        setShowDiagnosisDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleDiagnosisSelect = (diagnosis: string) => {
    setDiagnosisInput(diagnosis);
    setFormData((prev) => ({ ...prev, diagnosis }));
    setShowDiagnosisDropdown(false);
  };

  const handleDiagnosisChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setDiagnosisInput(value);
    setFormData((prev) => ({ ...prev, diagnosis: value }));
  };

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFacilitySelect = (facility: Facility) => {
    setSelectedFacility(facility);
    setFormData((prev) => ({
      ...prev,
      referredToFacility: facility.name,
      referredToDepartment: "",
      referredToPhysician: "",
    }));
    setSelectedDepartment("");
    setSelectedPhysician(null);
    setShowFacilityDropdown(false);
    setFacilitySearch("");
  };

  const handleDepartmentSelect = (department: string) => {
    setSelectedDepartment(department);
    setFormData((prev) => ({ ...prev, referredToDepartment: department }));
  };

  const handlePhysicianSelect = (physician: Physician) => {
    setSelectedPhysician(physician);
    setFormData((prev) => ({
      ...prev,
      referredToPhysician: physician.user?.name || "",
    }));
    setShowPhysicianDropdown(false);
    setPhysicianSearch("");
  };

  const generateAISummary = async () => {
    setAiLoading(true);
    setAiError("");

    try {
      let inputType: "text" | "file" | "url" | "image" = aiInputMethod;
      let args: any = { inputType };

      if (aiInputMethod === "text") {
        if (!aiText.trim()) throw new Error("Please enter text to summarize");
        args.text = aiText.trim();
      } else if (aiInputMethod === "file") {
        if (!aiFile) throw new Error("Please select a file");
        const fileType = aiFile.name.split(".").pop()?.toLowerCase() ?? "";
        const arrayBuffer = await aiFile.arrayBuffer();

        if (fileType === "pdf") {
          // Dynamically import pdf.js only on the client
          const pdfjsLib = await import("pdfjs-dist");
          if (typeof window !== "undefined") {
            pdfjsLib.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";
          }
          const pdf = await pdfjsLib.getDocument({
            data: new Uint8Array(arrayBuffer),
          }).promise;
          let extractedText = "";
          for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
            const page = await pdf.getPage(pageNum);
            const content = await page.getTextContent();
            const pageText = content.items
              .map((item: any) => item.str)
              .join(" ");
            extractedText += pageText + "\n";
          }
          extractedText = extractedText.trim();
          if (!extractedText)
            throw new Error("No text could be extracted from this PDF.");
          inputType = "text";
          args = { inputType: "text", text: extractedText };
        } else {
          args.file = arrayBuffer;
          args.fileName = aiFile.name;
          inputType = "file";
          args.inputType = "file";
        }
      } else if (aiInputMethod === "url") {
        if (!aiUrl.trim()) throw new Error("Please enter a URL");
        args.url = aiUrl.trim();
      }

      const result = await summarizeAction(args);
      if (!result.success)
        throw new Error(result.error || "Summarization failed");

      const summaryText = result.summary;
      setGeneratedSummary(summaryText);
      setFormData((prev) => ({ ...prev, clinicalSummary: summaryText }));
    } catch (err: any) {
      setAiError(err.message || "Failed to generate summary");
    } finally {
      setAiLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      const result = await createReferral({
        token,
        physicianId: physician.id,
        patientName: formData.patientName,
        patientAge: parseInt(formData.patientAge),
        patientGender: formData.patientGender,
        patientContact: formData.patientContact,
        patientNationalId: formData.patientNationalId || undefined,
        diagnosis: formData.diagnosis,
        clinicalSummary: formData.clinicalSummary,
        reasonForReferral: formData.reasonForReferral,
        urgency: formData.urgency as "routine" | "urgent" | "emergency",
        referredToFacility: formData.referredToFacility,
        referredToDepartment: formData.referredToDepartment || undefined,
        referredToPhysician: formData.referredToPhysician || undefined,
        physicianNotes: formData.physicianNotes || undefined,
      });

      if (result.success) {
        setSuccess("Referral created successfully!");
        setShowSuccessAnimation(true);
        setTimeout(() => {
          setShowSuccessAnimation(false);
          onBack();
        }, 2000);
      }
    } catch (err: any) {
      setError(err.message || "Failed to create referral");
    } finally {
      setIsSubmitting(false);
    }
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case "emergency":
        return "text-red-600 bg-red-50 border-red-200";
      case "urgent":
        return "text-orange-600 bg-orange-50 border-orange-200";
      default:
        return "text-blue-600 bg-blue-50 border-blue-200";
    }
  };

  const steps = [
    { id: "patient", label: "Patient", icon: User },
    { id: "medical", label: "Medical", icon: Stethoscope },
    { id: "facility", label: "Facility", icon: Building2 },
    { id: "review", label: "Review", icon: FileText },
  ];

  const renderStepIndicator = () => (
    <div className="mb-6 sm:mb-8 overflow-x-auto pb-2">
      <div className="flex items-center justify-between min-w-75 sm:min-w-0 max-w-2xl mx-auto">
        {steps.map((step, index) => {
          const StepIcon = step.icon;
          const isActive = currentStep === step.id;
          const isCompleted =
            steps.findIndex((s) => s.id === currentStep) > index;
          return (
            <div key={step.id} className="flex items-center flex-1">
              <div className="relative flex flex-col items-center">
                <motion.div
                  animate={{
                    scale: isActive ? 1.1 : 1,
                    backgroundColor: isActive
                      ? "#3B82F6"
                      : isCompleted
                        ? "#10B981"
                        : "#E5E7EB",
                  }}
                  className="w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-white shadow-lg transition-all duration-300"
                >
                  {isCompleted ? (
                    <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5" />
                  ) : (
                    <StepIcon className="w-4 h-4 sm:w-5 sm:h-5" />
                  )}
                </motion.div>
                <span
                  className={`text-[10px] sm:text-xs mt-1 sm:mt-2 font-medium ${
                    isActive ? "text-blue-600" : "text-gray-500"
                  }`}
                >
                  {step.label}
                </span>
              </div>
              {index < steps.length - 1 && (
                <div
                  className={`flex-1 h-0.5 mx-1 sm:mx-2 ${
                    isCompleted ? "bg-green-500" : "bg-gray-200"
                  }`}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );

  const renderPatientStep = () => (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-4"
    >
      <h2 className="text-lg sm:text-xl font-semibold text-gray-800 mb-4">
        Patient Information
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1 items-center gap-2">
            <User className="w-4 h-4 text-blue-500" /> Full Name *
          </label>
          <input
            type="text"
            name="patientName"
            required
            value={formData.patientName}
            onChange={handleChange}
            placeholder="Enter patient name"
            className="w-full px-3 sm:px-4 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1 items-center gap-2">
            <Calendar className="w-4 h-4 text-blue-500" /> Age *
          </label>
          <input
            type="number"
            name="patientAge"
            required
            min="0"
            max="150"
            value={formData.patientAge}
            onChange={handleChange}
            placeholder="Age"
            className="w-full px-3 sm:px-4 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1 items-center gap-2">
            <User className="w-4 h-4 text-blue-500" /> Gender *
          </label>
          <select
            name="patientGender"
            required
            value={formData.patientGender}
            onChange={handleChange}
            className="w-full px-3 sm:px-4 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">Select</option>
            <option value="male">Male</option>
            <option value="female">Female</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1 items-center gap-2">
            <Phone className="w-4 h-4 text-blue-500" /> Contact *
          </label>
          <input
            type="tel"
            name="patientContact"
            required
            value={formData.patientContact}
            onChange={handleChange}
            placeholder="Phone number"
            className="w-full px-3 sm:px-4 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <div className="sm:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1 items-center gap-2">
            <User className="w-4 h-4 text-blue-500" /> National ID Number{" "}
            <span className="text-gray-400 text-xs font-normal">
              (Optional)
            </span>
          </label>
          <input
            type="text"
            name="patientNationalId"
            value={formData.patientNationalId}
            onChange={handleChange}
            placeholder="Enter National ID or type 'N/A' for minors"
            className="w-full px-3 sm:px-4 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          <p className="text-xs text-gray-500 mt-1">
            For patients under 18, enter{" "}
            <span className="font-mono bg-gray-100 px-1 rounded">N/A</span>
          </p>
        </div>
      </div>

      <div className="flex justify-end pt-4">
        <Button
          type="button"
          onClick={() => setCurrentStep("medical")}
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 sm:px-6 py-2 rounded-lg font-medium flex items-center gap-2 text-sm sm:text-base"
        >
          Next <ChevronRight className="w-4 h-4" />
        </Button>
      </div>
    </motion.div>
  );

  const renderMedicalStep = () => (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-4"
    >
      <h2 className="text-lg sm:text-xl font-semibold text-gray-800 mb-4">
        Medical Details
      </h2>

      {/* Diagnosis Autocomplete Field */}
      <div className="relative">
        <label className="block text-sm font-medium text-gray-700 mb-1 items-center gap-2">
          <Stethoscope className="w-4 h-4 text-blue-500" /> Diagnosis *
        </label>
        <div className="relative">
          <input
            ref={diagnosisInputRef}
            type="text"
            name="diagnosis"
            required
            value={diagnosisInput}
            onChange={handleDiagnosisChange}
            placeholder="Start typing diagnosis (e.g., Malaria, Diabetes, Hypertension)..."
            className="w-full px-3 sm:px-4 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            autoComplete="off"
          />
        </div>

        {/* Diagnosis Suggestions Dropdown */}
        <AnimatePresence>
          {showDiagnosisDropdown && filteredDiagnoses.length > 0 && (
            <motion.div
              ref={diagnosisDropdownRef}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="absolute z-30 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-xl max-h-60 overflow-y-auto"
            >
              {filteredDiagnoses.map((diagnosis) => (
                <div
                  key={diagnosis}
                  onClick={() => handleDiagnosisSelect(diagnosis)}
                  className="px-4 py-2 hover:bg-blue-50 cursor-pointer text-sm text-gray-700 border-b border-gray-100 last:border-0 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <Stethoscope className="w-3 h-3 text-blue-400" />
                    <span>{diagnosis}</span>
                  </div>
                </div>
              ))}
              <div className="px-4 py-2 text-xs text-gray-400 border-t border-gray-100 bg-gray-50">
                <span>
                  💡 Can't find it? Just type and continue – your entry will be
                  saved
                </span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        <p className="text-xs text-gray-500 mt-1">
          Start typing to see suggestions from common diagnoses. You can also
          enter a custom diagnosis.
        </p>
      </div>

      {/* AI Summarizer Card */}
      <div className="mt-6 p-4 bg-linear-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200">
        <h3 className="text-md font-semibold text-gray-800 flex items-center gap-2 mb-3">
          <Sparkles className="w-5 h-5 text-blue-600" />
          AI Clinical Summary Assistant
        </h3>
        <p className="text-sm text-gray-600 mb-4">
          Generate a clinical summary from medical notes, files, or web pages.
        </p>

        {/* Input method selector */}
        <div className="flex flex-wrap gap-3 mb-4">
          <Button
            type="button"
            variant={aiInputMethod === "text" ? "default" : "outline"}
            size="sm"
            onClick={() => setAiInputMethod("text")}
            className="text-sm"
          >
            <FileText className="w-4 h-4 mr-1" />
            Text
          </Button>
          <Button
            type="button"
            variant={aiInputMethod === "file" ? "default" : "outline"}
            size="sm"
            onClick={() => setAiInputMethod("file")}
            className="text-sm"
          >
            <Upload className="w-4 h-4 mr-1" />
            File
          </Button>
          <Button
            type="button"
            variant={aiInputMethod === "url" ? "default" : "outline"}
            size="sm"
            onClick={() => setAiInputMethod("url")}
            className="text-sm"
          >
            <LinkIcon className="w-4 h-4 mr-1" />
            URL
          </Button>
        </div>

        {/* Dynamic input fields */}
        {aiInputMethod === "text" && (
          <textarea
            rows={4}
            placeholder="Paste medical notes, lab results, referral letter content..."
            value={aiText}
            onChange={(e) => setAiText(e.target.value)}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        )}

        {aiInputMethod === "file" && (
          <div className="space-y-2">
            <input
              type="file"
              accept=".txt,.pdf,.docx,.jpg,.jpeg,.png,.gif,.bmp"
              onChange={(e) => setAiFile(e.target.files?.[0] || null)}
              className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />
            {aiFile && (
              <p className="text-xs text-green-600">Selected: {aiFile.name}</p>
            )}
            <p className="text-xs text-gray-500">
              Supported: images (X‑ray, CT, etc.), PDF, Word, Text files.
            </p>
          </div>
        )}

        {aiInputMethod === "url" && (
          <input
            type="url"
            placeholder="https://example.com/medical-report"
            value={aiUrl}
            onChange={(e) => setAiUrl(e.target.value)}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        )}

        {/* Buttons row */}
        <div className="mt-4 flex flex-wrap gap-2 justify-end">
          <Button
            type="button"
            onClick={generateAISummary}
            disabled={aiLoading}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            {aiLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 mr-2" />
                Generate Summary
              </>
            )}
          </Button>

          {generatedSummary && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowSummaryModal(true)}
              className="text-blue-600"
            >
              <Eye className="w-4 h-4 mr-1" />
              View Summary
            </Button>
          )}
        </div>

        {/* Error / loading message */}
        {aiError && (
          <div className="mt-3 p-2 bg-red-50 text-red-700 text-sm rounded-lg flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" />
            {aiError}
          </div>
        )}
        {!aiError && aiLoading && (
          <div className="mt-3 text-xs text-blue-600">
            Processing, please wait...
          </div>
        )}
      </div>

      {/* Clinical Summary field (manual input) */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1 items-center gap-2">
          <FileText className="w-4 h-4 text-blue-500" /> Clinical Summary *
        </label>
        <textarea
          name="clinicalSummary"
          required
          rows={3}
          value={formData.clinicalSummary}
          onChange={handleChange}
          placeholder="Brief clinical summary (or use the AI assistant above)"
          className="w-full px-3 sm:px-4 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div>
        <label className="text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
          <Activity className="w-4 h-4 text-blue-500" /> Reason for Referral *
        </label>
        <textarea
          name="reasonForReferral"
          required
          rows={2}
          value={formData.reasonForReferral}
          onChange={handleChange}
          placeholder="Why is this patient being referred?"
          className="w-full px-3 sm:px-4 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Urgency *
        </label>
        <div className="flex flex-wrap gap-2">
          {["routine", "urgent", "emergency"].map((level) => (
            <button
              key={level}
              type="button"
              onClick={() =>
                setFormData((prev) => ({ ...prev, urgency: level }))
              }
              className={`px-3 sm:px-4 py-2 rounded-lg capitalize flex items-center gap-2 text-sm transition-all ${
                formData.urgency === level
                  ? getUrgencyColor(level)
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {level === "emergency" && <AlertTriangle className="w-4 h-4" />}
              {level === "urgent" && <Clock className="w-4 h-4" />}
              {level === "routine" && <Info className="w-4 h-4" />}
              {level}
            </button>
          ))}
        </div>
      </div>

      <div className="flex justify-between pt-4">
        <Button
          type="button"
          onClick={() => setCurrentStep("patient")}
          variant="outline"
          className="flex items-center gap-2 text-sm"
        >
          <ChevronLeft className="w-4 h-4" /> Back
        </Button>
        <Button
          type="button"
          onClick={() => setCurrentStep("facility")}
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 sm:px-6 py-2 rounded-lg font-medium flex items-center gap-2 text-sm"
        >
          Next <ChevronRight className="w-4 h-4" />
        </Button>
      </div>

      {/* Custom Modal for viewing summary */}
      <AnimatePresence>
        {showSummaryModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
            onClick={() => setShowSummaryModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-white rounded-xl shadow-xl max-w-3xl w-full max-h-[80vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="sticky top-0 bg-white border-b p-4 flex justify-between items-center">
                <h3 className="text-lg font-semibold">AI-Generated Summary</h3>
                <button
                  onClick={() => setShowSummaryModal(false)}
                  className="p-1 hover:bg-gray-100 rounded-full"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>
              <div className="p-6">
                <SummaryOutput
                  summary={generatedSummary}
                  activeTab="text"
                  confidence={88}
                />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );

  const renderFacilityStep = () => (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-4"
    >
      <h2 className="text-lg sm:text-xl font-semibold text-gray-800 mb-4">
        Receiving Facility
      </h2>

      {/* Facility Selection with Search */}
      <div className="relative">
        <label className="block text-sm font-medium text-gray-700 mb-1 items-center gap-2">
          <Building2 className="w-4 h-4 text-blue-500" /> Facility *
        </label>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search for a facility..."
            value={facilitySearch}
            onChange={(e) => {
              setFacilitySearch(e.target.value);
              setShowFacilityDropdown(true);
            }}
            onFocus={() => setShowFacilityDropdown(true)}
            className="w-full pl-9 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        {/* Facility Dropdown */}
        <AnimatePresence>
          {showFacilityDropdown && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="absolute z-20 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-xl max-h-60 overflow-y-auto"
            >
              {filteredFacilities.length === 0 ? (
                <div className="p-4 text-center text-gray-500 text-sm">
                  No facilities found
                </div>
              ) : (
                filteredFacilities.map((facility) => (
                  <div
                    key={facility._id}
                    onClick={() => handleFacilitySelect(facility)}
                    className="p-3 hover:bg-blue-50 cursor-pointer border-b border-gray-100 last:border-0"
                  >
                    <div className="flex items-start gap-3">
                      <Building2 className="w-5 h-5 text-blue-500 mt-0.5" />
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-800">
                          {facility.name}
                        </h4>
                        <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                          <MapPin className="w-3 h-3" />
                          {facility.city}, {facility.county}
                        </p>
                        <div className="flex gap-2 mt-1">
                          {facility.emergencyServices && (
                            <span className="text-[10px] px-2 py-0.5 bg-red-100 text-red-600 rounded-full">
                              24/7 Emergency
                            </span>
                          )}
                          <span className="text-[10px] px-2 py-0.5 bg-blue-100 text-blue-600 rounded-full">
                            {facility.services.length} services
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Selected Facility Info */}
      {selectedFacility && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-3 bg-blue-50 rounded-lg border border-blue-200"
        >
          <div className="flex justify-between items-start">
            <div>
              <h4 className="font-medium text-blue-800">
                {selectedFacility.name}
              </h4>
              <p className="text-xs text-blue-600 mt-1">
                {selectedFacility.address}, {selectedFacility.city}
              </p>
              <p className="text-xs text-blue-600">{selectedFacility.phone}</p>
            </div>
            <button
              onClick={() => {
                setSelectedFacility(null);
                setFormData((prev) => ({
                  ...prev,
                  referredToFacility: "",
                  referredToDepartment: "",
                  referredToPhysician: "",
                }));
              }}
              className="text-gray-400 hover:text-red-500"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </motion.div>
      )}

      {/* Department Selection */}
      {selectedFacility && facilityDepartments.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Department (Optional)
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-40 overflow-y-auto p-1">
            {facilityDepartments.map((dept) => (
              <button
                key={dept}
                type="button"
                onClick={() => handleDepartmentSelect(dept)}
                className={`p-2 text-xs rounded-lg transition-all ${
                  selectedDepartment === dept
                    ? "bg-blue-500 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                {dept}
              </button>
            ))}
          </div>
        </motion.div>
      )}

      {/* Physician Selection */}
      {selectedFacility && facilityPhysicians.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative"
        >
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Physician (Optional)
          </label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search physicians..."
              value={physicianSearch}
              onChange={(e) => {
                setPhysicianSearch(e.target.value);
                setShowPhysicianDropdown(true);
              }}
              onFocus={() => setShowPhysicianDropdown(true)}
              className="w-full pl-9 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Physician Dropdown */}
          <AnimatePresence>
            {showPhysicianDropdown && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="absolute z-20 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-xl max-h-48 overflow-y-auto"
              >
                {filteredPhysicians.length === 0 ? (
                  <div className="p-3 text-center text-gray-500 text-sm">
                    No physicians found
                  </div>
                ) : (
                  filteredPhysicians.map((phys) => (
                    <div
                      key={phys._id}
                      onClick={() => handlePhysicianSelect(phys)}
                      className="p-3 hover:bg-blue-50 cursor-pointer border-b border-gray-100 last:border-0"
                    >
                      <div className="flex items-center gap-3">
                        <Stethoscope className="w-4 h-4 text-blue-500" />
                        <div>
                          <p className="font-medium text-gray-800 text-sm">
                            Dr. {phys.user?.name}
                          </p>
                          <p className="text-xs text-gray-500">
                            {phys.specialization}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {selectedPhysician && (
            <div className="mt-2 p-2 bg-green-50 rounded-lg flex justify-between items-center">
              <span className="text-sm text-green-700">
                Selected: Dr. {selectedPhysician.user?.name}
              </span>
              <button
                onClick={() => {
                  setSelectedPhysician(null);
                  setFormData((prev) => ({ ...prev, referredToPhysician: "" }));
                }}
                className="text-gray-400 hover:text-red-500"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          )}
        </motion.div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Additional Notes (Optional)
        </label>
        <textarea
          name="physicianNotes"
          rows={2}
          value={formData.physicianNotes}
          onChange={handleChange}
          placeholder="Any additional information"
          className="w-full px-3 sm:px-4 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div className="flex justify-between pt-4">
        <Button
          type="button"
          onClick={() => setCurrentStep("medical")}
          variant="outline"
          className="flex items-center gap-2 text-sm"
        >
          <ChevronLeft className="w-4 h-4" /> Back
        </Button>
        <Button
          type="button"
          onClick={() => setCurrentStep("review")}
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 sm:px-6 py-2 rounded-lg font-medium flex items-center gap-2 text-sm"
          disabled={!selectedFacility}
        >
          Next <ChevronRight className="w-4 h-4" />
        </Button>
      </div>
    </motion.div>
  );

  const renderReviewStep = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4"
    >
      <div className="bg-blue-50 p-4 sm:p-6 rounded-lg border border-blue-100">
        <h3 className="text-base sm:text-lg font-semibold text-gray-800 mb-4">
          Review Referral
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-4">
          <div className="bg-white p-3 rounded-lg">
            <p className="text-xs text-gray-500">Patient</p>
            <p className="font-medium text-sm">{formData.patientName || "—"}</p>
            <p className="text-xs text-gray-600">
              {formData.patientAge} yrs • {formData.patientGender}
            </p>
            {formData.patientNationalId && (
              <p className="text-xs text-gray-500 mt-1">
                ID: {formData.patientNationalId}
              </p>
            )}
          </div>

          <div className="bg-white p-3 rounded-lg">
            <p className="text-xs text-gray-500">Diagnosis</p>
            <p className="font-medium text-sm">{formData.diagnosis || "—"}</p>
            <span
              className={`text-[10px] px-2 py-0.5 rounded-full ${getUrgencyColor(formData.urgency)}`}
            >
              {formData.urgency}
            </span>
          </div>

          <div className="bg-white p-3 rounded-lg sm:col-span-2">
            <p className="text-xs text-gray-500">Receiving Facility</p>
            <p className="font-medium text-sm">
              {selectedFacility?.name || "—"}
            </p>
            {selectedDepartment && (
              <p className="text-xs text-gray-600">
                Dept: {selectedDepartment}
              </p>
            )}
            {selectedPhysician && (
              <p className="text-xs text-gray-600">
                Dr. {selectedPhysician.user?.name}
              </p>
            )}
          </div>

          <div className="bg-white p-3 rounded-lg">
            <p className="text-xs text-gray-500">Referring Physician</p>
            <p className="font-medium text-sm">Dr. {physician?.fullName}</p>
            <p className="text-xs text-gray-600">{physician?.hospital}</p>
          </div>
        </div>

        {formData.physicianNotes && (
          <div className="bg-white p-3 rounded-lg">
            <p className="text-xs text-gray-500">Notes</p>
            <p className="text-sm text-gray-700">{formData.physicianNotes}</p>
          </div>
        )}
      </div>

      <div className="flex justify-between pt-4">
        <Button
          type="button"
          onClick={() => setCurrentStep("facility")}
          variant="outline"
          className="flex items-center gap-2 text-sm"
        >
          <ChevronLeft className="w-4 h-4" /> Back
        </Button>
        <Button
          type="submit"
          disabled={isSubmitting}
          className="bg-green-500 hover:bg-green-600 text-white px-4 sm:px-6 py-2 rounded-lg font-medium flex items-center gap-2 text-sm"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Creating Referral...
            </>
          ) : (
            <>
              <Send className="w-4 h-4" />
              Create Referral
            </>
          )}
        </Button>
      </div>
    </motion.div>
  );

  return (
    <div className="min-h-screen bg-gray-50 p-3 sm:p-4 md:p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-md p-3 sm:p-4 mb-4">
          <div className="flex items-center justify-between">
            <button
              onClick={onBack}
              className="flex items-center gap-2 text-gray-600 hover:text-blue-600 transition-colors text-sm"
            >
              <ArrowLeft className="w-4 h-5 sm:w-5 sm:h-5" />
              <span className="hidden sm:inline">Back</span>
            </button>
            <h1 className="text-base sm:text-xl md:text-2xl font-bold text-blue-600">
              Create Referral
            </h1>
            <div className="w-8 sm:w-16"></div>
          </div>
        </div>

        {/* Success Animation */}
        <AnimatePresence>
          {showSuccessAnimation && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 flex items-center justify-center z-50 bg-black/50 p-4"
            >
              <motion.div
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}
                className="bg-white rounded-xl p-6 text-center shadow-xl max-w-sm w-full"
              >
                <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto mb-3" />
                <p className="text-gray-800 font-medium">{success}</p>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Error Message */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg flex items-center gap-2 text-sm">
            <XCircle className="w-5 h-5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Form Card */}
        <Card className="bg-white shadow-xl border-0">
          <div className="p-4 sm:p-6">
            {renderStepIndicator()}
            <form onSubmit={handleSubmit}>
              <AnimatePresence mode="wait">
                {currentStep === "patient" && renderPatientStep()}
                {currentStep === "medical" && renderMedicalStep()}
                {currentStep === "facility" && renderFacilityStep()}
                {currentStep === "review" && renderReviewStep()}
              </AnimatePresence>
            </form>
          </div>
        </Card>
      </div>
    </div>
  );
}
