import { type NextRequest, NextResponse } from "next/server"
import { PodPayAPI } from "@/lib/podpay-api"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const transactionId = searchParams.get("id")

    if (!transactionId) {
      return NextResponse.json({ error: "Transaction ID required" }, { status: 400 })
    }

    console.log("[v0] Checking payment status for transaction:", transactionId)

    if (transactionId.startsWith("fallback-")) {
      console.log("[v0] Detected fallback transaction ID, returning mock status")
      // For fallback transactions, return a pending status since they're demo/test transactions
      return NextResponse.json({
        status: "pending",
        id: transactionId,
        amount: 8.82,
        paymentMethod: "pix",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })
    }

    const result = await PodPayAPI.getTransaction(transactionId)

    if (!result.success) {
      console.error("[v0] Error getting transaction status:", result.error)
      return NextResponse.json(
        {
          error: result.error,
          status: "error",
        },
        { status: 400 },
      )
    }

    return NextResponse.json({
      status: result.data?.status,
      id: transactionId,
      amount: result.data?.amount,
      paymentMethod: result.data?.paymentMethod,
      pixPayload: result.data?.pixPayload,
      boletoUrl: result.data?.boletoUrl,
      createdAt: result.data?.createdAt,
      updatedAt: result.data?.updatedAt,
    })
  } catch (error) {
    console.error("[v0] Error checking payment status:", error)
    return NextResponse.json({ error: "Error checking payment status" }, { status: 500 })
  }
}
