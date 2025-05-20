"use client"

import { useState, useEffect } from "react"
import Link from "next/link"

const HamburgerMenu = () => {
  const [isOpen, setIsOpen] = useState(false)
  const [isDarkMode, setIsDarkMode] = useState(false)

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme")
    if (savedTheme === "dark") {
      setIsDarkMode(true)
      document.body.classList.add("dark")
    }
  }, [])

  const toggleMenu = () => {
    setIsOpen(!isOpen)

  
    if (!isOpen) {
      const hamburgerBtn = document.querySelector(".hamburger")
      if (hamburgerBtn) {
        const ripple = document.createElement("span")
        ripple.style.position = "absolute"
        ripple.style.borderRadius = "50%"
        ripple.style.transform = "scale(0)"
        ripple.style.background = "rgba(99, 102, 241, 0.3)"
        ripple.style.width = "100px"
        ripple.style.height = "100px"
        ripple.style.top = "-35px"
        ripple.style.left = "-35px"
        ripple.style.animation = "ripple 0.8s ease-out"
        ripple.style.zIndex = "-1"

        hamburgerBtn.appendChild(ripple)

        setTimeout(() => {
          hamburgerBtn.removeChild(ripple)
        }, 800)
      }
    }
  }

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode)
    
    const overlay = document.createElement("div")
    overlay.style.position = "fixed"
    overlay.style.top = "0"
    overlay.style.left = "0"
    overlay.style.width = "100%"
    overlay.style.height = "100%"
    overlay.style.zIndex = "9999"
    overlay.style.pointerEvents = "none"
    overlay.style.transition = "opacity 0.5s ease-out"

    if (!isDarkMode) {
      document.body.classList.add("dark")
      localStorage.setItem("theme", "dark")

      overlay.style.background = "radial-gradient(circle at center, rgba(0, 0, 0, 0) 0%, rgba(0, 0, 0, 0.8) 100%)"
      overlay.style.opacity = "0"
      document.body.appendChild(overlay)

      setTimeout(() => {
        overlay.style.opacity = "1"
        setTimeout(() => {
          overlay.style.opacity = "0"
          setTimeout(() => {
            document.body.removeChild(overlay)
          }, 500)
        }, 300)
      }, 10)
    } else {
      document.body.classList.remove("dark")
      localStorage.setItem("theme", "light")

      overlay.style.background =
        "radial-gradient(circle at center, rgba(255, 255, 255, 0) 0%, rgba(255, 255, 255, 0.8) 100%)"
      overlay.style.opacity = "0"
      document.body.appendChild(overlay)
    
      setTimeout(() => {
        overlay.style.opacity = "1"
        setTimeout(() => {
          overlay.style.opacity = "0"
          setTimeout(() => {
            document.body.removeChild(overlay)
          }, 500)
        }, 300)
      }, 10)
    }
  }

  return (
    <>
      <button className="hamburger" onClick={toggleMenu} aria-label="Menu" aria-expanded={isOpen}>
        {isOpen ? "✕" : "☰"}
        <span className="hamburger-glow"></span>
      </button>
      <div className={`menu ${isOpen ? "open" : ""}`}>
        <div className="menu-header">
          <h3>Whodunit</h3>
          <div className="menu-decoration"></div>
        </div>
        <Link href="/" className="navLink" onClick={toggleMenu}>
          <span className="navIcon">🏠</span>
          <span className="navText">Home</span>
        </Link>
        <Link href="/game" className="navLink" onClick={toggleMenu}>
          <span className="navIcon">🎮</span>
          <span className="navText">Play Game</span>
        </Link>
        <Link href="/settings" className="navLink" onClick={toggleMenu}>
          <span className="navIcon">⚙️</span>
          <span className="navText">Settings</span>
        </Link>
        <Link href="/cases" className="navLink" onClick={toggleMenu}>
          <span className="navIcon">📂</span>
          <span className="navText">Saved Cases</span>
        </Link>
        <div className="menu-decoration"></div>
        <button className="darkModeToggle" onClick={toggleDarkMode}>
          {isDarkMode ? (
            <>
              <span className="toggleIcon">☀️</span>
              <span className="toggleText">Light Mode</span>
            </>
          ) : (
            <>
              <span className="toggleIcon">🌙</span>
              <span className="toggleText">Dark Mode</span>
            </>
          )}
        </button>
      </div>
      <div className={`menuOverlay ${isOpen ? "open" : ""}`} onClick={toggleMenu} />
    </>
  )
}

export default HamburgerMenu
