// src/lib/auth-client.ts
import { useAction, useMutation } from "convex/react";
import { api } from "@convex/_generated/api";

// Define clean, simple types for your auth operations
export interface User {
  _id: string;
  email: string;
  name: string;
  role: "admin" | "physician" | "patient";
  phoneNumber?: string;
  specialization?: string;
  licenseNumber?: string;
  dateOfBirth?: string;
  bloodGroup?: string;
  hospital?: string; // Hospital field for both admin and physician
}

export interface AuthResponse {
  success: boolean;
  token: string;
  user: User;
}

export interface ValidateSessionResponse {
  isValid: boolean;
  user?: User;
}

export interface SignOutResponse {
  success: boolean;
}

export interface SignUpData {
  email: string;
  password: string;
  name: string;
  role: "admin" | "physician" | "patient";
  phoneNumber?: string;
  // Hospital field for both admin and physician
  hospital?: string;
  // Physician-specific fields
  specialization?: string;
  licenseNumber?: string;
  // Patient-specific fields
  dateOfBirth?: string;
  bloodGroup?: string;
}

// Type-safe wrapper for auth operations
export function useAuthClient() {
  // Use 'as any' to break the complex Convex type chain
  // This is safe because we know the actual runtime behavior
  const signInAction = useAction(api.auth.actions.signInWithCrypto) as any;
  const signUpAction = useAction(api.auth.actions.signUpWithCrypto) as any;
  const signOutMutation = useMutation(api.auth.mutations.signOut) as any;
  const validateSessionMutation = useMutation(
    api.auth.mutations.validateSession,
  ) as any;

  // Wrap with type-safe functions
  const signIn = async (
    email: string,
    password: string,
    role: string,
  ): Promise<AuthResponse> => {
    try {
      const result = await signInAction({ email, password, role });

      // Validate the response shape matches what we expect
      if (!result || typeof result !== "object") {
        throw new Error("Invalid response from server");
      }

      return result as AuthResponse;
    } catch (error) {
      console.error("[AuthClient] Sign in error:", error);
      throw error;
    }
  };

  const signUp = async (data: SignUpData): Promise<AuthResponse> => {
    try {
      const result = await signUpAction(data);

      if (!result || typeof result !== "object") {
        throw new Error("Invalid response from server");
      }

      return result as AuthResponse;
    } catch (error) {
      console.error("[AuthClient] Sign up error:", error);
      throw error;
    }
  };

  const signOut = async (token: string): Promise<SignOutResponse> => {
    try {
      const result = await signOutMutation({ token });
      return result as SignOutResponse;
    } catch (error) {
      console.error("[AuthClient] Sign out error:", error);
      throw error;
    }
  };

  const validateSession = async (
    token: string,
  ): Promise<ValidateSessionResponse> => {
    try {
      const result = await validateSessionMutation({ token });
      return result as ValidateSessionResponse;
    } catch (error) {
      console.error("[AuthClient] Validate session error:", error);
      return { isValid: false };
    }
  };

  return {
    signIn,
    signUp,
    signOut,
    validateSession,
  };
}
