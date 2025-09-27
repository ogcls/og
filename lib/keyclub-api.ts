interface KeyClubCashoutData {
  amount: number
  external_id: string
  pix_key: string
  key_type: "EMAIL" | "CPF" | "CNPJ" | "PHONE"
  description?: string
}

interface KeyClubResponse {
  success: boolean
  data?: any
  error?: string
  details?: any
}

export class KeyClubAPI {
  static generateExternalId(): string {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789"
    let result = ""
    for (let i = 0; i < 10; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return result
  }

  static async createCashout(data: KeyClubCashoutData): Promise<KeyClubResponse> {
    try {
      console.log("[v0] 🚀 Iniciando cashout KeyClub:", data)

      const response = await fetch("/api/keyclub/cashout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      })

      const result = await response.json()

      if (!response.ok) {
        console.error("[v0] ❌ Erro na resposta da API:", {
          status: response.status,
          result,
        })

        if (response.status === 403) {
          throw new Error("IP não autorizado na KeyClub. Configure o IP nas configurações da plataforma.")
        }

        throw new Error(result.error || `Erro HTTP ${response.status}`)
      }

      console.log("[v0] ✅ Cashout realizado com sucesso:", result)
      return result
    } catch (error) {
      console.error("[v0] ❌ Erro na API KeyClub:", error)
      return {
        success: false,
        error: error instanceof Error ? error.message : "Erro desconhecido",
      }
    }
  }

  static validatePixKey(key: string, type: string): boolean {
    switch (type.toUpperCase()) {
      case "EMAIL":
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(key)
      case "CPF":
        return /^\d{11}$/.test(key.replace(/\D/g, ""))
      case "CNPJ":
        return /^\d{14}$/.test(key.replace(/\D/g, ""))
      case "PHONE":
        return /^\d{10,11}$/.test(key.replace(/\D/g, ""))
      default:
        return false
    }
  }

  static formatPixKey(key: string, type: string): string {
    switch (type.toUpperCase()) {
      case "CPF":
      case "CNPJ":
      case "PHONE":
        return key.replace(/\D/g, "")
      case "EMAIL":
        return key.toLowerCase().trim()
      default:
        return key
    }
  }
}
