import path from "path"
import react from "@vitejs/plugin-react-swc"
import tailwindcss from '@tailwindcss/vite'

import { defineConfig } from 'vite'

export default defineConfig({
    plugins: [
        react(),
        tailwindcss(),
    ],
    resolve: {
        dedupe: [
            'react',
            'react-dom',
        ],
        alias: {
            "@": path.resolve(__dirname, './src'),
            'react': path.resolve(__dirname, './node_modules/react'),
            'react-dom': path.resolve(__dirname, './node_modules/react-dom'),
        },
    },
    server: {
        host: "0.0.0.0",
        port: 8000,
        open: true,
    },
})
