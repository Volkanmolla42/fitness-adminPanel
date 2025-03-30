import React,{ useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { toast } from '@/components/ui/use-toast';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ExclamationTriangleIcon, MoonIcon, SunIcon } from "@radix-ui/react-icons";
import { useTheme } from '@/contexts/theme-context';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();

  const getErrorMessage = (error: any): string => {
    // Supabase hata mesajlarını Türkçeleştiriyoruz
    const errorMap: { [key: string]: string } = {
      'Invalid login credentials': 'E-posta veya şifre hatalı.',
      'Email not confirmed': 'E-posta adresi henüz onaylanmamış.',
      'Invalid email': 'Geçersiz e-posta adresi.',
      'Password should be at least 6 characters': 'Şifre en az 6 karakter olmalıdır.',
      'Email is required': 'E-posta adresi gerekli.',
      'Password is required': 'Şifre gerekli.',
    };

    return errorMap[error.message] || 'Bir hata oluştu. Lütfen tekrar deneyin.';
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (!email || !password) {
      setError('Lütfen e-posta ve şifrenizi girin.');
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      if (data.user) {
        toast({
          title: "Giriş başarılı",
          description: "Yönetim paneline yönlendiriliyorsunuz.",
          variant: "default",
          duration: 3000,
        });
        navigate('/dashboard');
      }
    } catch (error: any) {
      const errorMessage = getErrorMessage(error);
      setError(errorMessage);
      toast({
        title: "Giriş başarısız",
        description: errorMessage,
        variant: "destructive",
        duration: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="absolute top-4 right-4">
        <Button variant="outline" size="icon" onClick={toggleTheme} className="rounded-full">
          {theme === "dark" ? <SunIcon className="h-4 w-4" /> : <MoonIcon className="h-4 w-4" />}
          <span className="sr-only">Tema değiştir</span>
        </Button>
      </div>
      
      <Card className="w-[400px] shadow-lg border-border">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">Admin Girişi</CardTitle>
          <CardDescription className="text-center">Yönetim paneline erişmek için giriş yapın</CardDescription>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <ExclamationTriangleIcon className="h-4 w-4" />
                <AlertTitle>Hata</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            
            <div className="space-y-2">
              <Input
                type="email"
                placeholder="E-posta"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
                className={error && !email ? "border-destructive" : ""}
              />
            </div>
            
            <div className="space-y-2">
              <Input
                type="password"
                placeholder="Şifre"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
                className={error && !password ? "border-destructive" : ""}
              />
            </div>
            
            <Button 
              type="submit" 
              className="w-full" 
              disabled={loading}
            >
              {loading ? 'Giriş yapılıyor...' : 'Giriş Yap'}
            </Button>
          </form>
        </CardContent>
        
        <CardFooter className="flex flex-col items-center gap-1 text-xs text-muted-foreground">
          <p> &copy; {new Date().getFullYear()} LOCAFIT STUDIO</p>
          <p>Tüm hakları saklıdır.</p>
        </CardFooter>
      </Card>
    </div>
  );
}
