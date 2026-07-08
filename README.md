## stickers-cli

BanGDream 表情包制作命令行工具。基于 [stickers-maker](https://github.com/rpdg-cz/stickers-maker) 二次开发。

### 安装

```bash
cd cli
npm install
npm run build
```

### 使用

```bash
node cli/dist/index.js "/anon1 文本"
```

输入格式：`/角色[序号] 文本`。角色使用小写英文名，序号从 1 开始。可一次传入多组：

```bash
node cli/dist/index.js "/anon1 你好" "/tmr2 こんにちは" "/rana1 テスト"
```

生成图片输出到仓库根目录的 `output/`，每次运行前自动清空。

### 可用角色

| 角色 | 标识符 | 应援色 |
|------|--------|--------|
| 灯(Tomori) | `tmr` | `#77BBDD` |
| 愛音(Anon) | `anon` | `#FF8899` |
| 楽奈(Rana) | `rana` | `#77DD77` |
| 爽世(Soyo) | `soyo` | `#FFDD88` |
| 立希(Taki) | `taki` | `#7777AA` |
| 初華(Uika) | `uika` | `#BB9955` |
| 睦(Mutsumi) | `mutsumi` | `#779977` |
| 海鈴(Umirin) | `umirin` | `#335566` |
| 若麦(Nyamu) | `nyamu` | `#AA4477` |
| 祥子(Sakiko) | `sakiko` | `#7799CC` |

### 限制

- 文本不超过 **20 个全角字符**，超出拒绝并报错。
- 角色名和序号必须与 `src/` 下的素材文件对应。
- 输出画布固定 **2048×2048** 像素。
- .json文件中的配置画布大小是 **296×296** 像素，在图像编辑的时候会等比例放大。

### 项目结构

```
cli/
├── src/index.ts    # TypeScript 源码
├── dist/           # 编译输出（tsc）
├── package.json
└── tsconfig.json
```

### 技术栈

- **TypeScript**（ES2022 / ESNext 模块）
- **@napi-rs/canvas** — 基于 Skia 的 Node.js Canvas 实现，负责图片合成与文字渲染
- 字体文件来自 `../stickers-maker/src/fonts/`

### 构建

```bash
npm run build          # 等同于 npx tsc
```

`tsconfig.json` 将 `src/` 编译到 `dist/`，目标 ES2022，模块格式 ESNext。
