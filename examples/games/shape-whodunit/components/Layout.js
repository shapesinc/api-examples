"use client"

import HamburgerMenu from "./HamburgerMenu"
import { useEffect, useState } from "react"

const Layout = ({ children }) => {
  const [scrolled, setScrolled] = useState(false)
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })

  useEffect(() => {
    const handleScroll = () => {
      const isScrolled = window.scrollY > 10
      if (isScrolled !== scrolled) {
        setScrolled(isScrolled)
      }
    }

    window.addEventListener("scroll", handleScroll)
    return () => {
      window.removeEventListener("scroll", handleScroll)
    }
  }, [scrolled])
  
  useEffect(() => {
    const handleMouseMove = (e) => {
      setMousePosition({
        x: e.clientX / window.innerWidth,
        y: e.clientY / window.innerHeight,
      })
    }

    window.addEventListener("mousemove", handleMouseMove)
    return () => {
      window.removeEventListener("mousemove", handleMouseMove)
    }
  }, [])

  return (
    <div className="container">
      <div
        className="background-effect"
        style={{
          transform: `translate(${mousePosition.x * -20}px, ${mousePosition.y * -20}px)`,
        }}
      ></div>

      <header className={`header ${scrolled ? "scrolled" : ""}`}>
        <HamburgerMenu />
        <h1>Shapes Whodunit</h1>
        <div className="header-glow"></div>
      </header>

      <main className="main">{children}</main>

      <footer className="footer">
        <div className="footer-content">
          <p>Powered by Shapes API</p>
          <div className="footer-decoration"></div>
        </div>
      </footer>
    </div>
  )
}

export default Layout
