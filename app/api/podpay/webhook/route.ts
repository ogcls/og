import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    console.log("[v0] PodPay webhook received:", JSON.stringify(body, null, 2))

    // Process the webhook data
    const { id, status, amount, paymentMethod, customer } = body

    console.log("[v0] Processing PodPay webhook:", {
      transactionId: id,
      status,
      amount,
      paymentMethod,
      customerEmail: customer?.email,
    })

    // Here you would typically update your database with the transaction status
    // For now, we'll just log the webhook data

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error("[v0] Error processing PodPay webhook:", error)
    return NextResponse.json(
      {
        error: "Erro interno do servidor",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
