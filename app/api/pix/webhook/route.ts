import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const payload = await request.json()

    console.log("[v0] Received PodPay webhook:", payload)

    // Aqui você pode processar a notificação de pagamento
    // Por exemplo: atualizar status no banco de dados, enviar email, etc.

    // Verificar se o pagamento foi aprovado
    if (payload.status === "paid" || payload.status === "approved") {
      console.log("[v0] Payment confirmed for transaction:", payload.id)
      // Processar pagamento confirmado
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error("[v0] Webhook error:", error)
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 })
  }
}
