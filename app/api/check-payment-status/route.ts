import { type NextRequest, NextResponse } from "next/server"
import { PodPayAPI } from "@/lib/podpay-api"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const transactionId = searchParams.get("id")

    console.log("[v0] Checking payment status for transaction:", transactionId)

    if (!transactionId) {
      return NextResponse.json({ error: "Transaction ID required" }, { status: 400 })
    }

    const result = await PodPayAPI.getTransaction(transactionId)

    if (!result.success) {
      console.error("[v0] Error fetching transaction:", result.error)
      return NextResponse.json(
        {
          error: result.error,
          id: transactionId,
          status: "error",
        },
        { status: 400 },
      )
    }

    console.log("[v0] Payment status response:", result.data)

    return NextResponse.json({
      status: result.data.status || "pending",
      id: transactionId,
      data: result.data,
    })
  } catch (error) {
    console.error("[v0] Error checking payment status:", error)
    const { searchParams } = new URL(request.url)
    const transactionId = searchParams.get("id")

    return NextResponse.json(
      {
        error: "Error checking payment status",
        id: transactionId || "unknown",
      },
      { status: 500 },
    )
  }
}
