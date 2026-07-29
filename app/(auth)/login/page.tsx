"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { BookOpen, LogIn, UserPlus, AlertCircle, CheckCircle } from "lucide-react";
import { loginSchema, signupSchema, LoginInput, SignupInput } from "@/lib/validations/auth";
import { loginTeacher, signupTeacher } from "@/lib/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [activeTab, setActiveTab] = useState<"login" | "signup">("login");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  // Login Form
  const loginForm = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  // Signup Form
  const signupForm = useForm<SignupInput>({
    resolver: zodResolver(signupSchema),
    defaultValues: { full_name: "", email: "", password: "", phone: "" },
  });

  const onLoginSubmit = async (data: LoginInput) => {
    setIsLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    const res = await loginTeacher(data);
    if (res.success) {
      setSuccessMessage("تم تسجيل الدخول بنجاح! جاري التوجيه...");
      setTimeout(() => {
        router.push("/dashboard");
        router.refresh();
      }, 500);
    } else {
      setErrorMessage(res.error || "فشل تسجيل الدخول");
      setIsLoading(false);
    }
  };

  const onSignupSubmit = async (data: SignupInput) => {
    setIsLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    const res = await signupTeacher(data);
    if (res.success) {
      setSuccessMessage("تم إنشاء الحساب بنجاح! جاري التوجيه إلى اللوحة...");
      setTimeout(() => {
        router.push("/dashboard");
        router.refresh();
      }, 800);
    } else {
      setErrorMessage(res.error || "فشل إنشاء الحساب");
      setIsLoading(false);
    }
  };

  return (
    <div className="flex-1 flex items-center justify-center p-4 bg-slate-50 dark:bg-slate-950">
      <Card className="w-full max-w-md shadow-xl border-slate-200 dark:border-slate-800">
        <CardHeader className="space-y-2 text-center pb-4">
          <div className="mx-auto w-12 h-12 rounded-2xl bg-teal-700 text-white flex items-center justify-center shadow-md mb-2">
            <BookOpen className="w-7 h-7" />
          </div>
          <CardTitle className="text-2xl font-black text-slate-900 dark:text-slate-50">
            بوابة المعلم
          </CardTitle>
          <CardDescription className="text-slate-500">
            مُتابع الحفظ - تطبيق متابعة حلقات القرآن الكريم
          </CardDescription>

          {/* Tabs Switcher */}
          <div className="flex bg-slate-100 dark:bg-slate-900 p-1 rounded-xl mt-4">
            <button
              type="button"
              onClick={() => {
                setActiveTab("login");
                setErrorMessage(null);
                setSuccessMessage(null);
              }}
              className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${
                activeTab === "login"
                  ? "bg-white dark:bg-slate-800 text-teal-800 dark:text-teal-300 shadow-sm"
                  : "text-slate-500 hover:text-slate-900"
              }`}
            >
              تسجيل الدخول
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab("signup");
                setErrorMessage(null);
                setSuccessMessage(null);
              }}
              className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${
                activeTab === "signup"
                  ? "bg-white dark:bg-slate-800 text-teal-800 dark:text-teal-300 shadow-sm"
                  : "text-slate-500 hover:text-slate-900"
              }`}
            >
              حساب جديد
            </button>
          </div>
        </CardHeader>

        <CardContent>
          {errorMessage && (
            <div className="mb-4 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-sm flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div className="mb-4 p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm flex items-center gap-2">
              <CheckCircle className="w-4 h-4 shrink-0 text-emerald-600" />
              <span>{successMessage}</span>
            </div>
          )}

          {activeTab === "login" ? (
            /* Login Form */
            <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-4" noValidate>
              <div className="space-y-2">
                <Label htmlFor="login-email">البريد الإلكتروني</Label>
                <Input
                  id="login-email"
                  type="email"
                  placeholder="teacher@example.com"
                  dir="ltr"
                  className="text-left"
                  {...loginForm.register("email")}
                />
                {loginForm.formState.errors.email && (
                  <p className="text-xs text-rose-600 mt-1">{loginForm.formState.errors.email.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="login-password">كلمة المرور</Label>
                <Input
                  id="login-password"
                  type="password"
                  placeholder="••••••••"
                  dir="ltr"
                  className="text-left"
                  {...loginForm.register("password")}
                />
                {loginForm.formState.errors.password && (
                  <p className="text-xs text-rose-600 mt-1">{loginForm.formState.errors.password.message}</p>
                )}
              </div>

              <Button type="submit" className="w-full h-11 gap-2 text-base mt-2" disabled={isLoading}>
                <LogIn className="w-5 h-5" />
                <span>{isLoading ? "جاري التحقق..." : "دخول"}</span>
              </Button>
            </form>
          ) : (
            /* Signup Form */
            <form onSubmit={signupForm.handleSubmit(onSignupSubmit)} className="space-y-4" noValidate>
              <div className="space-y-2">
                <Label htmlFor="signup-name">الاسم الكامل للمعلم</Label>
                <Input
                  id="signup-name"
                  type="text"
                  placeholder="مثال: الشيخ أحمد علي"
                  {...signupForm.register("full_name")}
                />
                {signupForm.formState.errors.full_name && (
                  <p className="text-xs text-rose-600 mt-1">{signupForm.formState.errors.full_name.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="signup-email">البريد الإلكتروني</Label>
                <Input
                  id="signup-email"
                  type="email"
                  placeholder="teacher@example.com"
                  dir="ltr"
                  className="text-left"
                  {...signupForm.register("email")}
                />
                {signupForm.formState.errors.email && (
                  <p className="text-xs text-rose-600 mt-1">{signupForm.formState.errors.email.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="signup-password">كلمة المرور</Label>
                <Input
                  id="signup-password"
                  type="password"
                  placeholder="••••••••"
                  dir="ltr"
                  className="text-left"
                  {...signupForm.register("password")}
                />
                {signupForm.formState.errors.password && (
                  <p className="text-xs text-rose-600 mt-1">{signupForm.formState.errors.password.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="signup-phone">رقم الجوال (اختياري)</Label>
                <Input
                  id="signup-phone"
                  type="tel"
                  placeholder="0512345678"
                  dir="ltr"
                  className="text-left"
                  {...signupForm.register("phone")}
                />
                {signupForm.formState.errors.phone && (
                  <p className="text-xs text-rose-600 mt-1">{signupForm.formState.errors.phone.message}</p>
                )}
              </div>

              <Button type="submit" className="w-full h-11 gap-2 text-base mt-2" disabled={isLoading}>
                <UserPlus className="w-5 h-5" />
                <span>{isLoading ? "جاري إنشاء الحساب..." : "إنشاء حساب"}</span>
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
