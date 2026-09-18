import type { ButtonHTMLAttributes } from 'react'

export function PrimaryButton({ children, className = '', type = 'button', ...props }: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button type={type} className={`primary-button ${className}`} {...props}>
      <span>{children}</span>
      <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M5 12h14m-6-6 6 6-6 6" />
      </svg>
    </button>
  )
}
