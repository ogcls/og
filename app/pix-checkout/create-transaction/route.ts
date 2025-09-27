import { type NextRequest, NextResponse } from "next/server"
import { PodPayAPI } from "@/lib/podpay-api"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { amount, customerName, customerEmail, customerPhone, pixKey } = body

    console.log("[v0] Creating PIX transaction with data:", {
      amount,
      customerName,
      customerEmail,
      customerPhone,
      pixKey,
    })

    if (!amount || !customerName || !customerEmail || !customerPhone || !pixKey) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const result = await PodPayAPI.createTransaction({
      amount: parseFloat(amount),
      customerName,
      customerEmail,
      customerPhone,
      pixKey,
      paymentMethod: "pix",
    })

    if (!result.success) {
      console.error("[v0] Error creating PIX transaction:", result.error)
      return NextResponse.json(
        {
          error: result.error,
          success: false,
        },
        { status: 400 },
      )
    }

    console.log("[v0] PIX transaction created successfully:", result.data)

    return NextResponse.json({
      success: true,
      data: result.data,
    })
  } catch (error) {
    console.error("[v0] Error in PIX checkout API:", error)
    return NextResponse.json(
      {
        error: "Internal server error",
        success: false,
      },
      { status: 500 },
    )
  }
}
