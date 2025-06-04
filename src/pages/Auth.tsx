
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { User, Mail, Lock, ArrowLeft, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { z } from 'zod';

// Input validation schemas
const emailSchema = z.string().email("Bitte geben Sie eine gültige E-Mail-Adresse ein");
const passwordSchema = z.string()
  .min(8, "Passwort muss mindestens 8 Zeichen lang sein")
  .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, "Passwort muss mindestens einen Großbuchstaben, einen Kleinbuchstaben und eine Zahl enthalten");
const nameSchema = z.string()
  .min(2, "Name muss mindestens 2 Zeichen lang sein")
  .max(50, "Name darf maximal 50 Zeichen lang sein")
  .regex(/^[a-zA-ZäöüÄÖÜß\s]+$/, "Name darf nur Buchstaben und Leerzeichen enthalten");

// Input sanitization function
const sanitizeInput = (input: string): string => {
  return input.trim().replace(/[<>\"'&]/g, '');
};

const Auth = () => {
  const [loginData, setLoginData] = useState({ email: '', password: '' });
  const [registerData, setRegisterData] = useState({ 
    fullName: '',
    email: '', 
    password: '', 
    confirmPassword: '' 
  });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [loginAttempts, setLoginAttempts] = useState(0);
  const [isBlocked, setIsBlocked] = useState(false);
  
  const { signIn, signUp } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  // Rate limiting - block after 5 failed attempts for 15 minutes
  const maxAttempts = 5;
  const blockDuration = 15 * 60 * 1000; // 15 minutes

  const validateField = (field: string, value: string): string | null => {
    try {
      switch (field) {
        case 'email':
          emailSchema.parse(value);
          break;
        case 'password':
          passwordSchema.parse(value);
          break;
        case 'fullName':
          nameSchema.parse(value);
          break;
      }
      return null;
    } catch (error) {
      if (error instanceof z.ZodError) {
        return error.errors[0].message;
      }
      return "Ungültige Eingabe";
    }
  };

  const handleInputChange = (field: string, value: string, setState: React.Dispatch<React.SetStateAction<any>>) => {
    const sanitizedValue = sanitizeInput(value);
    setState((prev: any) => ({ ...prev, [field]: sanitizedValue }));
    
    // Clear validation error when user starts typing
    if (validationErrors[field]) {
      setValidationErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const validateForm = (data: any, isLogin: boolean = false): boolean => {
    const errors: Record<string, string> = {};
    
    // Validate email
    const emailError = validateField('email', data.email);
    if (emailError) errors.email = emailError;
    
    // Validate password
    if (!isLogin) {
      const passwordError = validateField('password', data.password);
      if (passwordError) errors.password = passwordError;
    } else {
      // For login, just check if password is not empty
      if (!data.password) errors.password = "Passwort ist erforderlich";
    }
    
    // Additional validation for registration
    if (!isLogin) {
      const nameError = validateField('fullName', data.fullName);
      if (nameError) errors.fullName = nameError;
      
      if (data.password !== data.confirmPassword) {
        errors.confirmPassword = "Passwörter stimmen nicht überein";
      }
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isBlocked) {
      toast({
        title: "Zu viele Anmeldeversuche",
        description: "Bitte warten Sie 15 Minuten vor dem nächsten Versuch.",
        variant: "destructive"
      });
      return;
    }
    
    if (!validateForm(loginData, true)) {
      return;
    }
    
    setLoading(true);
    
    const { error } = await signIn(loginData.email, loginData.password);
    
    if (error) {
      const newAttempts = loginAttempts + 1;
      setLoginAttempts(newAttempts);
      
      if (newAttempts >= maxAttempts) {
        setIsBlocked(true);
        setTimeout(() => {
          setIsBlocked(false);
          setLoginAttempts(0);
        }, blockDuration);
        
        toast({
          title: "Konto temporär gesperrt",
          description: "Zu viele fehlgeschlagene Anmeldeversuche. Versuchen Sie es in 15 Minuten erneut.",
          variant: "destructive"
        });
      } else {
        toast({
          title: "Anmeldung fehlgeschlagen",
          description: `Ungültige Anmeldedaten. ${maxAttempts - newAttempts} Versuche verbleibend.`,
          variant: "destructive"
        });
      }
    } else {
      setLoginAttempts(0);
      toast({
        title: "Erfolgreich angemeldet",
        description: "Willkommen zurück!"
      });
      navigate('/');
    }
    
    setLoading(false);
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm(registerData)) {
      return;
    }
    
    setLoading(true);
    
    const { error } = await signUp(registerData.email, registerData.password, registerData.fullName);
    
    if (error) {
      toast({
        title: "Registrierung fehlgeschlagen",
        description: error.message,
        variant: "destructive"
      });
    } else {
      toast({
        title: "Registrierung erfolgreich",
        description: "Bitte bestätigen Sie Ihre E-Mail-Adresse."
      });
    }
    
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-digitalwert-background via-digitalwert-background-light to-digitalwert-background-lighter flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Button 
          variant="ghost" 
          onClick={() => navigate('/')}
          className="mb-4 text-slate-300 hover:text-white"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Zurück zur Startseite
        </Button>

        <Card className="bg-digitalwert-background border-digitalwert-background-lighter">
          <CardHeader className="text-center">
            <div className="w-16 h-16 bg-gradient-to-r from-digitalwert-primary to-digitalwert-accent-light rounded-lg flex items-center justify-center mx-auto mb-4">
              <span className="text-white font-bold text-xl">D</span>
            </div>
            <CardTitle className="text-white">Digitalwert</CardTitle>
            <p className="text-slate-400">Anmelden oder Registrieren</p>
          </CardHeader>

          <CardContent>
            <Tabs defaultValue="login" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="login">Anmelden</TabsTrigger>
                <TabsTrigger value="register">Registrieren</TabsTrigger>
              </TabsList>

              <TabsContent value="login" className="space-y-4">
                <form onSubmit={handleLogin} className="space-y-4">
                  <div>
                    <Label htmlFor="login-email" className="text-slate-300">E-Mail</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                      <Input
                        id="login-email"
                        type="email"
                        value={loginData.email}
                        onChange={(e) => handleInputChange('email', e.target.value, setLoginData)}
                        className="pl-10 bg-digitalwert-background-lighter border-digitalwert-background-lighter text-white"
                        placeholder="ihre@email.de"
                        disabled={loading || isBlocked}
                        maxLength={100}
                      />
                    </div>
                    {validationErrors.email && (
                      <p className="text-red-400 text-sm mt-1">{validationErrors.email}</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="login-password" className="text-slate-300">Passwort</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                      <Input
                        id="login-password"
                        type={showPassword ? "text" : "password"}
                        value={loginData.password}
                        onChange={(e) => handleInputChange('password', e.target.value, setLoginData)}
                        className="pl-10 pr-10 bg-digitalwert-background-lighter border-digitalwert-background-lighter text-white"
                        placeholder="••••••••"
                        disabled={loading || isBlocked}
                        maxLength={128}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-3 text-slate-400 hover:text-slate-300"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    {validationErrors.password && (
                      <p className="text-red-400 text-sm mt-1">{validationErrors.password}</p>
                    )}
                  </div>

                  <Button type="submit" className="w-full" disabled={loading || isBlocked}>
                    {loading ? 'Anmelden...' : isBlocked ? 'Gesperrt' : 'Anmelden'}
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="register" className="space-y-4">
                <form onSubmit={handleRegister} className="space-y-4">
                  <div>
                    <Label htmlFor="register-name" className="text-slate-300">Vollständiger Name</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                      <Input
                        id="register-name"
                        value={registerData.fullName}
                        onChange={(e) => handleInputChange('fullName', e.target.value, setRegisterData)}
                        className="pl-10 bg-digitalwert-background-lighter border-digitalwert-background-lighter text-white"
                        placeholder="Ihr vollständiger Name"
                        disabled={loading}
                        maxLength={50}
                      />
                    </div>
                    {validationErrors.fullName && (
                      <p className="text-red-400 text-sm mt-1">{validationErrors.fullName}</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="register-email" className="text-slate-300">E-Mail</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                      <Input
                        id="register-email"
                        type="email"
                        value={registerData.email}
                        onChange={(e) => handleInputChange('email', e.target.value, setRegisterData)}
                        className="pl-10 bg-digitalwert-background-lighter border-digitalwert-background-lighter text-white"
                        placeholder="ihre@email.de"
                        disabled={loading}
                        maxLength={100}
                      />
                    </div>
                    {validationErrors.email && (
                      <p className="text-red-400 text-sm mt-1">{validationErrors.email}</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="register-password" className="text-slate-300">Passwort</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                      <Input
                        id="register-password"
                        type={showPassword ? "text" : "password"}
                        value={registerData.password}
                        onChange={(e) => handleInputChange('password', e.target.value, setRegisterData)}
                        className="pl-10 pr-10 bg-digitalwert-background-lighter border-digitalwert-background-lighter text-white"
                        placeholder="••••••••"
                        disabled={loading}
                        maxLength={128}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-3 text-slate-400 hover:text-slate-300"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    {validationErrors.password && (
                      <p className="text-red-400 text-sm mt-1">{validationErrors.password}</p>
                    )}
                    <p className="text-xs text-slate-400 mt-1">
                      Mindestens 8 Zeichen, mit Groß- und Kleinbuchstaben sowie einer Zahl
                    </p>
                  </div>

                  <div>
                    <Label htmlFor="register-confirm" className="text-slate-300">Passwort bestätigen</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                      <Input
                        id="register-confirm"
                        type={showConfirmPassword ? "text" : "password"}
                        value={registerData.confirmPassword}
                        onChange={(e) => handleInputChange('confirmPassword', e.target.value, setRegisterData)}
                        className="pl-10 pr-10 bg-digitalwert-background-lighter border-digitalwert-background-lighter text-white"
                        placeholder="••••••••"
                        disabled={loading}
                        maxLength={128}
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-3 text-slate-400 hover:text-slate-300"
                      >
                        {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    {validationErrors.confirmPassword && (
                      <p className="text-red-400 text-sm mt-1">{validationErrors.confirmPassword}</p>
                    )}
                  </div>

                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? 'Registrieren...' : 'Registrieren'}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Auth;
