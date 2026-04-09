import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, CheckCircle, KeyRound, Mail, ShieldCheck } from "lucide-react";

import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { Label } from "@/components/ui/label";

const RESET_CODE_LENGTH = 8;

type AuthView = "login" | "signup" | "reset";
type ResetStep = "email" | "otp" | "password" | "success";

const Auth = () => {
  const [authView, setAuthView] = useState<AuthView>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [signupSuccess, setSignupSuccess] = useState(false);
  const [needsConfirmation, setNeedsConfirmation] = useState(false);
  const [pendingEmail, setPendingEmail] = useState("");
  const [resetEmail, setResetEmail] = useState("");
  const [resetCode, setResetCode] = useState("");
  const [resetPassword, setResetPassword] = useState("");
  const [resetConfirmPassword, setResetConfirmPassword] = useState("");
  const [resetStep, setResetStep] = useState<ResetStep>("email");
  const [resetLoading, setResetLoading] = useState(false);
  const [resetResendLoading, setResetResendLoading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();
  const { user } = useAuth();

  const isLogin = authView === "login";
  const isResetView = authView === "reset";

  useEffect(() => {
    if (user && !isResetView) {
      navigate("/");
    }
  }, [user, navigate, isResetView]);

  const resetAuthForm = () => {
    setEmail("");
    setPassword("");
    setConfirmPassword("");
    setFullName("");
    setPhone("");
  };

  const resetPasswordFlow = () => {
    setResetEmail("");
    setResetCode("");
    setResetPassword("");
    setResetConfirmPassword("");
    setResetStep("email");
  };

  const switchView = (view: AuthView) => {
    setAuthView(view);
    resetAuthForm();
    setSignupSuccess(false);
    setNeedsConfirmation(false);
    setPendingEmail("");

    if (view !== "reset") {
      resetPasswordFlow();
    }
  };

  const openResetFlow = () => {
    setAuthView("reset");
    setSignupSuccess(false);
    setNeedsConfirmation(false);
    setPendingEmail("");
    setResetCode("");
    setResetPassword("");
    setResetConfirmPassword("");
    setResetStep("email");
    setResetEmail((currentValue) => currentValue || email.trim().toLowerCase());
  };

  const handleResendConfirmation = async () => {
    setResendLoading(true);

    const { error } = await supabase.auth.resend({
      type: "signup",
      email: pendingEmail,
      options: { emailRedirectTo: window.location.origin },
    });

    setResendLoading(false);

    if (error) {
      toast({ title: "Could not resend", description: error.message, variant: "destructive" });
      return;
    }

    toast({ title: "Verification email resent!", description: "Please check your inbox." });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isLogin && password !== confirmPassword) {
      toast({
        title: "Passwords do not match",
        description: "Please make sure both passwords are the same.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    if (isLogin) {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });

      if (error) {
        if (
          error.message.toLowerCase().includes("email not confirmed") ||
          error.message.toLowerCase().includes("not confirmed")
        ) {
          setPendingEmail(email);
          setNeedsConfirmation(true);
        } else if (
          error.message.toLowerCase().includes("invalid login") ||
          error.message.toLowerCase().includes("invalid credentials")
        ) {
          toast({
            title: "Login failed",
            description: "Incorrect email or password. Please try again.",
            variant: "destructive",
          });
        } else {
          toast({ title: "Login failed", description: error.message, variant: "destructive" });
        }
      } else if (data.session) {
        toast({ title: "Welcome back!" });
        navigate("/");
      }
    } else {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: fullName, phone },
          emailRedirectTo: window.location.origin,
        },
      });

      if (error) {
        if (
          error.message.toLowerCase().includes("already registered") ||
          error.message.toLowerCase().includes("already been registered")
        ) {
          toast({
            title: "Email already registered",
            description: "Please sign in instead, or use a different email.",
            variant: "destructive",
          });
          setAuthView("login");
          setEmail(email);
        } else {
          toast({ title: "Signup failed", description: error.message, variant: "destructive" });
        }
      } else {
        if (data.user && phone) {
          await supabase
            .from("profiles")
            .update({ phone, full_name: fullName })
            .eq("user_id", data.user.id);
        }

        if (data.session) {
          toast({ title: "Account created!", description: `Welcome, ${fullName || email}!` });
          navigate("/");
        } else {
          setPendingEmail(email);
          setSignupSuccess(true);
        }
      }
    }

    setLoading(false);
  };

  const handleSendResetCode = async () => {
    const normalizedEmail = resetEmail.trim().toLowerCase();

    if (!normalizedEmail) {
      toast({
        title: "Email required",
        description: "Enter the email registered with your account to receive the reset code.",
        variant: "destructive",
      });
      return;
    }

    setResetLoading(true);

    const { error } = await supabase.auth.signInWithOtp({
      email: normalizedEmail,
      options: {
        shouldCreateUser: false,
      },
    });

    setResetLoading(false);

    if (error) {
      toast({
        title: "Could not send code",
        description: error.message,
        variant: "destructive",
      });
      return;
    }

    setResetEmail(normalizedEmail);
    setResetStep("otp");
    toast({
      title: "Passcode sent",
      description: `A ${RESET_CODE_LENGTH}-digit passcode has been sent to ${normalizedEmail}.`,
    });
  };

  const handleVerifyResetCode = async () => {
    if (resetCode.length !== RESET_CODE_LENGTH) {
      toast({
        title: "Enter the full code",
        description: `Type the ${RESET_CODE_LENGTH}-digit passcode sent to your email.`,
        variant: "destructive",
      });
      return;
    }

    setResetLoading(true);

    const { error } = await supabase.auth.verifyOtp({
      email: resetEmail,
      token: resetCode,
      type: "email",
    });

    setResetLoading(false);

    if (error) {
      toast({
        title: "Code verification failed",
        description: error.message,
        variant: "destructive",
      });
      return;
    }

    setResetStep("password");
    toast({
      title: "Email verified",
      description: "You can now enter a new password for this account.",
    });
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (resetPassword.length < 6) {
      toast({
        title: "Password too short",
        description: "Your new password must be at least 6 characters long.",
        variant: "destructive",
      });
      return;
    }

    if (resetPassword !== resetConfirmPassword) {
      toast({
        title: "Passwords do not match",
        description: "Re-enter the same password in both fields.",
        variant: "destructive",
      });
      return;
    }

    setResetLoading(true);

    const { error } = await supabase.auth.updateUser({ password: resetPassword });

    if (error) {
      setResetLoading(false);
      toast({
        title: "Password update failed",
        description: error.message,
        variant: "destructive",
      });
      return;
    }

    await supabase.auth.signOut();
    setResetLoading(false);
    setResetStep("success");
    setEmail(resetEmail);
    setPassword("");
    setConfirmPassword("");

    toast({
      title: "Password updated",
      description: "Your password has been changed. Sign in with the new password.",
    });
  };

  const handleResendResetCode = async () => {
    if (!resetEmail) {
      return;
    }

    setResetResendLoading(true);

    const { error } = await supabase.auth.signInWithOtp({
      email: resetEmail,
      options: {
        shouldCreateUser: false,
      },
    });

    setResetResendLoading(false);

    if (error) {
      toast({
        title: "Could not resend code",
        description: error.message,
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "New passcode sent",
      description: `Check ${resetEmail} for the latest passcode.`,
    });
  };

  if (needsConfirmation) {
    return (
      <main className="container py-16">
        <div className="mx-auto max-w-md text-center">
          <div className="rounded-xl border border-border bg-card p-8 shadow-card">
            <Mail className="mx-auto mb-4 h-16 w-16 text-primary" />
            <h1 className="mb-2 font-display text-2xl font-bold text-foreground">Verify Your Email</h1>
            <p className="mb-2 text-muted-foreground">
              Your account for <span className="font-medium text-foreground">{pendingEmail}</span> has not been verified yet.
            </p>
            <p className="mb-6 text-sm text-muted-foreground">
              Please check your inbox for the verification link and click it to activate your account. Then come back here to sign in.
            </p>
            <Button
              className="mb-3 w-full border-0 gradient-warm text-primary-foreground"
              onClick={handleResendConfirmation}
              disabled={resendLoading}
            >
              {resendLoading ? "Sending..." : "Resend Verification Email"}
            </Button>
            <Button variant="outline" className="w-full" onClick={() => switchView("login")}>
              Back to Sign In
            </Button>
          </div>
        </div>
      </main>
    );
  }

  if (signupSuccess) {
    return (
      <main className="container py-16">
        <div className="mx-auto max-w-md text-center">
          <div className="rounded-xl border border-border bg-card p-8 shadow-card">
            <CheckCircle className="mx-auto mb-4 h-16 w-16 text-green-500" />
            <h1 className="mb-2 font-display text-2xl font-bold text-foreground">Account Created!</h1>
            <p className="mb-2 text-muted-foreground">
              We&apos;ve sent a verification email to <span className="font-medium text-foreground">{pendingEmail}</span>.
            </p>
            <p className="mb-6 text-sm text-muted-foreground">
              Click the link in the email to verify your account. Once verified, you can log in here and also on the mobile app using the same credentials.
            </p>
            <Button
              className="mb-3 w-full border-0 gradient-warm text-primary-foreground"
              onClick={handleResendConfirmation}
              disabled={resendLoading}
            >
              {resendLoading ? "Sending..." : "Resend Verification Email"}
            </Button>
            <Button variant="outline" className="w-full" onClick={() => switchView("login")}>
              Go to Sign In
            </Button>
          </div>
        </div>
      </main>
    );
  }

  if (isResetView) {
    return (
      <main className="container py-16">
        <div className="mx-auto max-w-xl">
          <div className="rounded-[28px] border border-border bg-card/95 p-6 shadow-elevated sm:p-8">
            <div className="mb-8 flex items-start justify-between gap-4">
              <div>
                <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-secondary px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                  <KeyRound className="h-3.5 w-3.5" />
                  Password Reset
                </div>
                <h1 className="font-display text-3xl font-bold text-foreground">Reset Your Password</h1>
                <p className="mt-2 max-w-lg text-sm text-muted-foreground sm:text-base">
                  Enter the email registered on ProperVista, verify the passcode from your inbox, then set a new password.
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                type="button"
                onClick={() => switchView("login")}
                aria-label="Back to sign in"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </div>

            <div className="mb-8 grid gap-3 rounded-2xl bg-muted/70 p-4 sm:grid-cols-3">
              <div className={`rounded-2xl border px-4 py-3 ${resetStep === "email" ? "border-primary bg-background" : "border-transparent bg-background/60"}`}>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Step 1</p>
                <p className="mt-1 text-sm font-medium text-foreground">Registered email</p>
              </div>
              <div className={`rounded-2xl border px-4 py-3 ${resetStep === "otp" ? "border-primary bg-background" : "border-transparent bg-background/60"}`}>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Step 2</p>
                <p className="mt-1 text-sm font-medium text-foreground">Enter passcode</p>
              </div>
              <div className={`rounded-2xl border px-4 py-3 ${resetStep === "password" || resetStep === "success" ? "border-primary bg-background" : "border-transparent bg-background/60"}`}>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Step 3</p>
                <p className="mt-1 text-sm font-medium text-foreground">Update password</p>
              </div>
            </div>

            {resetStep === "email" && (
              <div className="space-y-5">
                <div className="rounded-2xl border border-border bg-background p-5">
                  <Label htmlFor="resetEmail">Registered Email</Label>
                  <Input
                    id="resetEmail"
                    type="email"
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    placeholder="you@email.com"
                    className="mt-2 h-12"
                    autoComplete="email"
                  />
                  <p className="mt-3 text-sm text-muted-foreground">
                    We will send a verification passcode to this email. Use the same email registered in Supabase for your account.
                  </p>
                </div>

                <Button
                  type="button"
                  onClick={handleSendResetCode}
                  disabled={resetLoading}
                  className="h-12 w-full border-0 gradient-warm text-primary-foreground"
                >
                  {resetLoading ? "Sending passcode..." : "Send Passcode"}
                </Button>

                <p className="text-center text-sm text-muted-foreground">
                  Remembered it?{" "}
                  <button type="button" onClick={() => switchView("login")} className="font-medium text-primary hover:underline">
                    Go back to sign in
                  </button>
                </p>
              </div>
            )}

            {resetStep === "otp" && (
              <div className="space-y-5">
                <div className="rounded-2xl border border-border bg-background p-5">
                  <div className="mb-4 flex items-start gap-3">
                    <div className="mt-0.5 rounded-full bg-secondary p-2 text-primary">
                      <ShieldCheck className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">Check your inbox</p>
                      <p className="text-sm text-muted-foreground">
                        Enter the {RESET_CODE_LENGTH}-digit passcode sent to <span className="font-medium text-foreground">{resetEmail}</span>.
                      </p>
                    </div>
                  </div>

                  <Label htmlFor="resetCode">Email Passcode</Label>
                  <div className="mt-3 flex justify-center sm:justify-start">
                    <InputOTP
                      id="resetCode"
                      value={resetCode}
                      onChange={(value) => setResetCode(value.replace(/\D/g, "").slice(0, RESET_CODE_LENGTH))}
                      maxLength={RESET_CODE_LENGTH}
                      containerClassName="justify-center sm:justify-start"
                    >
                      <InputOTPGroup>
                        <InputOTPSlot index={0} />
                        <InputOTPSlot index={1} />
                        <InputOTPSlot index={2} />
                        <InputOTPSlot index={3} />
                        <InputOTPSlot index={4} />
                        <InputOTPSlot index={5} />
                        <InputOTPSlot index={6} />
                        <InputOTPSlot index={7} />
                      </InputOTPGroup>
                    </InputOTP>
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <Button type="button" variant="outline" onClick={() => setResetStep("email")} className="h-12">
                    Change Email
                  </Button>
                  <Button
                    type="button"
                    onClick={handleVerifyResetCode}
                    disabled={resetLoading || resetCode.length !== RESET_CODE_LENGTH}
                    className="h-12 border-0 gradient-warm text-primary-foreground"
                  >
                    {resetLoading ? "Verifying..." : "Verify Passcode"}
                  </Button>
                </div>

                <p className="text-center text-sm text-muted-foreground">
                  Didn&apos;t get the code?{" "}
                  <button
                    type="button"
                    onClick={handleResendResetCode}
                    disabled={resetResendLoading}
                    className="font-medium text-primary hover:underline disabled:opacity-70"
                  >
                    {resetResendLoading ? "Resending..." : "Resend passcode"}
                  </button>
                </p>
              </div>
            )}

            {resetStep === "password" && (
              <form onSubmit={handleResetPassword} className="space-y-5">
                <div className="rounded-2xl border border-border bg-background p-5">
                  <p className="text-sm font-medium text-foreground">Email verified for {resetEmail}</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Enter your new password below. After saving it, you can sign in on web and mobile with the updated password.
                  </p>

                  <div className="mt-5 space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="newPassword">New Password</Label>
                      <Input
                        id="newPassword"
                        type="password"
                        value={resetPassword}
                        onChange={(e) => setResetPassword(e.target.value)}
                        placeholder="Min. 6 characters"
                        minLength={6}
                        required
                        className="h-12"
                        autoComplete="new-password"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="confirmNewPassword">Confirm New Password</Label>
                      <Input
                        id="confirmNewPassword"
                        type="password"
                        value={resetConfirmPassword}
                        onChange={(e) => setResetConfirmPassword(e.target.value)}
                        placeholder="Re-enter new password"
                        minLength={6}
                        required
                        className="h-12"
                        autoComplete="new-password"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <Button type="button" variant="outline" onClick={() => setResetStep("otp")} className="h-12">
                    Back to Code
                  </Button>
                  <Button type="submit" disabled={resetLoading} className="h-12 border-0 gradient-warm text-primary-foreground">
                    {resetLoading ? "Updating..." : "Update Password"}
                  </Button>
                </div>
              </form>
            )}

            {resetStep === "success" && (
              <div className="space-y-5 text-center">
                <div className="rounded-2xl border border-border bg-background p-6">
                  <CheckCircle className="mx-auto mb-4 h-14 w-14 text-green-500" />
                  <h2 className="font-display text-2xl font-bold text-foreground">Password Updated</h2>
                  <p className="mt-3 text-sm text-muted-foreground sm:text-base">
                    Your password for <span className="font-medium text-foreground">{resetEmail}</span> has been updated successfully.
                  </p>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Sign in with your new password on the website or mobile app.
                  </p>
                </div>

                <Button
                  type="button"
                  className="h-12 w-full border-0 gradient-warm text-primary-foreground"
                  onClick={() => {
                    switchView("login");
                    setEmail(resetEmail);
                  }}
                >
                  Continue to Sign In
                </Button>
              </div>
            )}
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="container py-16">
      <div className="mx-auto max-w-md">
        <div className="mb-8 text-center">
          <h1 className="mb-2 font-display text-3xl font-bold text-foreground">
            {isLogin ? "Welcome Back" : "Create Account"}
          </h1>
          <p className="text-muted-foreground">
            {isLogin
              ? "Sign in to your ProperVista account"
              : "Join ProperVista to list and manage properties"}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 rounded-xl border border-border bg-card p-6 shadow-card">
          {!isLogin && (
            <>
              <div className="space-y-2">
                <Label htmlFor="fullName">Full Name *</Label>
                <Input
                  id="fullName"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Your full name"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">
                  Phone Number <span className="text-xs text-muted-foreground">(optional)</span>
                </Label>
                <Input
                  id="phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+234 800 000 0000"
                />
              </div>
            </>
          )}

          <div className="space-y-2">
            <Label htmlFor="email">Email *</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@email.com"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password *</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Min. 6 characters"
              required
              minLength={6}
            />
          </div>

          {!isLogin && (
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password *</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter your password"
                required
                minLength={6}
              />
            </div>
          )}

          {!isLogin && (
            <p className="rounded-lg bg-muted p-3 text-xs text-muted-foreground">
              After registering on this website, you can also log in to the mobile app using the same email and password.
            </p>
          )}

          <Button type="submit" disabled={loading} className="w-full border-0 gradient-warm text-primary-foreground">
            {loading ? "Please wait..." : isLogin ? "Sign In" : "Create Account"}
          </Button>

          {isLogin && (
            <button
              type="button"
              onClick={openResetFlow}
              className="w-full text-center text-sm font-medium text-primary hover:underline"
            >
              Forgot password?
            </button>
          )}

          <p className="text-center text-sm text-muted-foreground">
            {isLogin ? "Don't have an account?" : "Already have an account?"}{" "}
            <button
              type="button"
              onClick={() => switchView(isLogin ? "signup" : "login")}
              className="font-medium text-primary hover:underline"
            >
              {isLogin ? "Sign Up" : "Sign In"}
            </button>
          </p>
        </form>
      </div>
    </main>
  );
};

export default Auth;