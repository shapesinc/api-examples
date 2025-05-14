const { TeamsActivityHandler, TurnContext } = require("botbuilder");
const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, ".env") });

const { OpenAI } = require("openai");

const SHAPES_API_KEY = process.env.SHAPESINC_API_KEY;
const SHAPES_USERNAME = process.env.SHAPESINC_SHAPE_USERNAME;

const shapes = new OpenAI({
  apiKey: SHAPES_API_KEY,
  baseURL: "https://api.shapes.inc/v1",
});

async function processWithShapes(content, userId, threadId) {
  if (!content || content.trim() === '') {
    return "Please provide some text.";
  }

  try {
    const headers = {
      "X-User-Id": userId,
      ...(threadId && { "X-Channel-Id": threadId }),
    };

    const response = await shapes.chat.completions.create(
      {
        model: `shapesinc/${SHAPES_USERNAME}`,
        messages: [{ role: "user", content }],
      },
      { headers }
    );

    return response.choices?.[0]?.message?.content || "I didn't get that.";
  } catch (error) {
    console.error("Shapes API Error:", error.message);
    return "Shape failed to respond. Try again later.";
  }
}

class TeamsBot extends TeamsActivityHandler {
  constructor() {
    super();

    this.onMessage(async (context, next) => {
      console.log("Received message from Teams.");

      const removedMentionText = TurnContext.removeRecipientMention(context.activity);
      let txt = removedMentionText?.toLowerCase().replace(/\n|\r/g, "").trim();

      const userId = `teams-user-${context.activity.from.id}`;
      const threadId = `teams-thread-${context.activity.conversation.id}`;
      
      // Handle command-based triggers (!ask and !shape)
      let content = txt;
      if (txt.startsWith('!ask ')) {
        content = txt.substring(5).trim();
      } else if (txt.startsWith('!shape ')) {
        content = txt.substring(7).trim();
      }

      if (content && content.trim() !== '') {
        const aiReply = await processWithShapes(content, userId, threadId);
        await context.sendActivity(aiReply);
      } else if (txt.startsWith('!ask') || txt.startsWith('!shape')) {
        await context.sendActivity("Please include your question or prompt after the command. For example: `!ask What is the weather today?`");
      }
      
      await next();
    });

    this.onMembersAdded(async (context, next) => {
      const membersAdded = context.activity.membersAdded;
      for (let cnt = 0; cnt < membersAdded.length; cnt++) {
        if (membersAdded[cnt].id) {
          await context.sendActivity(`Hi there! I'm ${SHAPES_USERNAME}, a bot that can answer your questions using the Shapes API. You can interact with me by mentioning me or using !ask or !shape commands.`);
          break;
        }
      }
      await next();
    });
  }
}

module.exports.TeamsBot = TeamsBot;