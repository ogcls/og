import { type NextRequest, NextResponse } from "next/server"
import { PodPayAPI } from "@/lib/podpay-api"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { transferId } = body

    console.log("[v0] Cancel transfer request received:", { transferId })

    if (!transferId) {
      return NextResponse.json({ error: "Transfer ID é obrigatório" }, { status: 400 })
    }

    const result = await PodPayAPI.cancelTransfer(transferId)

    if (!result.success) {
      console.error("[v0] Error canceling transfer:", result.error)
      return NextResponse.json({ error: result.error, details: result.details }, { status: 400 })
    }

    console.log("[v0] Transfer canceled successfully:", result.data)
    return NextResponse.json({
      success: true,
      data: result.data,
    })
  } catch (error) {
    console.error("[v0] Error in cancel transfer endpoint:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
