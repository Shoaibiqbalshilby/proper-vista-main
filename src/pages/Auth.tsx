import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { CheckCircle, Mail } from "lucide-react";

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
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
  const { toast } = useToast();
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    if (user) navigate("/");
  }, [user, navigate]);

  const switchMode = (login: boolean) => {
    setIsLogin(login);
    setEmail("");
    setPassword("");
    setConfirmPassword("");
    setFullName("");
    setPhone("");
    setSignupSuccess(false);
    setNeedsConfirmation(false);
    setPendingEmail("");
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
    } else {
      toast({ title: "Verification email resent!", description: "Please check your inbox." });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isLogin && password !== confirmPassword) {
      toast({ title: "Passwords do not match", description: "Please make sure both passwords are the same.", variant: "destructive" });
      return;
    }

    setLoading(true);

    if (isLogin) {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        // Email not confirmed — show dedicated UI with resend button
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
          toast({ title: "Login failed", description: "Incorrect email or password. Please try again.", variant: "destructive" });
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
        if (error.message.toLowerCase().includes("already registered") || error.message.toLowerCase().includes("already been registered")) {
          toast({ title: "Email already registered", description: "Please sign in instead, or use a different email.", variant: "destructive" });
          setIsLogin(true);
          setEmail(email);
        } else {
          toast({ title: "Signup failed", description: error.message, variant: "destructive" });
        }
      } else {
        // Update profile with phone if provided
        if (data.user && phone) {
          await supabase
            .from("profiles")
            .update({ phone, full_name: fullName })
            .eq("user_id", data.user.id);
        }

        // Session returned → email confirmation is OFF → log in directly
        if (data.session) {
          toast({ title: "Account created!", description: `Welcome, ${fullName || email}!` });
          navigate("/");
        } else {
          // Email confirmation is ON → show verify screen
          setPendingEmail(email);
          setSignupSuccess(true);
        }
      }
    }
    setLoading(false);
  };

  // "Email not confirmed" screen shown when user tries to log in before verifying
  if (needsConfirmation) {
    return (
      <main className="container py-16">
        <div className="mx-auto max-w-md text-center">
          <div className="rounded-xl border border-border bg-card p-8 shadow-card">
            <Mail className="mx-auto mb-4 h-16 w-16 text-primary" />
            <h1 className="font-display text-2xl font-bold text-foreground mb-2">Verify Your Email</h1>
            <p className="text-muted-foreground mb-2">
              Your account for <span className="font-medium text-foreground">{pendingEmail}</span> has not been verified yet.
            </p>
            <p className="text-sm text-muted-foreground mb-6">
              Please check your inbox for the verification link and click it to activate your account. Then come back here to sign in.
            </p>
            <Button
              className="w-full gradient-warm border-0 text-primary-foreground mb-3"
              onClick={handleResendConfirmation}
              disabled={resendLoading}
            >
              {resendLoading ? "Sending..." : "Resend Verification Email"}
            </Button>
            <Button variant="outline" className="w-full" onClick={() => switchMode(true)}>
              Back to Sign In
            </Button>
          </div>
        </div>
      </main>
    );
  }

  // Success screen shown right after registration when email confirmation is required
  if (signupSuccess) {
    return (
      <main className="container py-16">
        <div className="mx-auto max-w-md text-center">
          <div className="rounded-xl border border-border bg-card p-8 shadow-card">
            <CheckCircle className="mx-auto mb-4 h-16 w-16 text-green-500" />
            <h1 className="font-display text-2xl font-bold text-foreground mb-2">Account Created!</h1>
            <p className="text-muted-foreground mb-2">
              We've sent a verification email to <span className="font-medium text-foreground">{pendingEmail}</span>.
            </p>
            <p className="text-sm text-muted-foreground mb-6">
              Click the link in the email to verify your account. Once verified, you can log in here and also on the mobile app using the same credentials.
            </p>
            <Button
              className="w-full gradient-warm border-0 text-primary-foreground mb-3"
              onClick={handleResendConfirmation}
              disabled={resendLoading}
            >
              {resendLoading ? "Sending..." : "Resend Verification Email"}
            </Button>
            <Button variant="outline" className="w-full" onClick={() => switchMode(true)}>
              Go to Sign In
            </Button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="container py-16">
      <div className="mx-auto max-w-md">
        <div className="mb-8 text-center">
          <h1 className="font-display text-3xl font-bold text-foreground mb-2">
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
                <Label htmlFor="phone">Phone Number <span className="text-muted-foreground text-xs">(optional)</span></Label>
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
            <p className="text-xs text-muted-foreground rounded-lg bg-muted p-3">
              After registering on this website, you can also log in to the mobile app using the same email and password.
            </p>
          )}

          <Button type="submit" disabled={loading} className="w-full gradient-warm border-0 text-primary-foreground">
            {loading ? "Please wait..." : isLogin ? "Sign In" : "Create Account"}
          </Button>

          <p className="text-center text-sm text-muted-foreground">
            {isLogin ? "Don't have an account?" : "Already have an account?"}{" "}
            <button
              type="button"
              onClick={() => switchMode(!isLogin)}
              className="text-primary font-medium hover:underline"
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
