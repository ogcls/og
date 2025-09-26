import { type NextRequest, NextResponse } from "next/server"
import { PodPayAPI } from "@/lib/podpay-api"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { amount, external_id, clientCallbackUrl, payer, utm_params } = body

    console.log("[v0] Dados recebidos para depósito (via PodPay):", {
      amount,
      external_id,
      clientCallbackUrl,
      payer,
      utm_params,
    })

    if (!amount || !external_id || !payer) {
      console.error("[v0] Dados obrigatórios não fornecidos")
      return NextResponse.json(
        {
          hasError: true,
          error: "Dados obrigatórios não fornecidos",
          required: ["amount", "external_id", "payer"],
        },
        { status: 400 },
      )
    }

    // Transform KeyClub format to PodPay format
    const podPayData = {
      amount: Number.parseFloat(amount.toString()),
      currency: "BRL",
      paymentMethod: "pix" as const,
      items: [
        {
          externalRef: external_id.toString(),
          title: "Meta Research Participation",
          unitPrice: Number.parseFloat(amount.toString()),
          quantity: 1,
          tangible: false,
        },
      ],
      customer: {
        name: payer.name || "Usuario Meta Research",
        email: payer.email || "usuario@metaresearch.com",
        document: {
          number: PodPayAPI.formatDocument(payer.document || "00000000000"),
          type: "cpf" as const,
        },
      },
      pix: {
        expiresAt: new Date(Date.now() + 30 * 60 * 1000).toISOString(), // 30 minutes
      },
      postbackUrl:
        clientCallbackUrl ||
        `${process.env.NEXT_PUBLIC_APP_URL || "https://meta-research-promotion.vercel.app"}/api/podpay/webhook`,
    }

    console.log("[v0] Creating PodPay transaction:", podPayData)

    const result = await PodPayAPI.createTransaction(podPayData)

    if (!result.success) {
      console.error("[v0] Error creating PodPay transaction:", result.error)
      return NextResponse.json(
        {
          hasError: true,
          error: "Erro ao processar depósito",
          message: result.error,
          details: result.details,
        },
        { status: 400 },
      )
    }

    const transactionData = result.data
    const transactionId = transactionData?.id || `demo-${Date.now()}`
    const pixPayload =
      transactionData?.pixPayload ||
      "00020126580014BR.GOV.BCB.PIX0136123456789010214Meta Desbloqueio5204000053039865802BR5925MARIA SILVA SANTOS6009SAO PAULO62070503***63046759"

    console.log("[v0] PodPay transaction created successfully:", transactionData)

    // Return response in KeyClub format for backward compatibility
    return NextResponse.json({
      id: transactionId,
      transaction_id: transactionId,
      external_id: external_id,
      pix: {
        payload: pixPayload,
        qr_code: pixPayload,
        expires_at: transactionData?.pix?.expiresAt || new Date(Date.now() + 30 * 60 * 1000).toISOString(),
      },
      pix_code: pixPayload,
      qr_code: pixPayload,
      amount: transactionData?.amount || amount,
      status: transactionData?.status || "waiting_payment",
      expires_at: transactionData?.pix?.expiresAt || new Date(Date.now() + 30 * 60 * 1000).toISOString(),
      hasError: false,
    })
  } catch (error) {
    console.error("[v0] Error in PodPay deposit endpoint:", error)
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
