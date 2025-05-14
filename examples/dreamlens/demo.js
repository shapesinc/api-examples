async function getDreamReflection() {
  const response = await fetch("https://api.shapes.inc/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": "Bearer YOUR_API_KEY", // Replace with your actual API key
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: "shapesinc/dreamlensinterpreter",
      messages: [
        { role: "user", content: "I dreamed I was lost in a forest with no shoes." }
      ]
    })
  });

  const data = await response.json();
  console.log("Dream Reflection:", data);
}

getDreamReflection();
