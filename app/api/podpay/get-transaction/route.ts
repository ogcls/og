import { type NextRequest, NextResponse } from "next/server"
import { PodPayAPI } from "@/lib/podpay-api"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          error: "ID da transação é obrigatório",
        },
        { status: 400 },
      )
    }

    console.log("[v0] Getting PodPay transaction:", id)

    const result = await PodPayAPI.getTransaction(id)

    if (!result.success) {
      return NextResponse.json(result, { status: 400 })
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error("[v0] Error in PodPay get transaction:", error)
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
