export const envConfig = {
  podpay: {
    publicKey: process.env.PODPAY_PUBLIC_KEY,
    secretKey: process.env.PODPAY_SECRET_KEY,
  },
  app: {
    url: process.env.NEXT_PUBLIC_APP_URL || "https://meta-research-promotion.vercel.app",
  },
  vercel: {
    region: process.env.VERCEL_REGION,
  },
} as const

export function validateEnvConfig() {
  const missing: string[] = []

  if (!envConfig.podpay.publicKey) {
    missing.push("PODPAY_PUBLIC_KEY")
  }

  if (!envConfig.podpay.secretKey) {
    missing.push("PODPAY_SECRET_KEY")
  }

  if (missing.length > 0) {
    const errorMessage = `Missing required environment variables: ${missing.join(", ")}\n\nTo fix this:\n1. Go to Project Settings in the top right\n2. Add the missing environment variables\n3. Refresh the preview`
    console.error("[v0] PodPay API Error:", errorMessage)
    throw new Error(errorMessage)
  }
}

export function isPodPayConfigured(): boolean {
  return !!(envConfig.podpay.publicKey && envConfig.podpay.secretKey)
}
