import crypto from "crypto";

export function generateTimestamp(): string {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  const seconds = String(date.getSeconds()).padStart(2, "0");
  return `${year}${month}${day}${hours}${minutes}${seconds}`;
}

export function generatePassword(
  businessShortCode: string,
  passkey: string,
  timestamp: string,
): string {
  const str = businessShortCode + passkey + timestamp;
  return Buffer.from(str).toString("base64");
}

export function generateReference(prefix: string = "UZ"): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `${prefix}${timestamp}${random}`;
}

export function formatPhoneNumber(phone: string): string {
  // Remove any non-numeric characters
  let cleaned = phone.replace(/\D/g, "");

  // If it starts with 0, replace with 254
  if (cleaned.startsWith("0")) {
    cleaned = "254" + cleaned.substring(1);
  }

  // If it doesn't start with 254, add it
  else if (!cleaned.startsWith("254")) {
    cleaned = "254" + cleaned;
  }

  // Ensure it's exactly 12 digits (254 + 9 digits)
  if (cleaned.length > 12) {
    cleaned = cleaned.substring(0, 12);
  }

  return cleaned;
}

export function parseCallbackMetadata(metadata: any): {
  amount: number;
  receiptNumber: string;
  transactionDate: Date;
  phoneNumber: string;
} | null {
  try {
    const items = metadata?.Item || [];
    const result: any = {};

    items.forEach((item: any) => {
      switch (item.Name) {
        case "Amount":
          result.amount = item.Value;
          break;
        case "MpesaReceiptNumber":
          result.receiptNumber = item.Value;
          break;
        case "TransactionDate":
          result.transactionDate = new Date(item.Value.toString());
          break;
        case "PhoneNumber":
          result.phoneNumber = item.Value;
          break;
      }
    });

    return result.amount && result.receiptNumber ? result : null;
  } catch (error) {
    console.error("Error parsing callback metadata:", error);
    return null;
  }
}
