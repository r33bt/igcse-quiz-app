import { Card } from "@/components/ui/card"
import { cn, colorVariants } from "@/lib/design-utils"

interface HealthCheckCardProps {
  title: string
  status: boolean
  successMessage: string
  errorMessage: string
  className?: string
}

export function HealthCheckCard({
  title,
  status,
  successMessage,
  errorMessage,
  className
}: HealthCheckCardProps) {
  const variant = status ? 'success' : 'error'
  const icon = status ? '✅' : '❌'
  const message = status ? successMessage : errorMessage

  return (
    <Card className={cn("p-4 border", colorVariants[variant], className)}>
      <div className="flex items-center justify-between">
        <span className="font-medium">{title}</span>
        <span className="text-2xl">{icon}</span>
      </div>
      <p className="text-sm mt-1">{message}</p>
    </Card>
  )
}
