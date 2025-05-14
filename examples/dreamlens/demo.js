// examples/dreamlens/demo.js

async function getDreamReflection() {
  const response = await fetch("https://api.shapes.inc/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": "Bearer YOUR_API_KEY",
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: "shapes-v1",
      messages: [
        { role: "system", content: "You are an empathetic dream therapist." },
        { role: "user", content: "I dreamed I was lost in a forest with no shoes." }
      ]
    })
  });

  const data = await response.json();
  console.log("Dream Reflection:", data);
}

getDreamReflection();
