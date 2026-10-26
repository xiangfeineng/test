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
