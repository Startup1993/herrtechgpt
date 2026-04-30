import { getAppSettings } from '@/lib/app-settings'
import SettingsManager from './SettingsManager'

export const dynamic = 'force-dynamic'

export default async function AdminMonetizationSettingsPage() {
  const settings = await getAppSettings()

  return (
    <div className="p-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground mb-2">Modus &amp; Defaults</h1>
        <p className="text-muted max-w-2xl">
          Master-Switch für das Abo-System und Fallback-Werte für die Credit-Logik.
          Hier entscheidest du, ob Plan S/M/L im Frontend buchbar sind oder ob die
          Plattform im &bdquo;Community-only&ldquo;-Modus läuft.
        </p>
      </div>

      <SettingsManager initial={settings} />
    </div>
  )
}
