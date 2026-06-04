// API call to DeepSeek via Vite proxy (avoids CORS)
export async function callLLM(messages, apiKey, apiUrl) {
  const url = apiUrl || "/api/deepseek/v1/chat/completions"

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: "deepseek-v4-pro",
      messages,
      temperature: 0.8,
      max_tokens: 1024,
      thinking: { type: "enabled" }
    })
  })

  if (!response.ok) {
    const err = await response.text()
    throw new Error(`API error ${response.status}: ${err}`)
  }

  const data = await response.json()
  const msg = data.choices[0].message
  // 只取 content；reasoning_content 是思考过程，不应输出到对话
  const text = (msg.content || "").trim()
  if (!text) {
    const finishReason = data.choices[0].finish_reason || "unknown"
    throw new Error(
      finishReason === "length"
        ? "回复被截断（输出token不足），请稍后重试"
        : "API 返回空回复，请稍后重试"
    )
  }
  return text
}

// Generate an observation/feeling for a character in the garden
export async function generateFeeling(character, landmark, apiKey, apiUrl) {
  const prompt = `你是${character.name}，一个${character.role}，${character.persona}

你现在在苏州园林中，正在看「${landmark}」。

请用第一人称，写一段你看到这个景色的内心感受（30-60字）。语言要自然、有生活气息，符合你的身份和性格。只说感受，不要说其他。`

  return callLLM([
    { role: "user", content: prompt }
  ], apiKey, apiUrl)
}

// Generate a conversation between two characters
export async function generateDialogue(charA, charB, apiKey, apiUrl) {
  const prompt = `你是一个对话生成器。下面两个人，都在苏州园林里，他们碰巧相遇了。

${charA.name}：${charA.role}，${charA.persona}
${charB.name}：${charB.role}，${charB.persona}

请生成一段自然简短的对话（每人说1-2句，总共3-4句）。
格式如下：
${charA.name}：...
${charB.name}：...
${charA.name}：...

对话要符合人物身份，围绕园林景色、建筑工艺或日常生活展开。`

  return callLLM([
    { role: "user", content: prompt }
  ], apiKey, apiUrl)
}

// Generate persona for custom character
export async function generatePersona(name, role, apiKey, apiUrl) {
  const prompt = `你是一个角色设定生成器。请为新角色写一段简短的人设描述（30-50字）。

角色名：${name}
身份：${role}

要求：自然、有生活气息，适合在苏州园林中活动的角色。`

  return callLLM([
    { role: "user", content: prompt }
  ], apiKey, apiUrl)
}
