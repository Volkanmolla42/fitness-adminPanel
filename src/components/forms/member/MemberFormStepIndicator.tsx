import React from "react";

interface MemberFormStepIndicatorProps {
  currentStep: number;
  isEditing: boolean;
}

export function MemberFormStepIndicator({
  currentStep,
  isEditing,
}: MemberFormStepIndicatorProps) {
  if (isEditing) return null;

  return (
    <div className="flex justify-between items-center mb-4">
      <div className="flex items-center space-x-2">
        <div
          className={`rounded-full h-8 w-8 flex items-center justify-center text-sm font-medium ${
            currentStep === 1
              ? "bg-primary text-primary-foreground"
              : "bg-muted text-muted-foreground"
          }`}
        >
          1
        </div>
        <div className="text-sm font-medium">Üye Bilgileri</div>
      </div>
      <div className="h-0.5 w-10 bg-muted"></div>
      <div className="flex items-center space-x-2">
        <div
          className={`rounded-full h-8 w-8 flex items-center justify-center text-sm font-medium ${
            currentStep === 2
              ? "bg-primary text-primary-foreground"
              : "bg-muted text-muted-foreground"
          }`}
        >
          2
        </div>
        <div className="text-sm font-medium">Paket Seçimi</div>
      </div>
      <div className="h-0.5 w-10 bg-muted"></div>
      <div className="flex items-center space-x-2">
        <div
          className={`rounded-full h-8 w-8 flex items-center justify-center text-sm font-medium ${
            currentStep === 3
              ? "bg-primary text-primary-foreground"
              : "bg-muted text-muted-foreground"
          }`}
        >
          3
        </div>
        <div className="text-sm font-medium">Ödeme Bilgileri</div>
      </div>
    </div>
  );
}
