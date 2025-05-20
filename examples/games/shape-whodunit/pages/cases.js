"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/router"

export default function SavedCases() {
  const router = useRouter()
  const [savedCases, setSavedCases] = useState([])

  useEffect(() => {
    const cases = localStorage.getItem("savedCases")
    if (cases) {
      setSavedCases(JSON.parse(cases))
    }
  }, [])

  const handleLoadCase = (caseData) => {
    localStorage.setItem("currentCase", JSON.stringify(caseData))
    router.push(`/game?case=${encodeURIComponent(caseData.caseName)}&load=true`)
  }

  const handleDeleteCase = (caseName) => {
    const updatedCases = savedCases.filter((c) => c.caseName !== caseName)
    setSavedCases(updatedCases)
    localStorage.setItem("savedCases", JSON.stringify(updatedCases))
    if (localStorage.getItem("savedCase") === caseName) {
      localStorage.removeItem("savedCase")
    }
  }

  return (
    <div>
      <h2>Saved Cases</h2>
      {savedCases.length === 0 ? (
        <p>No saved cases found.</p>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            gap: "1.5rem",
            margin: "2rem 0",
          }}
        >
          {savedCases.map((caseData) => (
            <div
              key={caseData.caseName}
              style={{
                backgroundColor: "rgba(255, 255, 255, 0.9)",
                borderRadius: "16px",
                padding: "1.5rem",
                boxShadow: "var(--shadow-lg)",
                transition: "all 0.3s ease-out",
                border: "1px solid rgba(209, 213, 219, 0.3)",
                backdropFilter: "blur(8px)",
                WebkitBackdropFilter: "blur(8px)",
                position: "relative",
                overflow: "hidden",
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.transform = "translateY(-8px)"
                e.currentTarget.style.boxShadow = "var(--shadow-xl), var(--shadow-glow-accent-light)"
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.transform = "translateY(0)"
                e.currentTarget.style.boxShadow = "var(--shadow-lg)"
              }}
            >
              <div
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  width: "100%",
                  height: "5px",
                  background: "linear-gradient(to right, var(--accent-light), transparent)",
                }}
              />

              <h3
                style={{
                  fontSize: "1.3rem",
                  margin: "0.5rem 0 1rem",
                  fontFamily: "Poppins, sans-serif",
                  fontWeight: "600",
                }}
              >
                {caseData.caseName}
              </h3>

              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  marginBottom: "1rem",
                }}
              >
                <span
                  style={{
                    display: "inline-block",
                    padding: "0.35rem 0.75rem",
                    borderRadius: "20px",
                    fontSize: "0.85rem",
                    fontWeight: "500",
                    background:
                      caseData.gameStatus === "won"
                        ? "rgba(16, 185, 129, 0.1)"
                        : caseData.gameStatus === "lost"
                          ? "rgba(239, 68, 68, 0.1)"
                          : "rgba(99, 102, 241, 0.1)",
                    color:
                      caseData.gameStatus === "won"
                        ? "var(--success-color)"
                        : caseData.gameStatus === "lost"
                          ? "var(--danger-color)"
                          : "var(--accent-light)",
                    border:
                      caseData.gameStatus === "won"
                        ? "1px solid rgba(16, 185, 129, 0.2)"
                        : caseData.gameStatus === "lost"
                          ? "1px solid rgba(239, 68, 68, 0.2)"
                          : "1px solid rgba(99, 102, 241, 0.2)",
                  }}
                >
                  {caseData.gameStatus === "won"
                    ? "✓ Solved"
                    : caseData.gameStatus === "lost"
                      ? "✗ Failed"
                      : "🔍 In Progress"}
                </span>
              </div>

              <div
                style={{
                  marginTop: "1.5rem",
                  display: "flex",
                  gap: "0.75rem",
                }}
              >
                <button
                  onClick={() => handleLoadCase(caseData)}
                  className="button"
                  style={{
                    flex: "1",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "0.5rem",
                  }}
                >
                  <span style={{ fontSize: "1.1rem" }}>📁</span> Load
                </button>
                <button
                  onClick={() => handleDeleteCase(caseData.caseName)}
                  style={{
                    padding: "0.75rem",
                    backgroundColor: "var(--danger-color)",
                    color: "#fff",
                    border: "none",
                    borderRadius: "8px",
                    cursor: "pointer",
                    fontSize: "1.1rem",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    transition: "all 0.2s ease-out",
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.backgroundColor = "var(--danger-hover)"
                    e.currentTarget.style.transform = "translateY(-2px)"
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.backgroundColor = "var(--danger-color)"
                    e.currentTarget.style.transform = "translateY(0)"
                  }}
                >
                  🗑️
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
