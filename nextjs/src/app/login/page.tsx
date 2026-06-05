import { getSiteSettings } from "@/lib/ghost"
import { LoginForm } from "./LoginForm"

export default async function LoginPage() {
  const settings = await getSiteSettings()
  const siteTitle = settings?.title || "GünYayla"

  return <LoginForm siteTitle={siteTitle} />
}
