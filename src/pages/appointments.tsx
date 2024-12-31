import React, { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { AppointmentForm } from "@/components/forms/AppointmentForm";
import { defaultMembers } from "@/data/members";
import { defaultTrainers } from "@/data/trainers";
import { defaultServices } from "@/data/services";
import { defaultAppointments } from "@/data/appointments";
import { AppointmentFilters } from "@/components/appointments/AppointmentFilters";
import AppointmentCard from "@/components/appointments/AppointmentCard";
import type { Appointment } from "@/types/appointment";

function AppointmentsPage() {
  const [appointments, setAppointments] = useState(defaultAppointments);
  const [searchQuery, setSearchQuery] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] =
    useState<Appointment | null>(null);

  // Convert arrays to record objects for easier lookup
  const membersRecord = defaultMembers.reduce(
    (acc, member) => ({ ...acc, [member.id]: member }),
    {} as Record<string, (typeof defaultMembers)[0]>
  );

  const trainersRecord = defaultTrainers.reduce(
    (acc, trainer) => ({ ...acc, [trainer.id]: trainer }),
    {} as Record<string, (typeof defaultTrainers)[0]>
  );

  const servicesRecord = defaultServices.reduce(
    (acc, service) => ({ ...acc, [service.id]: service }),
    {} as Record<string, (typeof defaultServices)[0]>
  );

  // Filter appointments based on search query
  const filteredAppointments = useMemo(() => {
    return appointments.filter((appointment) => {
      if (!searchQuery.trim()) return true;

      const member = membersRecord[appointment.memberId];
      const trainer = trainersRecord[appointment.trainerId];
      const service = servicesRecord[appointment.serviceId];

      if (!member || !trainer || !service) return false;

      const searchTerms = searchQuery.toLowerCase().split(" ");
      const searchString = `
        ${member.firstName}
        ${member.lastName}
        ${trainer.name}
        ${service.name}
        ${appointment.date}
        ${appointment.time}
        ${appointment.notes || ""}
      `.toLowerCase();

      return searchTerms.every((term) => searchString.includes(term));
    });
  }, [
    appointments,
    searchQuery,
    membersRecord,
    trainersRecord,
    servicesRecord,
  ]);

  // Group appointments by status
  const groupedAppointments = useMemo(() => {
    const groups = filteredAppointments.reduce((groups, appointment) => {
      const status = appointment.status;
      if (!groups[status]) {
        groups[status] = [];
      }
      groups[status].push(appointment);
      return groups;
    }, {} as Record<Appointment["status"], Appointment[]>);

    // Sort appointments by time within each group
    Object.values(groups).forEach((group) => {
      group.sort((a, b) => a.time.localeCompare(b.time));
    });

    return groups;
  }, [filteredAppointments]);

  // Handle search change
  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
  };

  const handleEditAppointment = (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setIsDialogOpen(true);
  };

  const handleFormSubmit = (data: Omit<Appointment, "id" | "status">) => {
    if (
      !data.date ||
      !data.time ||
      !data.memberId ||
      !data.trainerId ||
      !data.serviceId
    ) {
      alert("Please fill in all required fields.");
      return;
    }

    if (selectedAppointment) {
      // Editing existing appointment
      setAppointments((prev) =>
        prev.map((app) =>
          app.id === selectedAppointment.id
            ? { ...selectedAppointment, ...data }
            : app
        )
      );
    } else {
      // Adding new appointment
      const newAppointment: Appointment = {
        ...data,
        id: Math.random().toString(36).substring(2, 11),
        status: "scheduled",
      };
      setAppointments((prev) => [...prev, newAppointment]);
    }
    setSelectedAppointment(null);
    setIsDialogOpen(false);
  };

  const handleStatusChange = (id: string, status: Appointment["status"]) => {
    setAppointments((prev) =>
      prev.map((appointment) =>
        appointment.id === id ? { ...appointment, status } : appointment
      )
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Günlük Randevular</h1>
          <p className="text-gray-500 text-sm sm:text-base">
            {new Date().toLocaleDateString("tr-TR", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </p>
        </div>
        <Dialog
          open={isDialogOpen}
          onOpenChange={(open) => {
            setIsDialogOpen(open);
            if (!open) setSelectedAppointment(null);
          }}
        >
          <DialogTrigger asChild>
            <Button className="w-full sm:w-auto">
              <Plus className="mr-2 h-4 w-4" /> Yeni Randevu
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>
                {selectedAppointment ? "Randevu Düzenle" : "Yeni Randevu"}
              </DialogTitle>
            </DialogHeader>
            <AppointmentForm
              members={defaultMembers}
              trainers={defaultTrainers}
              services={defaultServices}
              appointment={selectedAppointment}
              onSubmit={handleFormSubmit}
              onCancel={() => {
                setIsDialogOpen(false);
                setSelectedAppointment(null);
              }}
            />
          </DialogContent>
        </Dialog>
      </div>

      <div className="w-full">
        <AppointmentFilters
          searchQuery={searchQuery}
          onSearchChange={handleSearchChange}
          onFilterClick={() => {}}
        />
      </div>

      {/* Ongoing Appointments */}
      {groupedAppointments["in-progress"] &&
        groupedAppointments["in-progress"].length > 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h2 className="text-lg sm:text-xl font-semibold mb-4 text-blue-800">
              Devam Eden Randevular
            </h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {groupedAppointments["in-progress"].map((appointment) => (
                <AppointmentCard
                  key={appointment.id}
                  appointment={appointment}
                  member={{
                    firstName: membersRecord[appointment.memberId].firstName,
                    lastName: membersRecord[appointment.memberId].lastName,
                  }}
                  trainer={{
                    name: trainersRecord[appointment.trainerId].name,
                  }}
                  service={servicesRecord[appointment.serviceId]}
                  onStatusChange={handleStatusChange}
                  onEdit={handleEditAppointment}
                />
              ))}
            </div>
          </div>
        )}

      {/* Upcoming Appointments */}
      {groupedAppointments["scheduled"] &&
        groupedAppointments["scheduled"].length > 0 && (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <h2 className="text-lg sm:text-xl font-semibold mb-4">
              Yaklaşan Randevular
            </h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {groupedAppointments["scheduled"].map((appointment) => (
                <AppointmentCard
                  key={appointment.id}
                  appointment={appointment}
                  member={{
                    firstName: membersRecord[appointment.memberId].firstName,
                    lastName: membersRecord[appointment.memberId].lastName,
                  }}
                  trainer={{
                    name: trainersRecord[appointment.trainerId].name,
                  }}
                  service={servicesRecord[appointment.serviceId]}
                  onStatusChange={handleStatusChange}
                  onEdit={handleEditAppointment}
                />
              ))}
            </div>
          </div>
        )}

      {/* Completed Appointments */}
      {groupedAppointments["completed"] &&
        groupedAppointments["completed"].length > 0 && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <h2 className="text-lg sm:text-xl font-semibold mb-4 text-green-800">
              Tamamlanan Randevular
            </h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {groupedAppointments["completed"].map((appointment) => (
                <AppointmentCard
                  key={appointment.id}
                  appointment={appointment}
                  member={{
                    firstName: membersRecord[appointment.memberId].firstName,
                    lastName: membersRecord[appointment.memberId].lastName,
                  }}
                  trainer={{
                    name: trainersRecord[appointment.trainerId].name,
                  }}
                  service={servicesRecord[appointment.serviceId]}
                  onStatusChange={handleStatusChange}
                  onEdit={handleEditAppointment}
                />
              ))}
            </div>
          </div>
        )}

      {/* Cancelled Appointments */}
      {groupedAppointments["cancelled"] &&
        groupedAppointments["cancelled"].length > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <h2 className="text-lg sm:text-xl font-semibold mb-4 text-red-800">
              İptal Edilen Randevular
            </h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {groupedAppointments["cancelled"].map((appointment) => (
                <AppointmentCard
                  key={appointment.id}
                  appointment={appointment}
                  member={{
                    firstName: membersRecord[appointment.memberId].firstName,
                    lastName: membersRecord[appointment.memberId].lastName,
                  }}
                  trainer={{
                    name: trainersRecord[appointment.trainerId].name,
                  }}
                  service={servicesRecord[appointment.serviceId]}
                  onStatusChange={handleStatusChange}
                  onEdit={handleEditAppointment}
                />
              ))}
            </div>
          </div>
        )}

      {/* No Appointments Message */}
      {Object.keys(groupedAppointments).length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <p>Bugün için randevu bulunmamaktadır.</p>
        </div>
      )}
    </div>
  );
}

export default AppointmentsPage;
