import UnoGame from "@/components/uno-game"
import { ThemeProvider } from "@/components/theme-provider"

export default function Home() {
  return (
    <ThemeProvider defaultTheme="system" storageKey="uno-theme">
      <main className="min-h-screen flex flex-col items-center justify-center p-4 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 transition-colors duration-300">
        <h1 className="text-4xl md:text-5xl font-bold mb-8 text-center bg-clip-text text-transparent bg-gradient-to-r from-purple-500 to-cyan-500">
          SHAPE UNO
        </h1>
        <UnoGame />
      </main>
    </ThemeProvider>
  )
}
