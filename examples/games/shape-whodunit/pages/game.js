"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/router"
import styles from "../styles/Game.module.css"

const defaultShapes = {
  narrator: process.env.NEXT_PUBLIC_NARRATOR_SHAPE,
  suspectA: process.env.NEXT_PUBLIC_SUSPECT_A_SHAPE,
  suspectB: process.env.NEXT_PUBLIC_SUSPECT_B_SHAPE,
  suspectC: process.env.NEXT_PUBLIC_SUSPECT_C_SHAPE,
}

const caseDescriptions = {
  "The Phantom Heist":
    "A cursed artifact vanished from a haunted museum, leaving only whispers of a spectral thief. The air grew cold that night, and the guards reported hearing faint, ghostly whispers echoing through the halls. Could the thief be something—or someone—beyond the living?",
  "Curse of the Crimson Gem":
    "A blood-red jewel was stolen from a gothic manor, rumored to carry a deadly curse. Legend has it that the gem brings misfortune to all who possess it, and the manor’s residents speak of shadowy figures lurking in the corridors at night.",
  "The Midnight Vanishing":
    'A guest disappeared from a shadowy gala, with no trace except a chilling note that read, "The shadows took me." The gala was held in an old mansion known for its eerie history, and some say the walls themselves hold secrets.',
  "Graveyard’s Lost Relic":
    "A sacred relic was taken from an ancient crypt, under the watch of eerie statues that locals swear move at night. The crypt has been a place of mystery for centuries, with tales of restless spirits guarding its treasures.",
  "The Wraith’s Locket":
    "A ghostly locket vanished from a cursed estate, tied to an old family secret that some believe involves a vengeful spirit. The estate has been abandoned for decades, yet lights flicker in the windows at night.",
  "Echoes of the Lost Vault":
    "A treasure disappeared from a sealed vault, locked from the inside, defying all logic. The vault was part of an old castle, and some say the treasure was cursed, destined to vanish from those who seek it.",
  "The Shadow’s Cipher":
    "A cryptic scroll was stolen under moonlight, holding secrets of a forgotten cult that once practiced dark rituals. The theft occurred in a secluded library, where the air is thick with the scent of ancient tomes and unspoken mysteries.",
  "The Whispering Statue":
    "A golden idol vanished from a forgotten garden where a statue is said to whisper secrets at dusk. Locals claim the statue’s eyes follow those who linger too long, and the night of the theft, a chilling breeze carried faint murmurs through the air.",
  "The Frostbound Reliquary":
    "An ancient reliquary disappeared from a frozen chapel in the mountains, where the air turned unnaturally cold. The chapel’s stained glass windows depict scenes of eternal winter, and some say the reliquary holds the key to a frost-bound curse.",
  "The Clocktower Conspiracy":
    "A hidden ledger vanished from an old clocktower as the clock stopped ticking at midnight. The tower has long been abandoned, but townsfolk report hearing the faint ticking of gears on moonless nights, hinting at a deeper conspiracy.",
  "The Veiled Portrait":
    "A portrait in a dusty attic vanished, leaving behind a veil stained with crimson droplets. The portrait was said to depict a woman who disappeared centuries ago, and some claim her eyes in the painting would weep blood on stormy nights.",
  "The Raven’s Riddle":
    "A riddle carved into an ancient tree led to a stolen amulet, once guarded by a raven that never left its perch. The raven’s cawing filled the forest the night of the theft, and some believe it holds the key to solving the riddle.",
  "The Fogbound Lantern":
    "A lantern in a foggy marsh went dark as a sacred map vanished into the mist. The marsh is known for its eerie silence, broken only by the occasional flicker of ghostly lights that lead travelers astray.",
  "The Shattered Mirror":
    "A mirror in an abandoned ballroom shattered as a silver comb disappeared from its frame. The ballroom once hosted lavish parties, but now echoes with the faint sound of waltzing footsteps on quiet nights.",
  "The Hollow Oak’s Secret":
    "A hollow oak in a cursed forest held a missing journal, now gone without a trace. The forest is said to be alive, with trees that shift positions, and locals whisper of a shadowy figure seen near the oak at twilight.",
  "The Moonlit Masquerade":
    "A sapphire ring was stolen during a masquerade under a full moon, where masked figures danced in eerie silence. The host of the masquerade vanished that night, leaving behind a single broken mask on the ballroom floor.",
  "The Cryptic Chessboard":
    "A chessboard in a dusty library held a clue to a stolen ivory piece, now missing from its checkered surface. The library’s bookshelves creak at night, and some say the chess pieces move on their own when no one is watching.",
  "The Phantom Carriage":
    "A ghostly carriage was seen rolling through the fog before a golden chalice vanished from a manor. The carriage is said to appear every century, carrying the spirits of those who once lived in the manor.",
  "The Starless Night":
    "On a night with no stars, a celestial globe disappeared from an observatory perched on a cliff. The observatory’s telescope is rumored to show glimpses of otherworldly realms, but that night, it showed only darkness.",
  "The Forgotten Shrine":
    "A jade idol was stolen from a shrine where the candles flicker without wind, casting eerie shadows on the walls. The shrine was abandoned after a priest vanished, leaving behind a single prayer bead on the altar.",
  "The Banshee’s Lament":
    "A haunting wail echoed through the cliffs as a silver harp vanished from a castle by the sea. The castle’s halls are said to be haunted by a banshee, whose cries foretell misfortune for all who hear them.",
  "The Alchemist’s Grimoire":
    "A grimoire with forbidden spells disappeared from an alchemist’s hidden lair, where vials of glowing liquid still bubble. The lair is rumored to be a place of dark experiments, and the air hums with an unnatural energy.",
  "The Ghostly Gala":
    "A chandelier fell during a gala, and a diamond tiara vanished in the chaos of the flickering lights. The gala was held in a mansion where past guests never left, their laughter still echoing in the empty halls.",
  "The Whispering Well":
    "A well whispered names as a bronze medallion disappeared from its depths, leaving ripples on the water’s surface. Villagers avoid the well, claiming the whispers grow louder at midnight, calling out to the unwary.",
  "The Cursed Compass":
    "A compass that always points north stopped as a sea captain’s log vanished from a shipwrecked vessel. The shipwreck is said to be cursed, with sailors hearing the creak of ghostly rigging on foggy nights.",
  "The Midnight Bell":
    "A bell tolled at midnight as a brass key disappeared from a cathedral’s altar, where stained glass windows cast eerie shadows. The cathedral has stood for centuries, its belltower rumored to house a locked secret.",
  "The Spectral Symphony":
    "A violin played a haunting tune as a conductor’s baton vanished mid-concert in an old theater. The theater has been closed for decades, yet the faint sound of an orchestra can be heard on quiet evenings.",
  "The Frozen Talisman":
    "A talisman encased in ice melted away as it vanished from a tundra shrine, leaving behind a puddle that never freezes. The shrine is said to be guarded by spirits of the ice, who whisper warnings to those who approach.",
  "The Eclipse Enigma":
    "During a lunar eclipse, a star chart vanished from an astronomer’s tower, where the shadows seemed to move on their own. The tower has a history of strange occurrences, with the eclipse amplifying its eerie aura.",
  "The Phantom’s Mask":
    "A mask from a masquerade ball disappeared, leaving behind a single black feather on the ballroom floor. The ball was held in a castle where a phantom is said to roam, searching for its lost identity.",
  "The Abyssal Relic":
    "A relic from the ocean depths vanished from a coastal cave, leaving behind a trail of saltwater and seaweed. The cave is known for its unnatural tides, and divers report hearing whispers from the abyss.",
}

const parseMessage = (text) => {
  // Handle text formatting and images
  const imageExtensions = /\.(png|jpg|jpeg|gif)(\?|$)/i
  if (typeof text === "string" && imageExtensions.test(text)) {
    return `<img src="${text}" alt="Shape response" style="max-width: 100%; border-radius: 6px; margin: 0.5rem 0;" />`
  }
  return text
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.*?)\*/g, "<em>$1</em>")
    .replace(/\n/g, "<br />")
}

const Game = () => {
  const router = useRouter()
  const { case: selectedCase, load } = router.query

  const [shapes, setShapes] = useState(defaultShapes)
  const [displayNames, setDisplayNames] = useState({
    [defaultShapes.narrator]: "Narrator",
    [defaultShapes.suspectA]: "Shape A",
    [defaultShapes.suspectB]: "Shape B",
    [defaultShapes.suspectC]: "Shape C",
  })
  const [suspectShapes, setSuspectShapes] = useState([
    defaultShapes.suspectA,
    defaultShapes.suspectB,
    defaultShapes.suspectC,
  ])
  const [conversation, setConversation] = useState([])
  const [suspects, setSuspects] = useState([])
  const [votedOut, setVotedOut] = useState([])
  const [gameStatus, setGameStatus] = useState("not started")
  const [recipient, setRecipient] = useState(shapes.narrator)
  const [message, setMessage] = useState("")
  const [canReturn, setCanReturn] = useState(true)
  const [isTyping, setIsTyping] = useState(false)
  const [firstClueFound, setFirstClueFound] = useState(false)
  const [typingSender, setTypingSender] = useState("")
  const [isVoting, setIsVoting] = useState({})
  const [saveMessage, setSaveMessage] = useState(null)
  const [clues, setClues] = useState([])
  const [showMentionBox, setShowMentionBox] = useState(false)
  const [mentionOptions, setMentionOptions] = useState([])
  const [selectedMentionIndex, setSelectedMentionIndex] = useState(0)

  useEffect(() => {
    if (saveMessage) {
      const timer = setTimeout(() => setSaveMessage(null), 5000)
      return () => clearTimeout(timer)
    }
  }, [saveMessage])

  const validateShapeUsername = async (username, field) => {
    if (!username) return true
    try {
      const response = await fetch("/api/shapes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: `shapesinc/${username}`,
          messages: [{ role: "user", content: "!info" }],
        }),
      })
      return response.ok
    } catch (error) {
      console.error("Validation error:", error)
      return false
    }
  }

  useEffect(() => {
    const loadShapes = async () => {
      const savedShapes = localStorage.getItem("customShapes")
      const validatedShapes = localStorage.getItem("validatedShapes")
      let updatedShapes = { ...defaultShapes }
      const shapesToValidate = []

      if (savedShapes) {
        const customShapes = JSON.parse(savedShapes)
        const savedValidatedShapes = validatedShapes ? JSON.parse(validatedShapes) : {}

        updatedShapes = {
          narrator: customShapes.narrator || defaultShapes.narrator,
          suspectA: customShapes.suspectA || defaultShapes.suspectA,
          suspectB: customShapes.suspectB || defaultShapes.suspectB,
          suspectC: customShapes.suspectC || defaultShapes.suspectC,
        }

        for (const field of ["narrator", "suspectA", "suspectB", "suspectC"]) {
          if (updatedShapes[field] && updatedShapes[field] !== savedValidatedShapes[field]) {
            shapesToValidate.push({ field, username: updatedShapes[field] })
          }
        }
      }

      let allValid = true
      for (const { field, username } of shapesToValidate) {
        const isValid = await validateShapeUsername(username, field)
        if (!isValid) {
          updatedShapes[field] = defaultShapes[field]
          allValid = false
        }
      }

      if (allValid && shapesToValidate.length > 0) {
        localStorage.setItem("validatedShapes", JSON.stringify(updatedShapes))
      }

      setShapes(updatedShapes)
      const updatedDisplayNames = {
        [updatedShapes.narrator]: "Narrator",
        [updatedShapes.suspectA]:
          updatedShapes.suspectA === defaultShapes.suspectA ? "Shape A" : updatedShapes.suspectA,
        [updatedShapes.suspectB]:
          updatedShapes.suspectB === defaultShapes.suspectB ? "Shape B" : updatedShapes.suspectB,
        [updatedShapes.suspectC]:
          updatedShapes.suspectC === defaultShapes.suspectC ? "Shape C" : updatedShapes.suspectC,
      }
      setDisplayNames(updatedDisplayNames)

      const updatedSuspectShapes = [updatedShapes.suspectA, updatedShapes.suspectB, updatedShapes.suspectC]
      setSuspectShapes(updatedSuspectShapes)
      setSuspects(updatedSuspectShapes)
      setRecipient(updatedShapes.narrator)
    }

    loadShapes()

    if (load === "true") {
      const savedCases = localStorage.getItem("savedCases")
      if (savedCases) {
        const allCases = JSON.parse(savedCases)
        const caseToLoad = allCases.find((c) => c.caseName === selectedCase)
        if (caseToLoad) {
          setConversation(caseToLoad.conversation || [])
          setSuspects(caseToLoad.suspects || suspectShapes)
          setVotedOut(caseToLoad.votedOut || [])
          setGameStatus("ongoing")
          setCanReturn(caseToLoad.canReturn !== undefined ? caseToLoad.canReturn : true)
          setFirstClueFound(caseToLoad.firstClueFound || false)
          setRecipient(caseToLoad.recipient || shapes.narrator)
          setClues(caseToLoad.clues || [])
        }
      }
    }
  }, [load, selectedCase])

  useEffect(() => {
    if (message.includes("@")) {
      const query = message.split("@").pop().toLowerCase()
      const options = [
        { name: "Narrator", value: shapes.narrator, alias: "narrator" },
        { name: displayNames[shapes.suspectA], value: shapes.suspectA, alias: "a" },
        { name: displayNames[shapes.suspectB], value: shapes.suspectB, alias: "b" },
        { name: displayNames[shapes.suspectC], value: shapes.suspectC, alias: "c" },
      ].filter((opt) => opt.name.toLowerCase().startsWith(query) || opt.alias.toLowerCase().startsWith(query))
      setMentionOptions(options)
      setShowMentionBox(options.length > 0)
      setSelectedMentionIndex(0)
    } else {
      setShowMentionBox(false)
      setMentionOptions([])
    }
  }, [message, shapes, displayNames])

  const sendMessage = async (to, content, userId = "player") => {
    setIsTyping(true)
    setTypingSender(displayNames[to] || "Narrator")
    const model = `shapesinc/${to}`
    const channelId = to === shapes.narrator ? "game-channel" : `${to}-channel`
    try {
      const response = await fetch("/api/shapes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model,
          messages: [{ role: "user", content }],
          headers: { "X-User-Id": userId, "X-Channel-Id": channelId },
        }),
      })
      if (!response.ok) throw new Error("API request failed")
      const data = await response.json()
      const responseContent = data.choices[0].message.content
      const parsedMessage = parseMessage(responseContent)

      if (to === shapes.narrator) {
        const clueMatches = responseContent.match(/\*\*(.*?)\*\*/g)
        if (clueMatches) {
          const newClues = clueMatches.map((clue) => clue.replace(/\*\*/g, ""))
          setClues((prev) => [...new Set([...prev, ...newClues])])
        }
      }

      if (to !== shapes.narrator && !firstClueFound) {
        setFirstClueFound(true)
      }
      return parsedMessage
    } catch (error) {
      console.error("Error:", error)
      return "<em>Error: Could not get a response.</em>"
    } finally {
      setIsTyping(false)
      setTypingSender("")
    }
  }

  const startGame = async () => {
    setGameStatus("ongoing")
    setConversation([])
    setSuspects(suspectShapes)
    setVotedOut([])
    setCanReturn(true)
    setRecipient(shapes.narrator)
    setFirstClueFound(false)
    setIsVoting({})
    setClues([])

    await sendMessage(shapes.narrator, "!reset", "system")
    for (const suspect of suspectShapes) {
      await sendMessage(suspect, "!reset", "system")
    }

    const casePrompt = selectedCase
      ? `Begin the mystery "${selectedCase}". Start with: "Case: ${selectedCase}". Describe the mystery with **bold** key clues and *italic* suspicious hints. Assign roles to ${
          displayNames[shapes.suspectA]
        }, ${displayNames[shapes.suspectB]}, ${
          displayNames[shapes.suspectC]
        } (one is the **culprit**, others are innocent but suspicious). Do not reveal the culprit. Do not provide additional clues until the player uncovers the first clue.`
      : `Begin a random mystery. Start with: "Case: [Your Mystery Name]". Describe the mystery with **bold** key clues and *italic* suspicious hints. Assign roles to ${
          displayNames[shapes.suspectA]
        }, ${displayNames[shapes.suspectB]}, ${
          displayNames[shapes.suspectC]
        } (one is the **culprit**, others are innocent but suspicious). Do not reveal the culprit. Do not provide additional clues until the player uncovers the first clue.`

    const initResponse = await sendMessage(shapes.narrator, casePrompt)
    setConversation([{ from: "Narrator", message: initResponse }])
  }

  const handleSendMessage = async () => {
    if (!message.trim()) return

    let targetRecipient = recipient
    const mentionMatch = message.match(/@(\w+)/)
    if (mentionMatch) {
      const mention = mentionMatch[1].toLowerCase()
      const mentionMap = {
        narrator: shapes.narrator,
        a: shapes.suspectA,
        b: shapes.suspectB,
        c: shapes.suspectC,
      }
      if (mentionMap[mention] && !votedOut.includes(mentionMap[mention])) {
        targetRecipient = mentionMap[mention]
        setRecipient(targetRecipient)
      }
    }

    setConversation((prev) => [...prev, { from: "You", to: targetRecipient, message }])

    const content =
      targetRecipient === shapes.narrator && firstClueFound
        ? `${message}. If appropriate, provide a **bold** clue or *italic* hint, but do not reveal the culprit.`
        : targetRecipient !== shapes.narrator
          ? `${message}. Respond evasively, using *italic* hints to seem suspicious without admitting guilt.`
          : message

    const response = await sendMessage(targetRecipient, content)
    setConversation((prev) => [...prev, { from: displayNames[targetRecipient], message: response }])
    setMessage("")
    setShowMentionBox(false)
  }

  const handleKeyDown = (e) => {
    if (showMentionBox) {
      if (e.key === "ArrowUp") {
        e.preventDefault()
        setSelectedMentionIndex((prev) => (prev > 0 ? prev - 1 : mentionOptions.length - 1))
      } else if (e.key === "ArrowDown") {
        e.preventDefault()
        setSelectedMentionIndex((prev) => (prev < mentionOptions.length - 1 ? prev + 1 : 0))
      } else if (e.key === "Enter" && mentionOptions[selectedMentionIndex]) {
        e.preventDefault()
        const selected = mentionOptions[selectedMentionIndex]
        setMessage((prev) => prev.replace(/@\w*$/, `@${selected.alias} `))
        setRecipient(selected.value)
        setShowMentionBox(false)
      }
    } else if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const handleVoteOff = async (suspect) => {
    if (isVoting[suspect]) return
    setIsVoting((prev) => ({ ...prev, [suspect]: true }))

    const voteMessage = `Shape ${displayNames[suspect]} has been voted off. Respond with a suspenseful message using *italic* hints, but do not reveal if they were the culprit.${
      firstClueFound ? " Provide a **bold** clue if appropriate." : ""
    }`
    setConversation((prev) => [
      ...prev,
      {
        from: "You",
        to: shapes.narrator,
        message: `Shape ${displayNames[suspect]} has been voted off.`,
      },
    ])
    const response = await sendMessage(shapes.narrator, voteMessage)

    setVotedOut((prev) => [...prev, suspect])
    setSuspects((prev) => prev.filter((s) => s !== suspect))
    setConversation((prev) => [...prev, { from: "Narrator", message: response }])
    if (!firstClueFound) {
      setFirstClueFound(true)
    }

    if (suspects.length === 1) {
      const endResponse = await sendMessage(
        shapes.narrator,
        "Only one suspect remains. Reveal the outcome with **bold** clues and *suspicious* hints, stating if the player won or the culprit escaped.",
      )
      setConversation((prev) => [...prev, { from: "Narrator", message: endResponse }])
      setGameStatus(endResponse.toLowerCase().includes("escaped") ? "lost" : "won")
    }

    setIsVoting((prev) => ({ ...prev, [suspect]: false }))
  }

  const handleReturnSuspect = async (suspect) => {
    if (!canReturn) return
    setCanReturn(false)
    setSuspects((prev) => [...prev, suspect])
    setVotedOut((prev) => prev.filter((s) => s !== suspect))
    const returnMessage = `Shape ${displayNames[suspect]} has been brought back. Respond with a *suspicious* message about their return, keeping it vague.${
      firstClueFound ? " Provide a **bold** clue if appropriate." : ""
    }`
    setConversation((prev) => [
      ...prev,
      {
        from: "You",
        to: shapes.narrator,
        message: `Shape ${displayNames[suspect]} has been brought back.`,
      },
    ])
    const response = await sendMessage(shapes.narrator, returnMessage)
    setConversation((prev) => [...prev, { from: "Narrator", message: response }])
  }

  const handleSaveCase = () => {
    try {
      const caseData = {
        caseName: selectedCase || "Random Mystery",
        conversation,
        suspects,
        votedOut,
        gameStatus,
        canReturn,
        firstClueFound,
        recipient,
        clues,
      }
      const savedCases = localStorage.getItem("savedCases") ? JSON.parse(localStorage.getItem("savedCases")) : []
      const updatedCases = savedCases.filter((c) => c.caseName !== caseData.caseName)
      updatedCases.push(caseData)
      localStorage.setItem("savedCases", JSON.stringify(updatedCases))
      localStorage.setItem("savedCase", caseData.caseName)
      setSaveMessage({ text: "Case and conversation saved!", type: "success" })
    } catch (error) {
      console.error("Save error:", error)
      setSaveMessage({ text: "Failed to save case. Please try again.", type: "error" })
    }
  }

  const getCaseDescription = () => {
    return selectedCase
      ? caseDescriptions[selectedCase]
      : "A mysterious case awaits, shrouded in secrets. Uncover the truth behind this enigma."
  }

  const howToPlay = `
    Welcome to Shapes Whodunit! Your goal is to uncover the **culprit** behind a *mysterious crime*. Here's how to play:\n
    - **Start the Investigation**: Click *Start Investigation* to begin.\n
    - **Chat with Characters**: Use the chatbox to ask questions or request *clues*. Type @narrator, @a, @b, or @c to message a specific Shape, or select from the dropdown. Press *Enter* or *Shift+Enter* to send.\n
    - **Gather Clues**: The Narrator provides **bold clues** or *italic hints* as you investigate. Clues appear below the suspects.\n
    - **Vote Off Suspects**: If you suspect a Shape, vote them off. You can *bring back* one voted-off suspect if you change your mind.\n
    - **Win the Game**: Narrow down to the **culprit**. If the last suspect is the culprit, you win! If not, the *culprit escapes*, and you lose.
  `

  return (
    <div
      className={`${styles.game} ${
        typeof window !== "undefined" && document.body.classList.contains("dark") ? "dark" : ""
      }`}
    >
      <h2>{selectedCase || "Random Mystery"}</h2>

      {gameStatus === "not started" && (
        <div>
          <p
            className={`caseDescription ${
              typeof window !== "undefined" && document.body.classList.contains("dark") ? "dark" : ""
            }`}
          >
            {getCaseDescription()}
          </p>
          <button onClick={startGame} className="button" style={{ marginBottom: "1rem" }}>
            Start Investigation
          </button>
          <div
            className={`caseDescription ${
              typeof window !== "undefined" && document.body.classList.contains("dark") ? "dark" : ""
            }`}
          >
            <h3 style={{ fontSize: "1.3rem", marginBottom: "0.5rem" }}>How to Play</h3>
            <div dangerouslySetInnerHTML={{ __html: parseMessage(howToPlay) }} />
          </div>
          <button onClick={startGame} className="button" style={{ marginTop: "1rem" }}>
            Start Investigation
          </button>
        </div>
      )}

      {gameStatus === "ongoing" && (
        <>
          <div className={styles.suspects}>
            <h3>Suspects:</h3>
            <ul>
              {suspectShapes.map((suspect) => (
                <li
                  key={suspect}
                  className={`${styles.suspectItem} ${votedOut.includes(suspect) ? styles.votedOut : ""} ${
                    typeof window !== "undefined" && document.body.classList.contains("dark") ? "dark" : ""
                  }`}
                >
                  {displayNames[suspect]}
                  {!votedOut.includes(suspect) && (
                    <button
                      onClick={() => handleVoteOff(suspect)}
                      disabled={votedOut.includes(suspect) || isVoting[suspect]}
                      className={styles.voteButton}
                    >
                      Vote Off
                    </button>
                  )}
                  {votedOut.includes(suspect) && canReturn && (
                    <button onClick={() => handleReturnSuspect(suspect)} className={styles.returnButton}>
                      Bring Back
                    </button>
                  )}
                </li>
              ))}
            </ul>
            <div
              className={
                styles.clueBox +
                (typeof window !== "undefined" && document.body.classList.contains("dark") ? " " + styles.dark : "")
              }
            >
              <h3>Clues Discovered</h3>
              {clues.length > 0 ? (
                <ul className={styles.clueList}>
                  {clues.map((clue, index) => (
                    <li key={index} className={styles.clueItem}>
                      {clue}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className={styles.noClues}>No clues collected yet. Question the suspects to find evidence.</p>
              )}
            </div>
            <button onClick={handleSaveCase} className={`${styles.saveCase} button`} style={{ marginTop: "1rem" }}>
              Save This Case
            </button>
          </div>


                
          <div className={styles.chat}>
  <h3>Investigation</h3>
  <div className={styles.chatWrapper}> 
    <div className={styles.conversation}>
      {conversation.map((msg, index) => (
        <p
          key={index}
          dangerouslySetInnerHTML={{
            __html: `<strong>${msg.from}${
              msg.to ? ` to ${displayNames[msg.to] || msg.to}` : ""
            }:</strong> ${msg.message}`,
          }}
        />
      ))}
      {isTyping && (
        <div
          className={`${styles.typingIndicator} ${
            typeof window !== "undefined" && document.body.classList.contains("dark") ? styles.dark : ""
          }`}
        >
          <span>{typingSender} is typing</span>
          <span
            className={`${styles.dot} ${
              typeof window !== "undefined" && document.body.classList.contains("dark") ? styles.dark : ""
            }`}
          ></span>
          <span
            className={`${styles.dot} ${
              typeof window !== "undefined" && document.body.classList.contains("dark") ? styles.dark : ""
            }`}
          ></span>
          <span
            className={`${styles.dot} ${
              typeof window !== "undefined" && document.body.classList.contains("dark") ? styles.dark : ""
            }`}
          ></span>
        </div>
      )}
    </div>
  </div>

                
            <div className={styles.chatInput} style={{ position: "relative" }}>
              <select
                value={recipient}
                onChange={(e) => setRecipient(e.target.value)}
                disabled={gameStatus !== "ongoing"}
                className={typeof window !== "undefined" && document.body.classList.contains("dark") ? "dark" : ""}
              >
                <option value={shapes.narrator}>Narrator</option>
                {suspectShapes.map((suspect) => (
                  <option key={suspect} value={suspect} disabled={votedOut.includes(suspect)}>
                    {displayNames[suspect]}
                  </option>
                ))}
              </select>
              <input
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask a question or request a clue (e.g., @narrator, @a)..."
                className={`${styles.input} ${
                  typeof window !== "undefined" && document.body.classList.contains("dark") ? "dark" : ""
                }`}
                disabled={gameStatus !== "ongoing"}
                autoFocus
              />
              <button onClick={handleSendMessage} className="button" disabled={gameStatus !== "ongoing"}>
                Send
              </button>
              {showMentionBox && (
                <div
                  className={`${styles.mentionBox} ${
                    typeof window !== "undefined" && document.body.classList.contains("dark") ? styles.dark : ""
                  }`}
                >
                  {mentionOptions.map((option, index) => (
                    <div
                      key={option.value}
                      className={`${styles.mentionOption} ${index === selectedMentionIndex ? styles.selected : ""} ${
                        typeof window !== "undefined" && document.body.classList.contains("dark") ? styles.dark : ""
                      }`}
                      onClick={() => {
                        setMessage((prev) => prev.replace(/@\w*$/, `@${option.alias} `))
                        setRecipient(option.value)
                        setShowMentionBox(false)
                      }}
                    >
                      {option.name}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          {saveMessage && (
            <div
              className={`${styles.saveMessage} ${saveMessage.type === "success" ? styles.success : styles.error}`}
              role="alert"
            >
              {saveMessage.text}
            </div>
          )}
        </>
      )}

      {gameStatus === "won" && (
        <div
          className={`${styles.outcome} ${typeof window !== "undefined" && document.body.classList.contains("dark") ? styles.dark : ""}`}
        >
          <h3 className={styles.success}>You caught the culprit!</h3>
          <button onClick={startGame} className="button" style={{ marginRight: "1rem" }}>
            New Investigation
          </button>
          <button onClick={handleSaveCase} className={`${styles.saveCase} button`}>
            Save This Case
          </button>
        </div>
      )}
      {gameStatus === "lost" && (
        <div
          className={`${styles.outcome} ${typeof window !== "undefined" && document.body.classList.contains("dark") ? styles.dark : ""}`}
        >
          <h3 className={styles.failure}>The culprit slipped away!</h3>
          <button onClick={startGame} className="button" style={{ marginRight: "1rem" }}>
            Try Again
          </button>
          <button onClick={handleSaveCase} className={`${styles.saveCase} button`}>
            Save This Case
          </button>
        </div>
      )}
    </div>
  )
}

export default Game
