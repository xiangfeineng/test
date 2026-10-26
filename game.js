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
let timer = null; // setInterval 句柄

// 临时：固定位置食物（Task 4 替换为随机生成 spawnFood）
function initFood() {
  return { x: 15, y: 10 };
}

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
}

start(); // 页面加载即开局

// 调试/验收用：控制台只读检查游戏状态
window.__snake = {
  get: () => ({ snake, direction, dirQueue, food, score, gameOver }),
};
