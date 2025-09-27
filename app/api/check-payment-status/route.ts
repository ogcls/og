import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const transactionId = searchParams.get("id")

    if (!transactionId) {
      return NextResponse.json({ error: "Transaction ID required" }, { status: 400 })
    }

    // Here you would typically check the payment status with Lira Pay API
    // For now, we'll simulate a successful payment after some time
    // In production, you should call Lira Pay's API to get the real status

    const response = await fetch(`https://api.lirapaybr.com/v1/transactions/${transactionId}`, {
      headers: {
        "api-secret":
          process.env.PIXUP_CLIENT_SECRET ||
          "sk_8b52ca56c36e31150c6f647d5ce3e492a67f0ceb588a06e7345843a7019264cd829675a3e8366ff9554007cb88f6548aaffe8afdaadcc3bf13e765278e2cb780",
        "Content-Type": "application/json",
      },
    })

    const data = await response.json()

    return NextResponse.json({
      status: data.status,
      id: transactionId,
    })
  } catch (error) {
    console.error("Error checking payment status:", error)
    return NextResponse.json({ error: "Error checking payment status" }, { status: 500 })
  }
}
