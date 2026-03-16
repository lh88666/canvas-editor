# CLAUDE.md

本文件为 Claude Code在本项目中工作时提供指导。
请始终使用简体中文与我对话，并在回答时保持专业。
如果要生成代码，代码中的函数名保持英文风格，注释请写中文。

## 开发命令

- `npm run dev` - 启动开发服务器
- `npm run lib` - 构建库（运行 lint、类型检查并构建库）
- `npm run build` - 构建应用（运行 lint、类型检查并构建应用）
- `npm run lint` - 运行 ESLint
- `npm run type:check` - 运行 TypeScript 类型检查（不生成文件）
- `npm run cypress:open` - 打开 Cypress 测试运行器 GUI
- `npm run cypress:run` - 无头运行 Cypress 测试
- `npm run docs:dev` - 启动 VitePress 文档服务器
- `npm run docs:build` - 构建 VitePress 文档
- `npm run release` - 运行发布脚本

运行单个 Cypress 测试文件：`npx cypress run --spec cypress/e2e/<test-file>.cy.ts`

## Git Hooks

预提交钩子运行 `npm run lint` 和 `npm run type:check`。提交信息必须遵循 Conventional Commits 格式：`feat:`、`fix:`、`docs:`、`refactor:` 等。

## 架构概述

这是一个基于 Canvas 的富文本编辑器，使用 TypeScript 构建。核心架构采用模块化、分层设计：

### 核心组件

**Editor 类** (`src/editor/index.ts`)
- 主编排所有子系统的主入口点
- 通过 `command` 属性暴露公共 API（例如 `editor.command.executeBold()`）
- 通过 `destroy()` 方法管理生命周期

**Draw 类** (`src/editor/core/draw/Draw.ts`)
- 负责 Canvas 绘制的核心渲染引擎（约 96KB）
- 管理页面、行、元素和光标渲染
- 协调所有粒子类型和框架元素

**命令模式** (`src/editor/core/command/`)
- `Command.ts`：暴露所有执行方法的外观类（例如 `executeBold`、`executeUndo`）
- `CommandAdapt.ts`：将命令桥接到 Draw 上下文的适配器
- 所有命令遵循 `execute*` 命名规范

### 元素系统

编辑器使用在 `src/editor/interface/Element.ts` 中定义的层次化元素模型：

**IElement** - 所有内容元素的基础接口，包含：
- 基本属性：`id`、`type`、`value`、`extension`、`externalId`
- 样式：`font`、`size`、`bold`、`color` 等（IElementStyle）
- 规则：`hide`（IElementRule）
- 分组：`groupIds`（IElementGroup）

**元素类型**（ElementType 枚举）：
- 文本粒子：TextParticle、ListParticle、HyperlinkParticle 等
- 块粒子：ImageParticle、TableParticle、LaTexParticle 等
- 控制粒子：CheckboxParticle、RadioParticle 等
- 框架元素：Margin、Background、PageNumber 等

### 目录结构

```
src/editor/
├── core/
│   ├── draw/           # 渲染引擎
│   │   ├── particle/    # 元素渲染（文本、图片、表格、latex 等）
│   │   ├── control/    # 控件组件渲染
│   │   ├── frame/       # 框架元素（页边距、背景、边框）
│   │   ├── richtext/    # 富文本装饰（下划线、高亮）
│   │   └── interactive/ # 交互功能（搜索、涂鸦）
│   ├── command/         # 命令模式实现
│   ├── event/          # Canvas 和全局事件处理
│   ├── observer/        # 鼠标、选择、图片观察器
│   ├── worker/          # Web Workers 异步操作
│   └── [其他子系统]
├── interface/           # TypeScript 接口（40+ 文件）
├── dataset/            # 枚举和常量
└── utils/               # 工具函数
```

### Web Workers

异步操作使用由 `WorkerManager.ts` 管理的 Web Workers：
- WordCountWorker - 统计元素列表中的字数
- CatalogWorker - 生成文档目录/大纲
- GroupWorker - 从元素中提取分组 ID
- ValueWorker - 异步获取文档值

### 事件系统

**EventBus** (`src/editor/core/event/eventbus/`) - 编辑器事件的发布/订阅系统
**Listener** (`src/editor/core/listener/`) - 变更通知的回调系统
**CanvasEvent** 和 **GlobalEvent** - 处理鼠标、键盘和拖拽事件

### 插件系统

插件通过 `editor.use(plugin)` 模式扩展功能。参见 `src/editor/core/plugin/Plugin.ts`。

## 关键模式

**命令-Draw 分离**：命令通过 CommandAdapt 访问 Draw 功能，而不是直接访问。这可以防止向外部用户暴露内部 Draw 上下文。

**元素格式化**：元素通过 `formatElementList()` 工具函数进行格式化，该函数应用默认值并补偿缺失的属性。

**基于区域的布局**：文档支持通过区域系统管理的页眉/主内容/页脚区域。

**位置-范围模型**：光标位置和选区通过 Position 和 RangeManager 类进行跟踪。

**历史管理**：通过 HistoryManager 和命令历史栈实现撤销/重做功能。

## DOCX 导入导出
DOCX 文件的导入和导出插件。


### 使用
```javascript
import Editor from '@hufe921/canvas-editor'
import docxPlugin from '@hufe921/canvas-editor-plugin-docx'

const instance = new Editor()
instance.use(docxPlugin)
```

### 导入 DOCX
```javascript
command.executeImportDocx({
  arrayBuffer: buffer
})
```

### 导出 DOCX
```javascript
instance.executeExportDocx({
  fileName: string
})
```

### 参数
#### 导入参数
| 参数         | 类型        | 说明                     |
|--------------|-------------|--------------------------|
| arrayBuffer  | ArrayBuffer | DOCX 文件的 ArrayBuffer  |

#### 导出参数
| 参数     | 类型   | 说明               |
|----------|--------|--------------------|
| fileName | string | 导出的文件名       |

## Excel 导入
Excel 文件导入插件。

### 使用
```javascript
import Editor from '@hufe921/canvas-editor'
import excelPlugin from '@hufe921/canvas-editor-plugin-excel'

const instance = new Editor()
instance.use(excelPlugin)

command.executeImportExcel({
  arrayBuffer: buffer
})
```

### 参数
| 参数         | 类型        | 说明                     |
|--------------|-------------|--------------------------|
| arrayBuffer  | ArrayBuffer | Excel 文件的 ArrayBuffer  |

### 示例
```javascript
// 读取文件后导入
const fileInput = document.getElementById('file')
fileInput.addEventListener('change', (e) => {
  const file = e.target.files[0]
  const reader = new FileReader()
  reader.onload = (e) => {
    command.executeImportExcel({
      arrayBuffer: e.target.result
    })
  }
  reader.readAsArrayBuffer(file)
})
```

## 浮动工具栏
浮动工具栏插件，选中文本时显示快捷操作工具栏。

### 使用
```javascript
import Editor from '@hufe921/canvas-editor'
import floatingToolbarPlugin from '@hufe921/canvas-editor-plugin-floating-toolbar'

const instance = new Editor()
instance.use(floatingToolbarPlugin)
```

### 说明
该插件无需额外配置，安装后会自动在文本选中时显示浮动工具栏，提供快捷格式化操作。


## 图表绘制
集成图表绘制功能的插件，支持流程图、时序图等。


### 使用
```javascript
import Editor from '@hufe921/canvas-editor'
import diagramPlugin from '@hufe921/canvas-editor-plugin-diagram'

const instance = new Editor()
instance.use(diagramPlugin)

command.executeLoadDiagram({
  lang?: Lang
  data?: string
  onDestroy?: (message?: any) => void
})
```

### 参数
| 参数      | 类型       | 说明                 |
|-----------|------------|----------------------|
| lang      | Lang       | 可选，语言设置       |
| data      | string     | 可选，初始图表数据   |
| onDestroy | function   | 可选，关闭回调函数   |

### 示例
```javascript
command.executeLoadDiagram({
  lang: 'zh',
  data: `graph TD
    A[开始] --> B{判断}
    B -->|条件1| C[处理1]
    B -->|条件2| D[处理2]`,
  onDestroy: (message) => {
    console.log('图表编辑器关闭', message)
  }
})
```
## 特殊字符
特殊字符选择对话框插件。

### 使用
```javascript
import Editor from '@hufe921/canvas-editor'
import specialCharactersPlugin from '@hufe921/canvas-editor-plugin-special-characters'

const instance = new Editor()
instance.use(specialCharactersPlugin)

command.executeOpenSpecialCharactersDialog({
  characters?: ICharacterCategory[],
  onSelect?: (char: string) => void
})
```

### 参数
| 参数        | 类型                  | 说明                     |
|-------------|-----------------------|--------------------------|
| characters  | ICharacterCategory[]  | 可选，自定义字符分类     |
| onSelect    | function              | 可选，选中字符时的回调   |

### 类型定义
```typescript
interface ICharacterCategory {
  name: string
  characters: string[]
}
```

### 示例
```javascript
command.executeOpenSpecialCharactersDialog({
  characters: [
    {
      name: '数学符号',
      characters: ['±', '×', '÷', '∞', '∑', '∏']
    },
    {
      name: '货币符号',
      characters: ['$', '€', '£', '¥', '₩', '₽']
    }
  ],
  onSelect: (char) => {
    console.log('选中了字符:', char)
  }
})
```

## 条形码 1D
一维条形码生成插件。

### 使用
```javascript
import Editor from '@hufe921/canvas-editor'
import barcode1DPlugin from '@hufe921/canvas-editor-plugin-barcode1d'

const instance = new Editor()
instance.use(barcode1DPlugin)

instance.executeInsertBarcode1D(
  content: string,
  width: number,
  height: number,
  options?: JsBarcode.Options
)
```

### 参数
| 参数     | 类型                | 说明                 |
|----------|---------------------|----------------------|
| content  | string              | 条形码内容           |
| width    | number              | 条形码宽度           |
| height   | number              | 条形码高度           |
| options  | JsBarcode.Options   | 可选，条形码配置选项 |

### 示例
```javascript
instance.executeInsertBarcode1D('123456789', 200, 100, {
  format: 'CODE128',
  lineColor: '#000000',
  background: '#ffffff'
})
```

## 条形码 2D
二维条形码（二维码）生成插件。

### 使用
```javascript
import Editor from '@hufe921/canvas-editor'
import barcode2DPlugin from '@hufe921/canvas-editor-plugin-barcode2d'

const instance = new Editor()
instance.use(barcode2DPlugin, options?: IBarcode2DOption)

instance.executeInsertBarcode2D(
  content: string,
  width: number,
  height: number,
  hints?: Map<EncodeHintType, any>
)
```

### 参数
| 参数     | 类型                          | 说明                 |
|----------|-------------------------------|----------------------|
| content  | string                        | 二维码内容           |
| width    | number                        | 二维码宽度           |
| height   | number                        | 二维码高度           |
| hints    | Map<EncodeHintType, any>      | 可选，编码提示       |

### 插件选项
```typescript
interface IBarcode2DOption {
  // 插件配置选项
}
```

## 代码块
代码块高亮显示插件。

### 使用
```javascript
import Editor from '@hufe921/canvas-editor'
import codeblockPlugin from '@hufe921/canvas-editor-plugin-codeblock'

const instance = new Editor()
instance.use(codeblockPlugin)

instance.executeInsertCodeblock(content: string)
```

### 参数
| 参数     | 类型    | 说明         |
|----------|---------|--------------|
| content  | string  | 代码内容     |

### 示例
```javascript
instance.executeInsertCodeblock(`function hello() {
  console.log('Hello World');
}`)
```

## 大小写转换
文本大小写转换插件，支持将选中的文本快速转换为大写或小写。

### 使用
```javascript
import Editor from '@hufe921/canvas-editor'
import casePlugin from '@hufe921/canvas-editor-plugin-case'

const instance = new Editor()
instance.use(casePlugin)
```

### 命令
#### 转为大写
```javascript
command.executeUpperCase()
```

#### 转为小写
```javascript
command.executeLowerCase()
```

### 说明
选中需要转换的文本后，执行上述相应命令即可完成文本大小写的转换操作。
