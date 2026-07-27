import StaffView from '../components/manager/StaffView'
import { useSettings } from '../hooks/useSettings'

export default function ManagerPage() {
  const settings = useSettings()

  if (settings.loading) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-gray-100 gap-4">
        <img src="/logo.png" alt="Smoky Bubble" style={{ width: 72, height: 72, objectFit: 'contain' }} />
        <div className="flex gap-1.5">
          <span className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '0ms' }} />
          <span className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '150ms' }} />
          <span className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '300ms' }} />
        </div>
      </div>
    )
  }

  return <StaffView settings={settings} />
}
