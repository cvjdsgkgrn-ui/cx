import { useRef, useMemo } from "react"
import { useFrame } from "@react-three/fiber"
import { Text } from "@react-three/drei"
import * as THREE from "three"

// 陶俑风格: 扁圆柱身体 + 球头 + 圆盘斗笠 + 磨砂单色
export function createCharacterModel(color, isMale, age) {
  const group = new THREE.Group()
  const s = Math.min(1.15, Math.max(0.55, age < 14 ? 0.6 : age < 25 ? 0.85 : age < 60 ? 1.0 : 0.9))

  // 斗笠 — 扁锥顶 + 宽圆盘
  const hatTop = new THREE.ConeGeometry(0.22 * s, 0.12 * s, 6)
  const hatBrim = new THREE.CylinderGeometry(0.38 * s, 0.38 * s, 0.03 * s, 8)
  const hatMat = new THREE.MeshStandardMaterial({ color: isMale ? "#3a5a7c" : "#c47a8a", roughness: 0.55 })
  const hatCone = new THREE.Mesh(hatTop, hatMat)
  hatCone.position.y = 1.38 * s
  group.add(hatCone)
  const hatDisc = new THREE.Mesh(hatBrim, hatMat)
  hatDisc.position.y = 1.3 * s
  group.add(hatDisc)

  // 头 — 球体, 肤色
  const head = new THREE.Mesh(
    new THREE.SphereGeometry(0.28 * s, 12, 12),
    new THREE.MeshStandardMaterial({ color: "#d4b896", roughness: 0.55 })
  )
  head.position.y = 1.0 * s
  head.castShadow = true
  group.add(head)


  // 身体 — 扁圆柱 (陶俑身体)
  const body = new THREE.Mesh(
    new THREE.CylinderGeometry(0.22 * s, 0.26 * s, 0.55 * s, 8),
    new THREE.MeshStandardMaterial({ color, roughness: 0.6 })
  )
  body.position.y = 0.55 * s
  body.castShadow = true
  group.add(body)

  // 底部小圆盘 (底座, 像陶俑的底座)
  const base = new THREE.Mesh(
    new THREE.CylinderGeometry(0.22 * s, 0.24 * s, 0.08 * s, 8),
    new THREE.MeshStandardMaterial({ color: "#8a7a6a", roughness: 0.7 })
  )
  base.position.y = 0.2 * s
  group.add(base)

  return group
}

// Character mesh component
export function CharacterMesh({ character, isSelected, onClick, sceneSize }) {
  const meshRef = useRef()
  const bouncePhase = useRef(Math.random() * Math.PI * 2)

  const model = useMemo(() => {
    return createCharacterModel(character.color, character.gender === "male", character.age || 30)
  }, [character.color, character.gender, character.age])

  useFrame((_, delta) => {
    if (!meshRef.current) return
    const group = meshRef.current
    const char = character
    const dt = Math.min(delta, 0.1)

    if (char.target && !char.isResting && !char.isConversing) {
      const dx = char.target.x - group.position.x
      const dz = char.target.z - group.position.z
      const dist = Math.sqrt(dx * dx + dz * dz)

      if (dist > 0.15) {
        const speed = 0.35
        const step = speed * dt
        group.position.x += (dx / dist) * step
        group.position.z += (dz / dist) * step
        char.position.x = group.position.x
        char.position.z = group.position.z

        bouncePhase.current += dt * 3
        group.position.y = Math.abs(Math.sin(bouncePhase.current)) * 0.015

        const targetAngle = Math.atan2(dx, dz)
        let diff = targetAngle - group.rotation.y
        while (diff > Math.PI) diff -= Math.PI * 2
        while (diff < -Math.PI) diff += Math.PI * 2
        group.rotation.y += diff * Math.min(1, 2.5 * dt)
      } else {
        group.position.y = 0
        char.target = null
      }
    }

    if (char.isResting && !char.isConversing) {
      group.position.y = 0
    }

    if (char.isSpeaking) {
      bouncePhase.current += dt * 4
      group.position.y = Math.abs(Math.sin(bouncePhase.current)) * 0.12
    }
  })

  return (
    <primitive
      ref={meshRef}
      object={model}
      position={[character.position.x, 0, character.position.z]}
      rotation={[0, character.rotation || 0, 0]}
      onClick={(e) => { e.stopPropagation(); onClick(character) }}
      scale={isSelected ? 1.12 : 1}
    />
  )
}

// Name label
export function CharacterLabel({ character }) {
  const labelRef = useRef()
  useFrame(() => {
    if (labelRef.current) {
      labelRef.current.position.x = character.position.x
      labelRef.current.position.z = character.position.z
    }
  })

  return (
    <Text
      ref={labelRef}
      position={[character.position.x, 1.85, character.position.z]}
      fontSize={0.22}
      color="#ffffff"
      anchorX="center"
      anchorY="middle"
      outlineWidth={0.03}
      outlineColor="#000000"
    >
      {character.name}
    </Text>
  )
}

// Speech bubble
export function SpeechBubble3D({ character }) {
  const bubbleRef = useRef()
  useFrame(() => {
    if (bubbleRef.current) {
      bubbleRef.current.position.x = character.position.x
      bubbleRef.current.position.z = character.position.z
    }
  })

  if (!character.dialogueText) return null
  const txt = character.dialogueText.length > 30 ? character.dialogueText.substring(0, 30) + "..." : character.dialogueText
  return (
    <group ref={bubbleRef} position={[character.position.x, 2.0, character.position.z]}>
      <mesh>
        <planeGeometry args={[2.2, 0.7]} />
        <meshBasicMaterial color="black" transparent opacity={0.8} depthTest={false} />
      </mesh>
      <Text position={[0, 0, 0.01]} fontSize={0.14} color="#ffffff" maxWidth={2.0} anchorX="center" anchorY="middle">
        {txt}
      </Text>
    </group>
  )
}


