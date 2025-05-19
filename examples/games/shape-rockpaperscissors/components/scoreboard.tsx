import { cn } from "@/lib/utils"

type ScoreboardProps = {
  userScore: number
  aiScore: number
  draws: number
}

export function Scoreboard({ userScore, aiScore, draws }: ScoreboardProps) {
  return (
    <div className="flex justify-center gap-3 sm:gap-4 md:gap-8 p-3 sm:p-4 bg-secondary/30 backdrop-blur-sm rounded-xl">
      <div className="flex flex-col items-center">
        <span className="text-xs sm:text-sm font-medium text-muted-foreground">You</span>
        <span className={cn("text-xl sm:text-2xl md:text-3xl font-bold", userScore > aiScore ? "text-green-500" : "")}>
          {userScore}
        </span>
      </div>

      <div className="flex flex-col items-center">
        <span className="text-xs sm:text-sm font-medium text-muted-foreground">Draws</span>
        <span className="text-xl sm:text-2xl md:text-3xl font-bold text-yellow-500">{draws}</span>
      </div>

      <div className="flex flex-col items-center">
        <span className="text-xs sm:text-sm font-medium text-muted-foreground">AI</span>
        <span className={cn("text-xl sm:text-2xl md:text-3xl font-bold", aiScore > userScore ? "text-red-500" : "")}>
          {aiScore}
        </span>
      </div>
    </div>
  )
}
