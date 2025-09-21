import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const timestamp = new Date().toISOString()
    const sourceIP = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown"

    console.log("[v0] 🔔 Webhook KeyClub recebido:", {
      timestamp,
      webhook_type: body.status === "RETIDO" ? "MED" : body.amount > 0 ? "DEPOSIT" : "WITHDRAWAL",
      transaction_id: body.transaction_id,
      status: body.status,
      amount: body.amount,
      source_ip: sourceIP,
      full_payload: body,
    })

    const { external_id, status, amount, transaction_id, fee, net_amount } = body

    if (status === "RETIDO") {
      console.log(`[v0] 🚨 MED (Medida Cautelar) - Transação ${transaction_id} retida`)
    } else if (body.net_amount !== undefined) {
      console.log(`[v0] 📥 Webhook de Depósito - ${external_id}: ${status} - Valor: R$ ${amount}`)
    } else {
      console.log(`[v0] 📤 Webhook de Saque - ${external_id}: ${status} - Valor: R$ ${amount}`)
    }

    // Log de auditoria
    const auditLog = {
      timestamp,
      webhook_type: body.status === "RETIDO" ? "MED" : body.net_amount !== undefined ? "DEPOSIT" : "WITHDRAWAL",
      transaction_id,
      status,
      source_ip: sourceIP,
      processed_at: new Date().toISOString(),
      processing_status: "SUCCESS",
    }

    console.log("[v0] 📋 Audit Log:", auditLog)

    return NextResponse.json({
      success: true,
      message: "Webhook processado com sucesso",
      processed_at: auditLog.processed_at,
    })
  } catch (error) {
    console.error("[v0] ❌ Erro ao processar webhook KeyClub:", error)

    // Log de erro para auditoria
    const errorLog = {
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : "Erro desconhecido",
      source_ip: request.headers.get("x-forwarded-for") || "unknown",
      processing_status: "ERROR",
    }

    console.log("[v0] 📋 Error Audit Log:", errorLog)

    return NextResponse.json({ error: "Erro ao processar webhook" }, { status: 500 })
  }
}
