export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-dvh items-center justify-center p-4 bg-gray-50 dark:bg-gray-950">
      <div className="w-full max-w-sm rounded-2xl bg-white dark:bg-gray-900 p-8 shadow-lg">
        {children}
      </div>
    </div>
  )
}
