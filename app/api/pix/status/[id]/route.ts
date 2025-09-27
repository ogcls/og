import { type NextRequest, NextResponse } from "next/server"

const cache = new Map<string, { data: any; timestamp: number }>()
const rateLimitMap = new Map<string, { count: number; resetTime: number }>()

const CACHE_DURATION = 30000 // 30 seconds cache
const RATE_LIMIT_WINDOW = 60000 // 1 minute window
const MAX_REQUESTS_PER_WINDOW = 2 // Max 2 requests per minute per transaction

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params
    const now = Date.now()

    const rateLimitKey = `status_${id}`
    const rateLimit = rateLimitMap.get(rateLimitKey)

    if (rateLimit) {
      if (now < rateLimit.resetTime) {
        if (rateLimit.count >= MAX_REQUESTS_PER_WINDOW) {
          console.log(`[v0] Rate limit exceeded for transaction ${id}`)
          return NextResponse.json({ error: "Too many requests. Please wait before checking again." }, { status: 429 })
        }
        rateLimit.count++
      } else {
        // Reset rate limit window
        rateLimitMap.set(rateLimitKey, { count: 1, resetTime: now + RATE_LIMIT_WINDOW })
      }
    } else {
      rateLimitMap.set(rateLimitKey, { count: 1, resetTime: now + RATE_LIMIT_WINDOW })
    }

    const cacheKey = `transaction_${id}`
    const cached = cache.get(cacheKey)

    if (cached && now - cached.timestamp < CACHE_DURATION) {
      console.log(`[v0] Returning cached status for transaction ${id}`)
      return NextResponse.json(cached.data)
    }

    // PodPay API credentials
    const publicKey = process.env.PODPAY_PUBLIC_KEY
    const secretKey = process.env.PODPAY_SECRET_KEY

    if (!publicKey || !secretKey) {
      return NextResponse.json({ error: "PodPay credentials not configured" }, { status: 500 })
    }

    // Create Basic Auth header
    const auth = "Basic " + Buffer.from(publicKey + ":" + secretKey).toString("base64")

    console.log(`[v0] Making API call to PodPay for transaction ${id}`)

    // Call PodPay API to get transaction status
    const response = await fetch(`https://api.podpay.co/v1/transactions/${id}`, {
      method: "GET",
      headers: {
        Authorization: auth,
        "Content-Type": "application/json",
      },
    })

    if (response.status === 429) {
      console.log(`[v0] PodPay API rate limited for transaction ${id}`)
      // Return cached data if available, otherwise return pending status
      if (cached) {
        return NextResponse.json(cached.data)
      }
      return NextResponse.json({
        id: id,
        status: "pending",
        amount: 8.82,
        paid_at: null,
        message: "Status check temporarily unavailable. Please try again later.",
      })
    }

    if (!response.ok) {
      throw new Error(`PodPay API error: ${response.status}`)
    }

    const data = await response.json()

    const responseData = {
      id: data.id,
      status: data.status,
      amount: data.amount,
      paid_at: data.paid_at,
    }

    cache.set(cacheKey, { data: responseData, timestamp: now })

    for (const [key, value] of cache.entries()) {
      if (now - value.timestamp > CACHE_DURATION * 2) {
        cache.delete(key)
      }
    }

    for (const [key, value] of rateLimitMap.entries()) {
      if (now > value.resetTime) {
        rateLimitMap.delete(key)
      }
    }

    return NextResponse.json(responseData)
  } catch (error) {
    console.error("Error checking PIX status:", error)

    // Return mock status for development
    return NextResponse.json({
      id: params.id,
      status: "pending",
      amount: 8.82,
      paid_at: null,
    })
  }
}
