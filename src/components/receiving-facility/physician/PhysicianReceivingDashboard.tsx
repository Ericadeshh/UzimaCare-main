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
import TodayReferrals from "./TodayReferrals";
import ReviewedOutcomes from "./ReviewedOutcomes";
import PatientOutcomeForm from "./PatientOutcomeForm";
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
  FileText,
  HeartPulse,
} from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";

export interface PhysicianReceivingDashboardProps {
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

type PhysicianView = "today" | "outcomes" | "patient-form";

export default function PhysicianReceivingDashboard({
  user,
  facilityData,
  onLogout,
}: PhysicianReceivingDashboardProps) {
  const [currentView, setCurrentView] = useState<PhysicianView>("today");
  const [selectedReferralId, setSelectedReferralId] =
    useState<Id<"referrals"> | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { token } = useAuth();
  const profileMenuRef = useRef<HTMLDivElement>(null);

  // Fetch real-time data
  const todayStats = useQuery(
    api.receivingFacility.queries.getPhysicianTodayStats,
    {
      facilityName: facilityData.name,
      physicianId: user?._id,
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
    {
      id: "today",
      label: "Today's Referrals",
      icon: Calendar,
      count: todayStats?.todayCount,
    },
    {
      id: "outcomes",
      label: "Reviewed Outcomes",
      icon: CheckCircle2,
      count: todayStats?.reviewedCount,
    },
  ];

  const renderContent = () => {
    if (currentView === "patient-form" && selectedReferralId) {
      return (
        <PatientOutcomeForm
          referralId={selectedReferralId}
          facilityId={facilityData._id}
          physicianId={user?._id}
          facilityName={facilityData.name}
          onBack={() => {
            setSelectedReferralId(null);
            setCurrentView("today");
          }}
          token={token || ""}
          onOutcomeSubmitted={() => {
            setSelectedReferralId(null);
            setCurrentView("outcomes");
          }}
        />
      );
    }

    switch (currentView) {
      case "today":
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            {/* Welcome Banner */}
            <Card className="p-6 bg-linear-to-r from-blue-500 to-blue-600 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-2xl font-bold mb-2">
                    Dr. {user?.name?.replace(/^Dr\.?\s*/i, "")}
                  </h1>
                  <p className="text-blue-100">
                    {facilityData.name} •{" "}
                    {format(new Date(), "EEEE, MMMM d, yyyy")}
                  </p>
                </div>
                <Stethoscope className="w-16 h-16 opacity-20" />
              </div>
            </Card>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Card className="p-5 bg-white border-l-4 border-blue-500">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Today's Referrals</p>
                    <p className="text-2xl font-bold text-gray-800">
                      {todayStats?.todayCount || 0}
                    </p>
                  </div>
                  <FileText className="w-8 h-8 text-blue-500" />
                </div>
              </Card>

              <Card className="p-5 bg-white border-l-4 border-yellow-500">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Pending Review</p>
                    <p className="text-2xl font-bold text-gray-800">
                      {todayStats?.pendingCount || 0}
                    </p>
                  </div>
                  <Clock className="w-8 h-8 text-yellow-500" />
                </div>
              </Card>

              <Card className="p-5 bg-white border-l-4 border-green-500">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Reviewed Today</p>
                    <p className="text-2xl font-bold text-gray-800">
                      {todayStats?.reviewedCount || 0}
                    </p>
                  </div>
                  <CheckCircle2 className="w-8 h-8 text-green-500" />
                </div>
              </Card>
            </div>

            {/* Today's Referrals Component */}
            <TodayReferrals
              facilityName={facilityData.name}
              date={todayDate}
              onSelectReferral={(id) => {
                setSelectedReferralId(id);
                setCurrentView("patient-form");
              }}
              token={token || ""}
            />
          </motion.div>
        );

      case "outcomes":
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                <CheckCircle2 className="w-6 h-6 text-green-500" />
                Reviewed Patient Outcomes
              </h2>
            </div>

            <ReviewedOutcomes
              facilityId={facilityData._id}
              physicianId={user?._id}
              token={token || ""}
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
                <Stethoscope className="w-5 h-5 text-blue-500 hidden sm:block" />
                <span className="text-sm sm:text-base font-medium text-gray-700">
                  Dr. {user?.name?.replace(/^Dr\.?\s*/i, "").split(" ")[0]}
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
                  <div className="w-7 h-7 sm:w-8 sm:h-8 bg-linear-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-semibold">
                    {user?.name?.charAt(0) || "D"}
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
                  onClick={() => setCurrentView(item.id as PhysicianView)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all text-sm ${
                    isActive
                      ? "bg-blue-50 text-blue-600 font-medium"
                      : "text-gray-600 hover:bg-gray-50"
                  }`}
                  variant="ghost"
                >
                  <Icon className="w-4 h-4" />
                  {item.label}
                  {item.count > 0 && (
                    <span className="ml-1 px-1.5 py-0.5 bg-blue-500 text-white rounded-full text-xs">
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
                        setCurrentView(item.id as PhysicianView);
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
                        <span className="px-2 py-1 bg-blue-500 text-white rounded-full text-xs">
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
