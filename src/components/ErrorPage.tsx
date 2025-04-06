import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertCircle, Bug, Home, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

interface StoredErrorDetails {
  message: string;
  stack?: string;
  timestamp: string;
  source: string;
}

interface ErrorPageProps {
  // Props for ErrorBoundary usage
  error?: Error | null;
  errorInfo?: React.ErrorInfo | null;
  onReset?: () => void;

  // Props for standalone page usage
  isStandalonePage?: boolean;
}

const ErrorPage: React.FC<ErrorPageProps> = ({
  error,
  errorInfo,
  onReset,
  isStandalonePage = false,
}) => {
  const navigate = useNavigate();
  const [isReportDialogOpen, setIsReportDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [storedErrorDetails, setStoredErrorDetails] =
    useState<StoredErrorDetails | null>(null);

  // For standalone page, try to get error details from sessionStorage
  useEffect(() => {
    if (isStandalonePage) {
      try {
        const storedError = sessionStorage.getItem("lastError");
        if (storedError) {
          setStoredErrorDetails(JSON.parse(storedError));
          // Clear the error from sessionStorage to avoid showing it again on refresh
          sessionStorage.removeItem("lastError");
        }
      } catch (e) {
        console.error("Failed to parse error details:", e);
      }
    }
  }, [isStandalonePage]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmitReport = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Prepare error details
      const errorDetails = {
        errorMessage:
          error?.message || storedErrorDetails?.message || "Bilinmeyen hata",
        errorStack: error?.stack || storedErrorDetails?.stack || "",
        componentStack: errorInfo?.componentStack || "",
        userDescription: formData.description,
        userName: formData.name,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        source: storedErrorDetails?.source || "ErrorBoundary",
      };

      // Send error report
      const response = await fetch(
        "https://formsubmit.co/ajax/mollavolkan11@gmail.com",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify({
            name: formData.name,
            message: formData.description,
            errorDetails: JSON.stringify(errorDetails, null, 2),
            _subject: "Fitness Admin Panel - Kritik Hata Bildirimi",
          }),
        }
      );

      if (response.ok) {
        toast.success("Hata bildirimi başarıyla gönderildi!");
        setFormData({ name: "", description: "" });
        setIsReportDialogOpen(false);
      } else {
        toast.error("Hata bildirimi gönderilirken bir sorun oluştu.");
      }
    } catch (reportError) {
      toast.error("Bir hata oluştu. Lütfen daha sonra tekrar deneyin.");
      console.error("Error report submission error:", reportError);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-3xl shadow-lg border-destructive/20">
        <CardHeader className="bg-destructive/10 border-b border-destructive/20">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-6 w-6 text-destructive" />
            <CardTitle className="text-xl text-destructive">
              Uygulama Hatası
            </CardTitle>
          </div>
          <CardDescription className="text-destructive/80">
            Üzgünüz, uygulamada beklenmeyen bir hata oluştu.
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6 pb-4">
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Kritik Hata</AlertTitle>
            <AlertDescription>
              {error?.message ||
                storedErrorDetails?.message ||
                "Bilinmeyen bir hata oluştu."}
            </AlertDescription>
          </Alert>

          {/* Show stored error details if available */}
          {storedErrorDetails && (
            <div className="text-xs text-muted-foreground mb-4">
              <p>
                Hata zamanı:{" "}
                {new Date(storedErrorDetails.timestamp).toLocaleString("tr-TR")}
              </p>
              <p>Hata kaynağı: {storedErrorDetails.source}</p>
              {storedErrorDetails.stack && (
                <details className="mt-2">
                  <summary className="cursor-pointer hover:text-foreground">
                    Teknik detaylar
                  </summary>
                  <pre className="mt-2 p-2 bg-muted rounded-md overflow-x-auto">
                    {storedErrorDetails.stack}
                  </pre>
                </details>
              )}
            </div>
          )}

          {/* Show component stack if available */}
          {errorInfo?.componentStack && (
            <div className="text-xs text-muted-foreground mb-4">
              <details className="mt-2">
                <summary className="cursor-pointer hover:text-foreground">
                  Bileşen Yığını
                </summary>
                <pre className="mt-2 p-2 bg-muted rounded-md overflow-x-auto">
                  {errorInfo.componentStack}
                </pre>
              </details>
            </div>
          )}

          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-medium mb-2">Ne yapabilirsiniz?</h3>
              <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
                <li>Sayfayı yenilemeyi deneyin</li>
                <li>Tarayıcınızı kapatıp tekrar açın</li>
                <li>Farklı bir tarayıcı kullanmayı deneyin</li>
                <li>İnternet bağlantınızı kontrol edin</li>
                <li>Sorun devam ederse, lütfen hata bildiriminde bulunun</li>
              </ul>
            </div>

            {isReportDialogOpen ? (
              <div className="mt-6 border rounded-lg p-4 bg-muted/50">
                <h3 className="text-lg font-medium mb-3">Hata Bildir</h3>
                <form onSubmit={handleSubmitReport} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Adınız</Label>
                    <Input
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      placeholder="Adınızı girin"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="description">Hata Açıklaması</Label>
                    <Textarea
                      id="description"
                      name="description"
                      value={formData.description}
                      onChange={handleInputChange}
                      placeholder="Hatayı nasıl aldığınızı ve ne yapmaya çalıştığınızı açıklayın"
                      rows={4}
                      required
                    />
                  </div>
                  <div className="flex justify-end gap-2 mt-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsReportDialogOpen(false)}
                    >
                      İptal
                    </Button>
                    <Button type="submit" disabled={isSubmitting}>
                      {isSubmitting ? "Gönderiliyor..." : "Gönder"}
                    </Button>
                  </div>
                </form>
              </div>
            ) : (
              <div className="flex justify-center mt-2">
                <Button
                  variant="outline"
                  className="flex items-center gap-2"
                  onClick={() => setIsReportDialogOpen(true)}
                >
                  <Bug className="h-4 w-4" />
                  Hata Bildir
                </Button>
              </div>
            )}
          </div>
        </CardContent>
        <CardFooter className="flex justify-between border-t pt-4 bg-muted/30">
          <Button
            variant="outline"
            className="flex items-center gap-2"
            onClick={() => {
              // Daha güvenli bir yönlendirme yaklaşımı
              try {
                if (isStandalonePage && navigate) {
                  navigate("/");
                } else {
                  window.location.href = "/";
                }
              } catch (e) {
                console.error("Error navigating:", e);
                // Navigate hook hatası durumunda window.location kullan
                window.location.href = "/";
              }
            }}
          >
            <Home className="h-4 w-4" />
            Ana Sayfaya Dön
          </Button>
          <Button
            className="flex items-center gap-2"
            onClick={() => {
              if (onReset) {
                onReset();
              } else {
                window.location.href = "/";
              }
            }}
          >
            <RefreshCw className="h-4 w-4" />
            Yeniden Başlat
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default ErrorPage;
