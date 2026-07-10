# BanGDream Stickers Maker

基于 [stickers-maker](https://github.com/rpdg-cz/stickers-maker)（Project Sekai 贴纸生成器）二次开发的 BanGDream 表情包制作工具。

输入 `/角色[序号] 文本`，将文本按预设字体特征填充到角色素材图片上，输出 PNG 图片。

## 快速开始

```bash
# 安装依赖
cd cli && npm install

# 构建 CLI
npm run build

# 生成贴图
node dist/index.js /anon1 你好世界
```

输出图片位于项目根目录的 `output/` 文件夹。

## 使用方式

```bash
# 单次生成
node cli/dist/index.js /anon1 文本

# 批量生成
node cli/dist/index.js /tmr1 こんにちは /rana2 テスト
```

### 输入格式

`/角色[序号] 文本`

- 角色名：小写英文字母（`anon`, `tmr`, `soyo`, `taki`, `rana`, `uika`, `mutsumi`, `umirin`, `nyamu`, `sakiko`）
- 序号：素材图片编号（1 或 2）
- 文本：不超过 20 个全角字符

### 示例

| 命令 | 效果 |
|---|---|
| `/anon1 你好` | 将你好以 anon 的字体特征渲染到 anon1 素材上 |
| `/tmr2 テスト` | 将テスト以 tmr 的字体特征渲染到 tmr2 素材上 |

## 项目结构

```
stick/
├── cli/                 命令行工具源码（TypeScript）
│   ├── src/index.ts     渲染与 CLI 入口
│   └── dist/            编译输出
├── image-editor/        Web 前端调试工具（React + Vite + MUI）
├── stickers-maker/      上游 Web 应用（参考实现）
├── src/                 角色素材图片（按角色分目录）
│   ├── anon/
│   ├── tmr/
│   └── ...
├── characters/          角色字体特征描述文件（Markdown）
├── characters.json      角色特征数据源（CLI 读取）
├── output/              CLI 输出目录
└── requirements.txt     环境与依赖说明
```

## 角色应援色

| 角色 | 应援色 |
|---|---|
| `tmr` | `#77BBDD` |
| `anon` | `#FF8899` |
| `rana` | `#77DD77` |
| `soyo` | `#FFDD88` |
| `taki` | `#7777AA` |
| `uika` | `#BB9955` |
| `mutsumi` | `#779977` |
| `umirin` | `#335566` |
| `nyamu` | `#AA4477` |
| `sakiko` | `#7799CC` |

## Build & Test

```bash
# 安装依赖
cd cli && npm install

# 编译 TypeScript
npm run build

# 运行 CLI
node dist/index.js /anon1 测试文本

# 启动 image-editor 开发服务器
cd ../image-editor && npm install && npm run dev
```

## 环境要求

- Node.js >= 20
- npm >= 9

详见 [requirements.txt](requirements.txt)。

## Commit 规范

遵循 [Conventional Commits](https://www.conventionalcommits.org/)：

| Scope | 含义 |
|---|---|
| `agent1` | 字体特征识别 |
| `agent2` | CLI 工具开发 |
| `chars` | 角色特征描述文件 |
| `assets` | 素材图片变更 |

## 许可

素材图片和角色特征文件纳入版本控制。`output/` 目录不纳入版本控制。
