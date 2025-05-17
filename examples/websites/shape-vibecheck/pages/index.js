import { useState } from 'react';
import Head from 'next/head';
import { motion, AnimatePresence } from 'framer-motion';
import { VibeCard } from '../components/VibeCard';
import styles from '../styles/Home.module.css'; 

export default function Home() {
  const [username, setUsername] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setResult(null);

    try {
      const response = await fetch(`/api/scrape?username=${username}`);
      if (!response.ok) throw new Error('failed to fetch data');
      const data = await response.json();
      setResult(data.vibeAnalysis);
    } catch (err) {
      setError('fuck failed to analyze your vibe. try again later pls.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <Head>
        <title>X vibe checker</title>     
        <meta name="description" content="just a sloppy vibe checker for X" />
        <meta name="keywords" content="vibe checker, X username analysis, social media vibes, vibe analysis tool" />
        <meta property="og:title" content="X vibe checker" />
        <meta property="og:description" content="just a sloppy vibe checker for X" />
        <meta property="og:image" content="https://vibe-checker.vercel.app/components/lyraxia.png" />
        <meta property="og:url" content="https://vibe-checker.vercel.app" />
        <link rel="icon" href="../components/lyraxia.png" />
      </Head>

      <main>
        <motion.h1
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className={`text-5xl font-bold ${styles.glow}`}
        >
          X vibe checker
        </motion.h1>

        {!loading && !result && (
          <motion.form
  onSubmit={handleSubmit}
  initial={{ opacity: 0, scale: 0.8 }}
  animate={{ opacity: 1, scale: 1 }}
  transition={{ duration: 0.5, delay: 0.2 }}
  className={styles.inputContainer}
>
  <div className={styles.inputWrapper}>
    <span className={styles.atSymbol}>@</span>
    <input
      type="text"
      value={username}
      onChange={(e) => setUsername(e.target.value)} 
      placeholder="enter your X username"
      className={styles.inputField}
    />
  </div>
  <button
    type="submit"
    disabled={loading}
    className={styles.submitButton}
  >
    {loading ? 'analyzing vibe...' : 'check vibe'}
  </button>
</motion.form>
        )}
      
        {loading && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className={styles.loadingContainer}
          >
            <div className={styles.spinner}></div>
            <p className={styles.loadingText}>Analyzing your vibe...</p>
          </motion.div>
        )}

        <AnimatePresence>
          {result && (
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -50 }}
              transition={{ duration: 0.5 }}
              className="flex justify-center"
            >
              <VibeCard result={result} username={username} />
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {error && (
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className={styles.errorText}
            >
              {error}
            </motion.p>
          )}
        </AnimatePresence>
      </main>
      <footer>
  <p className={`${styles.footerText} animate-pulse`}>
    created with 😭 and shapes api by <a href="https://x.com/_kiyosh1" target="_blank" rel="noopener noreferrer" style={{ color: '#00FFFF', fontWeight: 'bold' }}>@_kiyosh1</a>, 
    i spent 3 days working on this slop, so start building. this is v2 btw.
  </p>
</footer>
    </div>
  );
}
