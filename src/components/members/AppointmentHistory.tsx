import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Calendar,
  Clock,
  Package2,
  ChevronDown,
  User,
  Trash2,
} from "lucide-react";
import type { Database } from "@/types/supabase";
import { useMemo, useState, useCallback } from "react";
import {
  format,
  isToday,
  isTomorrow,
  isYesterday,
  parseISO,
  isFuture,
} from "date-fns";
import { tr } from "date-fns/locale";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";
import React from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useTheme } from "@/contexts/theme-context";
import { deleteAppointmentById } from "@/lib/queries";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

type Appointment = Database["public"]["Tables"]["appointments"]["Row"];
type Service = Database["public"]["Tables"]["services"]["Row"];
type Trainer = Database["public"]["Tables"]["trainers"]["Row"];
type AppointmentStatus =
  | "completed"
  | "cancelled"
  | "scheduled"
  | "in-progress";
type Member = Database["public"]["Tables"]["members"]["Row"];

interface AppointmentHistoryProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  appointments: Appointment[];
  services: { [key: string]: Service };
  trainers: { [key: string]: Trainer };
  member: Member;
  onAppointmentDeleted?: (appointmentId: string) => void;
}

interface StatusConfig {
  color: string;
  darkColor: string;
  text: string;
  bgColor: string;
  darkBgColor: string;
  icon?: React.ReactNode;
}

// Package interface to represent a service package instance
interface Package {
  id: string;
  serviceId: string;
  serviceName: string;
  appointments: Appointment[];
  totalSessions: number;
  completedSessions: number;
  scheduledSessions: number;
  cancelledSessions: number;
  remainingSessions: number;
  startDate: Date | null;
  endDate: Date | null;
  isActive: boolean;
  packageNumber: number;
  progressPercentage: number;
}

const STATUS_CONFIG: Record<AppointmentStatus, StatusConfig> = {
  completed: {
    color: "bg-green-100 text-green-700 border-green-300",
    darkColor: "bg-green-900/30 text-green-400 border-green-800",
    bgColor: "bg-green-50",
    darkBgColor: "bg-green-900/20",
    text: "Tamamlandı",
  },
  cancelled: {
    color: "bg-red-100 text-red-700 border-red-300",
    darkColor: "bg-red-900/30 text-red-400 border-red-800",
    bgColor: "bg-red-50",
    darkBgColor: "bg-red-900/20",
    text: "İptal Edildi",
  },
  scheduled: {
    color: "bg-blue-100 text-blue-700 border-blue-300",
    darkColor: "bg-blue-900/30 text-blue-400 border-blue-800",
    bgColor: "bg-blue-50",
    darkBgColor: "bg-blue-900/20",
    text: "Planlandı",
  },
  "in-progress": {
    color: "bg-yellow-100 text-yellow-700 border-yellow-300",
    darkColor: "bg-yellow-900/30 text-yellow-400 border-yellow-800",
    bgColor: "bg-yellow-50",
    darkBgColor: "bg-yellow-900/20",
    text: "Devam Ediyor",
  },
};

const getStatusColor = (status: AppointmentStatus, isDark: boolean) => {
  return isDark
    ? STATUS_CONFIG[status]?.darkColor ??
        "bg-gray-800 text-gray-300 border-gray-700"
    : STATUS_CONFIG[status]?.color ??
        "bg-gray-100 text-gray-700 border-gray-300";
};

const getStatusText = (status: AppointmentStatus) => {
  return STATUS_CONFIG[status]?.text ?? status;
};

const getStatusBgColor = (status: AppointmentStatus, isDark: boolean) => {
  return isDark
    ? STATUS_CONFIG[status]?.darkBgColor ?? "bg-gray-800"
    : STATUS_CONFIG[status]?.bgColor ?? "bg-gray-50";
};

const formatDate = (date: string | Date | null) => {
  if (!date) return "Belirsiz";

  const appointmentDate = typeof date === "string" ? parseISO(date) : date;

  if (isToday(appointmentDate)) {
    return "Bugün";
  } else if (isTomorrow(appointmentDate)) {
    return "Yarın";
  } else if (isYesterday(appointmentDate)) {
    return "Dün";
  }

  return format(appointmentDate, "d MMMM yyyy", { locale: tr });
};

const formatDateShort = (date: Date | null) => {
  if (!date) return "Belirsiz";
  return format(date, "d MMMM yyyy", { locale: tr });
};

const formatTime = (time: string) => {
  return time.slice(0, 5); // "14:30:00" -> "14:30"
};

const sortAppointments = (appointments: Appointment[]) => {
  return [...appointments].sort((a, b) => {
    const dateA = new Date(`${a.date} ${a.time}`);
    const dateB = new Date(`${b.date} ${b.time}`);
    return dateA.getTime() - dateB.getTime();
  });
};

interface AppointmentCardProps {
  appointment: Appointment;
  trainer: Trainer | undefined;
  onDelete?: (appointmentId: string) => void;
}

const AppointmentCard = React.memo(
  ({ appointment, trainer, onDelete }: AppointmentCardProps) => {
    const { theme } = useTheme();
    const isDark = theme === "dark";
    const isUpcoming = isFuture(
      parseISO(`${appointment.date}T${appointment.time}`)
    );
    const status = appointment.status as AppointmentStatus;

    const cardStyle = useMemo(() => {
      if (isDark) {
        if (status === "cancelled") {
          return "bg-red-900/10 border-red-800/30 hover:bg-red-900/20";
        } else if (status === "completed") {
          return "bg-green-900/10 border-green-800/30 hover:bg-green-900/20";
        } else if (isToday(parseISO(appointment.date))) {
          return "bg-primary/10 border-primary/30 hover:bg-primary/20";
        } else if (isTomorrow(parseISO(appointment.date))) {
          return "bg-blue-900/10 border-blue-800/30 hover:bg-blue-900/20";
        } else if (status === "in-progress") {
          return "bg-yellow-900/10 border-yellow-800/30 hover:bg-yellow-900/20";
        }
        return "bg-gray-800 border-gray-700 hover:bg-gray-700/80";
      } else {
        if (status === "cancelled") {
          return "bg-red-50/70 border-red-200/70 hover:bg-red-100/50";
        } else if (status === "completed") {
          return "bg-green-50/70 border-green-200/70 hover:bg-green-100/50";
        } else if (isToday(parseISO(appointment.date))) {
          return "bg-primary/5 border-primary/20 hover:bg-primary/10";
        } else if (isTomorrow(parseISO(appointment.date))) {
          return "bg-blue-50/70 border-blue-200/70 hover:bg-blue-100/50";
        } else if (status === "in-progress") {
          return "bg-yellow-50/70 border-yellow-200/70 hover:bg-yellow-100/50";
        }
        return "bg-card hover:bg-accent/50";
      }
    }, [appointment.date, status, isDark, isToday, isTomorrow]);

    return (
      <div
        className={`flex flex-col sm:flex-row sm:items-center gap-3 p-4 rounded-lg border shadow-sm transition-colors ${cardStyle}`}
      >
        <div className="flex-1 grid gap-3">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
            <span
              className={`flex items-center gap-1.5 min-w-[140px] text-sm sm:text-base font-medium ${
                isUpcoming ? "text-primary" : isDark ? "text-gray-200" : ""
              }`}
            >
              <Calendar
                className={`w-4 h-4 ${
                  isUpcoming
                    ? "text-primary"
                    : isDark
                    ? "text-gray-400"
                    : "text-muted-foreground"
                }`}
              />
              {formatDate(appointment.date)}
            </span>
            <span
              className={`flex items-center gap-1.5 text-sm sm:text-base font-medium ${
                isUpcoming ? "text-primary" : isDark ? "text-gray-200" : ""
              }`}
            >
              <Clock
                className={`w-4 h-4 ${
                  isUpcoming
                    ? "text-primary"
                    : isDark
                    ? "text-gray-400"
                    : "text-muted-foreground"
                }`}
              />
              {formatTime(appointment.time)}
            </span>
          </div>
          <div
            className={`text-xs sm:text-sm ${
              isDark ? "text-gray-400" : "text-muted-foreground"
            } flex items-center gap-1.5`}
          >
            <User className="w-3.5 h-3.5" />
            <span>Antrenör:</span>
            <span
              className={
                isDark
                  ? "text-gray-300 font-medium"
                  : "text-foreground/80 font-medium"
              }
            >
              {trainer?.first_name} {trainer?.last_name}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Badge
                  className={`shrink-0 px-3 py-1 ${getStatusColor(
                    status,
                    isDark
                  )} ${getStatusBgColor(status, isDark)}`}
                >
                  {getStatusText(status)}
                </Badge>
              </TooltipTrigger>
              <TooltipContent>
                <p>Durum: {getStatusText(status)}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          {onDelete && status === "scheduled" && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => onDelete(appointment.id)}
                    className={`p-1.5 rounded-full transition-colors ${
                      isDark
                        ? "text-red-400 hover:bg-red-900/30 hover:text-red-300"
                        : "text-red-500 hover:bg-red-100 hover:text-red-600"
                    }`}
                    aria-label="Randevuyu sil"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Randevuyu sil</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
      </div>
    );
  }
);

AppointmentCard.displayName = "AppointmentCard";

interface PackageCardProps {
  packageData: Package;
  trainers: { [key: string]: Trainer };
  onDelete?: (appointmentId: string) => void;
  defaultOpen?: boolean;
}

const PackageCard = React.memo(
  ({
    packageData,
    trainers,
    onDelete,
    defaultOpen = false,
  }: PackageCardProps) => {
    const [isOpen, setIsOpen] = useState(defaultOpen);
    const { theme } = useTheme();
    const isDark = theme === "dark";

    const totalSessions = packageData.totalSessions;
    const completedPercentage =
      totalSessions > 0
        ? (packageData.completedSessions / totalSessions) * 100
        : 0;
    const scheduledPercentage =
      totalSessions > 0
        ? (packageData.scheduledSessions / totalSessions) * 100
        : 0;
    const cancelledPercentage =
      totalSessions > 0
        ? (packageData.cancelledSessions / totalSessions) * 100
        : 0;

    const sortedAppointments = useMemo(
      () => sortAppointments(packageData.appointments),
      [packageData.appointments]
    );

    const packageStyle = useMemo(() => {
      // For active packages
      if (packageData.isActive) {
        return isDark
          ? "border-l-4 border-blue-500 pl-2 bg-primary/5"
          : "border-l-4 border-blue-500 pl-2 bg-primary/5";
      }

      // For completed packages
      const completionRate = packageData.progressPercentage;

      if (completionRate >= 90) {
        return isDark
          ? "border-l-4 border-green-600 pl-2 bg-green-900/5"
          : "border-l-4 border-green-600 pl-2 bg-green-50/50";
      }

      return isDark
        ? "border-l-4 border-gray-700 pl-2"
        : "border-l-4 border-gray-200 pl-2";
    }, [packageData.isActive, packageData.progressPercentage, isDark]);

    // Get colored icon based on package status
    const getPackageIcon = () => {
      if (packageData.isActive) {
        return (
          <div
            className={`rounded-lg p-2 ${
              isDark ? "bg-blue-500/20" : "bg-blue-500/10"
            }`}
          >
            <Package2 className="w-5 h-5 text-blue-500" />
          </div>
        );
      }

      const completionRate = packageData.progressPercentage;

      if (completionRate >= 90) {
        return (
          <div
            className={`rounded-lg p-2 ${
              isDark ? "bg-green-900/20" : "bg-green-100"
            }`}
          >
            <Package2
              className={`w-5 h-5 ${
                isDark ? "text-green-400" : "text-green-600"
              }`}
            />
          </div>
        );
      }

      return (
        <div
          className={`rounded-lg p-2 ${isDark ? "bg-gray-800" : "bg-gray-100"}`}
        >
          <Package2
            className={`w-5 h-5 ${isDark ? "text-gray-400" : "text-gray-500"}`}
          />
        </div>
      );
    };



    return (
      <Collapsible
        open={isOpen}
        onOpenChange={setIsOpen}
        className="space-y-2 mb-4 transition-all duration-200 ease-in-out"
      >
        <div
          className={`sticky top-0 z-10 ${
            isDark ? "bg-gray-900/95" : "bg-background/95"
          } backdrop-blur supports-[backdrop-filter]:${
            isDark ? "bg-gray-900/60" : "bg-background/60"
          }`}
        >
          <CollapsibleTrigger className="w-full">
            <div
              className={cn(
                `flex items-center justify-between p-3 rounded-lg transition-all duration-200
             hover:shadow-md ${
               isDark ? "hover:bg-gray-800/70" : "hover:bg-accent/70"
             }`,
                packageStyle
              )}
            >
              <div className="flex items-center gap-3 flex-1">
                {getPackageIcon()}
                <div className="flex flex-col flex-1">
                  <div className="flex items-baseline justify-between">
                    <div>
                      <h3
                        className={`text-lg font-semibold flex items-center gap-2 ${
                          isDark ? "text-gray-200" : ""
                        }`}
                      >
                        {packageData.serviceName}
                      </h3>
                      {/* Date range */}
                      <div className="flex items-center gap-1 mt-1 text-xs">
                        <Calendar
                          className={`h-3.5 w-3.5 ${
                            isDark ? "text-gray-400" : "text-gray-500"
                          }`}
                        />
                        <span
                          className={isDark ? "text-gray-400" : "text-gray-500"}
                        >
                          {formatDateShort(packageData.startDate)} -{" "}
                          {formatDateShort(packageData.endDate)}
                        </span>
                      </div>
                    </div>

                    <span
                      className={`text-sm  px-2 py-1 rounded-md text-primary ${
                        packageData.isActive
                          ? isDark
                            ? "bg-primary/10"
                            : "bg-primary/10"
                          : isDark
                          ? "bg-gray-800 text-gray-300"
                          : "bg-gray-100 text-gray-700"
                      }`}
                    >
                      {packageData.completedSessions +
                        packageData.scheduledSessions +
                        packageData.cancelledSessions}
                      /{packageData.totalSessions} seans
                    </span>
                  </div>

                  {/* Progress bar */}
                  <div className="mt-2 space-y-1.5">
                    <div className="flex justify-between text-xs">
                      <span
                        className={isDark ? "text-gray-400" : "text-gray-600"}
                      >
                        {packageData.completedSessions > 0 && (
                          <span className={`${isDark ? "text-green-400" : "text-green-600"} font-medium`}>
                            {packageData.completedSessions} tamamlanan
                          </span>
                        )}
                        {packageData.scheduledSessions > 0 && (
                          <span>
                            {packageData.completedSessions > 0 && ", "}
                            <span className={`${isDark ? "text-blue-400" : "text-blue-600"} font-medium`}>
                              {packageData.scheduledSessions} planlanmış
                            </span>
                          </span>
                        )}
                        {packageData.cancelledSessions > 0 && (
                          <span>
                            {(packageData.completedSessions > 0 ||
                              packageData.scheduledSessions > 0) && ", "}
                            <span className={`${isDark ? "text-red-400" : "text-red-600"} font-medium`}>
                              {packageData.cancelledSessions} iptal
                            </span>
                          </span>
                        )}
                        {packageData.remainingSessions > 0 && (
                          <span>
                            {(packageData.completedSessions > 0 || packageData.scheduledSessions > 0 || packageData.cancelledSessions > 0) && ", "}
                            <span className={`${isDark ? "text-gray-400" : "text-gray-500"} font-medium`}>
                              {packageData.remainingSessions} kalan
                            </span>
                          </span>
                        )}
                      </span>
                      <span
                        className={`font-medium ${
                          isDark ? "text-gray-300" : "text-gray-900"
                        }`}
                      >
                        %{Math.round(packageData.progressPercentage)}
                      </span>
                    </div>
                    <div
                      className={`relative h-2 w-full flex overflow-hidden rounded-full ${
                        isDark ? "bg-gray-700" : "bg-gray-300"
                      }`}
                    >
                      {completedPercentage > 0 && (
                        <div
                          className={`h-full ${
                            isDark ? "bg-green-500" : "bg-green-500"
                          } transition-all duration-300`}
                          style={{ width: `${completedPercentage}%` }}
                          title={`Tamamlandı: ${packageData.completedSessions}`}
                        />
                      )}
                      {scheduledPercentage > 0 && (
                        <div
                          className={`h-full ${
                            isDark ? "bg-blue-500" : "bg-blue-500"
                          } transition-all duration-300`}
                          style={{ width: `${scheduledPercentage}%` }}
                          title={`Planlanmış: ${packageData.scheduledSessions}`}
                        />
                      )}
                      {cancelledPercentage > 0 && (
                        <div
                          className={`h-full ${
                            isDark ? "bg-red-500" : "bg-red-500"
                          } transition-all duration-300`}
                          style={{ width: `${cancelledPercentage}%` }}
                          title={`İptal Edildi: ${packageData.cancelledSessions}`}
                        />
                      )}
                    </div>
                  </div>
                </div>
              </div>
              <ChevronDown
                className={cn(
                  `w-5 h-5 ${
                    isDark ? "text-gray-500" : "text-muted-foreground/50"
                  } transition-transform duration-300`,
                  isOpen && "transform rotate-180"
                )}
              />
            </div>
          </CollapsibleTrigger>
        </div>

        <CollapsibleContent className="space-y-2.5 pl-1 transition-all duration-300 animate-in slide-in-from-top-5">
          {sortedAppointments.length === 0 ? (
            <div
              className={`text-center ${
                isDark ? "text-gray-400" : "text-gray-500"
              } p-4`}
            >
              Bu pakete ait randevu bulunmuyor
            </div>
          ) : (
            sortedAppointments.map((appointment, index) => (
              <div
                key={appointment.id}
                className={`transition-all duration-200 animate-in slide-in-from-left-${
                  (index % 5) + 1
                }`}
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <AppointmentCard
                  appointment={appointment}
                  trainer={trainers[appointment.trainer_id]}
                  onDelete={onDelete}
                />
              </div>
            ))
          )}
        </CollapsibleContent>
      </Collapsible>
    );
  }
);

PackageCard.displayName = "PackageCard";

export const AppointmentHistory = ({
  open,
  onOpenChange,
  appointments,
  services,
  trainers,
  member,
  onAppointmentDeleted,
}: AppointmentHistoryProps) => {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const [isDeleting, setIsDeleting] = useState(false);
  const [appointmentToDelete, setAppointmentToDelete] = useState<string | null>(
    null
  );
  const [localAppointments, setLocalAppointments] =
    useState<Appointment[]>(appointments);

  // Update local appointments when props change
  React.useEffect(() => {
    setLocalAppointments(appointments);
  }, [appointments]);

  // Function to group appointments into packages
  const groupAppointmentsIntoPackages = useCallback(
    (
      appointments: Appointment[],
      services: { [key: string]: Service },
      member: Member
    ): Package[] => {
      const packages: Package[] = [];

      // First, group appointments by service
      const appointmentsByService: Record<string, Appointment[]> = {};
      appointments.forEach((appointment) => {
        const serviceId = appointment.service_id;
        if (!appointmentsByService[serviceId]) {
          appointmentsByService[serviceId] = [];
        }
        appointmentsByService[serviceId].push(appointment);
      });

      // Also include services that member has subscribed to but has no appointments yet
      const allSubscribedServices = [...new Set(member.subscribed_services)];
      allSubscribedServices.forEach(serviceId => {
        if (!appointmentsByService[serviceId]) {
          appointmentsByService[serviceId] = [];
        }
      });

      // For each service, create packages
      Object.entries(appointmentsByService).forEach(
        ([serviceId, serviceAppointments]) => {
          const service = services[serviceId];
          if (!service) return;

          const sessionsPerPackage = service.session_count || 0;
          if (sessionsPerPackage === 0) return;

          // Count how many of this service the member has purchased
          const serviceCount = member.subscribed_services.filter(
            (id) => id === serviceId
          ).length;
          if (serviceCount === 0) return;

          // Sort appointments by date
          const sortedAppointments = sortAppointments(serviceAppointments);

          // Split appointments into packages
          const remainingAppointments = [...sortedAppointments];

          for (let i = 0; i < serviceCount; i++) {
            const packageId = `${serviceId}-package-${i + 1}`;
            const packageAppointments = remainingAppointments.splice(
              0,
              sessionsPerPackage
            );

            // Calculate package stats (even if no appointments yet)
            const completedSessions = packageAppointments.filter(
              (apt) => apt.status === "completed"
            ).length;
            const scheduledSessions = packageAppointments.filter(
              (apt) => apt.status === "scheduled"
            ).length;
            const cancelledSessions = packageAppointments.filter(
              (apt) => apt.status === "cancelled"
            ).length;
            const totalSessions = sessionsPerPackage;
            const remainingSessions =
              totalSessions -
              completedSessions -
              scheduledSessions -
              cancelledSessions;
            // A package is active if it's not fully completed (has remaining sessions or scheduled sessions)
            const isActive = completedSessions + cancelledSessions < totalSessions;

            // Calculate start and end dates
            let startDate = null;
            let endDate = null;

            if (packageAppointments.length > 0) {
              const firstAppointment = packageAppointments[0];
              const lastAppointment = packageAppointments[packageAppointments.length - 1];

              // Start date is the first appointment
              if (firstAppointment?.date && firstAppointment?.time) {
                startDate = new Date(
                  `${firstAppointment.date}T${firstAppointment.time}`
                );
              }

              // End date is the last appointment
              if (lastAppointment?.date && lastAppointment?.time) {
                endDate = new Date(
                  `${lastAppointment.date}T${lastAppointment.time}`
                );
              }
            }

            // Calculate progress percentage
            const progressPercentage =
              ((completedSessions + scheduledSessions) / totalSessions) * 100;

            packages.push({
              id: packageId,
              serviceId,
              serviceName: service.name,
              appointments: packageAppointments,
              totalSessions,
              completedSessions,
              scheduledSessions,
              cancelledSessions,
              remainingSessions,
              startDate,
              endDate,
              isActive,
              packageNumber: i + 1,
              progressPercentage,
            });
          }
        }
      );

      return packages;
    },
    []
  );

  // Group appointments into packages
  const memberPackages = useMemo(() => {
    const allPackages = groupAppointmentsIntoPackages(
      localAppointments,
      services,
      member
    );

    // Sort packages: active first, then by start date (newest first)
    return allPackages.sort((a, b) => {
      // First sort by active status
      if (a.isActive && !b.isActive) return -1;
      if (!a.isActive && b.isActive) return 1;

      // Then sort by start date (newest first)
      const dateA = a.startDate ? a.startDate.getTime() : 0;
      const dateB = b.startDate ? b.startDate.getTime() : 0;
      return dateB - dateA;
    });
  }, [localAppointments, services, member, groupAppointmentsIntoPackages]);

  // Split packages into active and completed
  const { activePackages, completedPackages } = useMemo(() => {
    const active = memberPackages.filter((pkg) => pkg.isActive);
    const completed = memberPackages.filter((pkg) => !pkg.isActive);

    return {
      activePackages: active,
      completedPackages: completed,
    };
  }, [memberPackages]);

  const handleDeleteAppointment = useCallback((appointmentId: string) => {
    setAppointmentToDelete(appointmentId);
  }, []);

  const confirmDelete = async () => {
    if (!appointmentToDelete) return;

    setIsDeleting(true);
    try {
      const result = await deleteAppointmentById(appointmentToDelete);

      if (result.success) {
        // Update local state
        setLocalAppointments((prev) =>
          prev.filter((apt) => apt.id !== appointmentToDelete)
        );

        // Notify parent component
        if (onAppointmentDeleted) {
          onAppointmentDeleted(appointmentToDelete);
        }

        toast.success("Randevu başarıyla silindi");
      } else {
        toast.error("Randevu silinirken bir hata oluştu");
        console.error("Silme hatası:", result.error);
      }
    } catch (error) {
      toast.error("Randevu silinirken bir hata oluştu");
      console.error("Silme hatası:", error);
    } finally {
      setIsDeleting(false);
      setAppointmentToDelete(null);
    }
  };

  const cancelDelete = () => {
    setAppointmentToDelete(null);
  };

  return (
    <>
      <AlertDialog
        open={!!appointmentToDelete}
        onOpenChange={(open) => !open && cancelDelete()}
      >
        <AlertDialogContent
          className={`${
            isDark ? "bg-gray-900 text-gray-100 border-gray-800" : ""
          } animate-in zoom-in-90`}
        >
          <AlertDialogHeader>
            <AlertDialogTitle>Randevuyu Sil</AlertDialogTitle>
            <AlertDialogDescription className={isDark ? "text-gray-400" : ""}>
              Bu randevuyu silmek istediğinizden emin misiniz? Bu işlem geri
              alınamaz.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              className={
                isDark ? "bg-gray-800 text-gray-200 hover:bg-gray-700" : ""
              }
              disabled={isDeleting}
            >
              İptal
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              disabled={isDeleting}
              className={`bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white ${
                isDeleting ? "opacity-70" : ""
              }`}
            >
              {isDeleting ? "Siliniyor..." : "Sil"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent
          className={`h-[85vh] max-w-3xl overflow-hidden flex flex-col ${
            isDark ? "bg-gray-900 text-gray-200" : ""
          } animate-in zoom-in-90`}
        >
          <DialogHeader className="pb-2">
            <DialogTitle
              className={`flex items-center gap-2 text-xl ${
                isDark ? "text-gray-100" : ""
              }`}
            >
              <span className="font-semibold">
                {member.first_name} {member.last_name}
              </span>
              <span
                className={isDark ? "text-gray-400" : "text-muted-foreground"}
              >
                -
              </span>
              <span>Üye Paketleri</span>
            </DialogTitle>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto pr-2 scroll-smooth">
            {memberPackages.length === 0 ? (
              <div
                className={`text-center ${
                  isDark
                    ? "text-gray-400 bg-gray-800/50"
                    : "text-muted-foreground bg-accent/30"
                } py-12 rounded-lg mt-4`}
              >
                <p className="text-lg">Bu üyeye ait paket bulunmuyor</p>
              </div>
            ) : (
              <div className="space-y-6 mt-4">
                {/* Active Packages Section */}
                {activePackages.length > 0 && (
                  <div className="space-y-4 animate-in fade-in-50">
                    <h2
                      className={`text-lg font-semibold ${
                        isDark ? "text-gray-200" : ""
                      } flex items-center gap-2
                      py-1 px-3 bg-gradient-to-r ${
                        isDark
                          ? "from-primary/20 to-transparent"
                          : "from-primary/10 to-transparent"
                      } rounded-lg`}
                    >
                      <div className="h-2 w-2 rounded-full bg-blue-500 animate-pulse"></div>
                      Aktif Paketler
                      <Badge className="bg-blue-500 text-white">
                        {activePackages.length}
                      </Badge>
                    </h2>
                    {activePackages.map((packageData, index) => (
                      <div
                        key={packageData.id}
                        className="animate-in fade-in-50"
                        style={{ animationDelay: `${index * 100}ms` }}
                      >
                        <PackageCard
                          packageData={packageData}
                          trainers={trainers}
                          onDelete={handleDeleteAppointment}
                          defaultOpen={true}
                        />
                      </div>
                    ))}
                  </div>
                )}

                {/* Completed Packages Section */}
                {completedPackages.length > 0 && (
                  <div
                    className="space-y-4 animate-in fade-in-50"
                    style={{ animationDelay: "200ms" }}
                  >
                    <h2
                      className={`text-lg font-semibold ${
                        isDark ? "text-gray-200" : ""
                      } flex items-center gap-2
                      py-1 px-3 bg-gradient-to-r ${
                        isDark
                          ? "from-gray-800 to-transparent"
                          : "from-gray-100 to-transparent"
                      } rounded-lg`}
                    >
                      Tamamlanan Paketler
                      <Badge
                        variant="outline"
                        className={isDark ? "bg-gray-800" : ""}
                      >
                        {completedPackages.length}
                      </Badge>
                    </h2>
                    {completedPackages.map((packageData, index) => (
                      <div
                        key={packageData.id}
                        className="animate-in fade-in-50"
                        style={{
                          animationDelay: `${
                            (index + activePackages.length) * 100 + 200
                          }ms`,
                        }}
                      >
                        <PackageCard
                          packageData={packageData}
                          trainers={trainers}
                          onDelete={handleDeleteAppointment}
                          defaultOpen={false}
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
