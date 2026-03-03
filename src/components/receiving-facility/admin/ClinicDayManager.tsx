"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@convex/_generated/api";
import { Id } from "@convex/_generated/dataModel";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import {
  Calendar,
  CheckCircle2,
  XCircle,
  Save,
  Loader2,
  Users,
  Plus,
  Trash2,
  AlertCircle,
  Sun,
  Moon,
  Edit3,
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  X,
  Clock,
} from "lucide-react";
import { format, parseISO, isBefore, startOfDay } from "date-fns";

interface ClinicDayManagerProps {
  facilityId: Id<"facilities">;
  facilityName: string;
  token: string;
}

interface ClinicDay {
  _id?: Id<"clinicSchedule">;
  date: string;
  isOpen: boolean;
  maxPatients: number;
  currentBookings: number;
}

export default function ClinicDayManager({
  facilityId,
  facilityName,
  token,
}: ClinicDayManagerProps) {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [editingDay, setEditingDay] = useState<ClinicDay | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [dayToDelete, setDayToDelete] = useState<ClinicDay | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newDate, setNewDate] = useState<Date | null>(null);
  const [newMaxPatients, setNewMaxPatients] = useState(20);
  const [newIsOpen, setNewIsOpen] = useState(true);

  // Check for stored date from calendar
  useEffect(() => {
    const storedDate = localStorage.getItem("selectedClinicDate");
    if (storedDate) {
      setSelectedDate(new Date(storedDate));
      localStorage.removeItem("selectedClinicDate");
    }
  }, []);

  // Fetch clinic day for selected date
  const clinicDay = useQuery(
    api.receivingFacility.queries.getClinicDayByDate,
    facilityId && token
      ? {
          facilityId,
          date: format(selectedDate, "yyyy-MM-dd"),
          token,
        }
      : "skip",
  );

  // Fetch all clinic days
  const allClinicDays = useQuery(
    api.receivingFacility.queries.getAllClinicDays,
    facilityId && token ? { facilityId, token } : "skip",
  );

  // Mutations
  const createOrUpdateClinicDay = useMutation(
    api.receivingFacility.mutations.createOrUpdateClinicDay,
  );
  const deleteClinicDay = useMutation(
    api.receivingFacility.mutations.deleteClinicDay,
  );

  useEffect(() => {
    if (clinicDay) {
      setEditingDay({
        _id: clinicDay._id,
        date: clinicDay.date,
        isOpen: clinicDay.isOpen,
        maxPatients: clinicDay.maxPatients,
        currentBookings: clinicDay.currentBookings,
      });
    } else {
      // No existing clinic day for this date
      setEditingDay({
        date: format(selectedDate, "yyyy-MM-dd"),
        isOpen: true,
        maxPatients: 20,
        currentBookings: 0,
      });
    }
  }, [selectedDate, clinicDay]);

  const handleSave = async () => {
    if (!editingDay) return;

    setIsSubmitting(true);
    try {
      const result = await createOrUpdateClinicDay({
        facilityId,
        date: editingDay.date,
        isOpen: editingDay.isOpen,
        maxPatients: editingDay.maxPatients,
        token,
      });

      setSuccessMessage(result.message);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (error) {
      console.error("Error updating clinic day:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!dayToDelete?._id) return;

    setIsSubmitting(true);
    try {
      await deleteClinicDay({
        clinicDayId: dayToDelete._id,
        token,
      });

      setSuccessMessage("Clinic day deleted successfully");
      setShowSuccess(true);
      setShowDeleteConfirm(false);
      setDayToDelete(null);

      // Refresh the editing day
      setEditingDay({
        date: format(selectedDate, "yyyy-MM-dd"),
        isOpen: true,
        maxPatients: 20,
        currentBookings: 0,
      });

      setTimeout(() => setShowSuccess(false), 3000);
    } catch (error) {
      console.error("Error deleting clinic day:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateNew = async () => {
    if (!newDate) return;

    setIsSubmitting(true);
    try {
      const result = await createOrUpdateClinicDay({
        facilityId,
        date: format(newDate, "yyyy-MM-dd"),
        isOpen: newIsOpen,
        maxPatients: newMaxPatients,
        token,
      });

      setSuccessMessage(
        `Clinic day created for ${format(newDate, "MMMM d, yyyy")}`,
      );
      setShowSuccess(true);
      setShowCreateForm(false);
      setSelectedDate(newDate);
      setNewDate(null);
      setNewMaxPatients(20);
      setNewIsOpen(true);
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (error) {
      console.error("Error creating clinic day:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditDay = (day: ClinicDay) => {
    setSelectedDate(parseISO(day.date));
    setEditingDay(day);
  };

  const sortedClinicDays =
    allClinicDays
      ?.filter((day) => !isBefore(parseISO(day.date), startOfDay(new Date())))
      .sort((a, b) => a.date.localeCompare(b.date)) || [];

  return (
    <div className="space-y-6">
      {/* Success Message */}
      <AnimatePresence>
        {showSuccess && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="p-4 bg-green-50 border border-green-200 rounded-xl flex items-center gap-3 shadow-sm"
          >
            <div className="p-1 bg-green-100 rounded-full">
              <CheckCircle2 className="w-5 h-5 text-green-600" />
            </div>
            <span className="text-green-700 font-medium">{successMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header with Create Button */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-800">
          Clinic Day Management
        </h2>
        <Button
          onClick={() => setShowCreateForm(true)}
          className="bg-purple-500 hover:bg-purple-600 text-white flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Add New Clinic Day
        </Button>
      </div>

      {/* Create New Form */}
      <AnimatePresence>
        {showCreateForm && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="mb-6 p-6 bg-white rounded-xl border-2 border-purple-200 shadow-lg"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                <Plus className="w-5 h-5 text-purple-500" />
                Create New Clinic Day
              </h3>
              <button
                onClick={() => setShowCreateForm(false)}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Date *
                </label>
                <DatePicker
                  selected={newDate}
                  onChange={(date) => setNewDate(date)}
                  minDate={new Date()}
                  dateFormat="MMMM d, yyyy"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                  placeholderText="Click to select a date"
                />
              </div>

              {newDate && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Status
                    </label>
                    <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                      <button
                        onClick={() => setNewIsOpen(true)}
                        className={`flex-1 py-2 px-4 rounded-lg flex items-center justify-center gap-2 transition-all ${
                          newIsOpen
                            ? "bg-green-500 text-white"
                            : "bg-white text-gray-700 hover:bg-gray-100"
                        }`}
                      >
                        <Sun className="w-4 h-4" />
                        Open
                      </button>
                      <button
                        onClick={() => setNewIsOpen(false)}
                        className={`flex-1 py-2 px-4 rounded-lg flex items-center justify-center gap-2 transition-all ${
                          !newIsOpen
                            ? "bg-red-500 text-white"
                            : "bg-white text-gray-700 hover:bg-gray-100"
                        }`}
                      >
                        <Moon className="w-4 h-4" />
                        Closed
                      </button>
                    </div>
                  </div>

                  {newIsOpen && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Maximum Patients
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="100"
                        value={newMaxPatients}
                        onChange={(e) =>
                          setNewMaxPatients(parseInt(e.target.value))
                        }
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                  )}

                  <div className="flex gap-3 pt-4">
                    <Button
                      onClick={handleCreateNew}
                      disabled={isSubmitting}
                      className="flex-1 bg-linear-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white py-3"
                    >
                      {isSubmitting ? (
                        <Loader2 className="w-5 h-5 animate-spin mr-2" />
                      ) : (
                        <Plus className="w-5 h-5 mr-2" />
                      )}
                      Create Clinic Day
                    </Button>
                    <Button
                      onClick={() => setShowCreateForm(false)}
                      variant="outline"
                      className="px-6"
                    >
                      Cancel
                    </Button>
                  </div>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column - All Clinic Days List */}
        <Card className="p-6 bg-white">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-purple-500" />
            All Clinic Days ({sortedClinicDays.length})
          </h3>

          {sortedClinicDays.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-xl">
              <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">No clinic days configured</p>
              <p className="text-sm text-gray-400 mt-1">
                Click "Add New Clinic Day" to get started
              </p>
            </div>
          ) : (
            <div className="space-y-3 max-h-150 overflow-y-auto pr-2">
              {sortedClinicDays.map((day) => (
                <motion.div
                  key={day._id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="group relative"
                >
                  <div
                    className={`p-4 rounded-xl border-2 transition-all cursor-pointer ${
                      editingDay?._id === day._id
                        ? "border-purple-500 bg-purple-50"
                        : "border-gray-200 hover:border-purple-200 hover:shadow-md"
                    }`}
                    onClick={() => handleEditDay(day)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        <div
                          className={`p-2 rounded-lg ${
                            day.isOpen ? "bg-green-100" : "bg-red-100"
                          }`}
                        >
                          {day.isOpen ? (
                            <Sun className="w-5 h-5 text-green-600" />
                          ) : (
                            <Moon className="w-5 h-5 text-red-600" />
                          )}
                        </div>
                        <div>
                          <p className="font-semibold text-gray-800">
                            {format(parseISO(day.date), "EEEE, MMMM d, yyyy")}
                          </p>
                          <div className="flex items-center gap-3 mt-2">
                            <span
                              className={`text-xs px-2 py-1 rounded-full ${
                                day.isOpen
                                  ? "bg-green-100 text-green-700"
                                  : "bg-red-100 text-red-700"
                              }`}
                            >
                              {day.isOpen ? "Open" : "Closed"}
                            </span>
                            {day.isOpen && (
                              <>
                                <span className="text-xs text-gray-500 flex items-center gap-1">
                                  <Users className="w-3 h-3" />
                                  {day.currentBookings}/{day.maxPatients}
                                </span>
                                <span className="text-xs text-gray-500 flex items-center gap-1">
                                  <Clock className="w-3 h-3" />
                                  {day.maxPatients - day.currentBookings} slots
                                  left
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setDayToDelete(day);
                          setShowDeleteConfirm(true);
                        }}
                        className="p-2 hover:bg-red-100 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </button>
                    </div>

                    {/* Progress bar for open days */}
                    {day.isOpen && (
                      <div className="mt-3">
                        <div className="w-full bg-gray-200 rounded-full h-1.5">
                          <div
                            className="bg-purple-500 h-1.5 rounded-full transition-all"
                            style={{
                              width: `${(day.currentBookings / day.maxPatients) * 100}%`,
                            }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </Card>

        {/* Right Column - Edit Selected Day */}
        <Card className="p-6 bg-linear-to-br from-purple-50 to-white">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <Edit3 className="w-5 h-5 text-purple-500" />
            {editingDay?._id ? "Edit Clinic Day" : "Configure New Day"}
          </h3>

          {editingDay && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-6"
            >
              {/* Date Display */}
              <div className="p-4 bg-white rounded-xl border border-purple-100">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Date
                </label>
                <p className="text-lg font-semibold text-gray-800">
                  {format(parseISO(editingDay.date), "EEEE, MMMM d, yyyy")}
                </p>
              </div>

              {/* Status Toggle */}
              <div className="p-4 bg-white rounded-xl border border-purple-100">
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Clinic Status
                </label>
                <div className="flex items-center gap-4">
                  <button
                    onClick={() =>
                      setEditingDay({ ...editingDay, isOpen: true })
                    }
                    className={`flex-1 py-3 px-4 rounded-lg flex items-center justify-center gap-2 transition-all ${
                      editingDay.isOpen
                        ? "bg-green-500 text-white shadow-lg"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    }`}
                  >
                    <Sun className="w-5 h-5" />
                    Open
                  </button>
                  <button
                    onClick={() =>
                      setEditingDay({ ...editingDay, isOpen: false })
                    }
                    className={`flex-1 py-3 px-4 rounded-lg flex items-center justify-center gap-2 transition-all ${
                      !editingDay.isOpen
                        ? "bg-red-500 text-white shadow-lg"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    }`}
                  >
                    <Moon className="w-5 h-5" />
                    Closed
                  </button>
                </div>
              </div>

              {/* Max Patients Slider */}
              {editingDay.isOpen && (
                <div className="p-4 bg-white rounded-xl border border-purple-100">
                  <div className="flex items-center justify-between mb-3">
                    <label className="text-sm font-medium text-gray-700">
                      Maximum Patients
                    </label>
                    <span className="text-2xl font-bold text-purple-600">
                      {editingDay.maxPatients}
                    </span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="100"
                    value={editingDay.maxPatients}
                    onChange={(e) =>
                      setEditingDay({
                        ...editingDay,
                        maxPatients: parseInt(e.target.value),
                      })
                    }
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-purple-500"
                  />
                  <div className="flex justify-between text-xs text-gray-500 mt-2">
                    <span>1</span>
                    <span>50</span>
                    <span>100</span>
                  </div>
                </div>
              )}

              {/* Current Bookings Info */}
              {editingDay._id && (
                <div className="p-4 bg-blue-50 rounded-xl border border-blue-100">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Users className="w-5 h-5 text-blue-600" />
                      <span className="text-sm font-medium text-blue-700">
                        Current Bookings
                      </span>
                    </div>
                    <span className="text-2xl font-bold text-blue-700">
                      {editingDay.currentBookings}
                    </span>
                  </div>
                  {editingDay.isOpen && (
                    <>
                      <div className="w-full bg-blue-200 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full transition-all"
                          style={{
                            width: `${(editingDay.currentBookings / editingDay.maxPatients) * 100}%`,
                          }}
                        />
                      </div>
                      <p className="text-xs text-blue-600 mt-2">
                        {editingDay.maxPatients - editingDay.currentBookings}{" "}
                        slots remaining
                      </p>
                    </>
                  )}
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4">
                <Button
                  onClick={handleSave}
                  disabled={isSubmitting}
                  className="flex-1 bg-linear-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white py-3"
                >
                  {isSubmitting ? (
                    <Loader2 className="w-5 h-5 animate-spin mr-2" />
                  ) : (
                    <Save className="w-5 h-5 mr-2" />
                  )}
                  {editingDay._id ? "Update Changes" : "Create Day"}
                </Button>
                {editingDay._id && (
                  <Button
                    onClick={() => {
                      setDayToDelete(editingDay);
                      setShowDeleteConfirm(true);
                    }}
                    variant="destructive"
                    className="bg-red-500 hover:bg-red-600 text-white px-6"
                  >
                    <Trash2 className="w-5 h-5" />
                  </Button>
                )}
              </div>
            </motion.div>
          )}
        </Card>
      </div>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {showDeleteConfirm && dayToDelete && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
            onClick={() => setShowDeleteConfirm(false)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-white rounded-xl max-w-md w-full p-6 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-3 text-red-600 mb-4">
                <div className="p-2 bg-red-100 rounded-full">
                  <AlertCircle className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-semibold">Delete Clinic Day</h3>
              </div>

              <p className="text-gray-600 mb-2">
                Are you sure you want to delete the clinic day for:
              </p>
              <p className="font-semibold text-gray-800 mb-4">
                {format(parseISO(dayToDelete.date), "EEEE, MMMM d, yyyy")}
              </p>
              <p className="text-sm text-red-500 mb-6">
                This action cannot be undone. All settings for this day will be
                permanently removed.
              </p>

              <div className="flex gap-3">
                <Button
                  onClick={() => setShowDeleteConfirm(false)}
                  variant="outline"
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleDelete}
                  disabled={isSubmitting}
                  className="flex-1 bg-red-500 hover:bg-red-600 text-white"
                >
                  {isSubmitting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    "Delete"
                  )}
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Info Card */}
      <Card className="p-6 bg-linear-to-br from-purple-50 to-blue-50 border-purple-100">
        <h3 className="font-semibold text-purple-800 mb-3 flex items-center gap-2">
          <Calendar className="w-5 h-5" />
          About Clinic Day Management
        </h3>
        <ul className="space-y-2 text-sm text-purple-700">
          <li className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 bg-purple-400 rounded-full" />
            <span className="flex-1">
              <strong>Add</strong> - Create new clinic days for future dates
            </span>
          </li>
          <li className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 bg-purple-400 rounded-full" />
            <span className="flex-1">
              <strong>Edit</strong> - Modify date, status, and patient capacity
            </span>
          </li>
          <li className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 bg-purple-400 rounded-full" />
            <span className="flex-1">
              <strong>Delete</strong> - Remove clinic days
            </span>
          </li>
          <li className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 bg-purple-400 rounded-full" />
            <span className="flex-1">
              <strong>Real-time updates</strong> - Changes reflect immediately
            </span>
          </li>
        </ul>
      </Card>
    </div>
  );
}
