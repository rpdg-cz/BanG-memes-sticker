# BanGDream Stickers Maker — 仓库指南

## 项目概述

基于 [stickers-maker](https://github.com/rpdg-cz/stickers-maker)（Project Sekai 贴纸生成器，React + Vite + TypeScript + MUI）二次开发的 **BanGDream 表情包制作命令行工具**。

输入格式 `/角色[序号] 文本`，将文本按预设字体特征填充到角色素材图片上，输出到 `output/` 目录。

## Project Structure & Module Organization

```
stick/
├── AGENTS.md                # 本文件：项目规范与开发指南
├── goals.md                 # 原始需求文档
├── src/                     # 角色素材图片（按角色分目录）
│   ├── example/             # 表情包参考示例（用于提取字体特征）
│   │   ├── anon/            # anon1.png, anon2.png
│   │   ├── mutsumi/         # mutsumi1.png, mutsumi2.png
│   │   ├── nyamu/           # nyamu1.png, nyamu2.png
│   │   ├── rana/            # rana1.png, rana2.png
│   │   ├── sakiko/          # sakiko1.png, sakiko2.png
│   │   ├── soyo/            # soyo1.png, soyo2.png
│   │   ├── taki/            # taki1.png, taki2.png
│   │   ├── tmr/             # tmr1.png, tmr2.png
│   │   ├── uika/            # uika1.png, uika2.png
│   │   └── umirin/          # umirin1.png, umirin2.png
│   ├── anon/                # anon1.png, anon2.png
│   ├── mutsumi/             # mutsumi1.png, mutsumi2.png
│   ├── nyamu/               # nyamu1.png, nyamu2.png
│   ├── rana/                # rana1.png, rana2.png
│   ├── sakiko/              # sakiko1.png, sakiko2.png
│   ├── soyo/                # soyo1.png, soyo2.png
│   ├── taki/                # taki1.png, taki2.png
│   ├── tmr/                 # tmr1.png, tmr2.png
│   ├── uika/                # uika1.png, uika2.png
│   └── umirin/              # umirin1.png, umirin2.png
├── stickers-maker/          # 上游 Web 应用（参考实现）
│   └── src/                 # React 组件、hooks、工具函数
├── output/                  # CLI 工具输出目录（每次运行前自动清空）
├── characters/              # 角色特征描述文件（.md，由 Agent 1 生成）`r`n├── characters.json          # 角色特征数据源（JSON，CLI 运行时读取）
└── cli/                     # 命令行工具源码（由 Agent 2 实现）
```

素材命名规范：`{角色名}{序号}.png`（如 `anon1.png`）。角色名仅使用小写英文字母，序号为从 1 开始的阿拉伯数字。

## 多 Agent 工作流

本项目使用两个子 Agent 协同完成：

### Agent 1：字体特征识别

**职责**：分析 `src/example/{角色}/` 下每个角色的示例图片，提取文本渲染特征。

**输入**：`src/example/` 中每个角色目录的 PNG 文件。

**输出**：`characters/{角色}.md`，格式如下：

```markdown
# {角色} 字体特征

## {角色}1
* 文字排列方式：竖排
* 字体：SSFangTangTi
* 文字置于底层：True
* 字体中心坐标：（X,Y）
* 字体倾斜角度：θ°
* 字体大小：自适应
* 行间距：自适应

## {角色}2
* 文字排列方式：竖排
* 字体：SSFangTangTi
* 文字置于底层：True
* 字体中心坐标：（X,Y）
* 字体倾斜角度：θ°
* 字体大小：自适应
* 行间距：自适应
```

**提取规则**：
- **字体中心坐标 (X, Y)**、**字体倾斜角度**：从 `example/` 中的对应图片精确提取。
- **文字排列方式**：从 example 图片判断（全为竖排）。
- **字体颜色**：以角色应援色表为准（见下文），与 example 中颜色冲突时以应援色表为准。
- **字体**：默认 `SSFangTangTi`。
- **文字置于底层**：默认 `True`。
- **字体大小**、**行间距**：沿用 `stickers-maker` 的默认自适应算法。

### Agent 2：命令行工具开发

**职责**：开发基于 `stickers-maker` 的 CLI 工具，读取角色特征和素材，渲染文本并输出图片。

**输入格式**：
```
/角色[序号] 文本
```
示例：`/anon1 项目四`

**渲染特性**：
- 坐标 (x, y) 为**文本块几何中心**，非左上角起始点。
- 字体大小**自适应**：短文本可达 40px，长文本自动缩小；16 字极限时约 46px。
- 超长文本**自动换行**：单列高度超出画布时自动拆为多列竖排。
 → 将"项目四"按 anon 的字体特征填充到 `src/anon/anon1.png`。

**约束**：
- 文本长度不超过 **16 个全角字符**，超出则拒绝并提示错误。
- 输出目录 `output/`，每次运行前**清空**该目录；若目录不存在则自动创建。
- 图像文本填充逻辑基于 `stickers-maker/src/` 中的渲染实现。

## 角色应援色表

文本渲染时以此颜色表为准：

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

## Build, Test, and Development Commands

| Command | Purpose |
|---|---|
| `cd stickers-maker && npm install` | 安装上游 Web 应用依赖 |
| `cd stickers-maker && npm run dev` | 启动上游 Web 应用开发服务器 |
| `cd cli && npm install` | 安装 CLI 工具依赖 |
| `cd cli && npm run build` | 构建 CLI 工具（等同于 `npx tsc`） |
| `cd cli && npx tsc` | 直接调用 TypeScript 编译器，编译 `src/` 到 `dist/` |
| `cd cli && node dist/index.js /anon1 文本` | 运行 CLI，生成贴图到 `output/` |

CLI 工具使用方式：

```bash
# 单次生成
node cli/dist/index.js /anon1 文本

# 批量生成
node cli/dist/index.js /tmr1 こんにちは /rana2 テスト
```

## Coding Style & Naming Conventions

- **CLI 工具**使用 TypeScript，缩进 2 空格，遵循 `stickers-maker` 的 ESLint/Prettier 配置。
- 文件名、函数名、变量名使用 `camelCase`。类名使用 `PascalCase`。常量使用 `UPPER_SNAKE_CASE`。
- 角色名在所有上下文中统一使用**小写英文字母**（`anon`, `tmr`, `soyo` 等）。
- 素材文件命名严格遵循 `{角色名}{序号}.png` 格式。

## Testing Guidelines

- Agent 1 的特征提取需人工复核：每个角色的坐标和角度应抽样验证。
- CLI 工具需覆盖以下场景：
  - `test_parse_valid_input`：正确解析 `/anon1 文本` 格式。
  - `test_reject_long_text`：超过 16 个全角字符时拒绝并报错。
  - `test_reject_invalid_role`：不存在的角色名报错。
  - `test_reject_invalid_index`：不存在的序号报错。
  - `test_output_cleared`：每次运行前 `output/` 目录被清空。
  - `test_image_output`：输出图片文件存在且格式正确。

## Commit & Pull Request Guidelines

遵循 [Conventional Commits](https://www.conventionalcommits.org/)：`type(scope): summary`。

| Scope | 含义 |
|---|---|
| `agent1` | Agent 1：字体特征识别 |
| `agent2` | Agent 2：CLI 工具开发 |
| `chars` | 角色特征描述文件 |
| `assets` | 素材图片变更 |

示例：
- `feat(agent1): extract font features for anon`
- `feat(agent2): implement CLI text-to-sticker rendering`
- `fix(agent2): handle empty input gracefully`

## Security & Configuration

- 角色应援色为硬编码常量，定义在 CLI 工具的配置模块中。
- `output/` 目录已加入 `.gitignore`，不纳入版本控制。
- 素材图片 (`src/`) 和特征文件 (`characters/`) 纳入版本控制。
