// Character types and presets
export const PRESET_CHARACTERS = [
  { id: "wa", name: "老周", role: "瓦匠", age: 45, color: "#e2b04a", gender: "male", persona: "经验丰富的老瓦匠，香山帮传人，对每一片瓦的位置都精益求精。说话慢条斯理，喜欢用打比方的方式讲道理。" },
  { id: "mu", name: "小林", role: "木匠", age: 28, color: "#4ecdc4", gender: "male", persona: "年轻的木匠学徒，手艺精湛但偶尔毛躁。热爱苏州园林的榫卯结构，随身带着小本子记录灵感。" },
  { id: "you", name: "芸娘", role: "游客", age: 22, color: "#ff6b9d", gender: "female", persona: "建筑系学生，第一次来苏州园林，对一切充满好奇。喜欢拍照、画速写，常问一些天马行空的问题。" }
]

// Default non-deletable character IDs
export const PRESET_IDS = new Set(["wa", "mu", "you"])

// Scene configuration
export const SCENE_SIZE = 30
export const CONVERSE_DIST = 5
export const CONVERSE_COOLDOWN_MS = 30000

// Points of Interest
export const POIS = [
  { x: -10, z: -8, label: "亭台" },
  { x: 8, z: -5, label: "长廊" },
  { x: 5, z: 5, label: "月洞门" },
  { x: -6, z: 8, label: "石桥" },
  { x: 0, z: 0, label: "庭院中心" },
  { x: -12, z: 2, label: "水榭" },
  { x: 12, z: 8, label: "竹径" }
]

// Weather
export const WEATHER_PRESETS = {
  sunny: { sky: "#87CEEB", light: "#fff8e1", intensity: 1.3, ambient: 0.5 },
  cloudy: { sky: "#b0b8c0", light: "#d0d0d0", intensity: 0.8, ambient: 0.4 },
  dusk: { sky: "#e8945a", light: "#f4c78e", intensity: 1.0, ambient: 0.35 },
  night: { sky: "#1a1a3e", light: "#8888cc", intensity: 0.4, ambient: 0.2 }
}

// Knowledge cards — educational content about Suzhou gardens
export const KNOWLEDGE_CARDS = [
  { title: "香山帮营造技艺", text: "香山帮是中国传统建筑营造的重要流派，起源于苏州香山地区，以精湛的木作、瓦作、石作技艺闻名，被列入国家级非物质文化遗产。" },
  { title: "苏州园林借景手法", text: "借景是苏州园林的核心设计手法之一——将园外远景「借」入园内视野，使有限空间产生无限延伸之感。拙政园的远借北寺塔即为经典案例。" },
  { title: "榫卯结构", text: "中国传统木结构建筑中，构件之间不使用钉子，而是通过榫头与卯眼的咬合实现连接。这种结构具有良好的抗震性能和可拆卸性。" },
  { title: "月洞门", text: "月洞门是苏州园林中常见的圆形门洞形式，象征「圆满」与「通达」。它不仅起到连通空间的作用，更是一幅天然的「框景」画框。" },
  { title: "飞檐翘角", text: "飞檐是中国传统建筑屋顶的独特造型，檐角向上翘起，既有利于排水采光，又在视觉上形成了轻盈灵动的美感。" }
]


