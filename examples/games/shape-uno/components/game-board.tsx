"use client"

import { motion } from "framer-motion"
import { useTheme } from "next-themes"
import type { GameState, PlayerColor } from "@/lib/game-types"
import { isValidMove } from "@/lib/game-types"

interface GameBoardProps {
  gameState: GameState
  onPawnSelect: (pawnId: number) => void
}

export default function GameBoard({ gameState, onPawnSelect }: GameBoardProps) {
  const { theme } = useTheme()
  const isDark = theme === "dark"
  const currentPlayer = gameState.players[gameState.currentPlayer]
  const isHumanTurn = currentPlayer.isHuman && !gameState.isRolling

  // Calculate positions for pawns on the board
  const getPawnPosition = (playerIndex: number, pawnId: number) => {
    const player = gameState.players[playerIndex]
    const pawn = player.pawns.find((p) => p.id === pawnId)

    if (!pawn) return { top: 0, left: 0 }

    // Home positions (starting area)
    if (pawn.isHome) {
      const homePositions = {
        red: [
          { top: "15%", left: "15%" },
          { top: "15%", left: "25%" },
          { top: "25%", left: "15%" },
          { top: "25%", left: "25%" },
        ],
        green: [
          { top: "15%", left: "75%" },
          { top: "15%", left: "85%" },
          { top: "25%", left: "75%" },
          { top: "25%", left: "85%" },
        ],
        yellow: [
          { top: "75%", left: "75%" },
          { top: "75%", left: "85%" },
          { top: "85%", left: "75%" },
          { top: "85%", left: "85%" },
        ],
        blue: [
          { top: "75%", left: "15%" },
          { top: "75%", left: "25%" },
          { top: "85%", left: "15%" },
          { top: "85%", left: "25%" },
        ],
      }

      return homePositions[player.color as PlayerColor][pawnId]
    }

    // Finished positions (center)
    if (pawn.isFinished) {
      const finishPositions = {
        red: [
          { top: "42%", left: "42%" },
          { top: "42%", left: "46%" },
          { top: "46%", left: "42%" },
          { top: "46%", left: "46%" },
        ],
        green: [
          { top: "42%", left: "54%" },
          { top: "42%", left: "58%" },
          { top: "46%", left: "54%" },
          { top: "46%", left: "58%" },
        ],
        yellow: [
          { top: "54%", left: "54%" },
          { top: "54%", left: "58%" },
          { top: "58%", left: "54%" },
          { top: "58%", left: "58%" },
        ],
        blue: [
          { top: "54%", left: "42%" },
          { top: "54%", left: "46%" },
          { top: "58%", left: "42%" },
          { top: "58%", left: "46%" },
        ],
      }

      return finishPositions[player.color as PlayerColor][pawnId]
    }

    // Home run positions (final straight)
    if (pawn.position >= 52) {
      const homeRunStep = pawn.position - 52 // 0-5
      const homeRunPositions = {
        red: [
          { top: "50%", left: "40%" },
          { top: "50%", left: "35%" },
          { top: "50%", left: "30%" },
          { top: "50%", left: "25%" },
          { top: "50%", left: "20%" },
          { top: "50%", left: "15%" },
        ],
        green: [
          { top: "40%", left: "50%" },
          { top: "35%", left: "50%" },
          { top: "30%", left: "50%" },
          { top: "25%", left: "50%" },
          { top: "20%", left: "50%" },
          { top: "15%", left: "50%" },
        ],
        yellow: [
          { top: "50%", left: "60%" },
          { top: "50%", left: "65%" },
          { top: "50%", left: "70%" },
          { top: "50%", left: "75%" },
          { top: "50%", left: "80%" },
          { top: "50%", left: "85%" },
        ],
        blue: [
          { top: "60%", left: "50%" },
          { top: "65%", left: "50%" },
          { top: "70%", left: "50%" },
          { top: "75%", left: "50%" },
          { top: "80%", left: "50%" },
          { top: "85%", left: "50%" },
        ],
      }

      return homeRunPositions[player.color as PlayerColor][homeRunStep]
    }

    // Main track positions
    // Convert local position to global position
    const globalPosition = (pawn.position + player.startPosition) % 52

    // Define the main track coordinates
    const trackPositions = [
      // Red start (bottom middle) and going counterclockwise
      { top: "50%", left: "10%" }, // 0
      { top: "60%", left: "10%" },
      { top: "70%", left: "10%" },
      { top: "80%", left: "10%" },
      { top: "90%", left: "10%" },
      { top: "90%", left: "20%" },
      { top: "90%", left: "30%" }, // 6
      { top: "90%", left: "40%" },
      { top: "90%", left: "50%" }, // 8 - Blue start
      { top: "90%", left: "60%" },
      { top: "90%", left: "70%" },
      { top: "90%", left: "80%" },
      { top: "90%", left: "90%" },
      { top: "80%", left: "90%" }, // 13
      { top: "70%", left: "90%" },
      { top: "60%", left: "90%" },
      { top: "50%", left: "90%" },
      { top: "40%", left: "90%" },
      { top: "30%", left: "90%" },
      { top: "20%", left: "90%" }, // 19
      { top: "10%", left: "90%" },
      { top: "10%", left: "80%" },
      { top: "10%", left: "70%" },
      { top: "10%", left: "60%" },
      { top: "10%", left: "50%" }, // 24 - Green start
      { top: "10%", left: "40%" },
      { top: "10%", left: "30%" }, // 26
      { top: "10%", left: "20%" },
      { top: "10%", left: "10%" },
      { top: "20%", left: "10%" },
      { top: "30%", left: "10%" },
      { top: "40%", left: "10%" }, // 31
      // Repeat for clarity
      { top: "50%", left: "10%" }, // 32
      { top: "60%", left: "10%" },
      { top: "70%", left: "10%" },
      { top: "80%", left: "10%" },
      { top: "90%", left: "10%" },
      { top: "90%", left: "20%" },
      { top: "90%", left: "30%" }, // 38
      { top: "90%", left: "40%" },
      { top: "90%", left: "50%" }, // 40 - Blue start
      { top: "90%", left: "60%" },
      { top: "90%", left: "70%" },
      { top: "90%", left: "80%" },
      { top: "90%", left: "90%" },
      { top: "80%", left: "90%" }, // 45
      { top: "70%", left: "90%" },
      { top: "60%", left: "90%" },
      { top: "50%", left: "90%" },
      { top: "40%", left: "90%" },
      { top: "30%", left: "90%" },
      { top: "20%", left: "90%" }, // 51
    ]

    return trackPositions[globalPosition]
  }

  // Check if a pawn can be moved with the current dice value
  const canMovePawn = (playerIndex: number, pawnId: number) => {
    if (playerIndex !== gameState.currentPlayer) return false
    if (!gameState.players[playerIndex].isHuman) return false
    if (gameState.isRolling) return false

    const pawn = gameState.players[playerIndex].pawns.find((p) => p.id === pawnId)
    if (!pawn) return false

    return isValidMove(pawn, gameState.diceValue)
  }

  return (
    <div className="relative w-full aspect-square rounded-xl overflow-hidden bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900">
      {/* Board grid lines */}
      <div className="absolute inset-0 grid grid-cols-15 grid-rows-15">
        {Array.from({ length: 15 * 15 }).map((_, index) => (
          <div key={index} className="border border-slate-300/30 dark:border-slate-700/30" />
        ))}
      </div>

      {/* Home areas */}
      <div className="absolute top-[5%] left-[5%] w-[30%] h-[30%] rounded-xl bg-red-100 dark:bg-red-900/30 border-2 border-red-500"></div>
      <div className="absolute top-[5%] right-[5%] w-[30%] h-[30%] rounded-xl bg-green-100 dark:bg-green-900/30 border-2 border-green-500"></div>
      <div className="absolute bottom-[5%] right-[5%] w-[30%] h-[30%] rounded-xl bg-yellow-100 dark:bg-yellow-900/30 border-2 border-yellow-500"></div>
      <div className="absolute bottom-[5%] left-[5%] w-[30%] h-[30%] rounded-xl bg-blue-100 dark:bg-blue-900/30 border-2 border-blue-500"></div>

      {/* Center finish area */}
      <div className="absolute top-[40%] left-[40%] w-[20%] h-[20%] rounded-xl bg-gradient-to-br from-purple-500/20 to-cyan-500/20 border-2 border-purple-500/50 dark:border-cyan-500/50"></div>

      {/* Main tracks */}
      {/* Horizontal tracks */}
      <div className="absolute top-[50%] left-[5%] w-[35%] h-[10%] bg-slate-300/50 dark:bg-slate-600/50"></div>
      <div className="absolute top-[10%] left-[10%] w-[35%] h-[10%] bg-slate-300/50 dark:bg-slate-600/50"></div>
      <div className="absolute top-[50%] right-[5%] w-[35%] h-[10%] bg-slate-300/50 dark:bg-slate-600/50"></div>
      <div className="absolute bottom-[10%] right-[10%] w-[35%] h-[10%] bg-slate-300/50 dark:bg-slate-600/50"></div>

      {/* Vertical tracks */}
      <div className="absolute top-[10%] left-[10%] w-[10%] h-[35%] bg-slate-300/50 dark:bg-slate-600/50"></div>
      <div className="absolute top-[10%] right-[10%] w-[10%] h-[35%] bg-slate-300/50 dark:bg-slate-600/50"></div>
      <div className="absolute bottom-[10%] right-[10%] w-[10%] h-[35%] bg-slate-300/50 dark:bg-slate-600/50"></div>
      <div className="absolute bottom-[10%] left-[10%] w-[10%] h-[35%] bg-slate-300/50 dark:bg-slate-600/50"></div>

      {/* Home runs */}
      <div className="absolute top-[50%] left-[40%] w-[20%] h-[10%] bg-gradient-to-r from-red-500/30 to-transparent"></div>
      <div className="absolute top-[40%] left-[50%] w-[10%] h-[20%] bg-gradient-to-b from-green-500/30 to-transparent"></div>
      <div className="absolute top-[50%] left-[40%] w-[20%] h-[10%] bg-gradient-to-l from-yellow-500/30 to-transparent"></div>
      <div className="absolute top-[40%] left-[50%] w-[10%] h-[20%] bg-gradient-to-t from-blue-500/30 to-transparent"></div>

      {/* Safe spots */}
      <div className="absolute top-[50%] left-[10%] w-[8%] h-[8%] rounded-full bg-white/30 dark:bg-white/10 border border-white/50"></div>
      <div className="absolute top-[10%] left-[50%] w-[8%] h-[8%] rounded-full bg-white/30 dark:bg-white/10 border border-white/50"></div>
      <div className="absolute top-[50%] right-[10%] w-[8%] h-[8%] rounded-full bg-white/30 dark:bg-white/10 border border-white/50"></div>
      <div className="absolute bottom-[10%] left-[50%] w-[8%] h-[8%] rounded-full bg-white/30 dark:bg-white/10 border border-white/50"></div>

      {/* Pawns */}
      {gameState.players.map((player, playerIndex) =>
        player.pawns.map((pawn) => {
          const position = getPawnPosition(playerIndex, pawn.id)
          const isMovable = canMovePawn(playerIndex, pawn.id)

          return (
            <motion.div
              key={`${playerIndex}-${pawn.id}`}
              className={`absolute w-[8%] h-[8%] rounded-full cursor-pointer 
                ${isMovable ? "hover:ring-4 hover:ring-white hover:scale-110" : ""}
                ${pawn.isFinished ? "opacity-70" : "opacity-100"}
              `}
              style={{
                top: position.top,
                left: position.left,
                backgroundColor: player.color,
                boxShadow: isDark ? "0 0 10px rgba(255,255,255,0.3)" : "0 0 10px rgba(0,0,0,0.3)",
                zIndex: isMovable ? 10 : 1,
                border: isMovable ? "2px solid white" : "none",
              }}
              initial={{ scale: 0 }}
              animate={{
                scale: 1,
                y: pawn.isFinished ? -5 : 0,
              }}
              transition={{
                type: "spring",
                stiffness: 300,
                damping: 20,
              }}
              onClick={() => {
                if (isMovable) {
                  onPawnSelect(pawn.id)
                }
              }}
              whileTap={{ scale: 0.95 }}
            >
              <div className="absolute inset-2 rounded-full bg-white/30 dark:bg-black/30"></div>
              <div className="absolute inset-0 flex items-center justify-center text-white font-bold text-xs">
                {pawn.id + 1}
              </div>
              {isMovable && (
                <motion.div
                  className="absolute -inset-2 rounded-full border-2 border-white/50"
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ repeat: Number.POSITIVE_INFINITY, duration: 1.5 }}
                />
              )}
            </motion.div>
          )
        }),
      )}

      {/* Futuristic elements */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Corner glows */}
        <div className="absolute top-0 left-0 w-20 h-20 bg-gradient-to-br from-red-500/30 to-transparent rounded-br-full"></div>
        <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-bl from-green-500/30 to-transparent rounded-bl-full"></div>
        <div className="absolute bottom-0 right-0 w-20 h-20 bg-gradient-to-tl from-yellow-500/30 to-transparent rounded-tl-full"></div>
        <div className="absolute bottom-0 left-0 w-20 h-20 bg-gradient-to-tr from-blue-500/30 to-transparent rounded-tr-full"></div>

        {/* Center glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 bg-gradient-to-br from-purple-500/20 to-cyan-500/20 rounded-full blur-xl"></div>

        {/* Grid lines */}
        <div className="absolute inset-0 bg-[radial-gradient(circle,transparent_1px,rgba(255,255,255,0.03)_1px)] bg-[length:20px_20px]"></div>
      </div>
    </div>
  )
}
