import { NextRequest, NextResponse } from 'next/server'
import { PodPayAPI } from '@/lib/podpay-api'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const transactionId = searchParams.get('id')

    console.log("[v0] Get transaction request received:", { transactionId })

    if (!transactionId) {
      return NextResponse.json({ error: "Transaction ID é obrigatório" }, { status: 400 })
    }

    // Buscar transação na PodPay
    const result = await PodPayAPI.getTransaction(transactionId)

    if (result.success) {
      console.log("[v0] Transaction data loaded:", result.data)
      return NextResponse.json({
        success: true,
        data: result.data,
      }, { status: 200 })
    } else {
      console.error("[v0] Error getting transaction:", result.error)
      return NextResponse.json({ error: result.error, details: result.details }, { status: 400 })
    }
  } catch (error) {
    console.error("[v0] Error in get transaction endpoint:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
