import { createSign } from "crypto";
import type { LoyaltyCustomer } from "./loyalty";

const SAVE_URL = "https://pay.google.com/gp/v/save";

interface WalletConfig {
  issuerId: string;
  classSuffix: string;
  clientEmail: string;
  privateKey: string;
  origin: string;
  logoUrl: string | null;
}

export function googleWalletConfigured(): boolean {
  return !!(
    process.env.GOOGLE_WALLET_ISSUER_ID &&
    process.env.GOOGLE_WALLET_CLIENT_EMAIL &&
    process.env.GOOGLE_WALLET_PRIVATE_KEY &&
    process.env.NEXT_PUBLIC_SITE_URL
  );
}

function getConfig(): WalletConfig {
  const issuerId = process.env.GOOGLE_WALLET_ISSUER_ID;
  const clientEmail = process.env.GOOGLE_WALLET_CLIENT_EMAIL;
  const privateKey = process.env.GOOGLE_WALLET_PRIVATE_KEY;
  const origin = process.env.NEXT_PUBLIC_SITE_URL;
  if (!issuerId || !clientEmail || !privateKey || !origin) {
    throw new Error("Google Wallet env is not configured");
  }
  return {
    issuerId,
    clientEmail,
    origin,
    privateKey: privateKey.replace(/\\n/g, "\n"),
    classSuffix: process.env.GOOGLE_WALLET_CLASS_SUFFIX || "lokmaco_loyalty",
    logoUrl: process.env.GOOGLE_WALLET_LOGO_URL || null,
  };
}

function b64url(input: Buffer | string): string {
  return Buffer.from(input).toString("base64url");
}

function localized(value: string) {
  return {
    defaultValue: {
      language: "ru-RU",
      value,
    },
  };
}

function walletImage(uri: string, description: string) {
  return {
    sourceUri: { uri },
    contentDescription: localized(description),
  };
}

function safeSuffix(value: string): string {
  return value.replace(/[^A-Za-z0-9._-]/g, "_");
}

function signJwt(payload: object, privateKey: string): string {
  const header = { alg: "RS256", typ: "JWT" };
  const unsigned = `${b64url(JSON.stringify(header))}.${b64url(JSON.stringify(payload))}`;
  const signature = createSign("RSA-SHA256").update(unsigned).sign(privateKey);
  return `${unsigned}.${signature.toString("base64url")}`;
}

export function createGoogleWalletLink(customer: LoyaltyCustomer): string {
  const config = getConfig();
  const classId = `${config.issuerId}.${safeSuffix(config.classSuffix)}`;
  const objectId = `${config.issuerId}.customer_${safeSuffix(customer.id)}`;
  const origin = new URL(config.origin).origin;
  const now = Math.floor(Date.now() / 1000);

  const loyaltyClass = {
    id: classId,
    issuerName: "The Lokmaco",
    reviewStatus: "UNDER_REVIEW",
    programName: "Бонусная карта",
    hexBackgroundColor: "#3B2416",
    ...(config.logoUrl
      ? { programLogo: walletImage(config.logoUrl, "The Lokmaco logo") }
      : {}),
  };

  const loyaltyObject = {
    id: objectId,
    classId,
    state: "ACTIVE",
    accountId: customer.cardNumber,
    accountName: customer.name,
    barcode: {
      type: "QR_CODE",
      value: customer.cardNumber,
      alternateText: customer.cardNumber,
    },
    loyaltyPoints: {
      label: "Бонусы",
      balance: { int: Math.max(0, Math.floor(customer.balance)) },
    },
    textModulesData: [
      {
        id: "RULES",
        header: "Правила накопления",
        body: "Кэшбэк по сумме покупок: 3% до 300 000, 5% до 700 000, 7% до 1 500 000, 10% до 3 000 000 сум.\n1 бонус = 1 сум. Оплата бонусами до 50% чека.\nДень рождения: 15% кэшбэк за 5 дней до и 10 дней после.",
      },
      {
        id: "PHONE",
        header: "Телефон",
        body: customer.phone,
      },
    ],
  };

  const jwt = signJwt(
    {
      iss: config.clientEmail,
      aud: "google",
      typ: "savetowallet",
      iat: now,
      origins: [origin],
      payload: {
        loyaltyClasses: [loyaltyClass],
        loyaltyObjects: [loyaltyObject],
      },
    },
    config.privateKey
  );

  return `${SAVE_URL}/${jwt}`;
}
