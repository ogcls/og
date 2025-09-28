export interface UTMParams {
  utm_source?: string
  utm_medium?: string
  utm_campaign?: string
  utm_content?: string
  utm_term?: string
}

export class UTMManager {
  private static instance: UTMManager
  private utmParams: UTMParams = {}

  private constructor() {
    this.initializeUTMParams()
  }

  public static getInstance(): UTMManager {
    if (!UTMManager.instance) {
      UTMManager.instance = new UTMManager()
    }
    return UTMManager.instance
  }

  private initializeUTMParams(): void {
    if (typeof window === "undefined") return

    // Get UTM params from URL
    const urlParams = new URLSearchParams(window.location.search)
    const utmFromUrl: UTMParams = {
      utm_source: urlParams.get("utm_source") || undefined,
      utm_medium: urlParams.get("utm_medium") || undefined,
      utm_campaign: urlParams.get("utm_campaign") || undefined,
      utm_content: urlParams.get("utm_content") || undefined,
      utm_term: urlParams.get("utm_term") || undefined,
    }

    // Get UTM params from localStorage (fallback)
    const storedUTM = localStorage.getItem("utm_params")
    const utmFromStorage: UTMParams = storedUTM ? JSON.parse(storedUTM) : {}

    // Merge URL params with stored params (URL takes priority)
    this.utmParams = {
      ...utmFromStorage,
      ...Object.fromEntries(Object.entries(utmFromUrl).filter(([_, value]) => value !== undefined)),
    }

    // Store merged params
    this.saveUTMParams()
  }

  private saveUTMParams(): void {
    if (typeof window === "undefined") return
    localStorage.setItem("utm_params", JSON.stringify(this.utmParams))
  }

  public getUTMParams(): UTMParams {
    return { ...this.utmParams }
  }

  public getUTMString(): string {
    const params = new URLSearchParams()
    Object.entries(this.utmParams).forEach(([key, value]) => {
      if (value) params.set(key, value)
    })
    return params.toString()
  }

  public appendUTMToUrl(url: string): string {
    const utmString = this.getUTMString()
    if (!utmString) return url

    const separator = url.includes("?") ? "&" : "?"
    return `${url}${separator}${utmString}`
  }

  public navigateWithUTM(url: string): void {
    const urlWithUTM = this.appendUTMToUrl(url)
    window.location.href = urlWithUTM
  }
}

// Export convenience functions
export const getUTMParams = (): UTMParams => UTMManager.getInstance().getUTMParams()
export const navigateWithUTM = (url: string): void => UTMManager.getInstance().navigateWithUTM(url)
export const appendUTMToUrl = (url: string): string => UTMManager.getInstance().appendUTMToUrl(url)
