"use client"

export default function Home() {
  const cases = [
    {
      name: "The Phantom Heist",
      description: "A cursed artifact vanished from a haunted museum, leaving only whispers of a spectral thief.",
      image: "https://i.imgur.com/btNo6q7.png",
    },
    {
      name: "Curse of the Crimson Gem",
      description: "A blood-red jewel was stolen from a gothic manor, rumored to carry a deadly curse.",
      image: "https://i.imgur.com/MWKFkx5.png",
    },
    {
      name: "The Midnight Vanishing",
      description: "A guest disappeared from a shadowy gala, with no trace except a chilling note.",
      image: "https://i.imgur.com/Mqzr4kz.png",
    },
    {
      name: "Graveyard’s Lost Relic",
      description: "A sacred relic was taken from an ancient crypt, under the watch of eerie statues.",
      image: "https://i.imgur.com/rWOrdm2.png",
    },
    {
      name: "The Wraith’s Locket",
      description: "A ghostly locket vanished from a cursed estate, tied to an old family secret.",
      image: "https://i.imgur.com/KjB6TFk.png",
    },
    {
      name: "Echoes of the Lost Vault",
      description: "A treasure disappeared from a sealed vault, locked from the inside.",
      image: "https://i.imgur.com/e118Ec7.png",
    },
    {
      name: "The Shadow’s Cipher",
      description: "A cryptic scroll was stolen under moonlight, holding secrets of a forgotten cult.",
      image: "https://i.imgur.com/888DeKs.png",
    },
    {
      name: "The Whispering Statue",
      description: "A statue in a forgotten garden whispered secrets before a golden idol vanished.",
      image: "https://i.imgur.com/Nwo5xos.png",
    },
    {
      name: "The Frostbound Reliquary",
      description: "An ancient reliquary was stolen from a frozen chapel, where the air turned icy cold.",
      image: "https://i.imgur.com/jov7Um0.png",
    },
    {
      name: "The Clocktower Conspiracy",
      description: "A mysterious clock stopped ticking as a hidden ledger disappeared from the tower.",
      image: "https://i.imgur.com/hozUlyW.png",
    },
    {
      name: "The Raven’s Riddle",
      description: "A riddle carved into a tree led to a stolen amulet, guarded by a raven’s watchful eyes.",
      image: "https://i.imgur.com/EiVl2cv.png",
    },
    {
      name: "The Shattered Mirror",
      description: "A mirror in an abandoned ballroom shattered as a silver comb disappeared.",
      image: "https://i.imgur.com/3HdN2Pg.png",
    },
    {
      name: "The Phantom Carriage",
      description: "A ghostly carriage was seen before a golden chalice vanished from a manor.",
      image: "https://i.imgur.com/2r3FPN2.png",
    },
    {
      name: "The Starless Night",
      description: "On a night with no stars, a celestial globe disappeared from an observatory.",
      image: "https://i.imgur.com/eLmIBbN.png",
    },
    {
      name: "The Ghostly Gala",
      description: "A chandelier fell during a gala, and a diamond tiara vanished in the chaos.",
      image: "https://i.imgur.com/ltBCGHn.png",
    },
  ]

  const savedCase = typeof window !== "undefined" ? localStorage.getItem("savedCase") : null

  return (
    <div style={{ textAlign: "center" }}>
      <h2 className="home-title">Unravel the Mystery</h2>
      <p className="home-subtitle">Choose a spooky case or dive into a random enigma!</p>
      <div className="caseGrid">
        {cases.map((caseItem, index) => (
          <div
            key={caseItem.name}
            className="case-card"
            style={{
              animationDelay: `${index * 0.1}s`,
            }}
          >
            <div className="case-image-container">
              <img src={caseItem.image || "/placeholder.svg"} alt={caseItem.name} className="case-image" />
              <div className="case-overlay">
                <h3 className="case-title">{caseItem.name}</h3>
              </div>
            </div>
            <div className="case-content">
              <p className="case-description">{caseItem.description}</p>
              <div className="case-action">
                <a href={`/game?case=${encodeURIComponent(caseItem.name)}`} className="case-button">
                  <span className="case-button-icon">🔍</span>
                  <span className="case-button-text">Investigate</span>
                </a>
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className="home-actions">
        <a href="/game" className="button random-case-button" style={{ textDecoration: 'none' }}>
  <span className="button-icon">🎲</span>
  <span className="button-text">Random Case</span>
</a>
        {savedCase && (
          <a href={`/game?case=${encodeURIComponent(savedCase)}`} className="button saved-case-button">
            <span className="button-icon">📁</span>
            <span className="button-text">Load Saved Case</span>
          </a>
        )}
      </div>
    </div>
  )
}
