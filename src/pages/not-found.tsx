import React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useNavigate, useLocation } from "react-router-dom";
import { Home, Search, ArrowLeft, Map } from "lucide-react";
import { useAuth } from "@/contexts/auth-context";

const NotFoundPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { session } = useAuth();

  const handleGoHome = () => {
    navigate(session ? "/dashboard" : "/login");
  };

  const handleGoBack = () => {
    navigate(-1);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-3xl shadow-lg border-primary/10">
        <CardHeader className="bg-primary/5 border-b border-primary/10">
          <div className="flex items-center gap-2">
            <Search className="h-6 w-6 text-primary" />
            <CardTitle className="text-xl text-primary">
              Sayfa Bulunamadı
            </CardTitle>
          </div>
          <CardDescription className="text-muted-foreground">
            Aradığınız sayfa mevcut değil veya taşınmış olabilir.
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6 pb-4">
          <div className="flex flex-col items-center justify-center py-8">
            <div className="text-9xl font-extrabold text-primary/20 mb-4">
              404
            </div>
            <h2 className="text-2xl font-bold text-foreground mb-2">
              Sayfa Bulunamadı
            </h2>
            <p className="text-muted-foreground text-center max-w-md mb-6">
              Aradığınız sayfa{" "}
              <span className="font-medium text-foreground">
                {location.pathname}
              </span>{" "}
              bulunamadı. URL&apos;yi kontrol edin veya aşağıdaki bağlantıları
              kullanarak devam edin.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-md">
              <Card
                className="border border-muted bg-muted/30 p-4 hover:bg-muted transition-colors cursor-pointer"
                onClick={handleGoHome}
              >
                <div className="flex items-center gap-3">
                  <div className="bg-primary/10 p-2 rounded-full">
                    <Home className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-medium">Ana Sayfa</h3>
                    <p className="text-xs text-muted-foreground">
                      Ana sayfaya dön
                    </p>
                  </div>
                </div>
              </Card>

              <Card
                className="border border-muted bg-muted/30 p-4 hover:bg-muted transition-colors cursor-pointer"
                onClick={handleGoBack}
              >
                <div className="flex items-center gap-3">
                  <div className="bg-primary/10 p-2 rounded-full">
                    <ArrowLeft className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-medium">Geri Dön</h3>
                    <p className="text-xs text-muted-foreground">
                      Önceki sayfaya git
                    </p>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-center border-t pt-4 bg-muted/30">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Map className="h-4 w-4" />
            <span>
              Yardıma mı ihtiyacınız var? Menüyü kullanarak gezinmeyi deneyin.
            </span>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
};

export default NotFoundPage;
