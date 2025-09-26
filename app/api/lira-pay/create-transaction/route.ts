import { type NextRequest, NextResponse } from "next/server"
import { PodPayAPI } from "@/lib/podpay-api"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    console.log("[v0] PodPay transaction request (via legacy endpoint):", JSON.stringify(body, null, 2))

    // Transform Lira Pay format to PodPay format
    const podPayData = {
      amount: body.amount,
      currency: body.currency || "BRL",
      paymentMethod: body.paymentMethod || "pix",
      installments: body.installments,
      card: body.card,
      pix: body.pix,
      boleto: body.boleto,
      items: body.items || [
        {
          externalRef: PodPayAPI.generateExternalRef(),
          title: body.description || "Meta Research Participation",
          unitPrice: body.amount,
          quantity: 1,
        },
      ],
      customer: body.customer || {
        name: body.customerName || "Cliente Meta Research",
        email: body.customerEmail || "cliente@metaresearch.com",
        document: {
          number: body.customerDocument || "00000000000",
          type: "cpf",
        },
      },
      postbackUrl: `${process.env.NEXT_PUBLIC_APP_URL || "https://meta-research-promotion.vercel.app"}/api/podpay/webhook`,
    }

    const result = await PodPayAPI.createTransaction(podPayData)

    if (!result.success) {
      return NextResponse.json(
        {
          hasError: true,
          message: result.error,
          details: result.details,
        },
        { status: 400 },
      )
    }

    // Transform response to match Lira Pay format for backward compatibility
    const response = {
      id: result.data?.id,
      status: result.data?.status,
      amount: result.data?.amount,
      paymentMethod: result.data?.paymentMethod,
      pixPayload: result.data?.pixPayload,
      boletoUrl: result.data?.boletoUrl,
      boletoBarcode: result.data?.boletoBarcode,
      customer: result.data?.customer,
      items: result.data?.items,
      createdAt: result.data?.createdAt,
      updatedAt: result.data?.updatedAt,
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error("[v0] Error in legacy Lira Pay endpoint:", error)
    return NextResponse.json(
      {
        hasError: true,
        message: "Erro interno do servidor",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
