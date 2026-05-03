import { useEffect, useRef, useCallback } from 'react'

/*
 * CosmicBackground — A high-performance, GPU-friendly canvas animation
 * featuring a constellation particle network with mouse interactivity,
 * flowing gradient waves, and pulsing energy nodes.
 */

const CONFIG = {
  particleCount: 90,
  connectionDistance: 160,
  mouseRadius: 200,
  baseSpeed: 0.3,
  colors: {
    violet: { r: 139, g: 92, b: 246 },
    cyan: { r: 6, g: 182, b: 212 },
    rose: { r: 244, g: 63, b: 94 },
    indigo: { r: 99, g: 102, b: 241 },
  },
  waveCount: 3,
  energyNodeCount: 5,
}

class Particle {
  constructor(w, h) {
    this.reset(w, h)
  }

  reset(w, h) {
    this.x = Math.random() * w
    this.y = Math.random() * h
    this.vx = (Math.random() - 0.5) * CONFIG.baseSpeed * 2
    this.vy = (Math.random() - 0.5) * CONFIG.baseSpeed * 2
    this.radius = Math.random() * 2 + 0.5
    this.baseRadius = this.radius
    this.opacity = Math.random() * 0.5 + 0.2

    const colorKeys = Object.keys(CONFIG.colors)
    this.color = CONFIG.colors[colorKeys[Math.floor(Math.random() * colorKeys.length)]]
    this.pulseSpeed = Math.random() * 0.02 + 0.005
    this.pulsePhase = Math.random() * Math.PI * 2
  }

  update(w, h, time, mouseX, mouseY) {
    // Pulse
    this.radius = this.baseRadius + Math.sin(time * this.pulseSpeed + this.pulsePhase) * 0.5

    // Mouse repulsion
    if (mouseX !== null && mouseY !== null) {
      const dx = this.x - mouseX
      const dy = this.y - mouseY
      const dist = Math.sqrt(dx * dx + dy * dy)
      if (dist < CONFIG.mouseRadius) {
        const force = (CONFIG.mouseRadius - dist) / CONFIG.mouseRadius
        const angle = Math.atan2(dy, dx)
        this.vx += Math.cos(angle) * force * 0.8
        this.vy += Math.sin(angle) * force * 0.8
        this.radius = this.baseRadius + force * 3
      }
    }

    // Damping
    this.vx *= 0.98
    this.vy *= 0.98

    // Ensure minimum speed
    const speed = Math.sqrt(this.vx * this.vx + this.vy * this.vy)
    if (speed < CONFIG.baseSpeed * 0.5) {
      this.vx += (Math.random() - 0.5) * 0.1
      this.vy += (Math.random() - 0.5) * 0.1
    }

    this.x += this.vx
    this.y += this.vy

    // Wrap around edges
    if (this.x < -20) this.x = w + 20
    if (this.x > w + 20) this.x = -20
    if (this.y < -20) this.y = h + 20
    if (this.y > h + 20) this.y = -20
  }

  draw(ctx) {
    ctx.beginPath()
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2)
    ctx.fillStyle = `rgba(${this.color.r}, ${this.color.g}, ${this.color.b}, ${this.opacity})`
    ctx.fill()

    // Glow
    if (this.radius > 1.5) {
      ctx.beginPath()
      ctx.arc(this.x, this.y, this.radius * 3, 0, Math.PI * 2)
      ctx.fillStyle = `rgba(${this.color.r}, ${this.color.g}, ${this.color.b}, ${this.opacity * 0.1})`
      ctx.fill()
    }
  }
}

class EnergyNode {
  constructor(w, h) {
    this.x = Math.random() * w
    this.y = Math.random() * h
    this.targetX = Math.random() * w
    this.targetY = Math.random() * h
    this.radius = Math.random() * 40 + 30
    this.pulsePhase = Math.random() * Math.PI * 2
    const colorKeys = Object.keys(CONFIG.colors)
    this.color = CONFIG.colors[colorKeys[Math.floor(Math.random() * colorKeys.length)]]
    this.speed = Math.random() * 0.3 + 0.1
  }

  update(w, h, time) {
    // Drift toward target
    this.x += (this.targetX - this.x) * 0.003
    this.y += (this.targetY - this.y) * 0.003

    // Pick new target when close
    const dx = this.targetX - this.x
    const dy = this.targetY - this.y
    if (Math.sqrt(dx * dx + dy * dy) < 20) {
      this.targetX = Math.random() * w
      this.targetY = Math.random() * h
    }

    this.currentRadius = this.radius + Math.sin(time * 0.002 + this.pulsePhase) * 15
  }

  draw(ctx) {
    const gradient = ctx.createRadialGradient(
      this.x, this.y, 0,
      this.x, this.y, this.currentRadius
    )
    gradient.addColorStop(0, `rgba(${this.color.r}, ${this.color.g}, ${this.color.b}, 0.12)`)
    gradient.addColorStop(0.5, `rgba(${this.color.r}, ${this.color.g}, ${this.color.b}, 0.04)`)
    gradient.addColorStop(1, 'transparent')

    ctx.beginPath()
    ctx.arc(this.x, this.y, this.currentRadius, 0, Math.PI * 2)
    ctx.fillStyle = gradient
    ctx.fill()
  }
}

export default function CosmicBackground() {
  const canvasRef = useRef(null)
  const mouseRef = useRef({ x: null, y: null })
  const animRef = useRef(null)
  const particlesRef = useRef([])
  const nodesRef = useRef([])

  const init = useCallback((canvas) => {
    const w = canvas.width
    const h = canvas.height

    particlesRef.current = Array.from(
      { length: CONFIG.particleCount },
      () => new Particle(w, h)
    )
    nodesRef.current = Array.from(
      { length: CONFIG.energyNodeCount },
      () => new EnergyNode(w, h)
    )
  }, [])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    let dpr = window.devicePixelRatio || 1

    const resize = () => {
      dpr = window.devicePixelRatio || 1
      canvas.width = window.innerWidth * dpr
      canvas.height = window.innerHeight * dpr
      canvas.style.width = window.innerWidth + 'px'
      canvas.style.height = window.innerHeight + 'px'
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      init(canvas)
    }

    resize()
    window.addEventListener('resize', resize)

    const handleMouse = (e) => {
      mouseRef.current.x = e.clientX
      mouseRef.current.y = e.clientY
    }
    const handleMouseLeave = () => {
      mouseRef.current.x = null
      mouseRef.current.y = null
    }

    window.addEventListener('mousemove', handleMouse)
    window.addEventListener('mouseleave', handleMouseLeave)

    let time = 0

    const drawWaves = (w, h) => {
      for (let i = 0; i < CONFIG.waveCount; i++) {
        ctx.beginPath()
        const yOffset = h * 0.4 + i * h * 0.15
        const amplitude = 40 + i * 15
        const frequency = 0.003 - i * 0.0005
        const speed = time * (0.5 + i * 0.2)
        const color = i === 0 ? CONFIG.colors.violet : i === 1 ? CONFIG.colors.cyan : CONFIG.colors.rose

        ctx.moveTo(-10, yOffset)
        for (let x = -10; x <= w + 10; x += 4) {
          const y = yOffset +
            Math.sin(x * frequency + speed * 0.01) * amplitude +
            Math.sin(x * frequency * 2.5 + speed * 0.008) * amplitude * 0.3
          ctx.lineTo(x, y)
        }

        ctx.strokeStyle = `rgba(${color.r}, ${color.g}, ${color.b}, ${0.04 - i * 0.008})`
        ctx.lineWidth = 1.5
        ctx.stroke()
      }
    }

    const drawConnections = (particles) => {
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x
          const dy = particles[i].y - particles[j].y
          const dist = Math.sqrt(dx * dx + dy * dy)

          if (dist < CONFIG.connectionDistance) {
            const opacity = (1 - dist / CONFIG.connectionDistance) * 0.15
            const p = particles[i]

            // Create gradient line for extra depth
            ctx.beginPath()
            ctx.moveTo(particles[i].x, particles[i].y)
            ctx.lineTo(particles[j].x, particles[j].y)
            ctx.strokeStyle = `rgba(${p.color.r}, ${p.color.g}, ${p.color.b}, ${opacity})`
            ctx.lineWidth = 0.6
            ctx.stroke()
          }
        }
      }

      // Mouse connections
      const { x: mx, y: my } = mouseRef.current
      if (mx !== null && my !== null) {
        for (const p of particles) {
          const dx = p.x - mx
          const dy = p.y - my
          const dist = Math.sqrt(dx * dx + dy * dy)
          if (dist < CONFIG.mouseRadius) {
            const opacity = (1 - dist / CONFIG.mouseRadius) * 0.25
            ctx.beginPath()
            ctx.moveTo(mx, my)
            ctx.lineTo(p.x, p.y)
            ctx.strokeStyle = `rgba(139, 92, 246, ${opacity})`
            ctx.lineWidth = 0.8
            ctx.stroke()
          }
        }
      }
    }

    const animate = () => {
      time++
      const w = window.innerWidth
      const h = window.innerHeight

      // Clear
      ctx.clearRect(0, 0, w, h)

      // Energy nodes (background glow)
      for (const node of nodesRef.current) {
        node.update(w, h, time)
        node.draw(ctx)
      }

      // Waves
      drawWaves(w, h)

      // Particles
      for (const p of particlesRef.current) {
        p.update(w, h, time, mouseRef.current.x, mouseRef.current.y)
      }

      drawConnections(particlesRef.current)

      for (const p of particlesRef.current) {
        p.draw(ctx)
      }

      animRef.current = requestAnimationFrame(animate)
    }

    animate()

    return () => {
      cancelAnimationFrame(animRef.current)
      window.removeEventListener('resize', resize)
      window.removeEventListener('mousemove', handleMouse)
      window.removeEventListener('mouseleave', handleMouseLeave)
    }
  }, [init])

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none fixed inset-0 z-0"
      style={{ background: 'transparent' }}
    />
  )
}
