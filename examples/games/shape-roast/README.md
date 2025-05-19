
# 🔥 shape-roast

**Roast.SaaS** is a fun little AI-powered roast machine built with HTML, CSS, JS and the [Shapes API](https://github.com/shapesinc/shapes-api).

Type something roastable, pick a mood, and Shape will insult you like a sarcastic bestie 😈

---

## 📸 Live Demo

👉 **Try it now**: [https://guess.nextgencoders.xyz](https://guess.nextgencoders.xyz)

---

## 📁 Folder Structure

```

shape-roast/
├── index.js             # Express.js server
├── package.json         # Dependencies
├── .gitignore           # Hides .env and node\_modules
├── public/
│   └── index.html       # All-in-one HTML (CSS + JS included)
└── README.md

````

---

## ⚙️ Setup Instructions

> Make sure Node.js is installed.

### 1. Clone the repo:

```bash
cd shape-roast
````

### 2. Install dependencies:

```bash
npm install
```

### 3. Create `.env` file:

```env
SHAPES_API_KEY=your-shapes-api-key-here
SHAPE_MODEL=shapesinc/your-shape-name
```

> 🔐 Don't commit `.env` — it's already in `.gitignore`

### 4. Start the server:

```bash
npm start
```

Then open 👉 [http://localhost:3000](http://localhost:3000)

---

## 🌟 Features

* 🤖 Shape AI-based roast generation
* 😂 Mood selector using emoji
* 🔁 Roast history with localStorage
* 📲 Mobile-first responsive UI
* 🧠 Smart insult wording

---

## 🚀 Deploy Anywhere

You can deploy this to:

* [Vercel](https://vercel.com)
* [Render](https://render.com)
* [Railway](https://railway.app)

Set the `.env` variables via dashboard + point root to `index.js`

---

## 🧠 Powered By

* ✨ [Shapes API](https://github.com/shapesinc/shapes-api)
* 👨‍💻 Built by [NextGenCoders](https://nextgencoders.xyz)

---

## 📄 License

MIT — Use it, fork it, roast with it.

---


"Built during a random bored hour. No regrets. Only roasts. 😎"





