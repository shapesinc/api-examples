"use client";

import React, { useState, useEffect, useRef } from "react";
import { Chessboard } from "react-chessboard";
import { Chess } from "chess.js";
import "../styles/ChessGame.css";

export default function ChessGame() {
  const [game, setGame] = useState(new Chess());
  const [fen, setFen] = useState(game.fen());
  const [gameStatus, setGameStatus] = useState("Your turn (White)");
  const [isBotThinking, setIsBotThinking] = useState(false);
  const [moveHistory, setMoveHistory] = useState([]);
  const [lastBotMove, setLastBotMove] = useState(null);
  const [difficulty, setDifficulty] = useState("medium");
  const [showPromotionModal, setShowPromotionModal] = useState(false);
  const [pendingMove, setPendingMove] = useState(null);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState("");
  const undoRef = useRef(null);
  const chatContainerRef = useRef(null);

  function makeMove(move) {
    try {
      console.log("Attempting move:", move, "Current FEN:", game.fen());
      if (!move.from || !move.to || !/^[a-h][1-8]$/.test(move.from) || !/^[a-h][1-8]$/.test(move.to)) {
        console.error("Invalid move format:", move);
        return false;
      }
      if (move.promotion && !["q", "r", "b", "n"].includes(move.promotion)) {
        console.error("Invalid promotion piece:", move.promotion);
        return false;
      }

      const gameCopy = new Chess(game.fen());
      const legalMoves = gameCopy.moves({ square: move.from, verbose: true });
      console.log("Legal moves from", move.from, ":", legalMoves);

      const isLegalMove = legalMoves.some(
        (m) => m.from === move.from && m.to === move.to && (!move.promotion || m.promotion === move.promotion)
      );
      if (!isLegalMove) {
        console.error("Move not legal:", move, "Legal moves:", legalMoves);
        return false;
      }

      const result = gameCopy.move(move);
      if (result) {
        console.log("Move successful:", result, "New FEN:", gameCopy.fen());
        setGame(gameCopy);
        setFen(gameCopy.fen());
        setMoveHistory(gameCopy.history());
        updateGameStatus(gameCopy);
        undoRef.current = { fen: game.fen(), move };
        if (!gameCopy.isGameOver()) {
          setIsBotThinking(true);
          makeBotMove(gameCopy);
        }
        return true;
      } else {
        console.error("chess.js rejected move:", move, "Legal moves:", legalMoves);
        return false;
      }
    } catch (error) {
      console.error("Error processing move:", error.message, move, "FEN:", game.fen());
      return false;
    }
  }

  function updateGameStatus(game) {
    if (game.isCheckmate()) {
      setGameStatus(`Checkmate! ${game.turn() === "w" ? "Black" : "White"} wins!`);
    } else if (game.isStalemate()) {
      setGameStatus("Stalemate! Game is a draw.");
    } else if (game.isDraw()) {
      setGameStatus("Draw!");
    } else {
      setGameStatus("Your turn (White)");
    }
  }

  async function makeBotMove(game) {
    try {
      const moves = game.moves({ verbose: true });
      if (moves.length === 0) {
        setIsBotThinking(false);
        return;
      }

      try {
        new Chess(game.fen());
      } catch (e) {
        console.error("Invalid FEN:", game.fen());
        setIsBotThinking(false);
        setGameStatus("Error: Invalid position. Start a new game.");
        return;
      }

      const response = await fetch("/api/bot-move", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fen: game.fen(),
          moves: moves.map((m) => m.san),
          difficulty,
        }),
      });
      const data = await response.json();

      if (data.move) {
        const move = {
          from: data.move.slice(0, 2),
          to: data.move.slice(2, 4),
          promotion: data.move.length === 5 ? data.move[4] : undefined,
        };
        const gameCopy = new Chess(game.fen());
        const result = gameCopy.move(move);
        if (result) {
          setGame(gameCopy);
          setFen(gameCopy.fen());
          setMoveHistory(gameCopy.history());
          setLastBotMove({ from: move.from, to: move.to });
          updateGameStatus(gameCopy);
          // Add bot's move explanation to chat
          if (data.message) {
            setChatMessages((prev) => [
              ...prev,
              { role: "bot", content: data.message },
            ]);
          }
        } else {
          throw new Error("Invalid bot move received");
        }
      } else {
        const randomMove = moves[Math.floor(Math.random() * moves.length)];
        const gameCopy = new Chess(game.fen());
        gameCopy.move(randomMove);
        setGame(gameCopy);
        setFen(gameCopy.fen());
        setMoveHistory(gameCopy.history());
        setLastBotMove({ from: randomMove.from, to: randomMove.to });
        updateGameStatus(gameCopy);
        setChatMessages((prev) => [
          ...prev,
          { role: "bot", content: "Ugh, API failed me. Here's a random move, try not to mess it up." },
        ]);
      }
    } catch (error) {
      console.error("Bot error:", error);
      const moves = game.moves({ verbose: true });
      if (moves.length > 0) {
        const randomMove = moves[Math.floor(Math.random() * moves.length)];
        const gameCopy = new Chess(game.fen());
        gameCopy.move(randomMove);
        setGame(gameCopy);
        setFen(gameCopy.fen());
        setMoveHistory(gameCopy.history());
        setLastBotMove({ from: randomMove.from, to: randomMove.to });
        updateGameStatus(gameCopy);
        setChatMessages((prev) => [
          ...prev,
          { role: "bot", content: "Wow, something broke. Here's a move anyway, genius." },
        ]);
      }
    }
    setIsBotThinking(false);
  }

  function onDrop(sourceSquare, targetSquare) {
    if (game.turn() !== "w" || isBotThinking) return false;
    const piece = game.get(sourceSquare);
    if (!piece) {
      console.error("No piece at source square:", sourceSquare, "FEN:", game.fen());
      setGameStatus("Illegal move. Try again.");
      return false;
    }
    console.log("Piece at", sourceSquare, ":", piece, "Target:", targetSquare);

    const gameCopy = new Chess(game.fen());
    const legalMoves = gameCopy.moves({ square: sourceSquare, verbose: true });
    const isLegalMove = legalMoves.some((m) => m.from === sourceSquare && m.to === targetSquare);
    if (!isLegalMove) {
      console.error("Illegal move:", { from: sourceSquare, to: targetSquare }, "Legal moves:", legalMoves);
      setGameStatus("Illegal move. Try again.");
      return false;
    }

    if (piece.type === "p" && piece.color === "w" && targetSquare[1] === "8") {
      console.log("Promotion detected, setting pending move:", { from: sourceSquare, to: targetSquare });
      if (sourceSquare[1] !== "7") {
        console.error("Invalid promotion: Pawn not on 7th rank:", sourceSquare);
        setGameStatus("Illegal move: Invalid pawn position.");
        return false;
      }
      setPendingMove({ from: sourceSquare, to: targetSquare });
      setShowPromotionModal(true);
      return false;
    }

    const success = makeMove({ from: sourceSquare, to: targetSquare });
    if (!success) {
      setGameStatus("Illegal move. Try again.");
    }
    return success;
  }

  function handlePromotion(piece) {
    console.log("Promotion selected:", piece, "Pending move:", pendingMove, "FEN:", game.fen());
    if (!pendingMove) {
      console.error("No pending move for promotion");
      setGameStatus("Error: No pending move. Try again or start a new game.");
      setShowPromotionModal(false);
      return;
    }
    if (!["q", "r", "b", "n"].includes(piece)) {
      console.error("Invalid promotion piece:", piece);
      setGameStatus("Error: Invalid promotion piece. Try again or start a new game.");
      setShowPromotionModal(false);
      return;
    }

    const pawn = game.get(pendingMove.from);
    if (!pawn || pawn.type !== "p" || pawn.color !== "w" || pendingMove.from[1] !== "7" || pendingMove.to[1] !== "8") {
      console.error("Invalid promotion state:", {
        pawn,
        from: pendingMove.from,
        to: pendingMove.to,
        FEN: game.fen(),
      });
      setGameStatus("Error: Invalid pawn position. Start a new game.");
      setShowPromotionModal(false);
      setPendingMove(null);
      return;
    }

    const move = { from: pendingMove.from, to: pendingMove.to, promotion: piece };
    console.log("Attempting promotion move:", move);
    const success = makeMove(move);
    if (success) {
      console.log("Promotion successful:", move, "New FEN:", game.fen());
      setPendingMove(null);
      setShowPromotionModal(false);
    } else {
      console.error("Promotion move failed:", move, "FEN:", game.fen());
      setGameStatus("Error: Promotion failed. Try again or start a new game.");
    }
  }

  async function sendChatMessage() {
    if (!chatInput.trim() || isBotThinking) return;

    const userMessage = chatInput.trim();
    setChatMessages((prev) => [...prev, { role: "user", content: userMessage }]);
    setChatInput("");

    try {
      const moves = game.moves({ verbose: true }).map((m) => m.san);
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userMessage,
          fen: game.fen(),
          moves,
        }),
      });
      const data = await response.json();

      if (data.message) {
        setChatMessages((prev) => [...prev, { role: "bot", content: data.message }]);
      } else {
        setChatMessages((prev) => [
          ...prev,
          { role: "bot", content: "Ugh, something broke. Try again, champ." },
        ]);
      }
    } catch (error) {
      console.error("Chat error:", error);
      setChatMessages((prev) => [
        ...prev,
        { role: "bot", content: "Wow, even the chat broke. Nice going." },
      ]);
    }

    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [chatMessages]);

  function undoMove() {
    if (undoRef.current && !isBotThinking) {
      const { fen } = undoRef.current;
      const gameCopy = new Chess(fen);
      setGame(gameCopy);
      setFen(fen);
      setMoveHistory(gameCopy.history());
      setLastBotMove(null);
      updateGameStatus(gameCopy);
      undoRef.current = null;
    }
  }

  const customSquareStyles = lastBotMove
    ? {
        [lastBotMove.from]: { backgroundColor: "rgba(255, 255, 0, 0.4)" },
        [lastBotMove.to]: { backgroundColor: "rgba(255, 255, 0, 0.4)" },
      }
    : {};

  return (
    <div className="chess-game-container">
      <h1>Chess: You vs Chesster</h1>
      <div className="main-content">
        <div className="difficulty">
          <label>Difficulty: </label>
          <select value={difficulty} onChange={(e) => setDifficulty(e.target.value)}>
            <option value="easy">Easy</option>
            <option value="medium">Medium</option>
            <option value="hard">Hard</option>
          </select>
        </div>
        <Chessboard
          position={fen}
          onPieceDrop={onDrop}
          boardWidth={typeof window !== "undefined" ? Math.min(window.innerWidth * 0.9, 450) : 450}
          arePiecesDraggable={game.turn() === "w" && !isBotThinking}
          customSquareStyles={customSquareStyles}
        />
        <p className={`status ${gameStatus.includes("Illegal move") ? "error" : ""}`}>
          {isBotThinking ? "AI is thinking..." : gameStatus}
        </p>
      </div>
      <div className="sidebar">
        <div className="controls">
          {undoRef.current && !isBotThinking && (
            <button onClick={undoMove}>Undo Move</button>
          )}
          <button
            onClick={() => {
              const newGame = new Chess();
              setGame(newGame);
              setFen(newGame.fen());
              setMoveHistory([]);
              setLastBotMove(null);
              setGameStatus("Your turn (White)");
              setIsBotThinking(false);
              undoRef.current = null;
              setShowPromotionModal(false);
              setPendingMove(null);
              setChatMessages([]);
            }}
          >
            New Game
          </button>
        </div>
        <div className="move-history">
          <h2>Move History</h2>
          <ul>
            {moveHistory.map((move, index) => (
              <li key={index}>{move}</li>
            ))}
          </ul>
        </div>
        <div className="chat-section">
          <h2>Chat with Chesster</h2>
          <div className="chat-container" ref={chatContainerRef}>
            {chatMessages.map((msg, index) => (
              <div key={index} className={`chat-message ${msg.role}`}>
                <strong>{msg.role === "user" ? "You" : "Chesster"}:</strong> {msg.content}
              </div>
            ))}
          </div>
          <div className="chat-input">
            <input
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && sendChatMessage()}
              placeholder="Talk to Chesster..."
              disabled={isBotThinking}
            />
            <button onClick={sendChatMessage} disabled={isBotThinking}>
              Send
            </button>
          </div>
        </div>
      </div>
      {showPromotionModal && (
        <div className="promotion-modal">
          <div className="promotion-content">
            <h3>Choose Promotion</h3>
            <button onClick={() => handlePromotion("q")}>Queen</button>
            <button onClick={() => handlePromotion("r")}>Rook</button>
            <button onClick={() => handlePromotion("b")}>Bishop</button>
            <button onClick={() => handlePromotion("n")}>Knight</button>
            <button
              onClick={() => {
                console.log("Cancel promotion");
                setPendingMove(null);
                setShowPromotionModal(false);
                setGameStatus("Your turn (White)");
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
