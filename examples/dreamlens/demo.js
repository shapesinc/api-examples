// demo.js

async function getDreamReflection() {
  const SHAPES_KEY = Deno.env.get("SHAPES_KEY");

  const response = await fetch("https://api.shapes.inc/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${SHAPES_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: "shapesinc/dreamlensinterpreter",
      messages: [
        {
          role: "user",
          content: "I dreamed I was lost in a forest with no shoes."
        }
      ]
    })
  });

  const data = await response.json();
  console.log("Dream Reflection:", data);
}

getDreamReflection();
