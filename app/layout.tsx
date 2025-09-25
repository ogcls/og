import type React from "react"
import type { Metadata } from "next"
import { Montserrat } from "next/font/google"
import { Open_Sans } from "next/font/google"
import Script from "next/script"
import "./globals.css"

const montserrat = Montserrat({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-montserrat",
  weight: ["400", "600", "700", "900"],
})

const openSans = Open_Sans({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-open-sans",
  weight: ["400", "500", "600"],
})

export const metadata: Metadata = {
  title: "Meta Research - Ganhe por Participar",
  description: "Participe da pesquisa da Meta e seja remunerado por cada resposta. Cadastre-se agora!",
  generator: "Meta Research",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="pt-BR" className={`${montserrat.variable} ${openSans.variable} antialiased`}>
      <body className="font-sans">
        <Script
          id="utmify-pixel-config"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              window.pixelId = "68cb44e03b229ea4a4f68cf0";
            `,
          }}
        />
        <Script src="https://cdn.utmify.com.br/scripts/pixel/pixel.js" strategy="afterInteractive" async defer />
        <Script
          src="https://cdn.utmify.com.br/scripts/utms/latest.js"
          data-utmify-prevent-xcod-sck=""
          data-utmify-prevent-subids=""
          strategy="afterInteractive"
        />
        {children}
      </body>
    </html>
  )
}
