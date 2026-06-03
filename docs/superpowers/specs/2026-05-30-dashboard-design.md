# 个人仪表盘 — 设计规格

> 日期: 2026-05-30
> 状态: 待用户审阅

## 目标

一个本地浏览器打开的轻量个人仪表盘，包含时钟、天气、待办、随机引言四个模块，卡片网格布局，响应式适配手机。

## 技术选型

- 单文件 dashboard.html，零构建
- Tailwind CSS CDN @4 做样式
- 原生 JavaScript，无框架
- 天气：Open-Meteo 免费 API（无需注册 key）
- 待办：localStorage 持久化
- 位置：
avigator.geolocation，失败回退上海

## 模块设计

### 1. 时钟 + 日期
- 来源：
ew Date()
- 刷新：每秒 setInterval(1000)
- 显示：大号 HH:mm:ss，下方中文日期+星期
- 夜间 18:00-6:00 自动切暗色渐变背景

### 2. 天气卡片
- API：https://api.open-meteo.com/v1/forecast?latitude=X&longitude=Y&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m&timezone=auto
- 位置获取：
avigator.geolocation.getCurrentPosition()，失败或拒绝则用上海 (31.23, 121.47)
- 刷新：首次加载 + 每 30 分钟
- 显示：天气图标（emoji 映射 weather_code）、温度、湿度、风速、城市名
- 状态：加载中 / 成功 / 失败三种 UI

### 3. 待办卡片
- 存储：localStorage.setItem('dashboard_todos', JSON.stringify(array))
- 操作：添加（输入框+按钮）、勾选/取消勾选（点击）、删除（× 按钮）
- 已完成条目：划线 + 半透明样式
- 计数：底部显示"已完成 X / 共 Y"

### 4. 随机引言卡片
- 内置 20 条中文引言数组
- 每次页面刷新随机选一条
- 淡入动画

## 响应式布局

| 断点 | 列数 | 卡片排布 |
|------|------|----------|
| < sm (640px) | 1 列 | 时钟 → 天气 → 待办 → 引言 |
| md (768px) | 2 列 | 时钟横跨两列，天气+待办同行 |
| lg (1024px) | 2 列 | 同上，卡片间距加大 |

## 边界条件

- 离线时天气卡片显示上次缓存数据 + 感叹号提示
- 待办为空时显示空状态引导
- 地理位置权限被拒时不阻塞页面
- 引言数组保证不连续两次显示同一条

## 不包含

- 多城市切换（v2）
- 待办分类/标签（v2）
- 推送通知（v2）
- 用户登录/云同步（永远不做）
