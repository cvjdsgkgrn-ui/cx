import { useRef, useMemo } from "react"
import { Canvas, useFrame, useThree } from "@react-three/fiber"
import { Sky } from "@react-three/drei"
import GardenScene from "./GardenScene"
import SafeCanvas from "./SafeCanvas"
import { getTileData } from "../utils/pathfinding"
import { createCharacterModel } from "./CharacterSystem"

function FollowCamera({ character }) {
  const { camera } = useThree()

  useFrame(() => {
    if (!character) return
    // Character's forward direction
    const rx = Math.sin(character.rotation || 0)
    const rz = Math.cos(character.rotation || 0)
    // Camera behind and above
    camera.position.set(
      character.position.x - rx * 2.5,
      1.6,
      character.position.z - rz * 2.5
    )
    camera.lookAt(
      character.position.x + rx * 5,
      1.0,
      character.position.z + rz * 5
    )
  })

  return null
}

function OtherCharacters({ characters, excludeId }) {
  const models = useMemo(() => {
    return characters
      .filter(c => c.id !== excludeId)
      .map(c => ({
        id: c.id,
        model: createCharacterModel(c.color, c.gender === "male", c.age || 30),
        char: c
      }))
  }, [characters, excludeId])

  useFrame(() => {
    // Update model positions from ref data
    models.forEach(({ model, char }) => {
      model.position.x = char.position.x
      model.position.z = char.position.z
      model.rotation.y = char.rotation || 0
    })
  })

  return (
    <group>
      {models.map(({ id, model }) => (
        <primitive key={id} object={model} />
      ))}
    </group>
  )
}

export default function POVRenderer({ character, characters }) {
  if (!character) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", color: "#555", fontSize: 12 }}>
      选择一个角色查看视角
    </div>
  )

  const tileData = getTileData()

  return (
    <div style={{ width: "100%", height: "100%", background: "#000" }}>
      <SafeCanvas>
        <Canvas
          shadows
          style={{ position: "absolute", inset: 0 }}
          gl={{ preserveDrawingBuffer: false, alpha: false, antialias: true }}
        >
          <FollowCamera character={character} />
          <Sky sunPosition={[100, 20, 100]} />
          <ambientLight intensity={0.5} />
          <directionalLight position={[20, 25, 10]} intensity={1.3} castShadow shadow-mapSize={[512, 512]} />
          <GardenScene weather="sunny" tileData={tileData} />
          <OtherCharacters characters={characters} excludeId={character.id} />
        </Canvas>
      </SafeCanvas>
    </div>
  )
}


