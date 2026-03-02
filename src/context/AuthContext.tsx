// src/context/AuthContext.tsx
import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
  useCallback,
  useRef,
} from "react";
import { useRouter } from "next/navigation";
import { useAuthClient, User, SignUpData } from "@/lib/auth-client";

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (userData: SignUpData) => Promise<void>;
  signOut: () => Promise<void>;
}

// User-friendly error messages
const getFriendlyErrorMessage = (error: any): string => {
  const message = error?.message || error?.data?.message || String(error);

  if (message.includes("No account found")) {
    return "No account found with this email address. Please sign up first.";
  }
  if (message.includes("registered as")) {
    return message;
  }
  if (message.includes("password is incorrect")) {
    return "The password you entered is incorrect. Please try again.";
  }
  if (message.includes("deactivated")) {
    return "This account has been deactivated. Please contact support.";
  }
  if (message.includes("already exists")) {
    return "An account with this email already exists. Please sign in instead.";
  }
  if (message.includes("network") || message.includes("Network")) {
    return "Network error. Please check your internet connection and try again.";
  }
  if (message.includes("timeout") || message.includes("Timeout")) {
    return "Request timed out. Please try again.";
  }

  return "Something went wrong. Please try again.";
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const authClient = useAuthClient();
  const validationInProgress = useRef(false);

  // Validate session on mount
  useEffect(() => {
    let mounted = true;

    const validateStoredSession = async () => {
      if (validationInProgress.current) return;

      validationInProgress.current = true;
      const storedToken = localStorage.getItem("authToken");

      if (!storedToken) {
        if (mounted) setIsLoading(false);
        validationInProgress.current = false;
        return;
      }

      try {
        const result = await authClient.validateSession(storedToken);

        if (mounted) {
          if (result.isValid && result.user) {
            setUser(result.user);
            setToken(storedToken);
          } else {
            localStorage.removeItem("authToken");
          }
        }
      } catch (error) {
        console.error("Session validation error:", error);
        if (mounted) {
          localStorage.removeItem("authToken");
        }
      } finally {
        if (mounted) setIsLoading(false);
        validationInProgress.current = false;
      }
    };

    validateStoredSession();

    return () => {
      mounted = false;
    };
  }, [authClient]);

  const signIn = useCallback(
    async (email: string, password: string) => {
      // Try each role in sequence
      const roles: Array<"patient" | "physician" | "admin"> = [
        "patient",
        "physician",
        "admin",
      ];
      let lastError: Error | null = null;

      for (const role of roles) {
        try {
          const result = await authClient.signIn(email, password, role);

          if (result.success) {
            localStorage.setItem("authToken", result.token);
            setUser(result.user);
            setToken(result.token);

            // Redirect based on role
            switch (result.user.role) {
              case "admin":
                router.push("/dashboard/admin");
                break;
              case "physician":
                router.push("/dashboard/physician");
                break;
              case "patient":
                router.push("/dashboard/patient");
                break;
            }
            return;
          }
        } catch (error) {
          lastError = error as Error;
          // Continue to next role
        }
      }

      // If we get here, all attempts failed
      throw new Error(getFriendlyErrorMessage(lastError));
    },
    [authClient, router],
  );

  const signUp = useCallback(
    async (userData: SignUpData) => {
      try {
        const result = await authClient.signUp(userData);

        if (result.success) {
          localStorage.setItem("authToken", result.token);
          setUser(result.user);
          setToken(result.token);

          // Redirect based on role
          switch (result.user.role) {
            case "admin":
              router.push("/dashboard/admin");
              break;
            case "physician":
              router.push("/dashboard/physician");
              break;
            case "patient":
              router.push("/dashboard/patient");
              break;
          }
        }
      } catch (error: any) {
        console.error("Sign up error:", error);
        throw new Error(getFriendlyErrorMessage(error));
      }
    },
    [authClient, router],
  );

  const signOut = useCallback(async () => {
    if (token) {
      try {
        await authClient.signOut(token);
      } catch (error) {
        console.error("Sign out error:", error);
      }
    }

    localStorage.removeItem("authToken");
    setUser(null);
    setToken(null);
    router.push("/login");
  }, [authClient, token, router]);

  return (
    <AuthContext.Provider
      value={{ user, token, isLoading, signIn, signUp, signOut }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
