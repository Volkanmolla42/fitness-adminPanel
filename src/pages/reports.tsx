import React, { useState, useMemo, useRef, useEffect, useCallback } from "react";

import { Button } from "@/components/ui/button";
import { Download, RefreshCw } from "lucide-react";
import {
  format,
} from "date-fns";
import { tr } from "date-fns/locale";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import {
  getAppointments,
  getMembers,
  getServices,
  getMemberPayments,
  getTrainers,
} from "@/lib/queries";
import type { Database } from "@/types/supabase";
import { toast } from "sonner";

import { ServiceUsageStats } from "@/components/reports/ServiceUsageStats";
import { AppointmentDistribution } from "@/components/reports/AppointmentDistribution";
import { RevenueChart } from "@/components/reports/RevenueChart";
import { MemberPaymentsCard } from "@/components/reports/MemberPaymentsCard";
import { PackageIncomeCard } from "@/components/reports/PackageIncomeCard";
import { PerformanceMetrics } from "@/components/reports/PerformanceMetrics";
import { LoadingSpinner } from "@/App";

type Appointment = Database["public"]["Tables"]["appointments"]["Row"];
type Member = Database["public"]["Tables"]["members"]["Row"];
type Service = Database["public"]["Tables"]["services"]["Row"];
type MemberPayment = Database["public"]["Tables"]["member_payments"]["Row"];
type Trainer = Database["public"]["Tables"]["trainers"]["Row"];

// Debug flag - set to true only during development
const DEBUG = process.env.NODE_ENV === 'development';

/**
 * Custom hook to fetch and manage all data needed for reports
 */
const useReportData = () => {
  const [data, setData] = useState<{
    appointments: Appointment[];
    members: Member[];
    services: Service[];
    memberPayments: MemberPayment[];
    trainers: Trainer[];
  }>({
    appointments: [],
    members: [],
    services: [],
    memberPayments: [],
    trainers: [],
  });
  const [isLoading, setIsLoading] = useState(true);

  // Fetch all data needed for reports
  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [appointments, members, services, memberPayments, trainers] = await Promise.all([
        getAppointments(),
        getMembers(),
        getServices(),
        getMemberPayments(),
        getTrainers(),
      ]);

      setData({
        appointments,
        members,
        services,
        memberPayments,
        trainers,
      });

      if (DEBUG) {
        logDataAnalysis(members, services, memberPayments);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Veri yüklenirken bir hata oluştu");
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Initial data fetch on component mount
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    ...data,
    isLoading,
    refreshData: fetchData,
  };
};

/**
 * Debug utility function to analyze data consistency
 */
const logDataAnalysis = (members: Member[], services: Service[], memberPayments: MemberPayment[]) => {
  // Compare data sources for consistency
  const compareDataSources = () => {
    console.log('=== Veri Tutarsızlık Analizi ===');
    
    const paymentPackages = memberPayments.length;
    console.log(`Member Payments Tablosundaki Toplam Paket Sayısı: ${paymentPackages}`);
    
    let memberServiceCount = 0;
    const memberServiceMap = new Map();
    
    members.forEach(member => {
      const memberName = `${member.first_name} ${member.last_name}`;
      
      if (member.subscribed_services && Array.isArray(member.subscribed_services)) {
        memberServiceCount += member.subscribed_services.length;
        
        if (!memberServiceMap.has(memberName)) {
          memberServiceMap.set(memberName, []);
        }
        
        const memberServices = memberServiceMap.get(memberName);
        
        member.subscribed_services.forEach(serviceId => {
          memberServices.push(serviceId);
        });
      }
    });
    
    console.log(`Members Tablosundaki Toplam Paket Sayısı: ${memberServiceCount}`);
    console.log(`Fark: ${paymentPackages - memberServiceCount} paket`);
    
    const paymentMemberServiceMap = new Map();
    
    memberPayments.forEach(payment => {
      const memberName = payment.member_name;
      const packageName = payment.package_name;
      
      if (memberName && packageName) {
        if (!paymentMemberServiceMap.has(memberName)) {
          paymentMemberServiceMap.set(memberName, []);
        }
        paymentMemberServiceMap.get(memberName).push({
          packageName,
          created_at: payment.created_at
        });
      }
    });
    
    console.log('\nEksik Paket Kayıtları:');
    let missingCount = 0;
    
    paymentMemberServiceMap.forEach((packages, memberName) => {
      const memberServices = memberServiceMap.get(memberName) || [];
      const packageCount = packages.length;
      const serviceCount = memberServices.length;
      
      if (packageCount !== serviceCount) {
        const member = members.find(m => 
          `${m.first_name} ${m.last_name}` === memberName
        );
        
        console.log(`\n> Üye: ${memberName}`);
        console.log(`  - Member Payments tablosundaki paket sayısı: ${packageCount}`);
        console.log(`  - Members tablosundaki paket sayısı: ${serviceCount}`);
        console.log(`  - Fark: ${packageCount - serviceCount} paket`);
        
        console.log('  - Ödeme Kayıtları:');
        packages.forEach((pkg, idx) => {
          console.log(`    ${idx + 1}. ${pkg.packageName} (${format(new Date(pkg.created_at), 'dd.MM.yyyy')})`);
        });
        
        console.log('  - Üye Kayıtlı Paketleri:');
        if (member && member.subscribed_services) {
          member.subscribed_services.forEach((serviceId, idx) => {
            const service = services.find(s => s.id === serviceId);
            console.log(`    ${idx + 1}. ${service ? service.name : 'Bilinmeyen Servis'} (ID: ${serviceId})`);
          });
        }
        
        missingCount += Math.abs(packageCount - serviceCount);
      }
    });
    
    console.log(`\nToplam ${missingCount} tutarsız paket kaydı bulundu.`);
    console.log('===========================');
  };
  
 ;
  
  // Log problematic members
  const logProblematicMembers = () => {
    console.log('=== Sorunlu Üye Analizi ===');
    console.log('-------------------');

    const memberPaymentCounts = new Map<string, number>();
    memberPayments.forEach(payment => {
      const memberName = payment.member_name;
      if (memberName) {
        memberPaymentCounts.set(memberName, (memberPaymentCounts.get(memberName) || 0) + 1);
      }
    });

    let problematicMembers = [];

    members.forEach(member => {
      const memberName = `${member.first_name} ${member.last_name}`;
      const packageCount = member.subscribed_services?.length || 0;
      const paymentCount = memberPaymentCounts.get(memberName) || 0;

      if (packageCount !== paymentCount) {
        problematicMembers.push({
          name: memberName,
          currentPackages: packageCount,
          paymentsInPeriod: paymentCount
        });
      }
    });

    if (problematicMembers.length > 0) {
      console.log('Sorunlu Üyeler:');
      problematicMembers.forEach(member => {
        console.log(`\nÜye: ${member.name}`);
        console.log(`  > Mevcut Paket Sayısı: ${member.currentPackages}`);
        console.log(`  > Seçili Dönemdeki Ödeme Sayısı: ${member.paymentsInPeriod}`);
        console.log(`  ! UYARI: Paket sayısı (${member.currentPackages}) ile ödeme sayısı (${member.paymentsInPeriod}) uyuşmuyor`);
      });
      console.log(`\nToplam ${problematicMembers.length} üyede uyuşmazlık tespit edildi.`);
    } else {
      console.log('Tüm üyelerin paket sayıları ve ödemeleri tutarlı.');
    }
    console.log('-------------------');
  };

  // Log package distribution
  const logPackageDistribution = () => {
    const packageCounts = {
      one: 0,
      two: 0,
      three: 0,
      four: 0,
      moreThanFour: 0
    };

    let totalPackages = 0;
    const problemUsers = [];

    members.forEach(member => {
      const packageCount = member.subscribed_services?.length || 0;
      totalPackages += packageCount;

      if (packageCount === 1) packageCounts.one++;
      else if (packageCount === 2) packageCounts.two++;
      else if (packageCount === 3) packageCounts.three++;
      else if (packageCount === 4) packageCounts.four++;
      else if (packageCount > 4) {
        packageCounts.moreThanFour++;
        problemUsers.push({
          name: `${member.first_name} ${member.last_name}`,
          packageCount
        });
      }

      console.log(`${member.first_name} ${member.last_name}: ${packageCount} paket`);
    });

    console.log('Detaylı Paket Analizi:');
    console.log('1 paketi olan üye sayısı:', packageCounts.one);
    console.log('2 paketi olan üye sayısı:', packageCounts.two);
    console.log('3 paketi olan üye sayısı:', packageCounts.three);
    console.log('4 paketi olan üye sayısı:', packageCounts.four);
    console.log('4\'ten fazla paketi olan üye sayısı:', packageCounts.moreThanFour);
    console.log('Toplam paket sayısı:', totalPackages);
    console.log('Toplam üye sayısı:', members.length);

    if (problemUsers.length > 0) {
      console.log('4\'ten fazla paketi olan üyeler:', problemUsers);
    }

    const calculatedTotal =
      (packageCounts.one * 1) +
      (packageCounts.two * 2) +
      (packageCounts.three * 3) +
      (packageCounts.four * 4);

    console.log('Manuel hesaplanan toplam:', calculatedTotal);
  };

  // Run all data analysis functions
  compareDataSources();
  logProblematicMembers();
  //logPackageDistribution();
};

/**
 * Custom hook to process member packages for display
 */
const useMemberPackages = (members: Member[], services: Service[]) => {
  return useMemo(() => {
    // Flatten the array of member packages
    const memberPackages = members.reduce((acc: any[], member) => {
      const memberName = `${member.first_name} ${member.last_name}`;
      
      if (!member.subscribed_services || !Array.isArray(member.subscribed_services) || member.subscribed_services.length === 0) {
        return acc;
      }
      
      // Find matching service names for each service ID
      const memberPackagesData = member.subscribed_services.map((serviceId: string) => {
        const service = services.find(s => s.id === serviceId);
        return {
          member_id: member.id,
          member_name: memberName,
          service_id: serviceId,
          service_name: service ? service.name : 'Bilinmeyen Hizmet',
          created_at: member.created_at
        };
      });
      
      return [...acc, ...memberPackagesData];
    }, []);
    
    // Sort by most recent first
    return memberPackages.sort((a, b) => 
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  }, [members, services]);
};

/**
 * Custom hook to process and prepare chart data
 */
const useChartData = (appointments: Appointment[], services: Service[], memberPayments: MemberPayment[]) => {
  // Service usage data for ServiceUsageStats component
  const serviceUsageData = useMemo(() => {
    return services.map((service) => ({
      name: service.name,
      kullanim: appointments.filter((app) => app.service_id === service.id).length,
    }));
  }, [services, appointments]);

  // Revenue chart data for RevenueChart component
  const revenueChartData = useMemo(() => {
    const monthlyRevenue = memberPayments.reduce(
      (acc: { [key: string]: number }, payment) => {
        const paymentMonth = format(new Date(payment.created_at), "MMMM", {
          locale: tr,
        });

        acc[paymentMonth] =
          (acc[paymentMonth] || 0) +
          payment.credit_card_paid +
          payment.cash_paid;
        return acc;
      },
      {}
    );

    const months = [
      "Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran", 
      "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"
    ];

    return Object.entries(monthlyRevenue)
      .map(([month, gelir]) => ({
        month,
        gelir: Math.round(gelir),
      }))
      .sort((a, b) => months.indexOf(a.month) - months.indexOf(b.month));
  }, [memberPayments]);

  return {
    serviceUsageData,
    revenueChartData
  };
};

/**
 * Generate PDF from the metrics section
 */
const usePdfGenerator = () => {
  const generatePDF = useCallback(async (metricsRef: React.RefObject<HTMLDivElement>) => {
    if (!metricsRef.current) return;

    try {
      toast.info("PDF oluşturuluyor, lütfen bekleyin...");
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Canvas rendering options
      const canvasOptions = {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: "#ffffff",
        logging: false,
        removeContainer: true,
        foreignObjectRendering: false,
        imageTimeout: 15000,
        onclone: (clonedDoc: Document) => {
          Array.from(
            clonedDoc.querySelectorAll(".text-transparent, .bg-clip-text")
          ).forEach((el) => {
            if (el instanceof HTMLElement) {
              el.classList.remove("text-transparent", "bg-clip-text");
              el.style.color = "#000000";
            }
          });
        },
      };

      // Render to canvas
      const canvas = await html2canvas(metricsRef.current, canvasOptions);
      const imgData = canvas.toDataURL("image/png", 1.0);

      // Create PDF
      const pdf = new jsPDF("p", "mm", "a4");
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const margin = 10;
      const contentWidth = pdfWidth - margin * 2;
      const contentHeight = (canvas.height * contentWidth) / canvas.width;

      // Add title
      pdf.setFontSize(18);
      pdf.setTextColor(44, 62, 80);
      pdf.text(
        "Fitness Merkezi Performans Metrikleri",
        pdfWidth / 2,
        margin + 5,
        { align: "center" }
      );

      // Add date
      pdf.setFontSize(10);
      pdf.setTextColor(100, 100, 100);
      const currentDate = format(new Date(), "dd MMMM yyyy", { locale: tr });
      pdf.text(
        `Oluşturulma Tarihi: ${currentDate}`,
        pdfWidth / 2,
        margin + 12,
        { align: "center" }
      );

      // Add date range info
      pdf.text(
        "Tarih Aralığı: Rapordan Kontrol Ediniz", 
        pdfWidth / 2, 
        margin + 18, 
        { align: "center" }
      );

      // Add separator line
      pdf.setDrawColor(200, 200, 200);
      pdf.line(margin, margin + 22, pdfWidth - margin, margin + 22);

      // Add main content
      const yPos = margin + 25;
      pdf.addImage(imgData, "JPEG", margin, yPos, contentWidth, contentHeight);

      // Add footer
      const footerY = pdfHeight - 10;
      pdf.setFontSize(8);
      pdf.setTextColor(150, 150, 150);
      pdf.text("Loca Fit Studio Performans Raporu", margin, footerY);
      pdf.text("Sayfa 1/1", pdfWidth - margin, footerY, { align: "right" });

      // Save PDF
      pdf.save(`fitness-performans-metrikleri-${format(new Date(), "yyyy-MM-dd")}.pdf`);
      toast.success("Rapor başarıyla PDF olarak indirildi.");
    } catch (error) {
      console.error("PDF oluşturma hatası:", error);
      toast.error("PDF oluşturulurken bir hata oluştu.");
    }
  }, []);

  return { generatePDF };
};

/**
 * Main ReportsPage component
 */
const ReportsPage: React.FC = () => {
  const reportRef = useRef<HTMLDivElement>(null);
  const metricsRef = useRef<HTMLDivElement>(null);

  // Load all report data
  const { 
    appointments, 
    members, 
    services, 
    memberPayments, 
    trainers, 
    isLoading, 
    refreshData 
  } = useReportData();

  // Process member packages
  const memberPackages = useMemberPackages(members, services);

  // Process chart data
  const { serviceUsageData, revenueChartData } = useChartData(
    appointments, 
    services, 
    memberPayments
  );

  // PDF generation
  const { generatePDF } = usePdfGenerator();
  const handleGeneratePDF = useCallback(() => {
    generatePDF(metricsRef);
  }, [generatePDF, metricsRef]);

  if (isLoading) {
    return <LoadingSpinner text="Veriler yükleniyor..." />;
  }

  return (
    <div className="container my-0 p-0 mx-auto">
      {/* Header with actions */}
      <div className="mb-6 gap-4 flex flex-col md:items-center justify-between md:flex-row">
        <h1 className="text-3xl font-bold md:text-left">Raporlar</h1>
        <div className="flex flex-col gap-4 w-full md:flex-row md:items-center md:justify-end">
          <Button 
            onClick={handleGeneratePDF} 
            className="w-full md:w-auto"
          >
            <Download className="mr-2 h-4 w-4" />
            PDF İndir
          </Button>
          <Button
            onClick={refreshData}
            variant="outline"
            className="w-full md:w-auto"
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Yenile
          </Button>
        </div>
      </div>

      {/* Report content */}
      <div ref={reportRef} className="space-y-6">
        {/* Performance metrics - captured for PDF */}
          <MemberPaymentsCard />
        <div ref={metricsRef} className="mb-6">
          <PerformanceMetrics 
            appointments={appointments}
            trainers={trainers}
            services={services}
            members={members}
            memberPayments={memberPayments}
          />
        </div>
        {/* Additional reports */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <PackageIncomeCard />
          <ServiceUsageStats data={serviceUsageData} />
          <RevenueChart data={revenueChartData} />
          <AppointmentDistribution appointments={appointments} />
        </div>
      </div>
    </div>
  );
};

export default ReportsPage;
