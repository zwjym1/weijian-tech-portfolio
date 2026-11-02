# 赵伟健 · 技术作品集 (Weijian Zhao · Tech Portfolio)

齐鲁工业大学 软件工程（大二） · 方向：AI 内容生成工程 / 程序化动画 / 自动化工具链

> 本仓库整理了我近期在 **AI 驱动的视频生产自动化** 方向的工程实践：用代码（TypeScript/React + Python）把“选题 → 文案 → 配音 → 动画 → 渲染 → 数据复盘”做成可复用的流水线。成片发布于抖音账号「秘书丞」（硬核财经/科普）。

## 技术栈
| 领域 | 技术 |
|---|---|
| 程序化视频 | Remotion (React + TypeScript)、帧级动画、分层合成、节拍对齐 (BPM 卡点) |
| 语音 | Fish Audio TTS（逐字时间戳 → 字幕同步）、Whisper 类 ASR 校对 |
| 后端/脚本 | Python 3（数据采集、SQLite + FTS 资产库、状态机式流水线）、Node.js |
| 媒体处理 | ffmpeg、numpy/scipy 音频分析（BPM、节拍、响度） |
| 工程 | Git、YAML 配置驱动、本地 GPU 渲染（RTX 3080） |
| 其他学习 | Java / 数据结构与算法、操作系统、FISCO BCOS 区块链 + DID 数字身份（能源数据，竞赛方向） |

## 项目
| # | 项目 | 说明 | 技术 |
|---|---|---|---|
| 01 | [AI 视频工作流](projects/01-ai-video-workflows) | 两套可复用的视频制作规范（科普短视频 / 小学讲题课），含 π 课程、梯度下降、特斯拉等示例工程 | Remotion, Python, Fish TTS |
| 02 | [Remotion 动画引擎](projects/02-remotion-motion-engine) | 多期节目共用的组件库与场景代码；配音/字幕/对齐工具 | TypeScript, React, Python |
| 03 | [视频生产流水线](projects/03-video-production-pipeline) | 配置驱动的 10 阶段 / 4 审核闸口流水线、状态管理、数据闭环脚本 | Python, YAML, SQLite |
| 04 | [World Observatory](projects/04-world-observatory) | 新闻/世界观察类节目模板与渲染工程 | Remotion, TypeScript |
| 05 | [数据工具](projects/05-data-tools) | 公开页面数据采集、ASR 重识别、选题监控 | Python, Playwright |

## 说明
- 只包含源码与文档；成片、音频、第三方素材与大文件均未上传（版权与体积原因）。
- 所有 API 密钥只从环境变量读取，仓库内无任何凭证。
