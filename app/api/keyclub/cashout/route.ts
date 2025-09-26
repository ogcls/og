import { type NextRequest, NextResponse } from "next/server"
import { PodPayAPI } from "@/lib/podpay-api"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { amount, external_id, pix_key, key_type, description, transactionId } = body

    console.log("[v0] Dados recebidos para cashout (via PodPay):", {
      amount,
      external_id,
      pix_key,
      key_type,
      description,
      transactionId,
    })

    if (!amount || !external_id) {
      console.error("[v0] Dados obrigatórios não fornecidos")
      return NextResponse.json(
        {
          error: "Dados obrigatórios não fornecidos",
          required: ["amount", "external_id"],
        },
        { status: 400 },
      )
    }

    // For cashout functionality, we'll create a new PIX transaction
    // since PodPay doesn't have a direct cashout equivalent like KeyClub
    const podPayData = {
      amount: Number.parseFloat(amount.toString()),
      currency: "BRL",
      paymentMethod: "pix" as const,
      items: [
        {
          externalRef: external_id.toString(),
          title: description || `Saque Meta Research - ${external_id}`,
          unitPrice: Number.parseFloat(amount.toString()),
          quantity: 1,
        },
      ],
      customer: {
        name: "Meta Research User",
        email: "user@metaresearch.com",
        document: {
          number: "00000000000",
          type: "cpf" as const,
        },
      },
      pix: {
        expiresAt: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
      },
      postbackUrl: `${process.env.NEXT_PUBLIC_APP_URL || "https://meta-research-promotion.vercel.app"}/api/podpay/webhook`,
    }

    console.log("[v0] Creating PodPay cashout transaction:", podPayData)

    const result = await PodPayAPI.createTransaction(podPayData)

    if (!result.success) {
      console.error("[v0] Error creating PodPay cashout transaction:", result.error)
      return NextResponse.json(
        {
          error: "Erro ao processar saque",
          details: {
            message: result.error,
          },
        },
        { status: 400 },
      )
    }

    console.log("[v0] PodPay cashout transaction created successfully:", result.data)

    return NextResponse.json({
      success: true,
      data: result.data,
      message: "Saque processado com sucesso",
    })
  } catch (error) {
    console.error("[v0] Error in PodPay cashout endpoint:", error)
    return NextResponse.json(
      {
        error: "Erro interno do servidor",
        details: error instanceof Error ? error.message : "Erro desconhecido",
      },
      { status: 500 },
    )
  }
}
