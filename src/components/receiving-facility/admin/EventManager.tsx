"use client";

import { useState } from "react";
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
  Edit,
  Save,
  X,
  Loader2,
  Plus,
  Trash2,
  AlertCircle,
  Clock,
  CalendarDays,
  Building2,
} from "lucide-react";
import { format, startOfMonth, endOfMonth } from "date-fns";

interface EventManagerProps {
  facilityId: Id<"facilities">;
  token: string;
}

interface Event {
  _id: Id<"facilityEvents">;
  title: string;
  description?: string;
  eventType: "meeting" | "holiday" | "training" | "maintenance" | "other";
  startDate: string;
  endDate: string;
  isAllDay: boolean;
}

export default function EventManager({ facilityId, token }: EventManagerProps) {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  // Form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [eventType, setEventType] = useState<Event["eventType"]>("meeting");
  const [startDate, setStartDate] = useState<Date | null>(new Date());
  const [endDate, setEndDate] = useState<Date | null>(new Date());
  const [isAllDay, setIsAllDay] = useState(true);

  // Fetch events for current month
  const now = new Date();
  const monthStart = startOfMonth(now).toISOString();
  const monthEnd = endOfMonth(now).toISOString();

  const events = useQuery(
    api.receivingFacility.queries.getEventsByDateRange,
    facilityId && token
      ? {
          facilityId,
          startDate: monthStart,
          endDate: monthEnd,
          token,
        }
      : "skip",
  );

  // Mutations
  const createEvent = useMutation(api.receivingFacility.mutations.createEvent);
  const updateEvent = useMutation(api.receivingFacility.mutations.updateEvent);
  const deleteEvent = useMutation(api.receivingFacility.mutations.deleteEvent);

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setEventType("meeting");
    setStartDate(new Date());
    setEndDate(new Date());
    setIsAllDay(true);
    setEditingEvent(null);
  };

  const handleCreate = async () => {
    if (!title || !startDate || !endDate) return;

    setIsSubmitting(true);
    try {
      const result = await createEvent({
        facilityId,
        title,
        description: description || undefined,
        eventType,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        isAllDay,
        token,
      });

      setSuccessMessage("Event created successfully");
      setShowSuccess(true);
      setShowCreateForm(false);
      resetForm();
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (error) {
      console.error("Error creating event:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdate = async () => {
    if (!editingEvent || !title || !startDate || !endDate) return;

    setIsSubmitting(true);
    try {
      await updateEvent({
        eventId: editingEvent._id,
        title,
        description: description || undefined,
        eventType,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        isAllDay,
        token,
      });

      setSuccessMessage("Event updated successfully");
      setShowSuccess(true);
      setEditingEvent(null);
      resetForm();
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (error) {
      console.error("Error updating event:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!editingEvent) return;

    setIsSubmitting(true);
    try {
      await deleteEvent({
        eventId: editingEvent._id,
        token,
      });

      setSuccessMessage("Event deleted successfully");
      setShowSuccess(true);
      setShowDeleteConfirm(false);
      setEditingEvent(null);
      resetForm();
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (error) {
      console.error("Error deleting event:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getEventTypeColor = (type: string) => {
    switch (type) {
      case "meeting":
        return "bg-blue-100 text-blue-700 border-blue-200";
      case "holiday":
        return "bg-green-100 text-green-700 border-green-200";
      case "training":
        return "bg-purple-100 text-purple-700 border-purple-200";
      case "maintenance":
        return "bg-yellow-100 text-yellow-700 border-yellow-200";
      default:
        return "bg-gray-100 text-gray-700 border-gray-200";
    }
  };

  return (
    <div className="space-y-6">
      {/* Success Message */}
      <AnimatePresence>
        {showSuccess && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-3"
          >
            <CheckCircle2 className="w-5 h-5 text-green-500" />
            <span className="text-green-700">{successMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
          <CalendarDays className="w-5 h-5 text-purple-500" />
          Facility Events
        </h3>
        <Button
          onClick={() => {
            resetForm();
            setShowCreateForm(true);
          }}
          className="bg-purple-500 hover:bg-purple-600 text-white flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Add Event
        </Button>
      </div>

      {/* Create/Edit Form */}
      <AnimatePresence>
        {(showCreateForm || editingEvent) && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="p-6 bg-white rounded-xl border-2 border-purple-200 shadow-lg"
          >
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              {editingEvent ? "Edit Event" : "Create New Event"}
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Event Title *
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g., Staff Meeting, Public Holiday"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Event Type
                </label>
                <select
                  value={eventType}
                  onChange={(e) =>
                    setEventType(e.target.value as Event["eventType"])
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                >
                  <option value="meeting">Meeting</option>
                  <option value="training">Training</option>
                  <option value="holiday">Holiday</option>
                  <option value="maintenance">Maintenance</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Start Date
                  </label>
                  <DatePicker
                    selected={startDate}
                    onChange={(date) => setStartDate(date)}
                    showTimeSelect={!isAllDay}
                    dateFormat={
                      isAllDay ? "MMMM d, yyyy" : "MMMM d, yyyy h:mm aa"
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    End Date
                  </label>
                  <DatePicker
                    selected={endDate}
                    onChange={(date) => setEndDate(date)}
                    showTimeSelect={!isAllDay}
                    dateFormat={
                      isAllDay ? "MMMM d, yyyy" : "MMMM d, yyyy h:mm aa"
                    }
                    minDate={startDate || undefined}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isAllDay"
                  checked={isAllDay}
                  onChange={(e) => setIsAllDay(e.target.checked)}
                  className="w-4 h-4 text-purple-600"
                />
                <label htmlFor="isAllDay" className="text-sm">
                  All day event
                </label>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description (Optional)
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  placeholder="Additional details about the event..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>

              <div className="flex gap-2 pt-4">
                <Button
                  onClick={editingEvent ? handleUpdate : handleCreate}
                  disabled={isSubmitting || !title || !startDate || !endDate}
                  className="bg-green-500 hover:bg-green-600 text-white"
                >
                  {isSubmitting ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : editingEvent ? (
                    <Save className="w-4 h-4 mr-2" />
                  ) : (
                    <Plus className="w-4 h-4 mr-2" />
                  )}
                  {editingEvent ? "Update Event" : "Create Event"}
                </Button>
                <Button
                  onClick={() => {
                    setShowCreateForm(false);
                    setEditingEvent(null);
                    resetForm();
                  }}
                  variant="outline"
                >
                  Cancel
                </Button>
                {editingEvent && (
                  <Button
                    onClick={() => setShowDeleteConfirm(true)}
                    variant="destructive"
                    className="ml-auto"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete
                  </Button>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Events List */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">
          Upcoming Events
        </h3>
        {!events || events.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Calendar className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p>No events scheduled</p>
          </div>
        ) : (
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {events
              .filter((e) => new Date(e.endDate) >= new Date())
              .sort((a, b) => a.startDate.localeCompare(b.startDate))
              .map((event) => (
                <div
                  key={event._id}
                  onClick={() => {
                    setEditingEvent(event);
                    setTitle(event.title);
                    setDescription(event.description || "");
                    setEventType(event.eventType);
                    setStartDate(new Date(event.startDate));
                    setEndDate(new Date(event.endDate));
                    setIsAllDay(event.isAllDay);
                  }}
                  className="p-4 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="font-semibold text-gray-800">
                          {event.title}
                        </h4>
                        <span
                          className={`text-xs px-2 py-1 rounded-full ${getEventTypeColor(event.eventType)}`}
                        >
                          {event.eventType}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {format(new Date(event.startDate), "MMM d")}
                          {!event.isAllDay &&
                            format(new Date(event.startDate), " h:mm a")}
                          {event.startDate !== event.endDate && (
                            <>
                              {" "}
                              - {format(new Date(event.endDate), "MMM d")}
                              {!event.isAllDay &&
                                format(new Date(event.endDate), " h:mm a")}
                            </>
                          )}
                        </span>
                        {event.isAllDay && (
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            All day
                          </span>
                        )}
                      </div>
                      {event.description && (
                        <p className="text-xs text-gray-500 mt-2">
                          {event.description}
                        </p>
                      )}
                    </div>
                    <Edit className="w-4 h-4 text-gray-400 hover:text-purple-500" />
                  </div>
                </div>
              ))}
          </div>
        )}
      </Card>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {showDeleteConfirm && (
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
              className="bg-white rounded-xl max-w-md w-full p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-3 text-red-600 mb-4">
                <AlertCircle className="w-6 h-6" />
                <h3 className="text-lg font-semibold">Confirm Deletion</h3>
              </div>
              <p className="text-gray-600 mb-6">
                Are you sure you want to delete this event? This action cannot
                be undone.
              </p>
              <div className="flex gap-3 justify-end">
                <Button
                  onClick={() => setShowDeleteConfirm(false)}
                  variant="outline"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleDelete}
                  disabled={isSubmitting}
                  className="bg-red-500 hover:bg-red-600 text-white"
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
    </div>
  );
}
