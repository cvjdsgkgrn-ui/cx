import matplotlib.pyplot as plt
import random
import numpy as np

# 场地尺寸 (毫米)
width = 350000  # 350m = 350000mm
height = 300000  # 300m = 300000mm

# 柱网网格尺寸 (毫米) - 仅作为参照，不强制绘制
grid_size = 10000  # 10m = 10000mm

# 创建图形
fig, ax = plt.subplots(figsize=(16, 14))
ax.set_xlim(0, width)
ax.set_ylim(0, height)
ax.set_aspect('equal')
ax.axis('off')  # 隐藏坐标轴
ax.set_facecolor('white')  # 背景白色

random.seed()


def smooth_curve(xs, window=5):
    if len(xs) < window:
        return xs
    kernel = np.ones(window) / window
    return np.convolve(xs, kernel, mode='valid')


def random_walk_line(start, angle, segments, seg_len_range, angle_dev):
    # 从起点按角度做一系列线段，角度随机抖动，返回平滑曲线点
    x, y = start
    xs = [x]
    ys = [y]
    theta = angle
    for _ in range(segments):
        L = random.randint(*seg_len_range)
        theta += random.uniform(-angle_dev, angle_dev)
        # 计算下一点并在越界时反射角度以避免聚集边界
        nx = x + L * np.cos(theta)
        ny = y + L * np.sin(theta)
        if nx < 0 or nx > width:
            theta = np.pi - theta
            nx = x + L * np.cos(theta)
        if ny < 0 or ny > height:
            theta = -theta
            ny = y + L * np.sin(theta)
        x, y = nx, ny
        # 最终裁剪到场地范围
        x = max(0, min(width, x))
        y = max(0, min(height, y))
        xs.append(x)
        ys.append(y)
    # 平滑
    xs_s = smooth_curve(np.array(xs), window=5)
    ys_s = smooth_curve(np.array(ys), window=5)
    return xs_s, ys_s


def generate_organic_roads():
    roads = []
    # 主干道：起点分布在四周边界或内部，避免全部聚集一处
    for _ in range(random.randint(6, 10)):
        if random.random() < 0.5:
            # 从边界选一个随机边作为起点
            edge = random.choice(['left', 'right', 'top', 'bottom'])
            if edge == 'left':
                start = (0, random.uniform(0, height))
                angle = random.uniform(-np.pi/3, np.pi/3)
            elif edge == 'right':
                start = (width, random.uniform(0, height))
                angle = random.uniform(np.pi - np.pi/3, np.pi + np.pi/3)
            elif edge == 'top':
                start = (random.uniform(0, width), height)
                angle = random.uniform(np.pi/2 - np.pi/3, np.pi/2 + np.pi/3)
            else:
                start = (random.uniform(0, width), 0)
                angle = random.uniform(-np.pi/2 - np.pi/3, -np.pi/2 + np.pi/3)
        else:
            # 内部随机起点
            start = (random.uniform(width*0.1, width*0.9), random.uniform(height*0.1, height*0.9))
            angle = random.uniform(0, 2 * np.pi)
        xs, ys = random_walk_line(start, angle, segments=random.randint(8, 14), seg_len_range=(8000, 40000), angle_dev=0.7)
        roads.append({'x': xs, 'y': ys, 'width': random.uniform(12, 18), 'type': 'main'})

    # 次级道路：更多分支，较短段
    for _ in range(random.randint(12, 22)):
        start = (random.uniform(0, width), random.uniform(0, height))
        angle = random.uniform(0, 2 * np.pi)
        xs, ys = random_walk_line(start, angle, segments=random.randint(4, 9), seg_len_range=(8000, 40000), angle_dev=0.9)
        roads.append({'x': xs, 'y': ys, 'width': random.uniform(6, 12), 'type': 'secondary'})

    # 小巷/人行道：短小、多弯
    for _ in range(random.randint(50, 120)):
        start = (random.uniform(0, width), random.uniform(0, height))
        angle = random.uniform(0, 2 * np.pi)
        xs, ys = random_walk_line(start, angle, segments=random.randint(2, 6), seg_len_range=(3000, 20000), angle_dev=1.5)
        roads.append({'x': xs, 'y': ys, 'width': random.uniform(3, 6), 'type': 'small'})

    # 环路/广场周边
    for _ in range(random.randint(3, 7)):
        cx = random.uniform(width * 0.1, width * 0.9)
        cy = random.uniform(height * 0.1, height * 0.9)
        r = random.uniform(10000, 50000)
        angles = np.linspace(0, 2 * np.pi, 40)
        xs = cx + r * np.cos(angles) * random.uniform(0.8, 1.2) + np.random.normal(0, 2000, len(angles))
        ys = cy + r * np.sin(angles) * random.uniform(0.8, 1.2) + np.random.normal(0, 2000, len(angles))
        xs_s = smooth_curve(xs, window=5)
        ys_s = smooth_curve(ys, window=5)
        roads.append({'x': xs_s, 'y': ys_s, 'width': random.uniform(4, 8), 'type': 'loop'})

    # 为主干道添加分支，增加网格连通性和分布
    main_roads = [r for r in roads if r['type'] == 'main']
    for mr in main_roads:
        pts = len(mr['x'])
        if pts < 3:
            continue
        branches = random.randint(1, 4)
        for _ in range(branches):
            idx = random.randint(1, pts-2)
            bx = mr['x'][idx]
            by = mr['y'][idx]
            # 分支角度为主线局部切线方向加偏差
            if idx+1 < pts:
                dx = mr['x'][idx+1] - mr['x'][idx-1]
                dy = mr['y'][idx+1] - mr['y'][idx-1]
                base_angle = np.arctan2(dy, dx) + np.pi/2 * random.choice([-1,1])
            else:
                base_angle = random.uniform(0, 2*np.pi)
            xs_b, ys_b = random_walk_line((bx, by), base_angle, segments=random.randint(3, 8), seg_len_range=(4000, 20000), angle_dev=1.0)
            roads.append({'x': xs_b, 'y': ys_b, 'width': random.uniform(3, 8), 'type': 'secondary'})

    return roads


# 生成路网
roads = generate_organic_roads()

# 绘制街道
for road in roads:
    xs = np.array(road['x'])
    ys = np.array(road['y'])
    w_m = road['width']  # 米单位的近似宽度值

    if road['type'] == 'main':
        color = 'black'
        linewidth = max(2.5, w_m * 0.12)
        alpha = 0.95
    elif road['type'] == 'secondary':
        color = 'dimgray'
        linewidth = max(1.8, w_m * 0.09)
        alpha = 0.85
    elif road['type'] == 'small':
        color = 'gray'
        linewidth = max(0.9, w_m * 0.06)
        alpha = 0.6
    else:
        color = 'darkgray'
        linewidth = max(1.4, w_m * 0.08)
        alpha = 0.8

    ax.plot(xs, ys, color=color, linewidth=linewidth, alpha=alpha, solid_capstyle='round')

# 可选：在不破坏柱网结构的前提下淡化显示参考网格（注释以保留选择权）
# for gx in range(0, width+1, grid_size):
#     ax.plot([gx, gx], [0, height], color='#f0f0f0', linewidth=0.5)
# for gy in range(0, height+1, grid_size):
#     ax.plot([0, width], [gy, gy], color='#f0f0f0', linewidth=0.5)

plt.title('随机有机城市路网草图 (350m × 300m)', fontsize=18, pad=18)
plt.tight_layout()
plt.savefig('road_network.png', dpi=200, bbox_inches='tight')
plt.show()
