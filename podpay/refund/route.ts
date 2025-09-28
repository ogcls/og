import { type NextRequest, NextResponse } from "next/server"
import { PodPayAPI } from "@/lib/podpay-api"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { transactionId, amount } = body

    if (!transactionId) {
      return NextResponse.json(
        {
          success: false,
          error: "ID da transação é obrigatório",
        },
        { status: 400 },
      )
    }

    const result = await PodPayAPI.refundTransaction(transactionId, amount)

    if (!result.success) {
      return NextResponse.json(result, { status: 400 })
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error("[v0] Error in PodPay refund:", error)
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
