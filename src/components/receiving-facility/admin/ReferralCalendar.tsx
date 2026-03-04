"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import { Id } from "@convex/_generated/dataModel";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  addMonths,
  subMonths,
  startOfWeek,
  endOfWeek,
} from "date-fns";
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  FileText,
  Clock,
  AlertCircle,
  X,
  CheckCircle2,
  Settings2,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface ReferralCalendarProps {
  facilityId: Id<"facilities">;
  facilityName: string;
  token: string;
  onDateSelect?: (date: Date) => void;
}

interface DayReferrals {
  date: Date;
  referrals: any[];
  clinicDay?: {
    isOpen: boolean;
    maxPatients: number;
    currentBookings: number;
  };
  events?: any[];
}

export default function ReferralCalendar({
  facilityId,
  facilityName,
  token,
  onDateSelect,
}: ReferralCalendarProps) {
  const router = useRouter();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [showDayDetails, setShowDayDetails] = useState(false);
  const [showEventModal, setShowEventModal] = useState(false);
  const [selectedEvents, setSelectedEvents] = useState<any[]>([]);

  // Fetch referrals for the month
  const monthReferrals = useQuery(
    api.receivingFacility.queries.getMonthReferrals,
    {
      facilityName,
      month: format(currentMonth, "yyyy-MM"),
      token,
    },
  );

  // Fetch clinic schedule for the month
  const monthSchedule = useQuery(
    api.receivingFacility.queries.getMonthSchedule,
    {
      facilityId,
      month: format(currentMonth, "yyyy-MM"),
      token,
    },
  );

  // Fetch events for the month
  const monthEvents = useQuery(api.receivingFacility.queries.getMonthEvents, {
    facilityId,
    month: format(currentMonth, "yyyy-MM"),
    token,
  });

  // Fetch all clinic days for status indicators
  const allClinicDays = useQuery(
    api.receivingFacility.queries.getAllClinicDays,
    facilityId && token ? { facilityId, token } : "skip",
  );

  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
  const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));

  // Get all days in the month
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart);
  const endDate = endOfWeek(monthEnd);

  const days = eachDayOfInterval({ start: startDate, end: endDate });

  const getDayReferrals = (date: Date): DayReferrals => {
    const dateStr = format(date, "yyyy-MM-dd");
    const referrals =
      monthReferrals?.filter(
        (r: any) => format(new Date(r.createdAt), "yyyy-MM-dd") === dateStr,
      ) || [];

    const clinicDay = monthSchedule?.find((s: any) => s.date === dateStr);
    const events =
      monthEvents?.filter(
        (e: any) => format(new Date(e.startDate), "yyyy-MM-dd") === dateStr,
      ) || [];

    return { date, referrals, clinicDay, events };
  };

  const getDayStatusColor = (dayInfo: DayReferrals) => {
    if (!isSameMonth(dayInfo.date, currentMonth))
      return "bg-gray-50 text-gray-400";

    // Check if there are events on this day
    if (dayInfo.events && dayInfo.events.length > 0) {
      const hasHoliday = dayInfo.events.some((e) => e.eventType === "holiday");
      if (hasHoliday) return "bg-purple-100 text-purple-800 border-purple-300";
    }

    // Check clinic day status
    if (dayInfo.clinicDay) {
      if (!dayInfo.clinicDay.isOpen)
        return "bg-red-100 text-red-800 border-red-300";
      if (dayInfo.clinicDay.currentBookings >= dayInfo.clinicDay.maxPatients)
        return "bg-yellow-100 text-yellow-800 border-yellow-300";
    }

    // Check referrals
    if (dayInfo.referrals.length > 0) {
      const hasUrgent = dayInfo.referrals.some(
        (r) => r.urgency === "emergency",
      );
      const hasPending = dayInfo.referrals.some((r) => r.status === "pending");
      if (hasUrgent) return "bg-red-100 text-red-800 border-red-300";
      if (hasPending) return "bg-yellow-100 text-yellow-800 border-yellow-300";
      return "bg-green-100 text-green-800 border-green-300";
    }

    return "bg-white text-gray-800 hover:bg-gray-50";
  };

  const handleDayClick = (dayInfo: DayReferrals) => {
    setSelectedDate(dayInfo.date);
    setShowDayDetails(true);
    setSelectedEvents(dayInfo.events || []);
    if (onDateSelect) onDateSelect(dayInfo.date);
  };

  const handleManageDay = (date: Date) => {
    // Store the date in localStorage
    localStorage.setItem("selectedClinicDate", date.toISOString());
    // Close the modal
    setShowDayDetails(false);
    // Navigate to manage tab using router.push
    router.push("/dashboard/receive/admin?tab=manage");
  };

  const handleViewEvents = (events: any[]) => {
    setSelectedEvents(events);
    setShowEventModal(true);
  };

  return (
    <div className="space-y-4">
      {/* Calendar Header */}
      <Card className="p-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-800">
            {format(currentMonth, "MMMM yyyy")}
          </h2>
          <div className="flex gap-2">
            <Button onClick={prevMonth} variant="outline" size="sm">
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button onClick={nextMonth} variant="outline" size="sm">
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap gap-4 mt-4 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-red-100 border border-red-300 rounded"></div>
            <span>Emergency/Closed</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-yellow-100 border border-yellow-300 rounded"></div>
            <span>Pending/Full</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-green-100 border border-green-300 rounded"></div>
            <span>Completed/Open</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-purple-100 border border-purple-300 rounded"></div>
            <span>Events/Holidays</span>
          </div>
        </div>
      </Card>

      {/* Calendar Grid */}
      <Card className="p-4">
        {/* Weekday Headers */}
        <div className="grid grid-cols-7 gap-2 mb-2">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
            <div
              key={day}
              className="text-center text-sm font-medium text-gray-500 py-2"
            >
              {day}
            </div>
          ))}
        </div>

        {/* Days Grid */}
        <div className="grid grid-cols-7 gap-2">
          {days.map((day) => {
            const dayInfo = getDayReferrals(day);
            const statusColor = getDayStatusColor(dayInfo);
            const isSelected = selectedDate && isSameDay(day, selectedDate);
            const hasEvents = dayInfo.events && dayInfo.events.length > 0;

            return (
              <motion.div
                key={day.toString()}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleDayClick(dayInfo)}
                className={`
                  p-3 rounded-lg cursor-pointer transition-all border-2 relative
                  ${statusColor}
                  ${isSelected ? "border-purple-500 shadow-md" : "border-transparent hover:border-purple-200"}
                  ${!isSameMonth(day, currentMonth) ? "opacity-50" : ""}
                `}
              >
                <div className="text-sm font-semibold mb-1">
                  {format(day, "d")}
                </div>

                {/* Event Indicator */}
                {hasEvents && (
                  <div className="absolute top-1 right-1">
                    <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                  </div>
                )}

                {/* Referral Count */}
                {dayInfo.referrals.length > 0 && (
                  <div className="text-xs font-medium">
                    {dayInfo.referrals.length} ref
                  </div>
                )}

                {/* Clinic Day Status */}
                {dayInfo.clinicDay && (
                  <div className="text-xs mt-1">
                    {dayInfo.clinicDay.isOpen ? (
                      <span className="text-green-600">
                        {dayInfo.clinicDay.currentBookings}/
                        {dayInfo.clinicDay.maxPatients}
                      </span>
                    ) : (
                      <span className="text-red-600">Closed</span>
                    )}
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
      </Card>

      {/* Day Details Modal */}
      <AnimatePresence>
        {showDayDetails && selectedDate && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
            onClick={() => setShowDayDetails(false)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-white rounded-xl max-w-2xl w-full max-h-[80vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-bold text-gray-800">
                    {format(selectedDate, "EEEE, MMMM d, yyyy")}
                  </h3>
                  <button
                    onClick={() => setShowDayDetails(false)}
                    className="p-2 hover:bg-gray-100 rounded-lg"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {(() => {
                  const dayInfo = getDayReferrals(selectedDate);
                  return (
                    <div className="space-y-4">
                      {/* Clinic Status */}
                      {dayInfo.clinicDay && (
                        <Card className="p-4 bg-blue-50">
                          <h4 className="font-semibold text-blue-800 mb-2">
                            Clinic Status
                          </h4>
                          <div className="flex items-center gap-4">
                            <span
                              className={`px-2 py-1 rounded-full text-xs ${
                                dayInfo.clinicDay.isOpen
                                  ? "bg-green-100 text-green-700"
                                  : "bg-red-100 text-red-700"
                              }`}
                            >
                              {dayInfo.clinicDay.isOpen ? "Open" : "Closed"}
                            </span>
                            {dayInfo.clinicDay.isOpen && (
                              <span className="text-sm">
                                Bookings: {dayInfo.clinicDay.currentBookings}/
                                {dayInfo.clinicDay.maxPatients}
                              </span>
                            )}
                          </div>
                        </Card>
                      )}

                      {/* Events */}
                      {dayInfo.events && dayInfo.events.length > 0 && (
                        <div>
                          <h4 className="font-semibold text-gray-700 mb-2">
                            Events
                          </h4>
                          {dayInfo.events.map((event) => (
                            <Card
                              key={event._id}
                              className="p-3 mb-2 bg-purple-50"
                            >
                              <div className="flex items-start justify-between">
                                <div>
                                  <p className="font-medium text-purple-800">
                                    {event.title}
                                  </p>
                                  <p className="text-xs text-gray-500 mt-1">
                                    {event.description}
                                  </p>
                                </div>
                                <span
                                  className={`text-xs px-2 py-1 rounded-full ${
                                    event.eventType === "holiday"
                                      ? "bg-green-100 text-green-700"
                                      : event.eventType === "meeting"
                                        ? "bg-blue-100 text-blue-700"
                                        : "bg-gray-100 text-gray-700"
                                  }`}
                                >
                                  {event.eventType}
                                </span>
                              </div>
                            </Card>
                          ))}
                        </div>
                      )}

                      {/* Referrals */}
                      {dayInfo.referrals.length > 0 ? (
                        <div>
                          <h4 className="font-semibold text-gray-700 mb-2">
                            Referrals ({dayInfo.referrals.length})
                          </h4>
                          {dayInfo.referrals.map((referral) => (
                            <Card
                              key={referral._id}
                              className="p-3 mb-2 hover:shadow-md transition-shadow"
                            >
                              <div className="flex items-start justify-between">
                                <div>
                                  <p className="font-medium">
                                    {referral.patientName}
                                  </p>
                                  <p className="text-xs text-gray-500">
                                    #{referral.referralNumber}
                                  </p>
                                </div>
                                <span
                                  className={`px-2 py-1 rounded-full text-xs flex items-center gap-1 ${
                                    referral.urgency === "emergency"
                                      ? "bg-red-100 text-red-700"
                                      : referral.urgency === "urgent"
                                        ? "bg-orange-100 text-orange-700"
                                        : "bg-green-100 text-green-700"
                                  }`}
                                >
                                  {referral.urgency === "emergency" && (
                                    <AlertCircle className="w-3 h-3" />
                                  )}
                                  {referral.urgency === "urgent" && (
                                    <Clock className="w-3 h-3" />
                                  )}
                                  {referral.urgency === "routine" && (
                                    <CheckCircle2 className="w-3 h-3" />
                                  )}
                                  {referral.urgency}
                                </span>
                              </div>
                              <p className="text-xs text-gray-500 mt-2">
                                From: {referral.referringHospital} • Dr.{" "}
                                {referral.referringPhysicianName}
                              </p>
                            </Card>
                          ))}
                        </div>
                      ) : (
                        <p className="text-center text-gray-500 py-4">
                          No referrals on this day
                        </p>
                      )}

                      {/* Manage Day Button */}
                      <div className="mt-4 pt-4 border-t">
                        <Button
                          onClick={() => handleManageDay(selectedDate)}
                          className="w-full bg-purple-500 hover:bg-purple-600 text-white"
                        >
                          <Settings2 className="w-4 h-4 mr-2" />
                          Manage This Day
                        </Button>
                      </div>
                    </div>
                  );
                })()}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Events Modal */}
      <AnimatePresence>
        {showEventModal && selectedEvents.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
            onClick={() => setShowEventModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-white rounded-xl max-w-md w-full p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-xl font-bold text-gray-800 mb-4">
                Day Events
              </h3>
              <div className="space-y-3">
                {selectedEvents.map((event) => (
                  <div key={event._id} className="p-3 bg-purple-50 rounded-lg">
                    <p className="font-medium text-purple-800">{event.title}</p>
                    <p className="text-sm text-gray-600 mt-1">
                      {event.description}
                    </p>
                    <p className="text-xs text-gray-500 mt-2">
                      {format(new Date(event.startDate), "h:mm a")} -{" "}
                      {format(new Date(event.endDate), "h:mm a")}
                    </p>
                  </div>
                ))}
              </div>
              <Button
                onClick={() => setShowEventModal(false)}
                className="w-full mt-4"
              >
                Close
              </Button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
