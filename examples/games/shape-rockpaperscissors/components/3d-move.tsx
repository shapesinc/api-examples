"use client"

import { useRef, useEffect } from "react"
import * as THREE from "three"
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls"
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader"
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader"
import { cn } from "@/lib/utils"

type ThreeDMoveProps = {
  move: "rock" | "paper" | "scissors" | "lizard" | "spock"
  className?: string
  rotationSpeed?: number
  size?: "sm" | "md" | "lg"
  winner?: boolean
  loser?: boolean
}

export function ThreeDMove({
  move,
  className,
  rotationSpeed = 0.005,
  size = "md",
  winner = false,
  loser = false,
}: ThreeDMoveProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null)
  const sceneRef = useRef<THREE.Scene | null>(null)
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null)
  const modelRef = useRef<THREE.Group | null>(null)
  const frameIdRef = useRef<number>(0)

  // Update the size classes for better responsiveness
  const sizeClasses = {
    sm: "w-14 h-14 sm:w-16 sm:h-16",
    md: "w-20 h-20 sm:w-24 sm:h-24",
    lg: "w-24 h-24 sm:w-28 sm:h-28 md:w-32 md:h-32",
  }

  // Make the 3D move component more responsive
  // Update the useEffect to handle resize better
  useEffect(() => {
    if (!containerRef.current) return

    // Setup scene
    const scene = new THREE.Scene()
    sceneRef.current = scene

    // Add ambient light
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5)
    scene.add(ambientLight)

    // Add directional light
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1)
    directionalLight.position.set(1, 1, 1)
    scene.add(directionalLight)

    // Add point light
    const pointLight = new THREE.PointLight(winner ? 0x00ff00 : loser ? 0xff0000 : 0x9f7aea, winner || loser ? 2 : 1)
    pointLight.position.set(0, 0, 2)
    scene.add(pointLight)

    // Setup camera
    const camera = new THREE.PerspectiveCamera(
      75,
      containerRef.current.clientWidth / containerRef.current.clientHeight,
      0.1,
      1000,
    )
    camera.position.z = 2
    cameraRef.current = camera

    // Setup renderer
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
    })
    renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)) // Limit pixel ratio for performance
    containerRef.current.appendChild(renderer.domElement)
    rendererRef.current = renderer

    // Setup controls
    const controls = new OrbitControls(camera, renderer.domElement)
    controls.enableDamping = true
    controls.dampingFactor = 0.05
    controls.enableZoom = false
    controls.enablePan = false // Disable panning for better mobile experience

    // Load 3D model based on move
    const dracoLoader = new DRACOLoader()
    dracoLoader.setDecoderPath("https://www.gstatic.com/draco/versioned/decoders/1.5.5/")

    const loader = new GLTFLoader()
    loader.setDRACOLoader(dracoLoader)

    // Create placeholder geometry while model loads
    const geometry = new THREE.SphereGeometry(0.5, 32, 32)
    const material = new THREE.MeshStandardMaterial({
      color: winner ? 0x00ff00 : loser ? 0xff0000 : 0x9f7aea,
      emissive: winner ? 0x00ff00 : loser ? 0xff0000 : 0x9f7aea,
      emissiveIntensity: 0.2,
      roughness: 0.3,
      metalness: 0.8,
    })
    const placeholder = new THREE.Mesh(geometry, material)
    scene.add(placeholder)

    // Animation loop
    const animate = () => {
      frameIdRef.current = requestAnimationFrame(animate)

      if (modelRef.current) {
        modelRef.current.rotation.y += rotationSpeed
      } else {
        placeholder.rotation.y += rotationSpeed
      }

      controls.update()
      renderer.render(scene, camera)
    }

    animate()

    // Handle resize - improved for better responsiveness
    const handleResize = () => {
      if (!containerRef.current || !cameraRef.current || !rendererRef.current) return

      const width = containerRef.current.clientWidth
      const height = containerRef.current.clientHeight

      cameraRef.current.aspect = width / height
      cameraRef.current.updateProjectionMatrix()
      rendererRef.current.setSize(width, height)
      rendererRef.current.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    }

    window.addEventListener("resize", handleResize)

    // Initial resize to ensure correct dimensions
    handleResize()

    // Cleanup
    return () => {
      window.removeEventListener("resize", handleResize)
      cancelAnimationFrame(frameIdRef.current)

      if (rendererRef.current && containerRef.current) {
        containerRef.current.removeChild(rendererRef.current.domElement)
      }

      rendererRef.current?.dispose()
    }
  }, [move, rotationSpeed, winner, loser])

  return (
    <div
      ref={containerRef}
      className={cn(
        sizeClasses[size],
        "relative rounded-full overflow-hidden",
        winner ? "ring-4 ring-green-500" : "",
        loser ? "ring-4 ring-red-500" : "",
        className,
      )}
    />
  )
}
