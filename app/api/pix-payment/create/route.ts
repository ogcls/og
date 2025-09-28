import { NextRequest, NextResponse } from 'next/server'
import { PodPayAPI } from '@/lib/podpay-api'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { transferId } = body

    console.log("[v0] Creating PIX transaction with data:", { transferId })

    if (!transferId) {
      return NextResponse.json({ error: "Transfer ID é obrigatório" }, { status: 400 })
    }

    // Criar transação na PodPay
    const result = await PodPayAPI.createTransaction({
      amount: 8.82,
      currency: "BRL",
      paymentMethod: "pix",
      items: [{
        externalRef: "META-action-704",
        title: "ADSREWARS",
        unitPrice: 8.82,
        quantity: 1,
        tangible: false
      }],
      customer: {
        name: "Plano Mensal",
        email: "maria.silva@email.com",
        document: {
          number: "12345678901",
          type: "cpf"
        }
      },
      pix: {
        expiresAt: "2025-09-27T17:35:06.617Z"
      }
    })

    if (result.success) {
      console.log("[v0] PIX transaction created successfully:", result.data)
      return NextResponse.json({
        success: true,
        data: result.data,
      }, { status: 200 })
    } else {
      console.error("[v0] Error creating PIX transaction:", result.error)
      return NextResponse.json({ error: result.error, details: result.details }, { status: 400 })
    }
  } catch (error) {
    console.error("[v0] Error in create transaction endpoint:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
