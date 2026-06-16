/**
 * nodes.js - 节点类型定义、弹窗渲染、默认提示词和工作流
 */

// ── 节点类型定义 ───────────────────────────────────────────
const NODE_TYPES = {
    Input_Script: {
        label: '剧本输入',
        desc: '上传剧本文档',
        color: '#4a90e2',
        ports: { in: [], out: ['script'] }
    },
    Input_Character: {
        label: '角色输入',
        desc: '上传角色描述文档',
        color: '#7b68ee',
        ports: { in: [], out: ['characters'] }
    },
    Input_Env: {
        label: '环境输入',
        desc: '上传环境图片',
        color: '#32cd32',
        ports: { in: [], out: ['env_image'] }
    },
    Output_Storyboard: {
        label: '分镜生成',
        desc: '基于剧本生成分镜',
        color: '#ff6b6b',
        ports: { in: ['script'], out: ['shot_text'] }
    },
    Shot_Text: {
        label: '分镜纯文本',
        desc: '分镜文本编辑',
        color: '#ffa500',
        ports: { in: [], out: ['shot_text'] }
    },
    Output_Pic_ShotPrompt: {
        label: '图片描述生成',
        desc: '为分镜生成图片描述',
        color: '#20b2aa',
        ports: { in: ['shot_text'], out: ['pic_prompts'] }
    },
    Output_Video_ShotPrompt: {
        label: '视频描述生成',
        desc: '为分镜生成视频描述',
        color: '#9370db',
        ports: { in: ['shot_text', 'pic_prompts'], out: ['video_prompts'] }
    },
    Output_KeyPic: {
        label: '关键帧图片生成',
        desc: '生成镜头关键帧图片',
        color: '#ff1493',
        ports: { in: ['pic_prompts'], out: ['keyframes'] }
    },
    Output_Video: {
        label: '镜头视频生成',
        desc: '生成镜头视频',
        color: '#dc143c',
        ports: { in: ['video_prompts', 'keyframes', 'characters', 'env_image'], out: [] }
    }
};

// ── 状态标签 ───────────────────────────────────────────────
const STATUS_BADGE = {
    idle: 'idle',
    running: 'running',
    done: 'done',
    error: 'error',
    approved: 'approved'
};

const STATUS_LABEL = {
    idle: '待执行',
    running: '执行中',
    done: '完成',
    error: '错误',
    approved: '已确认'
};

// ── 默认提示词 ─────────────────────────────────────────────
const DEFAULT_PROMPTS = {
    storyboard: `你是一个专业的电影分镜师。请根据提供的剧本内容，生成详细的分镜脚本。

要求：
1. 分析剧本结构，提取关键场景和镜头
2. 为每个镜头分配镜头编号（shot_id），如 "shot_001", "shot_002" 等
3. 描述每个镜头的：
   - 镜头类型（全景、中景、特写等）
   - 场景描述
   - 角色动作和对话
   - 镜头运动（推拉摇移等）
   - 时长估算
4. 镜头编号应连续递增
5. 输出格式为JSON，包含shots数组，每个shot包含shot_id, description, duration等字段

请确保分镜逻辑连贯，符合电影叙事规律。`,

    pic_prompt: `你是一个专业的电影视觉设计师。请根据分镜描述，为每个镜头生成详细的图片生成提示词。

要求：
1. 分析分镜描述，提取视觉元素
2. 为每个镜头生成：
   - positive_prompt: 正向提示词，描述期望的视觉效果
   - negative_prompt: 负向提示词，避免不良元素
3. 提示词应详细、具体，便于AI图像生成
4. 考虑光影、构图、色彩、风格等
5. 输出格式为JSON，包含shots数组，每个shot包含shot_id, positive_prompt, negative_prompt

请确保提示词专业、精准，能够生成高质量的电影镜头图片。`,

    video_prompt: `你是一个专业的电影视频设计师。请根据分镜描述和图片提示，为每个镜头生成视频生成提示词。

要求：
1. 分析分镜描述和图片提示
2. 为每个镜头生成motion_prompt：描述镜头运动、动态效果、时长等
3. 考虑：
   - 镜头运动（推拉摇移等）
   - 角色动作
   - 场景变化
   - 特效需求
   - 时长（通常5-15秒）
4. 输出格式为JSON，包含shots数组，每个shot包含shot_id, motion_prompt

请确保视频提示词能够生成连贯、有动感的电影镜头。`
};

// ── 默认工作流 ─────────────────────────────────────────────
const DEFAULT_WORKFLOWS = {
    txt2img: {
        "1": {
            "inputs": {
                "ckpt_name": "sdxl_base_1.0.safetensors"
            },
            "class_type": "CheckpointLoaderSimple"
        },
        "2": {
            "inputs": {
                "text": "{{positive_prompt}}",
                "clip": ["1", 1]
            },
            "class_type": "CLIPTextEncode"
        },
        "3": {
            "inputs": {
                "text": "{{negative_prompt}}",
                "clip": ["1", 1]
            },
            "class_type": "CLIPTextEncode"
        },
        "4": {
            "inputs": {
                "seed": 0,
                "steps": 20,
                "cfg": 8,
                "sampler_name": "euler",
                "scheduler": "normal",
                "denoise": 1,
                "model": ["1", 0],
                "positive": ["2", 0],
                "negative": ["3", 0],
                "latent_image": ["5", 0]
            },
            "class_type": "KSampler"
        },
        "5": {
            "inputs": {
                "width": "{{width}}",
                "height": "{{height}}",
                "batch_size": 1
            },
            "class_type": "EmptyLatentImage"
        },
        "6": {
            "inputs": {
                "samples": ["4", 0],
                "vae": ["1", 2]
            },
            "class_type": "VAEDecode"
        },
        "7": {
            "inputs": {
                "filename_prefix": "ComfyUI",
                "images": ["6", 0]
            },
            "class_type": "SaveImage"
        }
    },
    img2vid: {
        "1": {
            "inputs": {
                "ckpt_name": "sdxl_base_1.0.safetensors"
            },
            "class_type": "CheckpointLoaderSimple"
        },
        "2": {
            "inputs": {
                "text": "{{motion_prompt}}",
                "clip": ["1", 1]
            },
            "class_type": "CLIPTextEncode"
        },
        "3": {
            "inputs": {
                "text": "blurry, low quality",
                "clip": ["1", 1]
            },
            "class_type": "CLIPTextEncode"
        },
        "4": {
            "inputs": {
                "image": "{{image_url}}",
                "upload": "image"
            },
            "class_type": "LoadImage"
        },
        "5": {
            "inputs": {
                "pixels": ["4", 0],
                "vae": ["1", 2]
            },
            "class_type": "VAEEncode"
        },
        "6": {
            "inputs": {
                "seed": 0,
                "steps": 20,
                "cfg": 8,
                "sampler_name": "euler",
                "scheduler": "normal",
                "denoise": 1,
                "model": ["1", 0],
                "positive": ["2", 0],
                "negative": ["3", 0],
                "latent_image": ["5", 0]
            },
            "class_type": "KSampler"
        },
        "7": {
            "inputs": {
                "samples": ["6", 0],
                "vae": ["1", 2]
            },
            "class_type": "VAEDecode"
        },
        "8": {
            "inputs": {
                "filename_prefix": "ComfyUI",
                "images": ["7", 0]
            },
            "class_type": "SaveImage"
        }
    }
};

// SECURITY helper: store sensitive keys in sessionStorage and keep only a masked indicator in node data.
function handleSensitiveInput(nodeId, key, el) {
    console.warn('SECURITY: Sensitive keys should not be persisted client-side. Stored in sessionStorage only for this session. Prefer a server-side proxy.');
    try {
        if (typeof sessionStorage !== 'undefined') {
            // store raw key only in sessionStorage (cleared on tab close)
            sessionStorage.setItem('aifs.' + key + '.' + nodeId, (el && el.value) || el || '');
        }
    } catch (e) { /* ignore */ }
    try {
        // persist only a masked indicator into node data so users know a key exists without storing it
        updateNodeData(nodeId, key + '_masked', 'stored_in_session');
    } catch (e) { /* ignore */ }
}

// ── 弹窗渲染 ───────────────────────────────────────────────
function renderModalBody(node) {
    const d = node.data || {};
    const type = node.type;
    let html = '';

    // 通用字段：API设置
    const apiFields = `
    <div class="form-group">
      <label>API URL:</label>
      <input type="text" value="${d.api_url || ''}" onchange="updateNodeData('${node.id}', 'api_url', this.value)">
    </div>
    <div class="form-group">
      <label>API Key:</label>
      <!-- SECURITY: sensitive key saved to sessionStorage only; prefer backend proxy -->
      <input type="password" value="${d.api_key || ''}" onchange="handleSensitiveInput('${node.id}', 'api_key', this)">
    </div>
    <div class="form-group">
      <label>Model:</label>
      <input type="text" value="${d.model || ''}" onchange="updateNodeData('${node.id}', 'model', this.value)">
    </div>
    <div class="form-group">
      <label>System Prompt:</label>
      <textarea onchange="updateNodeData('${node.id}', 'system_prompt', this.value)">${d.system_prompt || ''}</textarea>
    </div>`;

    // 通用字段：自定义提示词
    const customPromptField = `
    <div class="form-group">
      <label>自定义要求:</label>
      <textarea onchange="updateNodeData('${node.id}', 'custom_prompt', this.value)">${d.custom_prompt || ''}</textarea>
    </div>`;

    // 通用字段：参考文档
    const refDocsField = `
    <div class="form-group">
      <label>参考文档:</label>
      <input type="file" id="fu-${node.id}-ref_docs" accept=".docx,.txt,.pdf" multiple onchange="handleUpload(this, '${node.id}', 'ref_docs')" style="display:none">
      <button onclick="triggerUpload('${node.id}', 'ref_docs', '.docx,.txt,.pdf', true)">上传文档</button>
      <div class="file-list">
        ${(d.ref_docs || []).map((f, i) => `<div>${f.name} <button onclick="removeFile('${node.id}', 'ref_docs', ${i})">删除</button></div>`).join('')}
      </div>
    </div>`;

    // 通用字段：执行按钮
    const runBtn = node.status === 'running' ? '<button disabled>执行中...</button>' :
        `<button onclick="run${type.replace('Input_', '').replace('Output_', '')}('${node.id}')">执行</button>`;

    // 通用字段：输出显示
    const outputField = node.output ? `
    <div class="form-group">
      <label>输出:</label>
      <textarea readonly style="height:200px">${node.output}</textarea>
      <button onclick="downloadText('${node.id}')">下载文本</button>
    </div>` : '';

    // 通用字段：错误日志
    const errorField = node.error_log ? `
    <div class="form-group">
      <label>错误日志:</label>
      <pre style="color:red">${node.error_log}</pre>
    </div>` : '';

    // 通用字段：图片输出
    const imgOutput = (node.output_images && node.output_images.length) ? `
    <div class="form-group">
      <label>生成的图片:</label>
      <div class="image-grid">
        ${node.output_images.map((u, i) => `
          <div class="image-item ${node.selected_image === i ? 'selected' : ''}" onclick="selectImage('${node.id}', ${i})">
            <img src="${u}" alt="Generated ${i}">
          </div>`).join('')}
      </div>
    </div>` : '';

    // 通用字段：视频输出
    const vidOutput = (node.output_videos && node.output_videos.length) ? `
    <div class="form-group">
      <label>生成的视频:</label>
      <div class="video-list">
        ${node.output_videos.map(v => `<video src="${v}" controls style="max-width:100%;margin-bottom:8px"></video>`).join('')}
      </div>
    </div>` : '';

    // 根据节点类型渲染特定字段
    if (type === 'Input_Script') {
        html = `
      <div class="form-group">
        <label>剧本文档:</label>
        <input type="file" id="fu-${node.id}-script_files" accept=".docx,.txt,.pdf" multiple onchange="handleUpload(this, '${node.id}', 'script_files')" style="display:none">
        <button onclick="triggerUpload('${node.id}', 'script_files', '.docx,.txt,.pdf', true)">上传剧本</button>
        <div class="file-list">
          ${(d.script_files || []).map((f, i) => `<div>${f.name} <button onclick="removeFile('${node.id}', 'script_files', ${i})">删除</button></div>`).join('')}
        </div>
      </div>
      ${customPromptField}
      ${outputField}
      ${errorField}`;
    } else if (type === 'Input_Character') {
        html = `
      <div class="form-group">
        <label>角色描述文档:</label>
        <input type="file" id="fu-${node.id}-characters" accept=".docx,.txt,.pdf" multiple onchange="handleUpload(this, '${node.id}', 'characters')" style="display:none">
        <button onclick="triggerUpload('${node.id}', 'characters', '.docx,.txt,.pdf', true)">上传角色描述</button>
        <div class="file-list">
          ${(d.characters || []).map((f, i) => `<div>${f.name} <button onclick="removeFile('${node.id}', 'characters', ${i})">删除</button></div>`).join('')}
        </div>
      </div>
      ${customPromptField}
      ${outputField}
      ${errorField}`;
    } else if (type === 'Input_Env') {
        html = `
      <div class="form-group">
        <label>环境图片:</label>
        <input type="file" id="fu-${node.id}-env_images" accept="image/*" multiple onchange="handleUpload(this, '${node.id}', 'env_images')" style="display:none">
        <button onclick="triggerUpload('${node.id}', 'env_images', 'image/*', true)">上传环境图片</button>
        <div class="file-list">
          ${(d.env_images || []).map((f, i) => `<div>${f.name} <button onclick="removeFile('${node.id}', 'env_images', ${i})">删除</button></div>`).join('')}
        </div>
      </div>
      ${customPromptField}
      ${outputField}
      ${errorField}`;
    } else if (type === 'Output_Storyboard') {
        html = `
      ${apiFields}
      ${refDocsField}
      ${customPromptField}
      ${runBtn}
      ${outputField}
      ${errorField}`;
    } else if (type === 'Shot_Text') {
        html = `
      <div class="form-group">
        <label>分镜文本:</label>
        <textarea onchange="updateNodeData('${node.id}', 'shot_text', this.value)" style="height:300px">${d.shot_text || ''}</textarea>
      </div>
      ${customPromptField}
      ${outputField}
      ${errorField}
      ${node.status === 'done' ? `<button class="btn-pass" onclick="approveShotText('${node.id}')">✔ 确认</button>` : ''}`;
    } else if (type === 'Output_Pic_ShotPrompt') {
        html = `
      ${apiFields}
      ${refDocsField}
      ${customPromptField}
      ${runBtn}
      ${outputField}
      ${errorField}`;
    } else if (type === 'Output_Video_ShotPrompt') {
        html = `
      ${apiFields}
      ${refDocsField}
      ${customPromptField}
      ${runBtn}
      ${outputField}
      ${errorField}`;
    } else if (type === 'Output_KeyPic') {
        const genMode = d.keypic_gen_mode || 'comfyui';
        html = `
      <div class="form-group">
        <label>生成模式:</label>
        <select onchange="updateNodeData('${node.id}', 'keypic_gen_mode', this.value)">
          <option value="comfyui" ${genMode === 'comfyui' ? 'selected' : ''}>ComfyUI</option>
          <option value="volcano" ${genMode === 'volcano' ? 'selected' : ''}>Volcano</option>
          <option value="google" ${genMode === 'google' ? 'selected' : ''}>Google</option>
          <option value="api" ${genMode === 'api' ? 'selected' : ''}>OpenAI API</option>
        </select>
      </div>`;

        if (genMode === 'comfyui') {
            html += `
        <div class="form-group">
          <label>ComfyUI URL:</label>
          <input type="text" value="${d.comfyui_url || ''}" onchange="updateNodeData('${node.id}', 'comfyui_url', this.value)">
        </div>
        <div class="form-group">
          <label>Workflow JSON:</label>
          <textarea onchange="updateNodeData('${node.id}', 'workflow', this.value)" style="height:200px">${d.workflow || JSON.stringify(DEFAULT_WORKFLOWS.txt2img, null, 2)}</textarea>
        </div>`;
        } else if (genMode === 'volcano') {
            html += `
        <div class="form-group">
          <label>API Key:</label>
          <input type="password" value="${d.img_api_key || ''}" onchange="updateNodeData('${node.id}', 'img_api_key', this.value)">
        </div>
        <div class="form-group">
          <label>Model:</label>
          <input type="text" value="${d.img_model || ''}" onchange="updateNodeData('${node.id}', 'img_model', this.value)">
        </div>
        <div class="form-group">
          <label>尺寸:</label>
          <select onchange="updateNodeData('${node.id}', 'vol_size', this.value)">
            <option value="1024x1024" ${d.vol_size === '1024x1024' ? 'selected' : ''}>1024x1024</option>
            <option value="512x512" ${d.vol_size === '512x512' ? 'selected' : ''}>512x512</option>
            <option value="custom" ${d.vol_size === 'custom' ? 'selected' : ''}>自定义</option>
          </select>
          <input type="text" placeholder="如 1920x1080" value="${d.vol_size_custom || ''}" onchange="updateNodeData('${node.id}', 'vol_size_custom', this.value)" style="display:${d.vol_size === 'custom' ? 'inline' : 'none'}">
        </div>
        <div class="form-group">
          <label>响应格式:</label>
          <select onchange="updateNodeData('${node.id}', 'vol_response_format', this.value)">
            <option value="url" ${d.vol_response_format === 'url' ? 'selected' : ''}>URL</option>
            <option value="b64_json" ${d.vol_response_format === 'b64_json' ? 'selected' : ''}>Base64</option>
          </select>
        </div>
        <div class="form-group">
          <label>水印:</label>
          <select onchange="updateNodeData('${node.id}', 'vol_watermark', this.value)">
            <option value="false" ${d.vol_watermark === 'false' ? 'selected' : ''}>无</option>
            <option value="true" ${d.vol_watermark === 'true' ? 'selected' : ''}>有</option>
          </select>
        </div>`;
        } else if (genMode === 'google') {
            html += `
        <div class="form-group">
          <label>API Key:</label>
          <input type="password" value="${d.img_api_key || ''}" onchange="updateNodeData('${node.id}', 'img_api_key', this.value)">
        </div>
        <div class="form-group">
          <label>Model:</label>
          <input type="text" value="${d.img_model || ''}" onchange="updateNodeData('${node.id}', 'img_model', this.value)">
        </div>
        <div class="form-group">
          <label>图片数量:</label>
          <input type="number" min="1" max="4" value="${d.goog_num_images || 1}" onchange="updateNodeData('${node.id}', 'goog_num_images', this.value)">
        </div>
        <div class="form-group">
          <label>宽高比:</label>
          <select onchange="updateNodeData('${node.id}', 'goog_aspect_ratio', this.value)">
            <option value="1:1" ${d.goog_aspect_ratio === '1:1' ? 'selected' : ''}>1:1</option>
            <option value="4:3" ${d.goog_aspect_ratio === '4:3' ? 'selected' : ''}>4:3</option>
            <option value="16:9" ${d.goog_aspect_ratio === '16:9' ? 'selected' : ''}>16:9</option>
            <option value="3:4" ${d.goog_aspect_ratio === '3:4' ? 'selected' : ''}>3:4</option>
            <option value="9:16" ${d.goog_aspect_ratio === '9:16' ? 'selected' : ''}>9:16</option>
          </select>
        </div>
        <div class="form-group">
          <label>负向提示词:</label>
          <input type="text" value="${d.goog_neg_prompt || ''}" onchange="updateNodeData('${node.id}', 'goog_neg_prompt', this.value)">
        </div>
        <div class="form-group">
          <label>安全过滤:</label>
          <select onchange="updateNodeData('${node.id}', 'goog_safety', this.value)">
            <option value="block_only_high" ${d.goog_safety === 'block_only_high' ? 'selected' : ''}>仅阻挡高风险</option>
            <option value="block_medium_and_above" ${d.goog_safety === 'block_medium_and_above' ? 'selected' : ''}>阻挡中高风险</option>
            <option value="block_low_and_above" ${d.goog_safety === 'block_low_and_above' ? 'selected' : ''}>阻挡低中高风险</option>
          </select>
        </div>
        <div class="form-group">
          <label>参考图片:</label>
          <input type="file" id="fu-${node.id}-goog_ref_images" accept="image/*" multiple onchange="handleUpload(this, '${node.id}', 'goog_ref_images')" style="display:none">
          <button onclick="triggerUpload('${node.id}', 'goog_ref_images', 'image/*', true)">上传参考图片</button>
          <div class="file-list">
            ${(d.goog_ref_images || []).map((f, i) => `<div>${f.name} <button onclick="removeFile('${node.id}', 'goog_ref_images', ${i})">删除</button></div>`).join('')}
          </div>
        </div>`;
        } else if (genMode === 'api') {
            html += `
        <div class="form-group">
          <label>API URL:</label>
          <input type="text" value="${d.img_api_url || ''}" onchange="updateNodeData('${node.id}', 'img_api_url', this.value)">
        </div>
        <div class="form-group">
          <label>API Key:</label>
          <input type="password" value="${d.img_api_key || ''}" onchange="updateNodeData('${node.id}', 'img_api_key', this.value)">
        </div>
        <div class="form-group">
          <label>Model:</label>
          <input type="text" value="${d.img_model || ''}" onchange="updateNodeData('${node.id}', 'img_model', this.value)">
        </div>
        <div class="form-group">
          <label>尺寸:</label>
          <select onchange="updateNodeData('${node.id}', 'img_size', this.value)">
            <option value="1024x1024" ${d.img_size === '1024x1024' ? 'selected' : ''}>1024x1024</option>
            <option value="1792x1024" ${d.img_size === '1792x1024' ? 'selected' : ''}>1792x1024</option>
            <option value="1024x1792" ${d.img_size === '1024x1792' ? 'selected' : ''}>1024x1792</option>
            <option value="custom" ${d.img_size === 'custom' ? 'selected' : ''}>自定义</option>
          </select>
          <input type="text" placeholder="如 1920x1080" value="${d.img_size_custom || ''}" onchange="updateNodeData('${node.id}', 'img_size_custom', this.value)" style="display:${d.img_size === 'custom' ? 'inline' : 'none'}">
        </div>`;
        }

        html += `
      ${customPromptField}
      ${runBtn}
      ${imgOutput}
      ${errorField}`;
    } else if (type === 'Output_Video') {
        const vidMode = d.vid_gen_mode || 'comfyui';
        html = `
      <div class="form-group">
        <label>生成模式:</label>
        <select onchange="updateNodeData('${node.id}', 'vid_gen_mode', this.value)">
          <option value="comfyui" ${vidMode === 'comfyui' ? 'selected' : ''}>ComfyUI</option>
          <option value="volcano" ${vidMode === 'volcano' ? 'selected' : ''}>Volcano</option>
          <option value="google" ${vidMode === 'google' ? 'selected' : ''}>Google</option>
          <option value="api_img" ${vidMode === 'api_img' ? 'selected' : ''}>API (图生视频)</option>
          <option value="api_txt" ${vidMode === 'api_txt' ? 'selected' : ''}>API (文生视频)</option>
        </select>
      </div>`;

        if (vidMode === 'comfyui') {
            html += `
        <div class="form-group">
          <label>ComfyUI URL:</label>
          <input type="text" value="${d.comfyui_url || ''}" onchange="updateNodeData('${node.id}', 'comfyui_url', this.value)">
        </div>
        <div class="form-group">
          <label>Workflow JSON:</label>
          <textarea onchange="updateNodeData('${node.id}', 'workflow', this.value)" style="height:200px">${d.workflow || JSON.stringify(DEFAULT_WORKFLOWS.img2vid, null, 2)}</textarea>
        </div>`;
        } else if (vidMode === 'volcano') {
            html += `
        <div class="form-group">
          <label>API Key:</label>
          <input type="password" value="${d.vid_api_key || ''}" onchange="updateNodeData('${node.id}', 'vid_api_key', this.value)">
        </div>
        <div class="form-group">
          <label>Model:</label>
          <input type="text" value="${d.vid_model || ''}" onchange="updateNodeData('${node.id}', 'vid_model', this.value)">
        </div>`;
        } else if (vidMode === 'google') {
            html += `
        <div class="form-group">
          <label>API Key:</label>
          <input type="password" value="${d.vid_api_key || ''}" onchange="updateNodeData('${node.id}', 'vid_api_key', this.value)">
        </div>
        <div class="form-group">
          <label>Model:</label>
          <input type="text" value="${d.vid_model || ''}" onchange="updateNodeData('${node.id}', 'vid_model', this.value)">
        </div>
        <div class="form-group">
          <label>视频模式:</label>
          <select onchange="updateNodeData('${node.id}', 'goog_vid_mode', this.value)">
            <option value="text" ${d.goog_vid_mode === 'text' ? 'selected' : ''}>文本</option>
            <option value="text+image" ${d.goog_vid_mode === 'text+image' ? 'selected' : ''}>文本+图片</option>
          </select>
        </div>
        <div class="form-group">
          <label>宽高比:</label>
          <select onchange="updateNodeData('${node.id}', 'vid_aspect_ratio', this.value)">
            <option value="16:9" ${d.vid_aspect_ratio === '16:9' ? 'selected' : ''}>16:9</option>
            <option value="9:16" ${d.vid_aspect_ratio === '9:16' ? 'selected' : ''}>9:16</option>
            <option value="1:1" ${d.vid_aspect_ratio === '1:1' ? 'selected' : ''}>1:1</option>
          </select>
        </div>
        <div class="form-group">
          <label>时长(秒):</label>
          <input type="number" min="1" max="60" value="${d.vid_duration || 5}" onchange="updateNodeData('${node.id}', 'vid_duration', this.value)">
        </div>
        <div class="form-group">
          <label>分辨率:</label>
          <select onchange="updateNodeData('${node.id}', 'vid_resolution', this.value)">
            <option value="720p" ${d.vid_resolution === '720p' ? 'selected' : ''}>720p</option>
            <option value="1080p" ${d.vid_resolution === '1080p' ? 'selected' : ''}>1080p</option>
          </select>
        </div>
        <div class="form-group">
          <label>首帧图片:</label>
          <input type="file" id="fu-${node.id}-goog_first_frame" accept="image/*" multiple onchange="handleUpload(this, '${node.id}', 'goog_first_frame')" style="display:none">
          <button onclick="triggerUpload('${node.id}', 'goog_first_frame', 'image/*', true)">上传首帧</button>
          <div class="file-list">
            ${(d.goog_first_frame || []).map((f, i) => `<div>${f.name} <button onclick="removeFile('${node.id}', 'goog_first_frame', ${i})">删除</button></div>`).join('')}
          </div>
        </div>
        <div class="form-group">
          <label>末帧图片:</label>
          <input type="file" id="fu-${node.id}-goog_last_frame" accept="image/*" multiple onchange="handleUpload(this, '${node.id}', 'goog_last_frame')" style="display:none">
          <button onclick="triggerUpload('${node.id}', 'goog_last_frame', 'image/*', true)">上传末帧</button>
          <div class="file-list">
            ${(d.goog_last_frame || []).map((f, i) => `<div>${f.name} <button onclick="removeFile('${node.id}', 'goog_last_frame', ${i})">删除</button></div>`).join('')}
          </div>
        </div>
        <div class="form-group">
          <label>参考图片:</label>
          <input type="file" id="fu-${node.id}-goog_ref_image" accept="image/*" multiple onchange="handleUpload(this, '${node.id}', 'goog_ref_image')" style="display:none">
          <button onclick="triggerUpload('${node.id}', 'goog_ref_image', 'image/*', true)">上传参考</button>
          <div class="file-list">
            ${(d.goog_ref_image || []).map((f, i) => `<div>${f.name} <button onclick="removeFile('${node.id}', 'goog_ref_image', ${i})">删除</button></div>`).join('')}
          </div>
        </div>`;
        } else if (vidMode === 'api_img' || vidMode === 'api_txt') {
            html += `
        <div class="form-group">
          <label>API URL:</label>
          <input type="text" value="${d.vid_api_url || ''}" onchange="updateNodeData('${node.id}', 'vid_api_url', this.value)">
        </div>
        <div class="form-group">
          <label>API Key:</label>
          <input type="password" value="${d.vid_api_key || ''}" onchange="updateNodeData('${node.id}', 'vid_api_key', this.value)">
        </div>
        <div class="form-group">
          <label>Model:</label>
          <input type="text" value="${d.vid_model || ''}" onchange="updateNodeData('${node.id}', 'vid_model', this.value)">
        </div>`;
        }

        html += `
      ${customPromptField}
      ${runBtn}
      ${vidOutput}
      ${errorField}`;
    }

    return html;
}