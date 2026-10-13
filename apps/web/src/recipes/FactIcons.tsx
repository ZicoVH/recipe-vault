/** Small outline icons for the recipe facts. Decorative: the text names them. */
type IconProps = { className?: string }

function Icon({
  className,
  children,
}: IconProps & { children: React.ReactNode }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 20 20"
      width="16"
      height="16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      {children}
    </svg>
  )
}

export function ServingsIcon({ className }: IconProps) {
  return (
    <Icon className={className}>
      <circle cx="10" cy="6.5" r="3" />
      <path d="M4 17c0-3.3 2.7-5.5 6-5.5s6 2.2 6 5.5" />
    </Icon>
  )
}

export function PrepIcon({ className }: IconProps) {
  return (
    <Icon className={className}>
      <circle cx="10" cy="10.5" r="6.5" />
      <path d="M10 6.5v4l2.5 1.5" />
    </Icon>
  )
}

export function CookIcon({ className }: IconProps) {
  return (
    <Icon className={className}>
      <path d="M10 2.5c.5 3-3.5 4.5-3.5 8.2a3.5 3.5 0 0 0 7 0c0-1.5-.8-2.4-1.5-3.2-.3 1-.9 1.6-1.6 1.6.5-2.4.3-4.8-.4-6.6Z" />
      <path d="M5.5 17.5h9" />
    </Icon>
  )
}
