// Phone number validation for M-Pesa
export const validatePhoneNumber = (phone: string): boolean => {
  const cleaned = phone.replace(/\D/g, "");
  // Kenyan phone numbers: 07XXXXXXXX or 2547XXXXXXXX
  const kenyanRegex = /^(?:(?:\+?254|0)[17]\d{8})$/;
  return kenyanRegex.test(cleaned);
};

// Amount validation (M-Pesa limits: 10 - 150,000)
export const validateAmount = (amount: number): boolean => {
  return amount >= 10 && amount <= 150000;
};

// Format currency for display
export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat("en-KE", {
    style: "currency",
    currency: "KES",
    minimumFractionDigits: 0,
  }).format(amount);
};

// Format date for display
export const formatDate = (timestamp: number): string => {
  return new Date(timestamp).toLocaleDateString("en-KE", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};
