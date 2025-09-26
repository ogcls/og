import { envConfig, validateEnvConfig, isPodPayConfigured } from "./env-config"
import { Buffer } from "buffer"

interface PodPayCard {
  token: string
}

interface PodPayPix {
  expiresAt?: string
}

interface PodPayBoleto {
  expiresAt?: string
}

interface PodPayItem {
  externalRef: string
  title: string
  unitPrice: number
  quantity: number
  tangible: boolean // Added required tangible field for PodPay API
}

interface PodPayCustomer {
  name: string
  email: string
  document: {
    number: string
    type: "cpf" | "cnpj"
  }
}

interface PodPayTransactionRequest {
  amount: number
  currency?: string
  paymentMethod: "credit_card" | "boleto" | "pix"
  installments?: number
  card?: PodPayCard
  pix?: PodPayPix
  boleto?: PodPayBoleto
  items: PodPayItem[]
  customer: PodPayCustomer
  postbackUrl?: string
  returnUrl?: string
}

interface PodPayTransactionResponse {
  id: string
  status: "waiting_payment" | "approved" | "refused" | "refunded"
  amount: number
  paymentMethod: string
  pixPayload?: string
  boletoUrl?: string
  boletoBarcode?: string
  customer: PodPayCustomer
  items: PodPayItem[]
  createdAt: string
  updatedAt: string
}

interface PodPayResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  details?: any
}

export class PodPayAPI {
  private static getAuthHeader(): string {
    validateEnvConfig()

    const publicKey = envConfig.podpay.publicKey
    const secretKey = envConfig.podpay.secretKey

    const credentials = `${publicKey}:${secretKey}`
    return `Basic ${Buffer.from(credentials).toString("base64")}`
  }

  private static getWithdrawKey(): string {
    return "wk__awv--ejDTrIrgPWfRAovinmZfxS4jjPbe_6WGT8JBWs0Fr6"
  }

  static async createTransaction(data: PodPayTransactionRequest): Promise<PodPayResponse<PodPayTransactionResponse>> {
    try {
      if (!isPodPayConfigured()) {
        return {
          success: false,
          error:
            "PodPay não está configurado. Verifique as variáveis de ambiente PODPAY_PUBLIC_KEY e PODPAY_SECRET_KEY.",
        }
      }

      console.log("[v0] Creating PodPay transaction:", data)

      const response = await fetch("https://api.podpay.co/v1/transactions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: this.getAuthHeader(),
        },
        body: JSON.stringify(data),
      })

      const result = await response.json()

      if (!response.ok) {
        console.error("[v0] PodPay API Error:", {
          status: response.status,
          result,
        })

        return {
          success: false,
          error: result.message || result.error || "Erro ao criar transação",
          details: result,
        }
      }

      console.log("[v0] PodPay transaction created successfully:", result)
      return {
        success: true,
        data: result,
      }
    } catch (error) {
      console.error("[v0] PodPay API Error:", error)
      return {
        success: false,
        error: error instanceof Error ? error.message : "Erro desconhecido",
      }
    }
  }

  static async getTransaction(id: string): Promise<PodPayResponse<PodPayTransactionResponse>> {
    try {
      if (!isPodPayConfigured()) {
        return {
          success: false,
          error: "PodPay não está configurado. Verifique as variáveis de ambiente.",
        }
      }

      const response = await fetch(`https://api.podpay.co/v1/transactions/${id}`, {
        method: "GET",
        headers: {
          Authorization: this.getAuthHeader(),
        },
      })

      const result = await response.json()

      if (!response.ok) {
        return {
          success: false,
          error: result.message || result.error || "Erro ao buscar transação",
          details: result,
        }
      }

      return {
        success: true,
        data: result,
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Erro desconhecido",
      }
    }
  }

  static async refundTransaction(id: string, amount?: number): Promise<PodPayResponse> {
    try {
      if (!isPodPayConfigured()) {
        return {
          success: false,
          error: "PodPay não está configurado. Verifique as variáveis de ambiente.",
        }
      }

      const body = amount ? { amount } : {}

      const response = await fetch(`https://api.podpay.co/v1/transactions/${id}/refund`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: this.getAuthHeader(),
        },
        body: JSON.stringify(body),
      })

      const result = await response.json()

      if (!response.ok) {
        return {
          success: false,
          error: result.message || result.error || "Erro ao estornar transação",
          details: result,
        }
      }

      return {
        success: true,
        data: result,
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Erro desconhecido",
      }
    }
  }

  static async cancelTransfer(id: string): Promise<PodPayResponse> {
    try {
      if (!isPodPayConfigured()) {
        return {
          success: false,
          error: "PodPay não está configurado. Verifique as variáveis de ambiente.",
        }
      }

      console.log("[v0] Canceling PodPay transfer:", id)

      const response = await fetch(`https://api.podpay.co/v1/transfers/${id}/cancel`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Authorization: this.getAuthHeader(),
          "x-withdraw-key": this.getWithdrawKey(),
        },
      })

      const result = await response.json()

      if (!response.ok) {
        console.error("[v0] PodPay Cancel Transfer Error:", {
          status: response.status,
          result,
        })

        return {
          success: false,
          error: result.message || result.error || "Erro ao cancelar transferência",
          details: result,
        }
      }

      console.log("[v0] PodPay transfer canceled successfully:", result)
      return {
        success: true,
        data: result,
      }
    } catch (error) {
      console.error("[v0] PodPay Cancel Transfer Error:", error)
      return {
        success: false,
        error: error instanceof Error ? error.message : "Erro desconhecido",
      }
    }
  }

  static generateExternalRef(): string {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789"
    let result = ""
    for (let i = 0; i < 12; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return `META-${result}`
  }

  static validateDocument(document: string, type: "cpf" | "cnpj"): boolean {
    const cleanDoc = document.replace(/\D/g, "")

    if (type === "cpf") {
      return cleanDoc.length === 11
    } else if (type === "cnpj") {
      return cleanDoc.length === 14
    }

    return false
  }

  static formatDocument(document: string): string {
    return document.replace(/\D/g, "")
  }
}
