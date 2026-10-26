# 贪吃蛇游戏实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 实现最简版贪吃蛇网页游戏——Canvas 渲染、键盘操控、分数统计与游戏结束重开，双击 `index.html` 即玩。

**Architecture:** 三文件分离（`index.html` / `style.css` / `game.js`）。全部逻辑在 `game.js` 单文件内：模块级变量管理状态（蛇身数组、方向、方向队列、食物、分数、结束标志），`setInterval` 每 150ms 驱动一步，每步末尾用 Canvas 2D API 全量重绘画布。

**Tech Stack:** 纯 HTML5 + CSS + 原生 JavaScript（ES6）。无框架、无构建、无外部依赖、无网络请求、无存储。

**Spec:** `docs/superpowers/specs/2026-10-25-snake-game-design.md`

## Global Constraints

- 纯 HTML + CSS + JS：无外部依赖、无构建步骤、无网络请求、无 localStorage
- 双击 `index.html`（`file://` 协议）即可运行
- 画布 400×400 像素，20×20 网格，每格 20px
- 步速固定 150ms（`setInterval`），不加速
- 文件位于仓库根目录；所有游戏逻辑在 `game.js`（约 150-200 行）
- 界面文案使用中文（"分数"、"游戏结束"、"按空格重新开始"）
- 配色：蛇身 `#2ecc71`、蛇头 `#1e7e34`、食物 `#e74c3c`
- 明确不做：最高分、暂停、速度递增、难度、音效、穿墙、触屏、多人（YAGNI）
- 按规格不引入测试框架，验证方式为浏览器手动清单 + 控制台状态检查（见各任务步骤）

## Review Focus

规格未明说、但最可能咬人的五类输入/失效模式（括号内为承接任务与验证方式）：

1. **连按多键灌满方向队列** —— 一步只消费一个方向，队列上限 2，同向/反向输入直接丢弃，防止一步内 180° 掉头或连续多转（Task 5：向右行进时按 上→左→上 验证不自死）。
2. **蛇吃满整个棋盘** —— `spawnFood()` 找不到空格必须返回 `null` 并结束游戏，绝不能死循环（Task 4：代码走查空格为 0 的分支 + 逻辑推演）。
3. **游戏结束后反复按空格重开** —— `start()` 必须先 `clearInterval` 旧定时器，多次重开不得叠加多个 interval 导致游戏变快（Task 3 实现守卫；Task 6 连续重开 3 次实测步速）。
4. **蛇头驶入尾巴本步即将腾出的格子** —— 必须先弹出尾巴再判定撞自身，否则长蛇贴尾跟随会误判死亡（Task 3：代码走查 step() 中弹尾与碰撞判定的顺序）。
5. **大写 WASD 与游戏未结束时的空格键** —— 字母键统一 `toLowerCase()` 归一处理；未结束时按空格/回车不做任何事（不得意外重置进行中的游戏）（Task 5：开启大写锁 CapsLock 后 WASD 实测；进行中按空格实测无重置）。

## 文件结构

| 文件 | 职责 | 创建任务 |
|---|---|---|
| `index.html` | 页面骨架：标题、分数栏、`<canvas id="board" width="400" height="400">` | Task 1 |
| `style.css` | 居中布局、基础配色、画布边框 | Task 1 |
| `game.js` | 全部游戏逻辑：常量、状态、渲染、循环、碰撞、食物、输入、重开 | Task 2-5 |

---

### Task 1: 页面骨架与样式

**Files:**
- Create: `index.html`
- Create: `style.css`

**Interfaces:**
- Consumes: 无（首个任务）
- Produces: `index.html` 含 `<span id="score">0</span>`（分数显示元素）与 `<canvas id="board" width="400" height="400">`（画布）；`game.js`（Task 2 起）通过这两个 id 取 DOM。页面通过 `<script src="game.js"></script>` 在 body 末尾加载游戏脚本。

- [ ] **Step 1: 编写 index.html**

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8">
  <title>贪吃蛇</title>
  <link rel="stylesheet" href="style.css">
</head>
<body>
  <main class="wrap">
    <h1>贪吃蛇</h1>
    <div class="bar">分数：<span id="score">0</span></div>
    <canvas id="board" width="400" height="400"></canvas>
  </main>
  <script src="game.js"></script>
</body>
</html>
```

注意：此时 `game.js` 尚不存在，浏览器控制台会报 404，属预期，Task 2 消除。

- [ ] **Step 2: 编写 style.css**

```css
* {
  box-sizing: border-box;
}

body {
  margin: 0;
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f4f5f7;
  font-family: "Microsoft YaHei", "PingFang SC", sans-serif;
}

.wrap {
  text-align: center;
}

h1 {
  margin: 0 0 12px;
  font-size: 24px;
  color: #333;
}

.bar {
  margin-bottom: 8px;
  font-size: 16px;
  color: #555;
}

canvas {
  background: #fff;
  border: 2px solid #333;
  border-radius: 4px;
}
```

- [ ] **Step 3: 浏览器验证**

打开 `file:///D:/claude/codex/test/.claude/worktrees/feature-work/index.html`（或拖入浏览器），检查：
1. 标题"贪吃蛇"与"分数：0"水平居中显示
2. 画布居中、带 2px 深色边框、白色背景，尺寸为 400×400（不随窗口拉伸）
3. 控制台仅 `game.js` 404 一条报错

如有浏览器自动化工具，可用 evaluate_script 快速核对：

```js
() => ({
  title: document.title,
  canvasW: document.getElementById('board').width,
  canvasH: document.getElementById('board').height,
  score: document.getElementById('score').textContent,
})
```

期望：`{ title: "贪吃蛇", canvasW: 400, canvasH: 400, score: "0" }`

- [ ] **Step 4: 提交**

```bash
git add index.html style.css
git commit -m "feat: 添加贪吃蛇页面骨架与样式

Co-Authored-By: Claude Code <noreply@anthropic.com>"
```

---

### Task 2: 游戏状态与静态渲染

**Files:**
- Create: `game.js`

**Interfaces:**
- Consumes: `index.html` 的 `#board`（canvas）与 `#score`（span）元素
- Produces（后续任务依赖的精确形态）:
  - 模块级状态变量：`snake`（`[{x,y},...]`，**头在前**，坐标为 0-19 的网格索引）、`direction`（`{x,y}`，右为 `{x:1,y:0}`）、`dirQueue`（`{x,y}[]`）、`food`（`{x,y}` 或 `null`）、`score`（number）、`gameOver`（boolean）
  - 常量：`COLS=20, ROWS=20, CELL=20, STEP_MS=150`
  - 函数：`reset()`（重置全部状态并重绘）、`draw()`（全量重绘）
  - 调试句柄：`window.__snake.get()` → `{snake, direction, dirQueue, food, score, gameOver}`（验收用，只读）

- [ ] **Step 1: 编写 game.js（状态、初始渲染、临时固定食物）**

```js
'use strict';

// ===== 常量 =====
const COLS = 20;      // 网格列数
const ROWS = 20;      // 网格行数
const CELL = 20;      // 每格像素
const STEP_MS = 150;  // 每步间隔（毫秒）

const canvas = document.getElementById('board');
const ctx = canvas.getContext('2d');
const scoreEl = document.getElementById('score');

// ===== 状态 =====
let snake;        // [{x,y}, ...] 头在前，网格坐标 0-19
let direction;    // {x,y} 当前行进方向
let dirQueue;     // 待消费的方向队列
let food;         // {x,y} 或 null
let score;        // 分数
let gameOver;     // 是否结束

// 临时：固定位置食物（Task 4 替换为随机生成 spawnFood）
function initFood() {
  return { x: 15, y: 10 };
}

// 重置全部状态并重绘（重开 = 整体重置）
function reset() {
  snake = [{ x: 10, y: 10 }, { x: 9, y: 10 }, { x: 8, y: 10 }];
  direction = { x: 1, y: 0 };
  dirQueue = [];
  score = 0;
  gameOver = false;
  food = initFood();
  scoreEl.textContent = score;
  draw();
}

// 全量重绘画布
function draw() {
  // 背景
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, COLS * CELL, ROWS * CELL);

  // 食物（红色方块）
  if (food) {
    ctx.fillStyle = '#e74c3c';
    ctx.fillRect(food.x * CELL, food.y * CELL, CELL, CELL);
  }

  // 蛇（身体绿色，头部深绿以区分）
  snake.forEach((seg, i) => {
    ctx.fillStyle = i === 0 ? '#1e7e34' : '#2ecc71';
    ctx.fillRect(seg.x * CELL, seg.y * CELL, CELL, CELL);
  });
}

reset();

// 调试/验收用：控制台只读检查游戏状态
window.__snake = {
  get: () => ({ snake, direction, dirQueue, food, score, gameOver }),
};
```

- [ ] **Step 2: 浏览器验证（静态渲染）**

刷新 `index.html`，检查：
1. 控制台无任何报错（Task 1 的 404 消失）
2. 画布中部偏右一排 3 个绿色方块（蛇），最右侧方块为深绿（蛇头，位于网格 (10,10)）
3. (15,10) 处有一个红色方块（食物），即画布 x=300、y=200 处
4. 页面显示"分数：0"
5. 画面静止不动（循环在 Task 3 才加入）

控制台状态核对：

```js
() => window.__snake.get()
```

期望：`snake` 长度 3 且 `snake[0]` 为 `{x:10, y:10}`；`direction` 为 `{x:1, y:0}`；`dirQueue` 为 `[]`；`food` 为 `{x:15, y:10}`；`score` 为 0；`gameOver` 为 false。

- [ ] **Step 3: 提交**

```bash
git add game.js
git commit -m "feat: 游戏状态初始化与 Canvas 静态渲染

Co-Authored-By: Claude Code <noreply@anthropic.com>"
```

---

### Task 3: 游戏循环、移动与死亡检测

**Files:**
- Modify: `game.js`（新增 `step()` / `end()` / `start()` 与 `timer` 变量；`draw()` 增加结束遮罩；文件末尾 `reset();` 改为 `start();`）

**Interfaces:**
- Consumes: Task 2 的状态变量、`reset()`、`draw()`、常量 `STEP_MS`
- Produces:
  - `step()`：单步推进（取方向 → 新头 → 撞墙判定 → 弹尾 → 撞自身判定 → 入头）。
    **顺序是正确性关键**：撞墙判定在弹尾之前（只用新头坐标）；弹尾在撞自身判定之前（尾巴本步腾出的格子不算碰撞）。
  - `end()`：置 `gameOver=true`、清定时器、重绘（显示结束遮罩）
  - `start()`：先清旧 `timer`（防叠加，见 Review Focus 3）再 `reset()` 并启动 `setInterval(step, STEP_MS)`
  - 页面加载即自动 `start()` 开局

- [ ] **Step 1: 在 game.js 的"===== 状态 ====="块末尾新增定时器变量**

```js
let timer = null;  // setInterval 句柄
```

- [ ] **Step 2: 在 reset() 定义之前新增 step()、end()、start()**

```js
// 单步推进：每 STEP_MS 由 setInterval 调用一次
function step() {
  // 每步只消费一个方向
  if (dirQueue.length > 0) {
    direction = dirQueue.shift();
  }

  const head = { x: snake[0].x + direction.x, y: snake[0].y + direction.y };

  // 撞墙：越界即死（判定只用新头坐标，须在弹尾之前）
  if (head.x < 0 || head.x >= COLS || head.y < 0 || head.y >= ROWS) {
    return end();
  }

  // 是否吃到食物（决定本步是否增长；食物逻辑 Task 4 完善，此处仅占位判断）
  const eating = food !== null && head.x === food.x && head.y === food.y;

  // 未吃到则先移除尾巴：尾巴即将腾出的格子不参与撞自身判定
  if (!eating) {
    snake.pop();
  }

  // 撞自己身体
  if (snake.some((seg) => seg.x === head.x && seg.y === head.y)) {
    return end();
  }

  snake.unshift(head);
  draw();
}

// 游戏结束：停表、标记、重绘遮罩
function end() {
  gameOver = true;
  if (timer !== null) {
    clearInterval(timer);
    timer = null;
  }
  draw();
}

// 开局/重开：务必先清旧 interval，防止多次重开叠加定时器
function start() {
  if (timer !== null) {
    clearInterval(timer);
    timer = null;
  }
  reset();
  timer = setInterval(step, STEP_MS);
}
```

- [ ] **Step 3: draw() 末尾（蛇绘制循环之后）追加结束遮罩**

```js
  // 结束遮罩：分数 + 重开提示
  if (gameOver) {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
    ctx.fillRect(0, 0, COLS * CELL, ROWS * CELL);
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.font = '24px sans-serif';
    ctx.fillText('游戏结束  分数：' + score, 200, 190);
    ctx.font = '18px sans-serif';
    ctx.fillText('按空格重新开始', 200, 225);
  }
```

- [ ] **Step 4: 将文件末尾的 `reset();` 替换为 `start();`（页面加载即开局）**

- [ ] **Step 5: 浏览器验证（移动与撞墙死亡）**

刷新 `index.html`，检查：
1. 蛇立即向右匀速移动（每 150ms 一格）
2. 蛇头抵达右边界后游戏立即停止，画布出现半透明黑色遮罩，显示"游戏结束  分数：0"与"按空格重新开始"（蛇头从 x=10 到撞墙约 10 步 ≈ 1.5 秒）

控制台核对（等游戏结束后执行）：

```js
() => window.__snake.get().gameOver
```

期望：`true`。

代码走查（Review Focus 4，无法手动构造）：确认 `step()` 中顺序为 撞墙判定 → 弹尾 → 撞自身判定 → 入头，即蛇头驶入尾巴即将腾出的格子不会误判死亡。

- [ ] **Step 6: 提交**

```bash
git add game.js
git commit -m "feat: 游戏循环、移动与撞墙/撞自身死亡检测

Co-Authored-By: Claude Code <noreply@anthropic.com>"
```

---

### Task 4: 食物随机生成与得分

**Files:**
- Modify: `game.js`（`initFood()` 替换为 `spawnFood()`；`reset()` 改调 `spawnFood()`；`step()` 入头后补吃得食物逻辑）

**Interfaces:**
- Consumes: Task 2/3 的状态变量与 `draw()`；Task 3 的 `end()`
- Produces:
  - `spawnFood(): {x,y} | null` —— 在全部**非蛇身**空格中均匀随机取一格；无空格返回 `null`（棋盘吃满，Review Focus 2）
  - `step()` 完整版：吃到食物 → `score += 1`、更新 `#score` 文本、蛇自然增长（本步未弹尾）、`spawnFood()` 刷新食物；返回 `null` 时调用 `end()` 结束

- [ ] **Step 1: 将 initFood() 整体替换为 spawnFood()**

```js
// 在非蛇身的空格中随机生成食物；无空格（棋盘吃满）返回 null
function spawnFood() {
  const empty = [];
  for (let y = 0; y < ROWS; y++) {
    for (let x = 0; x < COLS; x++) {
      if (!snake.some((seg) => seg.x === x && seg.y === y)) {
        empty.push({ x, y });
      }
    }
  }
  if (empty.length === 0) {
    return null;
  }
  return empty[Math.floor(Math.random() * empty.length)];
}
```

- [ ] **Step 2: reset() 中 `food = initFood();` 改为 `food = spawnFood();`**

- [ ] **Step 3: step() 中 `snake.unshift(head);` 与 `draw();` 之间插入得分逻辑**

```js
  snake.unshift(head);

  // 吃到食物：+1 分、自然增长（本步未弹尾）、刷新食物
  if (eating) {
    score += 1;
    scoreEl.textContent = score;
    food = spawnFood();
    if (food === null) {
      return end(); // 棋盘已无空格：本局达成，结束
    }
  }

  draw();
```

注意：`return end()` 会跳过其后的 `draw();`，但 `end()` 内部已调用 `draw()`，画面不会缺失。

- [ ] **Step 4: 浏览器验证（吃食物与得分）**

刷新 `index.html`，用方向键把蛇头驶向红色食物格，检查：
1. 吃到瞬间：页面"分数"由 0 变 1；蛇身长度 +1（尾巴一步内未缩短）；原食物消失，另一空格出现新红色方块
2. 再吃一个，分数变 2（验证累计）
3. 连续刷新页面 3 次，食物初始位置至少有一次不同（验证随机、且从不在蛇身上——蛇初始占 (8,10)(9,10)(10,10)）

控制台核对随机性：

```js
() => window.__snake.get().food
```

多次刷新，期望坐标变化且不为 `(8,10)`/`(9,10)`/`(10,10)`。

代码走查（Review Focus 2，无法手动构造 400 格吃满）：确认 `spawnFood()` 在 `empty.length === 0` 时返回 `null`，且 `step()` 对 `food === null` 调用 `end()`——两处配合保证无死循环。

- [ ] **Step 5: 提交**

```bash
git add game.js
git commit -m "feat: 食物随机生成与得分增长

Co-Authored-By: Claude Code <noreply@anthropic.com>"
```

---

### Task 5: 键盘输入、方向队列与重开

**Files:**
- Modify: `game.js`（文件末尾、`window.__snake` 之前追加 `DIRS` 表与 keydown 监听）

**Interfaces:**
- Consumes: Task 3 的 `start()`；状态 `direction` / `dirQueue` / `gameOver`
- Produces: 完整输入管线——方向键 + WASD（大小写均识别）写入方向队列（上限 2）；180° 掉头与同向重复输入丢弃，判定基准是"队列最后一个方向，队列为空时为当前行进方向"；方向键与空格 `preventDefault`；空格/回车仅在 `gameOver` 为真时触发 `start()` 重开

- [ ] **Step 1: 在 game.js 末尾（`window.__snake` 之前）追加输入处理**

```js
// ===== 输入 =====
const DIRS = {
  ArrowUp: { x: 0, y: -1 },
  ArrowDown: { x: 0, y: 1 },
  ArrowLeft: { x: -1, y: 0 },
  ArrowRight: { x: 1, y: 0 },
  w: { x: 0, y: -1 },
  s: { x: 0, y: 1 },
  a: { x: -1, y: 0 },
  d: { x: 1, y: 0 },
};

document.addEventListener('keydown', (e) => {
  // 空格/回车：仅在游戏结束后重开；同时阻止空格滚动页面
  if (e.key === ' ' || e.key === 'Enter') {
    e.preventDefault();
    if (gameOver) {
      start();
    }
    return;
  }

  // 字母键归一（兼容大写/CapsLock），方向键原样查表
  const dir = DIRS[e.key.length === 1 ? e.key.toLowerCase() : e.key];
  if (!dir) {
    return;
  }
  e.preventDefault(); // 阻止方向键滚动页面

  if (gameOver) {
    return; // 结束状态下方向键不产生任何效果
  }

  // 判定基准：队列中最后一个方向；队列为空时为当前行进方向
  const last = dirQueue.length > 0 ? dirQueue[dirQueue.length - 1] : direction;
  if (dir.x === -last.x && dir.y === -last.y) {
    return; // 180° 掉头：忽略
  }
  if (dir.x === last.x && dir.y === last.y) {
    return; // 与基准同向：不入队
  }
  if (dirQueue.length >= 2) {
    return; // 队列上限 2：防止连按堆积
  }
  dirQueue.push(dir);
});
```

- [ ] **Step 2: 浏览器验证（转向、防掉头、WASD、滚动）**

刷新 `index.html`，检查（对应规格手动清单第 4、6 条）：

1. **基本转向**：↑/↓/←/→ 与 w/a/s/d 均能转向（用食物位置试一次即可）
2. **180° 掉头防护**：向右行进时按 ←，蛇继续向右；紧接着快速按 ↑ 再按 ←（一个步内两键），蛇先转上、下一步才转左，**不会**瞬间掉头自杀（Review Focus 1）
3. **同向不堆积**：向右行进时连按 → 多次，`window.__snake.get().dirQueue` 保持长度 0
4. **页面不滚动**：按住 ↓ 与空格，页面不发生滚动
5. **大写兼容**（Review Focus 5）：开启 CapsLock，WASD 仍可操控
6. **结束重开**：撞墙结束后按空格，游戏完全重置（分数 0、蛇 3 节居中、向右移动）并继续；按回车同样有效
7. **未结束时空格无效**（Review Focus 5）：游戏进行中按空格，`window.__snake.get().score` 与蛇身长度不变（不重置）

控制台核对队列行为：

```js
() => window.__snake.get().dirQueue.length
```

行进中间歇按键，期望值始终 ≤ 2。

- [ ] **Step 3: 提交**

```bash
git add game.js
git commit -m "feat: 键盘输入、方向队列与空格重开

Co-Authored-By: Claude Code <noreply@anthropic.com>"
```

---

### Task 6: 全量验收

**Files:**
- Modify: 无（如验收发现问题，修复后重跑本任务全部步骤）

**Interfaces:**
- Consumes: Task 1-5 的全部产出
- Produces: 按规格"测试方式"清单的完整验收结论

- [ ] **Step 1: 执行规格手动验收清单（全部 6 项逐一记录通过/失败）**

| # | 清单项（摘自规格） | 对应任务 |
|---|---|---|
| 1 | 吃到食物后分数 +1、蛇身变长、新食物出现 | Task 4 |
| 2 | 蛇头撞墙后游戏结束，显示分数 | Task 3 |
| 3 | 蛇头撞自己身体后游戏结束 | Task 3/5（把蛇绕圈撞向自己身体） |
| 4 | 快速连按两个方向键（向右行进时按上再按左）不会瞬间自杀 | Task 5 |
| 5 | 游戏结束后按空格，游戏完全重置并可正常继续玩 | Task 5 |
| 6 | 方向键操作时页面不发生滚动 | Task 5 |

- [ ] **Step 2: 边界用例验收（Review Focus 3）**

1. 撞墙结束后**快速连按空格 3 次以上**：游戏重开一次且正常，随后观察蛇移动速度仍为每 150ms 一格（无叠加快进）
2. 重开后再玩到结束、再重开，重复 2 轮，确认状态完全干净（分数归零、蛇 3 节、队列空）
3. 控制台确认无任何报错：

```js
() => window.__snake.get()
```

期望重开后：`score` 0、`snake` 长 3、`dirQueue` `[]`、`gameOver` false。

- [ ] **Step 3: 代码规模核对**

```bash
wc -l game.js
```

期望：约 150-200 行（规格约定；少量出入可接受，超出较多需精简）。

- [ ] **Step 4: 提交（如有修复）**

无修复则跳过本步；有修复时：

```bash
git add game.js index.html style.css
git commit -m "fix: 全量验收发现问题的修复

Co-Authored-By: Claude Code <noreply@anthropic.com>"
```

---

## Self-Review 记录

1. **规格覆盖**：画布/网格（T1-2）、初始状态（T2）、食物规则（T4）、得分增长（T4）、死亡两条件（T3）、结束显示与重开（T3/T5）、固定 150ms（T3）、渲染配色（T2）、双操控与方向队列与 preventDefault（T5）、状态整体重置（T2/T5）、手动验收清单（T6）——全部有对应任务，无遗漏。
2. **占位符扫描**：所有代码步骤均给出完整可用代码，无 TBD/TODO/"类似上文"。
3. **类型一致性**：`snake` 头在前、`direction/food` 为 `{x,y}`、`spawnFood` 返回 `{x,y}|null`、`__snake.get()` 形态在 T2 定义且 T3-T6 引用一致；`start/reset/step/end/draw/spawnFood` 命名全文一致。
4. **Review Focus**：五项均已写入对应任务的具体验证步骤（T3 走查顺序守卫、T4 空格判空、T5 连按/大写/未结束空格、T6 重复重开）。
