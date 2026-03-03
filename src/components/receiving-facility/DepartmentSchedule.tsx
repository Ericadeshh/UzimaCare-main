"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import { Id } from "@convex/_generated/dataModel";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Calendar,
  Clock,
  Users,
  Stethoscope,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { format, addDays, startOfWeek, isSameDay } from "date-fns";

interface DepartmentScheduleProps {
  facilityId: Id<"facilities">;
  departments: string[];
  token: string;
}

interface Appointment {
  _id: string;
  patientName: string;
  time: string;
  physician: string;
  department: string;
  status: "scheduled" | "in-progress" | "completed" | "cancelled";
}

export default function DepartmentSchedule({
  facilityId,
  departments,
  token,
}: DepartmentScheduleProps) {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedDepartment, setSelectedDepartment] = useState<string>("all");

  // Fetch schedule for the selected date
  const schedule = useQuery(
    api.receivingFacility.queries.getDepartmentSchedule,
    {
      facilityId,
      date: selectedDate.toISOString(),
      department: selectedDepartment !== "all" ? selectedDepartment : undefined,
      token,
    },
  ) as Appointment[] | undefined;

  const weekDays = Array.from({ length: 7 }, (_, i) =>
    addDays(startOfWeek(selectedDate), i),
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case "scheduled":
        return "bg-blue-100 text-blue-700";
      case "in-progress":
        return "bg-yellow-100 text-yellow-700";
      case "completed":
        return "bg-green-100 text-green-700";
      case "cancelled":
        return "bg-red-100 text-red-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <Calendar className="w-6 h-6 text-blue-500" />
          Department Schedule
        </h2>
        <div className="flex items-center gap-2">
          <select
            value={selectedDepartment}
            onChange={(e) => setSelectedDepartment(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Departments</option>
            {departments.map((dept) => (
              <option key={dept} value={dept}>
                {dept}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Week Navigation */}
      <div className="flex items-center justify-between">
        <Button
          onClick={() => setSelectedDate(addDays(selectedDate, -7))}
          variant="outline"
          size="sm"
        >
          <ChevronLeft className="w-4 h-4" />
          Previous Week
        </Button>
        <h3 className="text-lg font-semibold">
          Week of {format(weekDays[0], "MMM d")} -{" "}
          {format(weekDays[6], "MMM d, yyyy")}
        </h3>
        <Button
          onClick={() => setSelectedDate(addDays(selectedDate, 7))}
          variant="outline"
          size="sm"
        >
          Next Week
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>

      {/* Weekly Calendar */}
      <div className="grid grid-cols-7 gap-2">
        {weekDays.map((day) => (
          <Card
            key={day.toISOString()}
            className={`p-3 text-center cursor-pointer transition-all ${
              isSameDay(day, selectedDate)
                ? "border-2 border-blue-500 bg-blue-50"
                : "hover:border-gray-300"
            }`}
            onClick={() => setSelectedDate(day)}
          >
            <p className="text-sm font-medium text-gray-500">
              {format(day, "EEE")}
            </p>
            <p
              className={`text-lg font-bold ${
                isSameDay(day, selectedDate) ? "text-blue-600" : "text-gray-700"
              }`}
            >
              {format(day, "d")}
            </p>
          </Card>
        ))}
      </div>

      {/* Schedule for selected date */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">
          {format(selectedDate, "MMMM d, yyyy")} Schedule
        </h3>

        {!schedule || schedule.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Calendar className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p>No appointments scheduled for this day</p>
          </div>
        ) : (
          <div className="space-y-3">
            {schedule.map((appointment) => (
              <div
                key={appointment._id}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2 text-gray-600">
                    <Clock className="w-4 h-4" />
                    <span className="font-medium">{appointment.time}</span>
                  </div>
                  <div>
                    <p className="font-medium text-gray-800">
                      {appointment.patientName}
                    </p>
                    <div className="flex items-center gap-3 text-sm text-gray-500">
                      <span className="flex items-center gap-1">
                        <Stethoscope className="w-3 h-3" />
                        Dr. {appointment.physician}
                      </span>
                      <span className="flex items-center gap-1">
                        <Users className="w-3 h-3" />
                        {appointment.department}
                      </span>
                    </div>
                  </div>
                </div>
                <span
                  className={`px-2 py-1 rounded-full text-xs ${getStatusColor(appointment.status)}`}
                >
                  {appointment.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
