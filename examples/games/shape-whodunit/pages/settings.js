"use client"

import { useState, useEffect } from "react"

export default function Settings() {
  const [shapes, setShapes] = useState({
    narrator: "",
    suspectA: "",
    suspectB: "",
    suspectC: "",
  })
  const [errors, setErrors] = useState({
    narrator: "",
    suspectA: "",
    suspectB: "",
    suspectC: "",
  })
  const [success, setSuccess] = useState({
    narrator: "",
    suspectA: "",
    suspectB: "",
    suspectC: "",
  })
  const [loading, setLoading] = useState({
    narrator: false,
    suspectA: false,
    suspectB: false,
    suspectC: false,
  })
  const [validCache, setValidCache] = useState({}) // In-memory cache for valid usernames
  const [validatedShapes, setValidatedShapes] = useState({}) // Previously validated usernames
  const [message, setMessage] = useState(null) // Custom message state

  useEffect(() => {
    // Load user-entered shapes
    const savedShapes = localStorage.getItem("customShapes")
    if (savedShapes) {
      setShapes(JSON.parse(savedShapes))
    }
    const savedValidatedShapes = localStorage.getItem("validatedShapes")
    if (savedValidatedShapes) {
      setValidatedShapes(JSON.parse(savedValidatedShapes))
    }
  }, [])

  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => setMessage(null), 5000)
      return () => clearTimeout(timer)
    }
  }, [message])

  const validateShapeUsername = async (username, field) => {
    if (!username) {
      setErrors((prev) => ({ ...prev, [field]: "" }))
      setSuccess((prev) => ({ ...prev, [field]: "" }))
      return true
    }

    if (validCache[username]) {
      setErrors((prev) => ({ ...prev, [field]: "" }))
      setSuccess((prev) => ({ ...prev, [field]: "Valid Shape username" }))
      return true
    }

    setLoading((prev) => ({ ...prev, [field]: true }))
    setSuccess((prev) => ({ ...prev, [field]: "" }))
    try {
      const response = await fetch("/api/shapes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: `shapesinc/${username}`,
          messages: [{ role: "user", content: "!info" }],
        }),
      })
      if (!response.ok) {
        const { error } = await response.json()
        setErrors((prev) => ({
          ...prev,
          [field]: `Invalid Shape username: ${username} (${error})`,
        }))
        setSuccess((prev) => ({ ...prev, [field]: "" }))
        return false
      }
      setErrors((prev) => ({ ...prev, [field]: "" }))
      setSuccess((prev) => ({ ...prev, [field]: "Valid Shape username" }))
      setValidCache((prev) => ({ ...prev, [username]: true }))
      return true
    } catch (error) {
      setErrors((prev) => ({
        ...prev,
        [field]: `Error validating ${username}: ${error.message}`,
      }))
      setSuccess((prev) => ({ ...prev, [field]: "" }))
      return false
    } finally {
      setLoading((prev) => ({ ...prev, [field]: false }))
    }
  }
  const handleChange = (e) => {
    const { name, value } = e.target
    setShapes((prev) => ({ ...prev, [name]: value }))
    setErrors((prev) => ({ ...prev, [name]: "" }))
    setSuccess((prev) => ({ ...prev, [name]: "" }))
  }

  const handleBlur = async (e) => {
    const { name, value } = e.target
    await validateShapeUsername(value, name)
  }

  const handleSave = async () => {
    const fields = ["narrator", "suspectA", "suspectB", "suspectC"]
    let allValid = true
    const changedFields = fields.filter((field) => shapes[field] !== validatedShapes[field])

    if (changedFields.length === 0) {
      localStorage.setItem("customShapes", JSON.stringify(shapes))
      setMessage({ text: "Shape names saved!", type: "success" })
      return
    }

    for (const field of changedFields) {
      const isValid = await validateShapeUsername(shapes[field], field)
      if (!isValid) allValid = false
    }

    if (allValid) {
      localStorage.setItem("customShapes", JSON.stringify(shapes))
      localStorage.setItem("validatedShapes", JSON.stringify(shapes))
      setValidatedShapes(shapes)
      setMessage({ text: "Shape names saved!", type: "success" })
    } else {
      setMessage({
        text: "Please fix invalid Shape usernames before saving.",
        type: "error",
      })
    }
  }

  const handleReset = () => {
    localStorage.removeItem("customShapes")
    localStorage.removeItem("validatedShapes")
    setShapes({ narrator: "", suspectA: "", suspectB: "", suspectC: "" })
    setErrors({ narrator: "", suspectA: "", suspectB: "", suspectC: "" })
    setSuccess({ narrator: "", suspectA: "", suspectB: "", suspectC: "" })
    setValidCache({})
    setValidatedShapes({})
    setMessage({ text: "Shape names reset to defaults.", type: "success" })
  }

  return (
    <div style={{ padding: "2rem", maxWidth: "600px", margin: "0 auto" }}>
      <h2>Settings</h2>
      <p>Enter custom Shape usernames or leave blank to use defaults.</p>
    
      <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
        {["narrator", "suspectA", "suspectB", "suspectC"].map((field) => (
          <div key={field}>
            <label style={{ display: "block", marginBottom: "0.25rem", fontWeight: "500" }}>
              {field === "narrator" ? "Narrator Shape" : `Suspect ${field.slice(-1)} Shape`}:
            </label>
            <input
              type="text"
              name={field}
              value={shapes[field]}
              onChange={handleChange}
              onBlur={handleBlur}
              placeholder={`e.g., ${field === "narrator" ? "narrator" : `suspect-${field.slice(-1).toLowerCase()}`}`}
              style={{
                width: "100%",
                padding: "10px",
                borderRadius: "6px",
                border: errors[field] ? "1px solid #f03e3e" : "1px solid #dee2e6",
                fontSize: "1rem",
                background: loading[field] ? "#f1f3f5" : "#fff",
              }}
              disabled={loading[field]}
              aria-invalid={!!errors[field]}
              aria-describedby={`${field}-status`}
            />
            {errors[field] && (
              <p id={`${field}-status`} style={{ color: "#f03e3e", fontSize: "0.875rem", marginTop: "0.25rem" }}>
                {errors[field]}
              </p>
            )}
            {success[field] && !errors[field] && !loading[field] && (
              <p id={`${field}-status`} style={{ color: "#2b8a3e", fontSize: "0.875rem", marginTop: "0.25rem" }}>
                {success[field]}
              </p>
            )}
            {loading[field] && (
              <p id={`${field}-status`} style={{ color: "#868e96", fontSize: "0.875rem", marginTop: "0.25rem" }}>
                Validating...
              </p>
            )}
          </div>
        ))}

        <div
          style={{
            margin: "2rem 0",
            padding: "1.5rem",
            borderRadius: "12px",
            background: "rgba(255, 255, 255, 0.9)",
            boxShadow: "var(--shadow-md)",
            border: "1px solid rgba(209, 213, 219, 0.3)",
            backdropFilter: "blur(8px)",
            WebkitBackdropFilter: "blur(8px)",
            transition: "all 0.3s ease-out",
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.transform = "translateY(-5px)"
            e.currentTarget.style.boxShadow = "var(--shadow-lg)"
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.transform = "translateY(0)"
            e.currentTarget.style.boxShadow = "var(--shadow-md)"
          }}
        >
          <h3
            style={{
              fontSize: "1.25rem",
              marginBottom: "1rem",
              color: "var(--text-light)",
              fontFamily: "Poppins, sans-serif",
              fontWeight: "600",
              position: "relative",
              display: "inline-block",
            }}
          >
            Finding Shape Usernames
          </h3>
          <div style={{ position: "relative" }}>
            <p style={{ color: "#4b5563", lineHeight: "1.6", marginBottom: "1rem" }}>
              Shape usernames are unique identifiers for social AI agents (e.g.,{" "}
              <code
                style={{
                  background: "rgba(99, 102, 241, 0.1)",
                  padding: "0.2rem 0.4rem",
                  borderRadius: "4px",
                  fontFamily: "monospace",
                }}
              >
                tenshi
              </code>
              ). To find or create a Shape:
            </p>
            <ul
              style={{
                listStyleType: "none",
                padding: "0",
                marginBottom: "1rem",
              }}
            >
              <li
                style={{
                  marginBottom: "0.75rem",
                  paddingLeft: "1.5rem",
                  position: "relative",
                }}
              >
                <span
                  style={{
                    position: "absolute",
                    left: "0",
                    top: "0.2rem",
                    color: "var(--accent-light)",
                    fontWeight: "bold",
                  }}
                >
                  •
                </span>
                Visit{" "}
                <a
                  href="https://shapes.inc"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    color: "var(--accent-light)",
                    textDecoration: "none",
                    position: "relative",
                    fontWeight: "500",
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.color = "var(--accent-hover-light)"
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.color = "var(--accent-light)"
                  }}
                >
                  shapes.inc
                </a>{" "}
                to create a new custom Shape or browse available Shapes.
              </li>
              <li
                style={{
                  marginBottom: "0.75rem",
                  paddingLeft: "1.5rem",
                  position: "relative",
                }}
              >
                <span
                  style={{
                    position: "absolute",
                    left: "0",
                    top: "0.2rem",
                    color: "var(--accent-light)",
                    fontWeight: "bold",
                  }}
                >
                  •
                </span>
                Create your own Shape and note its username from the Shapes website.
              </li>
            </ul>
            <p style={{ color: "#4b5563", marginTop: "1rem" }}>
              Enter usernames exactly as they appear on{" "}
              <a
                href="https://shapes.inc"
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  color: "var(--accent-light)",
                  textDecoration: "none",
                  position: "relative",
                  fontWeight: "500",
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.color = "var(--accent-hover-light)"
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.color = "var(--accent-light)"
                }}
              >
                shapes.inc
              </a>
              . Invalid usernames will trigger an error.
            </p>
          </div>
        </div>

        {message && (
          <div
            style={{
              marginBottom: "1.5rem",
              padding: "12px 16px",
              borderRadius: "8px",
              background: message.type === "success" ? "rgba(16, 185, 129, 0.1)" : "rgba(239, 68, 68, 0.1)",
              color: message.type === "success" ? "var(--success-color)" : "var(--danger-color)",
              textAlign: "center",
              fontSize: "0.95rem",
              border:
                message.type === "success" ? "1px solid rgba(16, 185, 129, 0.2)" : "1px solid rgba(239, 68, 68, 0.2)",
              animation: "fadeIn 0.5s ease-out",
            }}
          >
            {message.text}
          </div>
        )}

        <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
          <button
            onClick={handleSave}
            className="button"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
            }}
          >
            <span style={{ fontSize: "1.1rem" }}>💾</span> Save
          </button>
          <button
            onClick={handleReset}
            className="button"
            style={{
              background: "var(--danger-color)",
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.background = "var(--danger-hover)"
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.background = "var(--danger-color)"
            }}
          >
            <span style={{ fontSize: "1.1rem" }}>🔄</span> Reset to Defaults
          </button>
        </div>
      </div>
    </div>
  )
}
