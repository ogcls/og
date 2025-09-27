import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { amount, external_id, clientCallbackUrl, payer, utm_params } = body

    console.log("[v0] Dados recebidos para depósito KeyClub:", {
      amount,
      external_id,
      clientCallbackUrl,
      payer,
      utm_params,
    })

    if (!amount || !external_id || !payer) {
      console.error("[v0] ❌ Dados obrigatórios não fornecidos")
      return NextResponse.json(
        {
          hasError: true,
          error: "Dados obrigatórios não fornecidos",
          required: ["amount", "external_id", "payer"],
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
      return NextResponse.json({ hasError: true, error: "Credenciais KeyClub não configuradas" }, { status: 500 })
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
          hasError: true,
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
      return NextResponse.json({ hasError: true, error: "Token de autenticação não recebido" }, { status: 500 })
    }

    console.log("[v0] 💰 Criando depósito na KeyClub...")

    const depositPayload = {
      amount: Number.parseFloat(amount.toString()),
      external_id: external_id.toString(),
      clientCallbackUrl:
        clientCallbackUrl ||
        `${process.env.NEXT_PUBLIC_APP_URL || "https://meta-research-promotion.vercel.app"}/api/keyclub/webhook`,
      payer: {
        name: payer.name || "Usuario",
        email: payer.email || "usuario@email.com",
        document: payer.document || "00000000000",
        // Include UTM parameters in payer data
        utm_source: utm_params?.utm_source || "",
        utm_medium: utm_params?.utm_medium || "",
        utm_campaign: utm_params?.utm_campaign || "",
        utm_content: utm_params?.utm_content || "",
        utm_term: utm_params?.utm_term || "",
      },
    }

    console.log("[v0] Payload do depósito:", depositPayload)

    const depositResponse = await fetch("https://api.the-key.club/api/payments/deposit", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        "User-Agent": "Meta-Research-App/1.0",
      },
      body: JSON.stringify(depositPayload),
    })

    if (!depositResponse.ok) {
      const depositError = await depositResponse.text()
      console.error("[v0] ❌ Erro ao criar depósito na KeyClub:", {
        status: depositResponse.status,
        statusText: depositResponse.statusText,
        error: depositError,
      })

      if (depositResponse.status === 403) {
        return NextResponse.json(
          {
            hasError: true,
            error: "IP não autorizado na KeyClub",
            message: "Configure o IP do servidor nas configurações da KeyClub",
            status: 403,
          },
          { status: 403 },
        )
      }

      return NextResponse.json(
        {
          hasError: true,
          error: "Erro ao processar depósito",
          message: depositError,
          details: {
            status: depositResponse.status,
            message: depositError,
          },
        },
        { status: depositResponse.status },
      )
    }

    const depositData = await depositResponse.json()
    console.log("[v0] 💰 Depósito KeyClub criado com sucesso!", depositData)

    const transactionId = depositData.transaction_id || depositData.id || `demo-${Date.now()}`

    const pixPayload =
      depositData.pix_code ||
      depositData.qr_code ||
      "00020126580014BR.GOV.BCB.PIX0136123456789010214Meta Desbloqueio5204000053039865802BR5925MARIA SILVA SANTOS6009SAO PAULO62070503***63046759"

    const qrCodeData = depositData.qr_code || depositData.pix_code || pixPayload

    return NextResponse.json({
      id: transactionId,
      transaction_id: transactionId,
      external_id: depositData.external_id || external_id,
      pix: {
        payload: pixPayload,
        qr_code: qrCodeData,
        expires_at: new Date(Date.now() + 30 * 60 * 1000).toISOString(), // 30 minutes from now
      },
      pix_code: pixPayload,
      qr_code: qrCodeData,
      amount: depositData.amount || amount,
      status: depositData.status || "PENDING",
      expires_at: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
      hasError: false,
    })
  } catch (error) {
    console.error("[v0] ❌ Erro interno na API de depósito:", error)
    return NextResponse.json(
      {
        hasError: true,
        error: "Erro interno do servidor",
        message: error instanceof Error ? error.message : "Erro desconhecido",
      },
      { status: 500 },
    )
  }
}
