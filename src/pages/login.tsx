import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from '@/components/ui/use-toast';
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ExclamationTriangleIcon } from "@radix-ui/react-icons";

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

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
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <Card className="w-[400px]">
        <CardHeader>
          <CardTitle>Admin Girişi</CardTitle>
          <CardDescription>Yönetim paneline erişmek için giriş yapın</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <ExclamationTriangleIcon className="h-4 w-4" />
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
                className={error && !email ? "border-red-500" : ""}
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
                className={error && !password ? "border-red-500" : ""}
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Giriş yapılıyor...' : 'Giriş Yap'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
