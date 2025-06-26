import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Crown,
  Pencil,
  Phone,
  History,
  Trash2,
  Package2,
  Calendar,
  UserX,
  UserCheck,
  Settings,
  Mail,
  CalendarPlus,
  Save,
  CalendarRange,
  ChevronDown,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import type { Database } from "@/types/supabase";
import React, { useState, useMemo, useCallback } from "react";
import { AppointmentHistory } from "./AppointmentHistory";
import { AppointmentForm } from "@/components/forms/AppointmentForm";
import { useAppointments } from "@/hooks/useAppointments";
import { toast } from "sonner";
import { useTheme } from "@/contexts/theme-context";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { openWhatsApp } from "@/lib/utils";

type Member = Database["public"]["Tables"]["members"]["Row"];
type Service = Database["public"]["Tables"]["services"]["Row"];
type Appointment = Database["public"]["Tables"]["appointments"]["Row"];
type Trainer = Database["public"]["Tables"]["trainers"]["Row"];

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

interface MemberDetailProps {
  member: Member;
  services: { [key: string]: Service };
  trainers: { [key: string]: Trainer };
  appointments: Appointment[];
  onEdit: (member: Member) => void;
  onDelete: (id: string) => Promise<void>;
  onUpdate?: (member: Member) => Promise<void>;
  onAppointmentDeleted?: (appointmentId: string) => void;
  onToggleActive?: (member: Member) => Promise<void>;
}

export const MemberDetail = ({
  member,
  services,
  trainers,
  appointments,
  onEdit,
  onDelete,
  onAppointmentDeleted,
  onUpdate,
}: MemberDetailProps) => {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const { createAppointment } = useAppointments();
  const [showAppointments, setShowAppointments] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showDeactivateDialog, setShowDeactivateDialog] = useState(false);
  const [showActivateDialog, setShowActivateDialog] = useState(false);
  const [showAddAppointmentDialog, setShowAddAppointmentDialog] =
    useState(false);
  const [editingPostponement, setEditingPostponement] = useState(false);
  const [postponementCount, setPostponementCount] = useState(
    member.postponement_count
  );
  const isVip = member.membership_type === "vip";

  // Filter appointments for this member
  const memberAppointments = appointments.filter(
    (apt) => apt.member_id === member.id
  );

  // Format dates function
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("tr-TR", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  // Helper function to format dates for packages
  const formatDateShort = (date: Date | null) => {
    if (!date) return "Belirsiz";
    return format(date, "d MMM yyyy", { locale: tr });
  };

  // Helper function to sort appointments
  const sortAppointments = (appointments: Appointment[]) => {
    return [...appointments].sort((a, b) => {
      const dateA = new Date(`${a.date} ${a.time}`);
      const dateB = new Date(`${b.date} ${b.time}`);
      return dateA.getTime() - dateB.getTime();
    });
  };

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
            const isActive =
              completedSessions + cancelledSessions < totalSessions;

            // Calculate start and end dates
            let startDate = null;
            let endDate = null;

            if (packageAppointments.length > 0) {
              // Start date is the first appointment
              startDate = new Date(
                `${packageAppointments[0].date}T${packageAppointments[0].time}`
              );

              // End date is the last appointment
              const lastAppointment =
                packageAppointments[packageAppointments.length - 1];
              endDate = new Date(
                `${lastAppointment.date}T${lastAppointment.time}`
              );
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
    [sortAppointments]
  );

  // Group appointments into packages
  const memberPackages = useMemo(() => {
    const allPackages = groupAppointmentsIntoPackages(
      memberAppointments,
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
  }, [memberAppointments, services, member, groupAppointmentsIntoPackages]);

  // Split packages into active and completed
  const { activePackages, completedPackages } = useMemo(() => {
    const active = memberPackages.filter((pkg) => pkg.isActive);
    const completed = memberPackages.filter((pkg) => !pkg.isActive);

    return {
      activePackages: active,
      completedPackages: completed,
    };
  }, [memberPackages]);

  // PackageCard component for displaying individual packages
  const PackageCard = React.memo(
    ({
      packageData,
      defaultOpen = false,
    }: {
      packageData: Package;
      defaultOpen?: boolean;
    }) => {
      const [isOpen, setIsOpen] = useState(defaultOpen);

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
      }, [packageData.isActive, packageData.progressPercentage]);

      // Get progress bar background color based on completion status
      const getProgressColor = () => {
        const completionRate =
          ((packageData.completedSessions +
            packageData.scheduledSessions +
            packageData.cancelledSessions) /
            packageData.totalSessions) *
          100;

        if (packageData.isActive) {
          return isDark ? "bg-primary/20" : "bg-primary/20";
        }

        if (completionRate >= 90) {
          return isDark ? "bg-green-900/20" : "bg-green-100";
        }

        if (completionRate >= 50) {
          return isDark ? "bg-amber-900/20" : "bg-amber-100";
        }

        return isDark ? "bg-gray-800/50" : "bg-gray-100";
      };

      return (
        <Collapsible
          open={isOpen}
          onOpenChange={setIsOpen}
          className="space-y-2 mb-3 transition-all duration-200 ease-in-out "
        >
          <CollapsibleTrigger className="w-full">
            <div
              className={cn(
                `flex items-center gap-3 p-4 rounded-lg transition-all duration-200 border
             hover:shadow-md relative ${
               isDark ? "hover:bg-gray-800/70" : "hover:bg-accent/70"
             }`,
                packageStyle
              )}
            >
              {packageData.isActive && (
                <Badge className="bg-gradient-to-r absolute -top-3 left-2 from-blue-500 to-blue-600 text-white text-xs px-2 py-0.5 shrink-0">
                  Aktif
                </Badge>
              )}
              {/* Main Content */}
              <div className="flex-1 min-w-0">
                {/* Header with service name and status */}
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <h3
                      className={`text-base font-semibold truncate ${
                        isDark ? "text-gray-200" : "text-gray-900"
                      }`}
                    >
                      {packageData.serviceName}
                    </h3>

                  </div>

                  {/* Session count */}
                  <div
                    className={`text-sm font-medium px-2 py-1 rounded-md shrink-0 ${
                      packageData.isActive
                        ? isDark
                          ? "bg-primary/10 text-primary"
                          : "bg-primary/10 text-primary"
                        : isDark
                        ? "bg-gray-800 text-gray-300"
                        : "bg-gray-100 text-gray-700"
                    }`}
                  >
                    {packageData.completedSessions +
                      packageData.scheduledSessions +
                      packageData.cancelledSessions}
                    /{packageData.totalSessions}
                  </div>
                </div>

                {/* Date range */}
                <div className="flex items-center gap-1 mb-3 text-xs">
                  <Calendar
                    className={`h-3 w-3 ${
                      isDark ? "text-gray-500" : "text-gray-400"
                    }`}
                  />
                  <span className={isDark ? "text-gray-500" : "text-gray-400"}>
                    {formatDateShort(packageData.startDate)} -{" "}
                    {formatDateShort(packageData.endDate)}
                  </span>
                </div>

                {/* Progress bar and stats */}
                <div className="space-y-2">
                  <div
                    className={`relative h-2 w-full flex overflow-hidden rounded-full ${getProgressColor()}`}
                  >
                    {completedPercentage > 0 && (
                      <div
                        className="h-full bg-green-500 transition-all duration-300"
                        style={{ width: `${completedPercentage}%` }}
                        title={`Tamamlandı: ${packageData.completedSessions}`}
                      />
                    )}
                    {scheduledPercentage > 0 && (
                      <div
                        className="h-full bg-blue-500 transition-all duration-300"
                        style={{ width: `${scheduledPercentage}%` }}
                        title={`Planlanmış: ${packageData.scheduledSessions}`}
                      />
                    )}
                    {cancelledPercentage > 0 && (
                      <div
                        className="h-full bg-red-500 transition-all duration-300"
                        style={{ width: `${cancelledPercentage}%` }}
                        title={`İptal Edildi: ${packageData.cancelledSessions}`}
                      />
                    )}
                    {/* Remaining sessions (empty space) */}
                    {packageData.remainingSessions > 0 && (
                      <div
                        className={`h-full ${
                          isDark ? "bg-gray-600" : "bg-gray-300"
                        } transition-all duration-300`}
                        style={{
                          width: `${
                            (packageData.remainingSessions /
                              packageData.totalSessions) *
                            100
                          }%`,
                        }}
                        title={`Kalan: ${packageData.remainingSessions}`}
                      />
                    )}
                  </div>

                  {/* Stats summary */}
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-3">
                      {packageData.completedSessions > 0 && (
                        <span
                          className={`${
                            isDark ? "text-green-400" : "text-green-600"
                          } font-medium`}
                        >
                          {packageData.completedSessions} tamamlandı
                        </span>
                      )}
                      {packageData.scheduledSessions > 0 && (
                        <span
                          className={`${
                            isDark ? "text-blue-400" : "text-blue-600"
                          } font-medium`}
                        >
                          {packageData.scheduledSessions} planlandı
                        </span>
                      )}
                      {packageData.cancelledSessions > 0 && (
                        <span
                          className={`${
                            isDark ? "text-red-400" : "text-red-600"
                          } font-medium`}
                        >
                          {packageData.cancelledSessions} iptal
                        </span>
                      )}
                      {packageData.remainingSessions > 0 && (
                        <span
                          className={`${
                            isDark ? "text-gray-400" : "text-gray-500"
                          } font-medium`}
                        >
                          {packageData.remainingSessions} kalan
                        </span>
                      )}
                    </div>
                    <span
                      className={`font-medium ${
                        isDark ? "text-gray-300" : "text-gray-600"
                      }`}
                    >
                      %
                      {Math.round(
                        ((packageData.completedSessions +
                          packageData.scheduledSessions +
                          packageData.cancelledSessions) /
                          packageData.totalSessions) *
                          100
                      )}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </CollapsibleTrigger>
        </Collapsible>
      );
    }
  );

  PackageCard.displayName = "PackageCard";

  const handleDelete = async () => {
    if (member.id) {
      await onDelete(member.id);
      setShowDeleteDialog(false);
    }
  };

  const handleSavePostponement = async () => {
    if (onUpdate) {
      await onUpdate({
        ...member,
        postponement_count: postponementCount,
      });
      setEditingPostponement(false);
      toast.success("Erteleme hakkı güncellendi.");
    }
  };

  return (
    <div className="p-4 relative overflow-y-auto max-h-[calc(100vh-3rem)]">
      {/* Ayarlar Dropdown Menüsü - Sağ Üst Köşe */}
      <div className="absolute top-6 right-6 z-10">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 dark:hover:bg-zinc-700 hover:bg-gray-100"
            >
              <Settings className="h-5 w-5 text-gray-500" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem
              onClick={() => onEdit(member)}
              className="cursor-pointer"
            >
              <Pencil className="mr-2 h-4 w-4" />
              Düzenle
            </DropdownMenuItem>

            <DropdownMenuItem
              onClick={() =>
                member.active
                  ? setShowDeactivateDialog(true)
                  : setShowActivateDialog(true)
              }
              className={`cursor-pointer ${
                member.active ? "text-red-600" : "text-green-600"
              }`}
            >
              {member.active ? (
                <UserX className="mr-2 h-4 w-4" />
              ) : (
                <UserCheck className="mr-2 h-4 w-4" />
              )}
              {member.active ? "Pasife Al" : "Aktife Al"}
            </DropdownMenuItem>

            <DropdownMenuItem
              onClick={() => setShowDeleteDialog(true)}
              className="text-red-600 cursor-pointer"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Sil
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Üst Bilgi Kartı */}
      <div className="bg-white dark:bg-gray-800 shadow-md overflow-hidden">
        <div className="p-3 flex items-center gap-3">
          <Avatar className="h-16 w-16 border-2 border-primary/20 shadow-sm">
            <AvatarImage src={member.avatar_url || undefined} />
            <AvatarFallback className="bg-primary/10 text-base font-medium">
              {member.first_name[0]}
              {member.last_name[0]}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1 min-w-0">
            <div className="flex items-center flex-wrap gap-2 mb-2">
              <h2 className="text-lg font-semibold">
                {member.first_name} {member.last_name}
              </h2>
              {isVip && (
                <Badge
                  variant="secondary"
                  className="bg-yellow-500/10 text-yellow-600 border-yellow-500/20 h-5 px-1.5 py-0.5 text-xs"
                >
                  VIP
                  <Crown className="w-2.5 h-2.5 ml-1" />
                </Badge>
              )}
              {!member.active && (
                <Badge variant="destructive" className="h-5 px-1.5 py-0.5 gap-1 text-xs">
                  <UserX className="h-2.5 w-2.5" />
                  <span>Pasif</span>
                </Badge>
              )}
            </div>

            {/* İletişim Bilgileri */}
            <div className="flex items-center gap-4 text-sm">
              <div
                className="flex items-center gap-1.5 px-2 py-1 rounded-md hover:bg-green-50 dark:hover:bg-green-900/20 cursor-pointer transition-colors group"
                onClick={() => openWhatsApp(member.phone)}
                title="WhatsApp ile mesaj gönder"
              >
                <Phone className="h-3.5 w-3.5 text-green-600 dark:text-green-500" />
                <span className="font-medium group-hover:text-green-600 dark:group-hover:text-green-500 transition-colors">
                  {member.phone}
                </span>
              </div>

              {member.email && (
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <Mail className="h-3.5 w-3.5" />
                  <span className="truncate">{member.email}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Üyelik Bilgileri */}
        <div className="border-t dark:border-gray-700 bg-gray-50 dark:bg-gray-800/80 px-3 py-2">
          <div className="flex items-center justify-between text-xs">
            {/* Kayıt Tarihi */}
            <div className="flex items-center gap-1.5">
              <CalendarRange className="h-3 w-3 text-muted-foreground" />
              <span className="text-muted-foreground">Kayıt Tarihi:</span>
              <span className="font-medium">{formatDate(member.start_date)}</span>
            </div>

            {/* Erteleme Hakkı */}
            <div className="flex items-center gap-1.5">
              <CalendarPlus className="h-3 w-3 text-muted-foreground" />
              <span className="text-muted-foreground">Erteleme:</span>
              <div
                className={`flex items-center gap-1 ${
                  member.postponement_count > 0
                    ? "text-green-600 dark:text-green-400"
                    : "text-red-600 dark:text-red-400"
                }`}
              >
                {editingPostponement ? (
                  <>
                    <input
                      type="number"
                      min="0"
                      value={postponementCount}
                      onChange={(e) =>
                        setPostponementCount(Number(e.target.value))
                      }
                      className="w-10 h-5 bg-transparent text-center focus:outline-none border rounded-sm text-xs"
                      autoFocus
                    />
                    <button
                      onClick={handleSavePostponement}
                      className="flex items-center justify-center p-0.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-sm"
                    >
                      <Save className="h-3 w-3" />
                    </button>
                  </>
                ) : (
                  <>
                    <span className="font-medium">
                      {member.postponement_count}
                    </span>
                    <button
                      onClick={() => setEditingPostponement(true)}
                      className="flex items-center justify-center p-0.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-sm"
                    >
                      <Pencil className="h-2.5 w-2.5" />
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Not Kartı */}
      {member.notes && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border p-4">
          <div className="text-sm font-medium mb-2 text-muted-foreground">
            Not
          </div>
          <p className="text-sm whitespace-pre-line">{member.notes}</p>
        </div>
      )}

      {/* Paketler Kartı */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-md border mb-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Package2 className="w-5 h-5 text-primary" />
            <h3 className="font-medium text-lg">Eklenen Paketler</h3>
          </div>
        </div>

        {memberPackages.length === 0 ? (
          <div className="text-center p-4 text-muted-foreground text-sm">
            Paket bulunmamaktadır
          </div>
        ) : (
          <div className="space-y-4">
            {/* Active Packages Section */}
            {activePackages.map((packageData) => (
              <PackageCard
                key={packageData.id}
                packageData={packageData}
                defaultOpen={true}
              />
            ))}

            {/* Completed Packages Section */}
            {completedPackages.length > 0 && (
              <Collapsible defaultOpen={false} className="space-y-2">
                <CollapsibleTrigger className="w-full">
                  <div
                    className={`flex items-center justify-between px-4 py-2 rounded-lg transition-all duration-200
                    hover:shadow-md ${
                      isDark
                        ? "hover:bg-gray-800/70 bg-gray-800/30"
                        : "hover:bg-accent/70 bg-gray-100/50"
                    } border ${isDark ? "border-gray-700" : "border-gray-200"}`}
                  >
                    <div className="flex items-center gap-2">
                      <h2
                        className={`text-sm ${
                          isDark ? "text-gray-200" : ""
                        }`}
                      >
                        Tamamlanan Paketler
                      </h2>
                      <Badge
                        variant="outline"
                        className={isDark ? "bg-gray-800" : ""}
                      >
                        {completedPackages.length}
                      </Badge>
                    </div>
                    <ChevronDown
                      className={`w-5 h-5 ${
                        isDark ? "text-gray-500" : "text-muted-foreground/50"
                      } transition-transform duration-300 group-data-[state=open]:rotate-180`}
                    />
                  </div>
                </CollapsibleTrigger>
                <CollapsibleContent className="space-y-3 pl-2">
                  {completedPackages.map((packageData) => (
                    <PackageCard
                      key={packageData.id}
                      packageData={packageData}
                      defaultOpen={false}
                    />
                  ))}
                </CollapsibleContent>
              </Collapsible>
            )}
          </div>
        )}
      </div>

      {/* Butonlar */}
      <div className="grid grid-cols-2 gap-4">
        {/* Randevu Ekle Butonu */}
        <Button
          variant="default"
          className="w-full bg-green-600 hover:bg-green-700 text-white py-6"
          onClick={() => setShowAddAppointmentDialog(true)}
        >
          <CalendarPlus className="mr-2 h-5 w-5" />
          Randevu Ekle
        </Button>

        {/* Randevu Geçmişi Butonu */}
        <Button
          variant="outline"
          className="w-full py-6"
          onClick={() => setShowAppointments(true)}
        >
          <History className="mr-2 h-5 w-5" />
          Randevu Geçmişi
        </Button>
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Üye Silme Onayı</DialogTitle>
            <DialogDescription>
              {member.first_name} {member.last_name} isimli üyeyi silmek
              istediğinize emin misiniz? Bu işlem geri alınamaz.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setShowDeleteDialog(false)}
            >
              İptal
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Sil
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Aktif/Pasif Durumu Değiştirme Onay Dialogu */}
      {(showDeactivateDialog || showActivateDialog) && (
        <Dialog
          open={showDeactivateDialog || showActivateDialog}
          onOpenChange={(open) => {
            if (!open) {
              setShowDeactivateDialog(false);
              setShowActivateDialog(false);
            }
          }}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                Üye {showDeactivateDialog ? "Pasife" : "Aktife"} Alma Onayı
              </DialogTitle>
              <DialogDescription>
                {member.first_name} {member.last_name} isimli üyeyi{" "}
                {showDeactivateDialog ? "pasife" : "aktife"} almak istediğinize
                emin misiniz?{" "}
                {showDeactivateDialog
                  ? 'Pasif üyeler listelerde görünmeye devam edecek ancak "Pasif" olarak işaretlenecektir.'
                  : 'Aktif üyeler normal olarak listelerde görünecek ve "Pasif" işareti kaldırılacaktır.'}
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setShowDeactivateDialog(false);
                  setShowActivateDialog(false);
                }}
              >
                İptal
              </Button>
              <Button
                variant={showDeactivateDialog ? "destructive" : "default"}
                className={
                  showActivateDialog ? "bg-green-600 hover:bg-green-700" : ""
                }
                onClick={() => {
                  if (onUpdate) {
                    onUpdate({
                      ...member,
                      active: !member.active,
                    });
                    setShowDeactivateDialog(false);
                    setShowActivateDialog(false);
                  }
                }}
              >
                {showDeactivateDialog ? "Pasife Al" : "Aktife Al"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Appointment History Modal */}
      {showAppointments && (
        <AppointmentHistory
          open={showAppointments}
          onOpenChange={setShowAppointments}
          appointments={memberAppointments}
          services={services}
          trainers={trainers}
          member={member}
          onAppointmentDeleted={onAppointmentDeleted}
        />
      )}

      {/* Add Appointment Dialog */}
      <Dialog
        open={showAddAppointmentDialog}
        onOpenChange={setShowAddAppointmentDialog}
      >
        <DialogContent
          className={`sm:max-w-[425px] ${
            isDark ? "dark:bg-gray-800 dark:text-gray-100" : ""
          }`}
        >
          <DialogHeader>
            <DialogTitle className={isDark ? "dark:text-white" : ""}>
              Yeni Randevu
            </DialogTitle>
          </DialogHeader>
          <AppointmentForm
            members={[member]} // Only show the current member
            trainers={Object.values(trainers)}
            services={Object.values(services)}
            appointments={appointments}
            defaultMemberId={member.id}
            onSubmit={async (data) => {
              try {
                await createAppointment({ ...data, status: "scheduled" });
                toast.success("Randevu başarıyla oluşturuldu.");
                setShowAddAppointmentDialog(false);
              } catch (error) {
                console.error("Randevu oluşturulurken hata:", error);
                toast.error("Randevu oluşturulurken bir hata oluştu.");
              }
            }}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
};
