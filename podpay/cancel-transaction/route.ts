import { type NextRequest, NextResponse } from "next/server"
import { PodPayAPI } from "@/lib/podpay-api"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    console.log("[v0] PodPay transaction request:", JSON.stringify(body, null, 2))

    // Validate required fields
    const { amount, paymentMethod, items, customer } = body

    if (!amount || !paymentMethod || !items || !customer) {
      return NextResponse.json(
        {
          success: false,
          error: "Dados obrigatórios não fornecidos",
          required: ["amount", "paymentMethod", "items", "customer"],
        },
        { status: 400 },
      )
    }

    // Add postback URL
    const transactionData = {
      ...body,
      postbackUrl: `${process.env.NEXT_PUBLIC_APP_URL || "https://meta-research-promotion.vercel.app"}/api/podpay/webhook`,
    }

    const result = await PodPayAPI.createTransaction(transactionData)

    if (!result.success) {
      return NextResponse.json(result, { status: 400 })
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error("[v0] Error in PodPay create transaction:", error)
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
