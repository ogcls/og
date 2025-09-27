import { type NextRequest, NextResponse } from "next/server"
import { PodPayAPI } from "@/lib/podpay-api"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { amount = 8.82, customerName, customerEmail, customerDocument } = body

    console.log("[v0] Creating PIX checkout transaction:", { amount, customerName, customerEmail })

    // Create transaction data for PodPay
    const transactionData = {
      amount: amount,
      currency: "BRL",
      paymentMethod: "pix" as const,
      items: [
        {
          externalRef: PodPayAPI.generateExternalRef(),
          title: "Desbloqueio de Saldo - Instagram Meta",
          unitPrice: amount,
          quantity: 1,
          tangible: false,
        },
      ],
      customer: {
        name: customerName || "Cliente Instagram",
        email: customerEmail || "cliente@instagram.com",
        document: {
          number: PodPayAPI.formatDocument(customerDocument || "00000000000"),
          type: "cpf" as const,
        },
      },
      pix: {
        expiresAt: new Date(Date.now() + 30 * 60 * 1000).toISOString(), // 30 minutes
      },
      postbackUrl: `${process.env.NEXT_PUBLIC_BASE_URL || "https://localhost:3000"}/api/podpay/webhook`,
      returnUrl: `${process.env.NEXT_PUBLIC_BASE_URL || "https://localhost:3000"}/taxaiof`,
    }

    const result = await PodPayAPI.createTransaction(transactionData)

    if (!result.success) {
      console.error("[v0] Failed to create PIX checkout transaction:", result.error)
      return NextResponse.json(result, { status: 400 })
    }

    console.log("[v0] PIX checkout transaction created successfully:", result.data?.id)

    return NextResponse.json({
      success: true,
      data: {
        transactionId: result.data?.id,
        redirectUrl: `/pix-checkout?id=${result.data?.id}`,
      },
    })
  } catch (error) {
    console.error("[v0] Error creating PIX checkout transaction:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Erro interno do servidor",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
