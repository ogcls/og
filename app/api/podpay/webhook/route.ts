import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    console.log("[v0] PodPay webhook received:", JSON.stringify(body, null, 2))

    // Process the webhook data
    const { id, status, paymentMethod, amount, customer } = body

    // Here you would typically update your database with the transaction status
    // For now, we'll just log the webhook data

    console.log("[v0] Processing PodPay webhook:", {
      transactionId: id,
      status,
      paymentMethod,
      amount,
      customerEmail: customer?.email,
    })

    // Always return 200 OK to acknowledge receipt of the webhook
    return NextResponse.json({ received: true })
  } catch (error) {
    console.error("[v0] Error processing PodPay webhook:", error)

    // Still return 200 to prevent webhook retries
    return NextResponse.json({ received: false, error: "Processing error" })
  }
}
