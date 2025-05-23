import { useTheme } from "@/contexts/theme-context";
import { Button } from "@/components/ui/button";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { UseFormReturn } from "react-hook-form";
import type { Database } from "@/types/supabase";
import type { Service } from "@/types/index";
import React from "react";
import { formatPhoneNumber } from "../TrainerForm";

type Member = Database["public"]["Tables"]["members"]["Row"];
type MemberInput = Omit<Member, "id" | "created_at">;

interface MemberInfoStepProps {
  form: UseFormReturn<MemberInput>;
  isEditing: boolean;
  isSubmitting: boolean;
  existingServices: Service[];
  onCancel: () => void;
  onNext: () => void;
  onSubmit: () => void;
  setCurrentStep: (step: number) => void;
  setShowDeleteConfirm: (show: boolean) => void;
  setPackageToDelete: (service: Service | null) => void;
}

export function MemberInfoStep({
  form,
  isEditing,
  isSubmitting,
  existingServices,
  onCancel,
  onNext,
  onSubmit,
  setCurrentStep,
  setShowDeleteConfirm,
  setPackageToDelete,
}: MemberInfoStepProps) {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  return (
    <div className="space-y-4 mb-4 p-1">
      <div
        className={`text-xs font-medium ${
          isDark ? "text-gray-400" : "text-muted-foreground"
        } px-1`}
      >
        Kişisel Bilgiler
      </div>

      <div
        className={`flex flex-col sm:flex-row gap-6 p-4 border-2 rounded-lg shadow-sm ${
          isDark
            ? "bg-gray-800/50 border-gray-700"
            : "bg-gray-50/80 border-gray-300"
        }`}
      >
        {/* Avatar Section */}
        <div className="flex flex-col items-center gap-2">
          <FormField
            control={form.control}
            name="avatar_url"
            render={({ field }) => (
              <FormItem className="space-y-2">
                <div className="relative">
                  <div
                    className={`h-24 w-24 rounded-full overflow-hidden border-2 ${
                      isDark
                        ? "border-primary/30 shadow-lg shadow-primary/10"
                        : "border-primary/20 shadow-md"
                    }`}
                  >
                    <img
                      src={field.value}
                      alt="Üye Avatar"
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <button
                    type="button"
                    className={`absolute -bottom-1 -right-1 p-1.5 rounded-full shadow-md transition-colors ${
                      isDark
                        ? "bg-primary/80 text-primary-foreground hover:bg-primary/70 shadow-primary/20"
                        : "bg-primary text-primary-foreground hover:bg-primary/90"
                    }`}
                    onClick={() => {
                      const newAvatar = `https://api.dicebear.com/7.x/avataaars/svg?seed=${Math.random()
                        .toString(36)
                        .substring(
                          2
                        )}&options[style]=female&options[top]=longHair&options[accessories]=none`;
                      field.onChange(newAvatar);
                    }}
                    title="Rastgele Avatar"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <rect
                        x="2"
                        y="2"
                        width="20"
                        height="20"
                        rx="5"
                        ry="5"
                      ></rect>
                      <path d="M6 16h.01"></path>
                      <path d="M10 16h.01"></path>
                      <path d="M14 16h.01"></path>
                      <path d="M18 16h.01"></path>
                      <path d="M6 12h.01"></path>
                      <path d="M18 12h.01"></path>
                      <path d="M10 8h.01"></path>
                      <path d="M14 8h.01"></path>
                    </svg>
                  </button>
                </div>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* VIP Membership Checkbox */}
          <FormField
            control={form.control}
            name="membership_type"
            render={({ field }) => (
              <FormItem className="mt-2">
                <div className="flex items-center gap-2">
                  <div
                    className={`flex items-center border-2 px-3 py-2 rounded-md ${
                      isDark
                        ? "bg-gray-800/50 border-gray-700"
                        : "bg-white border-gray-300 shadow-sm"
                    } hover:bg-accent/50 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring gap-2`}
                  >
                    <input
                      type="checkbox"
                      id="membership-type"
                      checked={field.value === "vip"}
                      onChange={(e) => {
                        field.onChange(e.target.checked ? "vip" : "basic");
                      }}
                      className={`h-4 w-4 rounded ${
                        isDark ? "accent-primary/80" : "accent-primary"
                      }`}
                    />
                    <label
                      htmlFor="membership-type"
                      className={`text-sm font-medium cursor-pointer ml-1.5 ${
                        isDark ? "text-gray-200" : "text-gray-700"
                      }`}
                    >
                      VIP Üyelik
                    </label>
                  </div>
                </div>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Member Info Section */}
        <div className="flex-1 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="first_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel
                    className={`text-xs font-medium ${
                      isDark ? "text-gray-300" : "text-gray-700"
                    }`}
                  >
                    Ad
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Ad"
                      {...field}
                      onChange={(e) => {
                        const words = e.target.value.split(" ");
                        const capitalizedWords = words.map((word) =>
                          word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
                        );
                        field.onChange(capitalizedWords.join(" "));
                      }}
                      className={`border-2 ${
                        isDark
                          ? "bg-gray-800/80 border-gray-700 text-gray-200 focus-visible:border-primary/70 focus-visible:ring-primary/30"
                          : "bg-white border-gray-300 text-gray-900 focus-visible:border-primary focus-visible:ring-primary/20"
                      }`}
                    />
                  </FormControl>
                  <FormMessage
                    className={isDark ? "text-rose-300" : "text-rose-500"}
                  />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="last_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel
                    className={`text-xs font-medium ${
                      isDark ? "text-gray-300" : "text-gray-700"
                    }`}
                  >
                    Soyad
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Soyad"
                      {...field}
                      onChange={(e) => {
                        field.onChange(e.target.value.toUpperCase());
                      }}
                      className={`border-2 ${
                        isDark
                          ? "bg-gray-800/80 border-gray-700 text-gray-200 focus-visible:border-primary/70 focus-visible:ring-primary/30"
                          : "bg-white border-gray-300 text-gray-900 focus-visible:border-primary focus-visible:ring-primary/20"
                      }`}
                    />
                  </FormControl>
                  <FormMessage
                    className={isDark ? "text-rose-300" : "text-rose-500"}
                  />
                </FormItem>
              )}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel
                    className={`text-xs font-medium ${
                      isDark ? "text-gray-300" : "text-gray-700"
                    }`}
                  >
                    Telefon
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Telefon"
                      {...field}
                      value={field.value || ""}
                      onChange={(e) => {
                        const formatted = formatPhoneNumber(e.target.value);
                        field.onChange(formatted);
                      }}
                      className={`border-2 ${
                        isDark
                          ? "bg-gray-800/80 border-gray-700 text-gray-200 focus-visible:border-primary/70 focus-visible:ring-primary/30"
                          : "bg-white border-gray-300 text-gray-900 focus-visible:border-primary focus-visible:ring-primary/20"
                      }`}
                    />
                  </FormControl>
                  <FormMessage
                    className={isDark ? "text-rose-300" : "text-rose-500"}
                  />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel
                    className={`text-xs font-medium ${
                      isDark ? "text-gray-300" : "text-gray-700"
                    }`}
                  >
                    E-posta
                  </FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      placeholder="E-posta adresi"
                      {...field}
                      value={field.value || ""}
                      onChange={(e) => {
                        const value = e.target.value;
                        field.onChange(value || "");
                      }}
                      className={`border-2 ${
                        isDark
                          ? "bg-gray-800/80 border-gray-700 text-gray-200 focus-visible:border-primary/70 focus-visible:ring-primary/30"
                          : "bg-white border-gray-300 text-gray-900 focus-visible:border-primary focus-visible:ring-primary/20"
                      }`}
                    />
                  </FormControl>
                  <FormMessage
                    className={isDark ? "text-rose-300" : "text-rose-500"}
                  />
                </FormItem>
              )}
            />
          </div>
        </div>
      </div>

      {/* Mevcut Paketler - Düzenleme modunda */}
      {isEditing && (
        <div className="mt-4">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm font-medium px-1">Mevcut Paketler</div>
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="flex items-center gap-1"
              onClick={() => setCurrentStep(2)}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M5 12h14" />
                <path d="M12 5v14" />
              </svg>
              Paket Ekle
            </Button>
          </div>
          {existingServices.length > 0 ? (
            <div className="flex flex-wrap gap-2 p-2 border rounded-md bg-muted/20">
              {existingServices.map((service, index) => (
                <Badge
                  key={`existing-${service.id}-${index}`}
                  variant="outline"
                  className={`px-2 py-1 flex items-center gap-1.5 ${
                    isDark ? "bg-gray-700 hover:bg-gray-600" : ""
                  }`}
                >
                  <span>{service.name}</span>
                  <button
                    type="button"
                    className="ml-1 text-destructive hover:text-destructive/80 transition-colors"
                    onClick={() => {
                      setPackageToDelete(service);
                      setShowDeleteConfirm(true);
                    }}
                    title="Paketi Sil"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M3 6h18" />
                      <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                      <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                      <line x1="10" x2="10" y1="11" y2="17" />
                      <line x1="14" x2="14" y1="11" y2="17" />
                    </svg>
                  </button>
                </Badge>
              ))}
            </div>
          ) : (
            <div className="p-4 border rounded-md bg-muted/20 text-center text-sm text-muted-foreground">
              Üyenin henüz paketi bulunmuyor. Paket eklemek için &quot;Paket
              Ekle&quot; butonuna tıklayın.
            </div>
          )}
        </div>
      )}

      {/* Notes and Start Date */}
      <div className="flex gap-2">
        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem className="w-full">
              <FormLabel
                className={`text-xs font-medium ${
                  isDark ? "text-gray-300" : "text-gray-700"
                }`}
              >
                Notlar
              </FormLabel>
              <FormControl>
                <Input
                  placeholder="Notlar.."
                  {...field}
                  className={`border-2 focus-visible:border-primary ${
                    isDark ? "bg-gray-800 border-gray-700 text-gray-200" : "bg-white border-gray-300 text-gray-900"
                  }`}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="start_date"
          render={({ field }) => (
            <FormItem>
              <FormLabel
                className={`text-xs font-medium ${
                  isDark ? "text-gray-300" : "text-gray-700"
                }`}
              >
                Başlangıç Tarihi
              </FormLabel>
              <FormControl>
                <Input
                  type="date"
                  {...field}
                  className={`border-2 w-full focus-visible:border-primary ${
                    isDark ? "bg-gray-800 border-gray-700 text-gray-200" : ""
                  }`}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      {/* Action Buttons */}
      <div className="flex justify-between mt-6">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isSubmitting}
          className="flex items-center gap-1"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M18 6 6 18" />
            <path d="m6 6 12 12" />
          </svg>
          İptal
        </Button>
        {isEditing ? (
          <Button
            type="button"
            disabled={isSubmitting}
            className="flex items-center gap-1"
            onClick={onSubmit}
          >
            {isSubmitting ? "Kaydediliyor..." : "Kaydet"}
            {!isSubmitting && (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M20 6 9 17l-5-5" />
              </svg>
            )}
          </Button>
        ) : (
          <Button
            type="button"
            disabled={isSubmitting}
            className="flex items-center gap-1"
            onClick={onNext}
          >
            Paket Seçimine Geç
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M5 12h14" />
              <path d="m12 5 7 7-7 7" />
            </svg>
          </Button>
        )}
      </div>
    </div>
  );
}
