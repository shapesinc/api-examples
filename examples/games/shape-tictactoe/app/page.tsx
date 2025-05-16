"use client";

import { useState, useEffect, useCallback, useRef } from 'react';
import { RefreshCcw } from 'lucide-react';
import styles from './styles/TicTacToe.module.css';

type GamePhase = "playing" | "win" | "tie";
type Difficulty = "normal" | "hard" | "extreme";
type ChatMessage = { sender: 'user' | 'ai'; text: string };
type Move = { player: 'X' | 'O'; index: number };

export default function Home() {
  const [board, setBoard] = useState<(string | number)[]>([0, 1, 2, 3, 4, 5, 6, 7, 8]);
  const [gamePhase, setGamePhase] = useState<GamePhase>("playing");
  const [gameStatus, setGameStatus] = useState<string>("Your turn (X)");
  const [isPlayerTurn, setIsPlayerTurn] = useState<boolean>(true);
  const [isAITurnProcessing, setIsAITurnProcessing] = useState<boolean>(false);
  const [isDarkMode, setIsDarkMode] = useState<boolean>(false);
  const [difficulty, setDifficulty] = useState<Difficulty>("hard");
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [userMessage, setUserMessage] = useState<string>('');
  const [moveHistory, setMoveHistory] = useState<Move[]>([]);
  const chatRef = useRef<HTMLDivElement>(null);

  const huPlayer = "X";
  const aiPlayer = "O";

  useEffect(() => {
    const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    setIsDarkMode(prefersDark);
    if (prefersDark) {
      document.documentElement.classList.add('dark');
    }
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDarkMode);
  }, [isDarkMode]);

  useEffect(() => {
    if (chatRef.current) {
      chatRef.current.scrollTop = chatRef.current.scrollHeight;
    }
  }, [chatMessages]);

  useEffect(() => {
    if (gamePhase === "playing" && !isPlayerTurn && !isAITurnProcessing) {
      triggerAIMove();
    }
  }, [gamePhase, isPlayerTurn, isAITurnProcessing]);

  const toggleTheme = () => setIsDarkMode(!isDarkMode);

  const initializeGame = useCallback(() => {
    const newBoard = [0, 1, 2, 3, 4, 5, 6, 7, 8];
    setBoard(newBoard);
    setGamePhase("playing");
    setGameStatus("Your turn (X)");
    setIsPlayerTurn(true);
    setIsAITurnProcessing(false);
    setChatMessages([]);
    setMoveHistory([]);
  }, []);

  const checkGameState = (newBoard: (string | number)[]) => {
    const winPatterns = [
      [0, 1, 2], [3, 4, 5], [6, 7, 8],
      [0, 3, 6], [1, 4, 7], [2, 5, 8],
      [0, 4, 8], [2, 4, 6],
    ];

    for (const pattern of winPatterns) {
      const [a, b, c] = pattern;
      if (newBoard[a] === newBoard[b] && newBoard[b] === newBoard[c] && typeof newBoard[a] === 'string') {
        return newBoard[a] === huPlayer ? "win" : "lose";
      }
    }

    if (!newBoard.some(cell => typeof cell === 'number')) {
      return "tie";
    }

    return "playing";
  };

  const minimax = (board: (string | number)[], player: string, isExtreme: boolean, depth = 0): { score: number; move: number | null } => {
    const validMoves = board
      .map((cell, i) => (typeof cell === 'number' ? i : null))
      .filter(i => i !== null) as number[];

    const winner = checkGameState(board);
    if (winner === 'win') return { score: player === huPlayer ? -10 + depth : 10 - depth, move: null };
    if (winner === 'tie') return { score: 0, move: null };
    if (validMoves.length === 0) return { score: 0, move: null };

    let bestScore = player === aiPlayer ? -Infinity : Infinity;
    let bestMove: number | null = validMoves[0];

    for (const move of validMoves) {
      const newBoard = [...board];
      newBoard[move] = player;
      const result = minimax(newBoard, player === aiPlayer ? huPlayer : aiPlayer, isExtreme, depth + 1);
      const score = result.score;

      if (player === aiPlayer) {
        if (score > bestScore) {
          bestScore = score;
          bestMove = move;
        }
      } else {
        if (score < bestScore) {
          bestScore = score;
          bestMove = move;
        }
      }
    }

    return { score: bestScore, move: bestMove };
  };

  const handleSquareClick = (index: number) => {
    if (!isPlayerTurn || gamePhase !== "playing" || isAITurnProcessing || typeof board[index] !== 'number') {
      return;
    }

    const newBoard = [...board];
    newBoard[index] = huPlayer;
    setBoard(newBoard);
    setMoveHistory(prev => [...prev, { player: huPlayer, index }]);

    const gameResult = checkGameState(newBoard);

    if (gameResult === "win") {
      setGamePhase("win");
      setGameStatus("You win!");
      setIsPlayerTurn(false);
    } else if (gameResult === "lose") {
      setGamePhase("win");
      setGameStatus("AI wins!");
      setIsPlayerTurn(false);
    } else if (gameResult === "tie") {
      setGamePhase("tie");
      setGameStatus("Game is a tie!");
      setIsPlayerTurn(false);
    } else {
      setGameStatus("AI's turn (O)");
      setIsPlayerTurn(false);
    }
  };

  const triggerAIMove = async () => {
    if (gamePhase !== "playing" || isPlayerTurn || isAITurnProcessing) {
      return;
    }
    setIsAITurnProcessing(true);
    setGameStatus("AI is thinking...");

    try {
      const response = await fetch('/api/shapes-move', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ board, difficulty, moveHistory }),
      });

      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(responseData.error || `API request failed with status ${response.status}`);
      }

      let { move: aiMove, chat } = responseData;

      if (typeof aiMove !== 'number' || aiMove < 0 || aiMove > 8 || typeof board[aiMove] !== 'number') {
        throw new Error('Invalid AI move received from server');
      }

      if (difficulty !== 'normal') {
        const expectedMove = minimax(board, aiPlayer, difficulty === 'extreme').move;
        if (expectedMove !== null && aiMove !== expectedMove) {
          aiMove = expectedMove;
        }
      }

      const newBoard = [...board];
      newBoard[aiMove] = aiPlayer;
      setBoard(newBoard);
      setMoveHistory(prev => [...prev, { player: aiPlayer, index: aiMove }]);

      if (chat) {
        setChatMessages(prev => [...prev, { sender: 'ai', text: chat }]);
      }

      const gameResult = checkGameState(newBoard);

      setIsPlayerTurn(true);
      setIsAITurnProcessing(false);

      if (gameResult === "win") {
        setGamePhase("win");
        setGameStatus("You win!");
      } else if (gameResult === "lose") {
        setGamePhase("win");
        setGameStatus("AI wins!");
      } else if (gameResult === "tie") {
        setGamePhase("tie");
        setGameStatus("Game is a tie!");
      } else {
        setGameStatus("Your turn (X)");
      }
    } catch (error) {
      const validMoves = board
        .map((cell, i) => (typeof cell === 'number' ? i : null))
        .filter(i => i !== null) as number[];
      if (validMoves.length > 0) {
        let randomMove;
        if (difficulty === 'normal') {
          const winMove = validMoves.find(i => {
            const testBoard = [...board];
            testBoard[i] = aiPlayer;
            return checkGameState(testBoard) === 'lose';
          });
          const blockMove = validMoves.find(i => {
            const testBoard = [...board];
            testBoard[i] = huPlayer;
            return checkGameState(testBoard) === 'win';
          });
          if (winMove !== undefined) randomMove = winMove;
          else if (blockMove !== undefined) randomMove = blockMove;
          else if (validMoves.includes(4)) randomMove = 4;
          else if (validMoves.some(i => [0, 2, 6, 8].includes(i))) {
            const corners = validMoves.filter(i => [0, 2, 6, 8].includes(i));
            randomMove = corners[Math.floor(Math.random() * corners.length)];
          } else {
            randomMove = validMoves[Math.floor(Math.random() * validMoves.length)];
          }
        } else {
          randomMove = minimax(board, aiPlayer, difficulty === 'extreme').move;
        }

        if (randomMove === null) {
          randomMove = validMoves[Math.floor(Math.random() * validMoves.length)];
        }

        const newBoard = [...board];
        newBoard[randomMove] = aiPlayer;
        setBoard(newBoard);
        setMoveHistory(prev => [...prev, { player: aiPlayer, index: randomMove }]);

        setChatMessages(prev => [...prev, { sender: 'ai', text: 'Even my backup move is better than yours!' }]);

        const gameResult = checkGameState(newBoard);

        setIsPlayerTurn(true);
        setIsAITurnProcessing(false);

        if (gameResult === "win") {
          setGamePhase("win");
          setGameStatus("You win!");
        } else if (gameResult === "lose") {
          setGamePhase("win");
          setGameStatus("AI wins!");
        } else if (gameResult === "tie") {
          setGamePhase("tie");
          setGameStatus("Game is a tie!");
        } else {
          setGameStatus("Your turn (X)");
        }
      } else {
        setIsAITurnProcessing(false);
        setGameStatus(`Error during AI move: ${error.message}. No valid moves available.`);
        setIsPlayerTurn(true);
      }
    }
  };

  const handleSendMessage = async () => {
    if (!userMessage.trim()) return;

    setChatMessages(prev => [...prev, { sender: 'user', text: userMessage }]);
    const messageToSend = userMessage;
    setUserMessage('');

    try {
      const response = await fetch('/api/shapes-move', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ board, difficulty, userMessage: messageToSend, moveHistory }),
      });

      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(responseData.error || `Chat API request failed with status ${response.status}`);
      }

      const { chat } = responseData;
      if (chat) {
        setChatMessages(prev => [...prev, { sender: 'ai', text: chat }]);
      }
    } catch (error) {
      setChatMessages(prev => [...prev, { sender: 'ai', text: 'Error responding, but I’m still winning!' }]);
    }
  };

  return (
    <div className={`${styles.container} ${isDarkMode ? styles.dark : ''}`}>
      <header className={styles.header}>
        <h1>Tic-Tac-Toe with AI</h1>
      </header>
      <div className={styles.gameWrapper}>
        <div className={styles.difficultySelector}>
          <label htmlFor="difficulty">Difficulty: </label>
          <select
            id="difficulty"
            value={difficulty}
            onChange={e => setDifficulty(e.target.value as Difficulty)}
            disabled={gamePhase === 'playing' && !isPlayerTurn}
          >
            <option value="normal">Normal</option>
            <option value="hard">Hard</option>
            <option value="extreme">Extreme</option>
          </select>
        </div>
        <div className={styles.board}>
          {board.map((cell, index) => (
            <button
              key={index}
              onClick={() => handleSquareClick(index)}
              className={`${styles.cell} ${
                typeof cell === 'number' ? styles.cellEmpty : styles.cellFilled
              } ${cell === 'X' ? styles.cellX : cell === 'O' ? styles.cellO : ''}`}
              disabled={typeof cell !== 'number' || gamePhase !== 'playing' || !isPlayerTurn || isAITurnProcessing}
            >
              {typeof cell === 'string' ? cell : ''}
            </button>
          ))}
        </div>
        <div className={styles.chatbox}>
          <div className={styles.chatMessages} ref={chatRef}>
            {chatMessages.map((msg, index) => (
              <div
                key={index}
                className={`${styles.chatMessage} ${msg.sender === 'user' ? styles.userMessage : styles.aiMessage}`}
              >
                <strong>{msg.sender === 'user' ? 'You' : 'AI'}:</strong> {msg.text}
              </div>
            ))}
          </div>
          <div className={styles.chatInput}>
            <input
              type="text"
              value={userMessage}
              onChange={e => setUserMessage(e.target.value)}
              onKeyPress={e => e.key === 'Enter' && handleSendMessage()}
              placeholder="Type a message..."
              disabled={isAITurnProcessing}
            />
            <button onClick={handleSendMessage} disabled={isAITurnProcessing || !userMessage.trim()}>
              Send
            </button>
          </div>
        </div>
        <div className={styles.controls}>
          <p
            className={`${styles.status} ${
              gamePhase === 'win'
                ? gameStatus.includes('You win')
                  ? styles.statusWin
                : styles.statusLose
              : gamePhase === 'tie'
              ? styles.statusTie
              : styles.statusDefault
            }`}
          >
            {gameStatus}
          </p>
          <div className={styles.buttonGroup}>
            <button onClick={initializeGame} className={`${styles.btn} ${styles.btnPrimary}`}>
              <RefreshCcw size={20} className={styles.btnIcon} />
              New Game
            </button>
            <button
              onClick={toggleTheme}
              className={`${styles.btn} ${styles.btnSecondary}`}
            >
              {isDarkMode ? 'Light Mode' : 'Dark Mode'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
