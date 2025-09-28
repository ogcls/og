import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Log the webhook for debugging
    console.log("Lira Pay Webhook received:", body)

    // Here you can add logic to handle payment status updates
    // For example, update database, send notifications, etc.

    const { id, external_id, status, total_amount, payment_method } = body

    if (status === "AUTHORIZED") {
      // Payment was successful
      console.log(`Payment ${id} was authorized for amount ${total_amount}`)
      // In a real application, you might want to store this in a database
      // and use WebSockets or Server-Sent Events to notify the frontend
      // For now, the frontend will poll the payment status
    } else if (status === "FAILED") {
      // Payment failed
      console.log(`Payment ${id} failed`)
      // Add your failure logic here
    }

    // Always return 200 to acknowledge receipt
    return NextResponse.json({ received: true })
  } catch (error) {
    console.error("Erro no webhook Lira Pay:", error)
    return NextResponse.json({ error: "Erro ao processar webhook" }, { status: 500 })
  }
}
