import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    console.log("[v0] Lira Pay API Request:", JSON.stringify(body, null, 2))

    const apiSecret =
      "sk_8b52ca56c36e31150c6f647d5ce3e492a67f0ceb588a06e7345843a7019264cd829675a3e8366ff9554007cb88f6548aaffe8afdaadcc3bf13e765278e2cb780"
    console.log("[v0] Using API Secret:", apiSecret ? "Present" : "Missing")

    const response = await fetch("https://api.lirapaybr.com/v1/transactions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "api-secret": apiSecret,
      },
      body: JSON.stringify(body),
    })

    const result = await response.json()

    console.log("[v0] Lira Pay API Response Status:", response.status)
    console.log("[v0] Lira Pay API Response:", JSON.stringify(result, null, 2))

    if (!response.ok) {
      console.error("[v0] Lira Pay API Error:", {
        status: response.status,
        statusText: response.statusText,
        result,
      })

      return NextResponse.json(
        {
          hasError: true,
          message: result.message || result.error || "Erro ao criar transação",
          details: result,
        },
        { status: response.status },
      )
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error("[v0] Erro na API Lira Pay:", error)
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
