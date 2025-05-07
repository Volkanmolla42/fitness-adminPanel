import React from "react";

interface MemberFormStepIndicatorProps {
  currentStep: number;
}

export function MemberFormStepIndicator({
  currentStep,
}: MemberFormStepIndicatorProps) {
 

  const steps = [
    { id: 1, label: "Üye Bilgileri" },
    { id: 2, label: "Paket Seçimi" },
    { id: 3, label: "Ödeme Bilgileri" },
    { id: 4, label: "Önizleme" },
  ];

  return (
    <div className="flex justify-between items-center px-8">
      {steps.map((step, index) => (
        <React.Fragment key={step.id}>
          <div className="flex flex-col items-center space-y-1">
            <div
              className={`rounded-full h-8 w-8 flex items-center justify-center text-sm font-medium ${
                currentStep === step.id
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              {step.id}
            </div>
            <div className="text-sm text-center">{step.label}</div>
          </div>

          {index !== steps.length - 1 && (
            <div className="flex-1 h-0.5 bg-muted mx-2"></div>
          )}
        </React.Fragment>
      ))}
    </div>
  );
}
