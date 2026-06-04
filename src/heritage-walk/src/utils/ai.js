// DeepSeek API — 扬州名人故居沉浸式游览对话生成

import { POIS } from "../store/gameData"

// 每个场景点的文学联想
export const SCENE_MEMORIES = {
  "堂屋": "朱自清祖父朱则余是晚清小官，堂屋是待客议事之处。小朱自清常在堂屋的八仙桌旁做功课，听大人们谈论时局。",
  "东厢房": "朱自清少年时的卧室。墙上贴着自抄的诗文，窗下书桌正对天井，下雨天可以听见檐水落在青石板上的声音。",
  "西厢房": "朱家藏书和杂物间。朱自清常在这里翻箱倒柜找书看。汪曾祺若来串门，大概会在这里发现几本有趣的旧书。",
  "门楼": "安乐巷27号的门楼不大，没有盐商宅第的气派，却有文人的克制。门楣上的砖雕虽已斑驳，但「耕读传家」的精神还留在石缝里。",
  "书房": "朱自清写作的地方。窗外种着芭蕉——「雨打芭蕉」是扬州文人最爱的声音。他在这里写出了《儿女》《扬州的夏日》等名篇。",
  "古井": "老扬州家家有井。夏天把西瓜吊在井里冰着，是汪曾祺念念不忘的童年滋味。「井水镇过的西瓜，甜得沁人。」",
  "池塘": "池塘不大，种着荷花。让人想起《荷塘月色》——虽然那是清华园的荷塘，但朱自清说，他总觉得天下的荷塘都是一个模样。",
  "竹林": "扬州人家爱在院角种竹。「宁可食无肉，不可居无竹。」汪曾祺在《人间草木》里写道：竹子最好看是在有月亮的晚上，影子投在白粉墙上。",
  "老槐树": "这棵老槐树比故居还老。朱自清童年的夏天常在树下乘凉，听祖母讲扬州旧事。槐花开时，满院都是清甜的香气。",
  "石桌": "天井里的石桌，刻着岁月的痕迹。朱自清和父亲曾在这里下棋。「他少年出外谋生，独力支持，做了许多大事。哪知老境却如此颓唐！」——这是《背影》里写父亲的话，大概也在这里想起。"
}

export async function callLLM(messages, apiKey, apiUrl) {
  const url = apiUrl || "/api/deepseek/v1/chat/completions"

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: "deepseek-chat",
      messages,
      temperature: 0.8,
      max_tokens: 250
    })
  })

  if (!response.ok) {
    const err = await response.text()
    throw new Error(`API error ${response.status}: ${err}`)
  }

  const data = await response.json()
  return data.choices[0].message.content
}

export async function generateFeeling(character, landmark, apiKey, apiUrl) {
  const memory = SCENE_MEMORIES[landmark] || ""

  const prompt = `你是${character.name}，${character.persona}

你现在在扬州名人故居的「${landmark}」。

${memory ? "关于这个地方：" + memory : ""}

请用第一人称，写一段你此刻的内心感受（40-80字）。
- 如果你是本尊角色（朱自清/汪曾祺），请展现作家特有的语言质感——你的语气、用词、感受方式应当贴近你的散文风格。
- 如果是其他角色，请保持自然口语化，符合身份。
- 可以呼应这个地方的历史和文学记忆，但不要背诵百科。
- 只说感受，不要说其他。`

  return callLLM([{ role: "user", content: prompt }], apiKey, apiUrl)
}

export async function generateDialogue(charA, charB, apiKey, apiUrl) {
  // 确定谁可能是作家角色
  const writers = [charA, charB].filter(c => c.id === "zhu" || c.id === "wang")
  const writerNote = writers.length > 0
    ? writers.map(w => `${w.name}是${w.id === "zhu" ? "散文家朱自清" : "作家汪曾祺"}，对话中可以自然流露其文风——朱自清细腻温润、常带书卷气；汪曾祺冲淡幽默、三句话不离吃和人间草木。`)
    : ""

  const prompt = `你是一个对话生成器。下面两个人，在扬州名人故居的院落中偶遇了。

${charA.name}（${charA.role}）：${charA.persona}
${charB.name}（${charB.role}）：${charB.persona}

请生成一段自然的对话（每人说1-2句，总共3-4句），格式：
${charA.name}：...
${charB.name}：...
${charA.name}：...

${writerNote.join(" ")}

对话要求：
- 围绕扬州故居、文学记忆、文人生活或传统文化
- 可以提及具体作品（如《背影》《荷塘月色》《端午的鸭蛋》《人间草木》）
- 语言有烟火气，不要书面化、不要说教
- 如果对话中有作家角色，其语句应有散文质感但不说教，自然如日常闲谈`

  return callLLM([{ role: "user", content: prompt }], apiKey, apiUrl)
}

export async function generatePersona(name, role, apiKey, apiUrl) {
  const prompt = `你是一个角色设定生成器。请为新角色写一段简短的人设描述（30-50字）。

角色名：${name}
身份：${role}

要求：有生活气息，适合在扬州名人故居中活动。可以是游客、研究者、本地居民、文创设计师等。`

  return callLLM([{ role: "user", content: prompt }], apiKey, apiUrl)
}
