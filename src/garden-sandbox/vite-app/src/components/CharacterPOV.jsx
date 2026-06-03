import { useState, useRef, useCallback } from "react"
import { Canvas, useFrame } from "@react-three/fiber"
import { PerspectiveCamera, OrbitControls } from "@react-three/drei"
import GardenScene from "./GardenScene"
import { CharacterMesh, CharacterLabel, SpeechBubble3D } from "./CharacterSystem"
import { SCENE_SIZE } from "../store/gameData"

// Character POV — render the 3D garden from a characters eyes
export default function CharacterPOV({ character, characters, weather, onClose }) {
  return (
    <div style={{ width: "100%", height: "100%", position: "relative", background: "#000" }}>
      <Canvas shadows>
        <PerspectiveCamera
          makeDefault
          position={[
            character.position.x,
            1.5,
            character.position.z
          ]}
          fov={70}
          near={0.1}
          far={100}
        />
        <ambientLight intensity={0.3} />
        <directionalLight position={[20, 25, 10]} intensity={0.8} />
        <GardenScene weather={weather} />
        {characters.filter(c => c.id !== character.id).map(c => (
          <group key={c.id}>
            <CharacterMesh character={c} isSelected={false} onClick={() => {}} sceneSize={SCENE_SIZE} />
            <CharacterLabel character={c} />
            {c.dialogueText && <SpeechBubble3D character={c} text={c.dialogueText} />}
          </group>
        ))}
        <POVTracker character={character} />
      </Canvas>
    </div>
  )
}

function POVTracker({ character }) {
  // This component follows the character so the POV camera stays attached
  useFrame(({ camera }) => {
    camera.position.set(
      character.position.x,
      1.5,
      character.position.z
    )
    // Look in the direction the character is facing
    const rx = Math.sin(character.rotation || 0)
    const rz = Math.cos(character.rotation || 0)
    camera.lookAt(
      character.position.x + rx * 10,
      1.3,
      character.position.z + rz * 10
    )
  })
  return null
}
