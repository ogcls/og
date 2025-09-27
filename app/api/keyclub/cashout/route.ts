import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { amount, external_id, pix_key, key_type, description } = body

    console.log("[v0] Dados recebidos para cashout:", { amount, external_id, pix_key, key_type, description })

    if (!amount || !external_id || !pix_key || !key_type) {
      console.error("[v0] ❌ Dados obrigatórios não fornecidos")
      return NextResponse.json(
        {
          error: "Dados obrigatórios não fornecidos",
          required: ["amount", "external_id", "pix_key", "key_type"],
        },
        { status: 400 },
      )
    }

    const clientId = process.env.KEYCLUB_CLIENT_ID || "cauaavaliador(w)_FC9C13C2"
    const clientSecret =
      process.env.KEYCLUB_CLIENT_SECRET ||
      "4d1118d7bd84c26bb8f4206fae0e9682e89103f86cbd48f63f83122bbdea0713a897ec4ecc5a7b0488ebc9ad9d3136d06d33"

    if (!clientId || !clientSecret) {
      console.error("[v0] ❌ Credenciais KeyClub não configuradas")
      return NextResponse.json({ error: "Credenciais KeyClub não configuradas" }, { status: 500 })
    }

    console.log("[v0] ✅ Credenciais KeyClub configuradas")

    console.log("[v0] 🔐 Fazendo login na KeyClub...")

    const loginResponse = await fetch("https://api.the-key.club/api/auth/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "User-Agent": "Meta-Research-App/1.0",
      },
      body: JSON.stringify({
        client_id: clientId,
        client_secret: clientSecret,
      }),
    })

    if (!loginResponse.ok) {
      const loginError = await loginResponse.text()
      console.error("[v0] ❌ Erro ao fazer login na KeyClub:", {
        status: loginResponse.status,
        statusText: loginResponse.statusText,
        error: loginError,
      })
      return NextResponse.json(
        {
          error: "Erro ao autenticar com KeyClub",
          details: {
            status: loginResponse.status,
            message: loginError,
          },
        },
        { status: 500 },
      )
    }

    const loginData = await loginResponse.json()
    console.log("[v0] ✅ Login KeyClub realizado com sucesso!")

    const token = loginData.token
    if (!token) {
      console.error("[v0] ❌ Token não recebido da KeyClub")
      return NextResponse.json({ error: "Token de autenticação não recebido" }, { status: 500 })
    }

    console.log("[v0] 💸 Solicitando saque na KeyClub...")

    const withdrawalPayload = {
      amount: Number.parseFloat(amount.toString()),
      external_id: external_id.toString(),
      pix_key: pix_key.toString(),
      key_type: key_type.toString().toUpperCase(),
      description: description || `Saque Meta Research - ${external_id}`,
      clientCallbackUrl: `${process.env.NEXT_PUBLIC_APP_URL || "https://meta-research-promotion.vercel.app"}/api/keyclub/webhook`,
    }

    console.log("[v0] Payload do saque:", withdrawalPayload)

    const withdrawalResponse = await fetch("https://api.the-key.club/api/withdrawals/withdraw", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        "User-Agent": "Meta-Research-App/1.0",
      },
      body: JSON.stringify(withdrawalPayload),
    })

    if (!withdrawalResponse.ok) {
      const withdrawalError = await withdrawalResponse.text()
      console.error("[v0] ❌ Erro ao solicitar saque na KeyClub:", {
        status: withdrawalResponse.status,
        statusText: withdrawalResponse.statusText,
        error: withdrawalError,
      })

      if (withdrawalResponse.status === 403) {
        return NextResponse.json(
          {
            error: "IP não autorizado na KeyClub",
            details: "Configure o IP do servidor nas configurações da KeyClub",
            status: 403,
          },
          { status: 403 },
        )
      }

      return NextResponse.json(
        {
          error: "Erro ao processar saque",
          details: {
            status: withdrawalResponse.status,
            message: withdrawalError,
          },
        },
        { status: withdrawalResponse.status },
      )
    }

    const withdrawalData = await withdrawalResponse.json()
    console.log("[v0] 💸 Saque KeyClub solicitado com sucesso!", withdrawalData)

    return NextResponse.json({
      success: true,
      data: withdrawalData,
      message: "Saque processado com sucesso",
    })
  } catch (error) {
    console.error("[v0] ❌ Erro interno na API de cashout:", error)
    return NextResponse.json(
      {
        error: "Erro interno do servidor",
        details: error instanceof Error ? error.message : "Erro desconhecido",
      },
      { status: 500 },
    )
  }
}
