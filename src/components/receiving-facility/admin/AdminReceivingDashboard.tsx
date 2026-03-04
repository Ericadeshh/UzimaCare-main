"use client";

import { useState, useEffect, useRef } from "react";
import { useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import { Id } from "@convex/_generated/dataModel";
import { useAuth } from "@/context/AuthContext";
import NotificationBell from "@/components/notifications/notification-bell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { useSearchParams } from "next/navigation";
import ReferralCalendar from "./ReferralCalendar";
import ClinicDayManager from "./ClinicDayManager";
import TodayEvents from "./TodayEvents";
import TotalReferralsStats from "./TotalReferralsStats";
import EventManager from "./EventManager";
import {
  Calendar,
  Activity,
  CheckCircle2,
  Clock,
  LogOut,
  Menu,
  X,
  ChevronDown,
  Settings,
  HelpCircle,
  Building2,
  Users,
  Stethoscope,
  RefreshCw,
  LayoutDashboard,
  FileText,
  TrendingUp,
  CalendarDays,
  Settings2,
} from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";

export interface AdminReceivingDashboardProps {
  user: any;
  facilityData: {
    _id: Id<"facilities">;
    name: string;
    type: string;
    departments: string[];
    bedCapacity?: number;
  };
  onLogout: () => void;
}

type AdminView = "overview" | "calendar" | "manage" | "stats" | "events";

export default function AdminReceivingDashboard({
  user,
  facilityData,
  onLogout,
}: AdminReceivingDashboardProps) {
  const searchParams = useSearchParams();

  const [currentView, setCurrentView] = useState<AdminView>("overview");
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { token } = useAuth();
  const profileMenuRef = useRef<HTMLDivElement>(null);

  // Effect to handle tab changes from URL
  useEffect(() => {
    const tab = searchParams.get("tab");
    if (
      tab &&
      ["overview", "calendar", "manage", "stats", "events"].includes(tab)
    ) {
      setCurrentView(tab as AdminView);
    }
  }, [searchParams]);

  // Check for stored date from calendar
  useEffect(() => {
    const storedDate = localStorage.getItem("selectedClinicDate");
    if (storedDate && currentView === "manage") {
      setSelectedDate(new Date(storedDate));
      localStorage.removeItem("selectedClinicDate");
    }
  }, [currentView]);

  // Fetch real-time data
  const dashboardStats = useQuery(
    api.receivingFacility.queries.getAdminDashboardStats,
    {
      facilityId: facilityData._id,
      token: token || "",
    },
  );

  const todayDate = format(new Date(), "yyyy-MM-dd");

  // Close profile menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        profileMenuRef.current &&
        !profileMenuRef.current.contains(event.target as Node)
      ) {
        setProfileMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => setIsRefreshing(false), 1000);
  };

  const navItems = [
    { id: "overview", label: "Overview", icon: LayoutDashboard },
    {
      id: "calendar",
      label: "Calendar",
      icon: CalendarDays,
      count: dashboardStats?.todayEvents,
    },
    { id: "manage", label: "Manage Clinic", icon: Settings2 },
    { id: "events", label: "Events", icon: Calendar },
    { id: "stats", label: "Statistics", icon: TrendingUp },
  ];

  const renderContent = () => {
    switch (currentView) {
      case "overview":
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            {/* Welcome Banner */}
            <Card className="p-6 bg-linear-to-r from-purple-500 to-purple-600 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-2xl font-bold mb-2">
                    Admin Dashboard • {facilityData.name}
                  </h1>
                  <p className="text-purple-100">
                    {format(new Date(), "EEEE, MMMM d, yyyy")}
                  </p>
                </div>
                <Building2 className="w-16 h-16 opacity-20" />
              </div>
            </Card>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="p-5 bg-white border-l-4 border-blue-500">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Total Referrals</p>
                    <p className="text-2xl font-bold text-gray-800">
                      {dashboardStats?.totalReferrals || 0}
                    </p>
                  </div>
                  <FileText className="w-8 h-8 text-blue-500" />
                </div>
                <p className="text-xs text-gray-400 mt-2">
                  ↑ {dashboardStats?.referralsGrowth || 0}% from last month
                </p>
              </Card>

              <Card className="p-5 bg-white border-l-4 border-green-500">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Completed</p>
                    <p className="text-2xl font-bold text-gray-800">
                      {dashboardStats?.completedReferrals || 0}
                    </p>
                  </div>
                  <CheckCircle2 className="w-8 h-8 text-green-500" />
                </div>
              </Card>

              <Card className="p-5 bg-white border-l-4 border-yellow-500">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Pending</p>
                    <p className="text-2xl font-bold text-gray-800">
                      {dashboardStats?.pendingReferrals || 0}
                    </p>
                  </div>
                  <Clock className="w-8 h-8 text-yellow-500" />
                </div>
              </Card>

              <Card className="p-5 bg-white border-l-4 border-purple-500">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Active Physicians</p>
                    <p className="text-2xl font-bold text-gray-800">
                      {dashboardStats?.activePhysicians || 0}
                    </p>
                  </div>
                  <Stethoscope className="w-8 h-8 text-purple-500" />
                </div>
              </Card>
            </div>

            {/* Today's Events and Stats */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <TodayEvents
                  facilityId={facilityData._id}
                  date={todayDate}
                  token={token || ""}
                />
              </div>
              <div className="lg:col-span-1">
                <TotalReferralsStats
                  facilityId={facilityData._id}
                  token={token || ""}
                />
              </div>
            </div>

            {/* Quick Actions */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">
                Quick Actions
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <Button
                  onClick={() => setCurrentView("calendar")}
                  className="flex items-center gap-2 bg-blue-50 text-blue-700 hover:bg-blue-100"
                >
                  <Calendar className="w-4 h-4" />
                  View Calendar
                </Button>
                <Button
                  onClick={() => setCurrentView("manage")}
                  className="flex items-center gap-2 bg-green-50 text-green-700 hover:bg-green-100"
                >
                  <Settings2 className="w-4 h-4" />
                  Manage Clinic Days
                </Button>
                <Button
                  onClick={() => setCurrentView("events")}
                  className="flex items-center gap-2 bg-purple-50 text-purple-700 hover:bg-purple-100"
                >
                  <Calendar className="w-4 h-4" />
                  Manage Events
                </Button>
                <Button
                  onClick={() => setCurrentView("stats")}
                  className="flex items-center gap-2 bg-yellow-50 text-yellow-700 hover:bg-yellow-100"
                >
                  <TrendingUp className="w-4 h-4" />
                  View Statistics
                </Button>
              </div>
            </Card>
          </motion.div>
        );

      case "calendar":
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                <CalendarDays className="w-6 h-6 text-purple-500" />
                Facility Calendar
              </h2>
            </div>

            <ReferralCalendar
              facilityId={facilityData._id}
              facilityName={facilityData.name}
              token={token || ""}
              onDateSelect={(date) => setSelectedDate(date)}
            />
          </motion.div>
        );

      case "manage":
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                <Settings2 className="w-6 h-6 text-green-500" />
                Manage Clinic Days
              </h2>
            </div>

            <ClinicDayManager
              facilityId={facilityData._id}
              facilityName={facilityData.name}
              token={token || ""}
            />
          </motion.div>
        );

      case "events":
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                <Calendar className="w-6 h-6 text-purple-500" />
                Facility Events
              </h2>
            </div>

            <EventManager facilityId={facilityData._id} token={token || ""} />
          </motion.div>
        );

      case "stats":
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <TotalReferralsStats
              facilityId={facilityData._id}
              token={token || ""}
              detailed={true}
            />
          </motion.div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6">
          <div className="flex items-center justify-between h-14 sm:h-16">
            {/* Left side - Mobile menu button & Logo */}
            <div className="flex items-center gap-2 sm:gap-4">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="lg:hidden p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                {mobileMenuOpen ? (
                  <X className="w-5 h-5" />
                ) : (
                  <Menu className="w-5 h-5" />
                )}
              </button>

              <div className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-purple-500 hidden sm:block" />
                <span className="text-sm sm:text-base font-medium text-gray-700">
                  {facilityData.name} • Admin
                </span>
              </div>
            </div>

            {/* Right side - Actions */}
            <div className="flex items-center gap-1 sm:gap-3">
              <button
                onClick={handleRefresh}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <RefreshCw
                  className={`w-4 h-4 text-gray-600 ${isRefreshing ? "animate-spin" : ""}`}
                />
              </button>

              <NotificationBell userId={user?._id} />

              <div className="relative" ref={profileMenuRef}>
                <button
                  onClick={() => setProfileMenuOpen(!profileMenuOpen)}
                  className="flex items-center gap-1 sm:gap-2 p-1.5 sm:p-2 hover:bg-gray-100 rounded-lg"
                >
                  <div className="w-7 h-7 sm:w-8 sm:h-8 bg-linear-to-br from-purple-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold">
                    {user?.name?.charAt(0) || "A"}
                  </div>
                  <ChevronDown
                    className={`w-4 h-4 text-gray-600 transition-transform ${profileMenuOpen ? "rotate-180" : ""}`}
                  />
                </button>

                <AnimatePresence>
                  {profileMenuOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-xl border py-1 z-50"
                    >
                      <div className="px-4 py-3 border-b">
                        <p className="text-sm font-medium">{user?.name}</p>
                        <p className="text-xs text-gray-500">{user?.email}</p>
                      </div>
                      <Link
                        href="/facility/settings"
                        className="block px-4 py-2 text-sm hover:bg-gray-50"
                      >
                        <Settings className="w-4 h-4 inline mr-2" /> Settings
                      </Link>
                      <Link
                        href="/facility/help"
                        className="block px-4 py-2 text-sm hover:bg-gray-50"
                      >
                        <HelpCircle className="w-4 h-4 inline mr-2" /> Help
                      </Link>
                      <div className="border-t my-1"></div>
                      <button
                        onClick={() => {
                          setProfileMenuOpen(false);
                          onLogout();
                        }}
                        className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                      >
                        <LogOut className="w-4 h-4 inline mr-2" /> Logout
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="hidden lg:flex items-center gap-1 py-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentView === item.id;
              return (
                <Button
                  key={item.id}
                  onClick={() => setCurrentView(item.id as AdminView)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all text-sm ${
                    isActive
                      ? "bg-purple-50 text-purple-600 font-medium"
                      : "text-gray-600 hover:bg-gray-50"
                  }`}
                  variant="ghost"
                >
                  <Icon className="w-4 h-4" />
                  {item.label}
                  {item.count > 0 && (
                    <span className="ml-1 px-1.5 py-0.5 bg-purple-500 text-white rounded-full text-xs">
                      {item.count}
                    </span>
                  )}
                </Button>
              );
            })}
          </nav>
        </div>

        {/* Mobile Navigation */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="lg:hidden border-t bg-white"
            >
              <nav className="px-3 py-2 space-y-1">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Button
                      key={item.id}
                      onClick={() => {
                        setCurrentView(item.id as AdminView);
                        setMobileMenuOpen(false);
                      }}
                      className="w-full flex items-center justify-between px-4 py-3 rounded-lg text-gray-600 hover:bg-gray-50"
                      variant="ghost"
                    >
                      <div className="flex items-center gap-3">
                        <Icon className="w-5 h-5" />
                        <span>{item.label}</span>
                      </div>
                      {item.count > 0 && (
                        <span className="px-2 py-1 bg-purple-500 text-white rounded-full text-xs">
                          {item.count}
                        </span>
                      )}
                    </Button>
                  );
                })}
              </nav>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 py-4 sm:py-6">
        <AnimatePresence mode="wait">{renderContent()}</AnimatePresence>
      </main>
    </div>
  );
}
