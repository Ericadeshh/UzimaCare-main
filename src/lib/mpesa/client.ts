import { MPESA_API_URLS, TRANSACTION_TYPES } from "./constants";
import { generatePassword, generateTimestamp } from "./utils";
import type {
  MpesaConfig,
  STKPushRequest,
  STKPushResponse,
  InitiatePaymentParams,
} from "./types";

export class MpesaClient {
  private config: MpesaConfig;
  private authToken: string | null = null;
  private tokenExpiry: Date | null = null;

  constructor(config: MpesaConfig) {
    this.config = config;
  }

  private async getAuthToken(): Promise<string> {
    // Check if token is still valid
    if (this.authToken && this.tokenExpiry && new Date() < this.tokenExpiry) {
      return this.authToken;
    }

    const auth = Buffer.from(
      `${this.config.consumerKey}:${this.config.consumerSecret}`,
    ).toString("base64");

    const urls = MPESA_API_URLS[this.config.environment];

    try {
      const response = await fetch(urls.AUTH, {
        method: "GET",
        headers: {
          Authorization: `Basic ${auth}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Auth failed: ${response.statusText}`);
      }

      const data = await response.json();
      this.authToken = data.access_token;
      // Token expires in 1 hour (3600 seconds)
      this.tokenExpiry = new Date(Date.now() + 3599 * 1000);

      return this.authToken!;
    } catch (error) {
      console.error("Failed to get M-Pesa auth token:", error);
      throw new Error("M-Pesa authentication failed");
    }
  }

  async stkPush(params: InitiatePaymentParams): Promise<STKPushResponse> {
    const token = await this.getAuthToken();
    const timestamp = generateTimestamp();
    const password = generatePassword(
      this.config.businessShortCode,
      this.config.passkey,
      timestamp,
    );

    const urls = MPESA_API_URLS[this.config.environment];
    const phoneNumber = params.phoneNumber.replace(/\D/g, "");

    // Ensure paymentType is a string for the transaction description
    const transactionDesc =
      typeof params.paymentType === "string"
        ? params.paymentType
        : String(params.paymentType);

    const requestBody: STKPushRequest = {
      businessShortCode: this.config.businessShortCode,
      password,
      timestamp,
      transactionType: TRANSACTION_TYPES.CUSTOMER_PAYBILL_ONLINE,
      amount: params.amount,
      partyA: phoneNumber,
      partyB: this.config.businessShortCode,
      phoneNumber,
      callBackURL: this.config.callbackUrl,
      accountReference: (params.relatedEntityId || "UZIMACARE").substring(
        0,
        12,
      ),
      transactionDesc: transactionDesc.substring(0, 12),
    };

    try {
      const response = await fetch(urls.STK_PUSH, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        throw new Error(`STK Push failed: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error("STK Push failed:", error);
      throw error;
    }
  }

  async queryStatus(checkoutRequestID: string): Promise<any> {
    const token = await this.getAuthToken();
    const timestamp = generateTimestamp();
    const password = generatePassword(
      this.config.businessShortCode,
      this.config.passkey,
      timestamp,
    );

    const urls = MPESA_API_URLS[this.config.environment];

    const requestBody = {
      businessShortCode: this.config.businessShortCode,
      password,
      timestamp,
      checkoutRequestID,
    };

    try {
      const response = await fetch(urls.QUERY, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        throw new Error(`Status query failed: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error("Status query failed:", error);
      throw error;
    }
  }
}
