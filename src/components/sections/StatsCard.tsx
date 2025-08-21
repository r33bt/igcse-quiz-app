import { Card } from "@/components/ui/card"
import { cn, statVariants } from "@/lib/design-utils"

interface StatsCardProps {
  title: string
  value: string | number
  icon?: string
  variant?: keyof typeof statVariants
  subtitle?: string
  className?: string
}

export function StatsCard({ 
  title, 
  value, 
  icon, 
  variant = "blue", 
  subtitle,
  className 
}: StatsCardProps) {
  return (
    <Card className={cn("p-6", className)}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className={cn("text-2xl font-bold", statVariants[variant])}>
            {value}
          </p>
          {subtitle && <p className="text-xs text-gray-500 mt-1">{subtitle}</p>}
        </div>
        {icon && <span className="text-3xl">{icon}</span>}
      </div>
    </Card>
  )
}
