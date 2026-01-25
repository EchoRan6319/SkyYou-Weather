# SkyYou Weather
一个精美、移动端优先的渐进式 Web 应用 (PWA) 天气追踪器，采用 **Material You** 设计美学。
---

## ✨ 功能特性 (Features)

*   **全球天气数据**：精准的实时、24小时逐小时和未来7天预报。
*   **移动端优先设计**：
    *   专为移动设备优化的响应式布局。
    *   **悬浮船坞 (Floating Dock)** 导航栏，便于单手拇指操作。
    *   适配现代全面屏手机（iOS/Android）的安全区域（刘海屏/灵动岛）。
    *   流畅的动画和过渡效果。
*   **多城市管理**：
    *   自动 GPS 定位。
    *   搜索并保存多个关注城市。
    *   便捷的城市切换。
*   **PWA 支持**：可像原生应用一样安装到 iOS 和 Android 设备主屏幕。
*   **多语言支持**：完美支持简体中文和英语。
*   **个性化定制**：
    *   单位切换（公制/英制）。
    *   主题支持（跟随系统/浅色/深色）。
    *   早晚天气播报通知。
*   **数据隐私**：“清除数据”功能可一键重置本地存储。

---

## 🛠️ 技术栈 (Tech Stack)

*   **前端 (Frontend)**: React (v19), TypeScript
*   **构建工具 (Build Tool)**: Vite
*   **样式 (Styling)**: Tailwind CSS (via CDN)
*   **图标 (Icons)**: Lucide React
*   **数据源 (Data Sources)**:
    *   彩云天气 (Caiyun Weather) - 国内首选
    *   OpenWeatherMap - 国际备用

---

## 🚀 本地部署与开发 (Local Deployment & Development)

### 先决条件 (Prerequisites)

*   已安装 Node.js 环境。

### 安装步骤 (Installation)

1.  克隆仓库：
    ```bash
    git clone https://github.com/YourUsername/SkyYou-Weather.git
    cd SkyYou-Weather
    ```

2.  安装依赖：
    ```bash
    npm install
    ```

### 开发模式 (Development)

启动开发服务器：
```bash
npm run dev
```

#### ⚠️ 移动端测试重要提示 (Mobile Testing Note)

本项目使用了 **地理位置 (Geolocation)** 和 **通知 (Notifications)** 等现代 Web API，这些 API 在 iOS 和 Android 上**必须**在 **安全上下文 (HTTPS)** 下才能运行。

开发服务器已配置为使用自签名 HTTPS 证书：
1.  运行 `npm run dev`。
2.  在手机浏览器中打开 `https://<局域网IP>:5173`。
3.  点击“高级” -> “继续访问” (Proceed) 以接受自签名证书警告。

### 生产环境部署 (Production Build)

如果您想在本地构建生产版本并运行：

1.  **构建项目**：
    ```bash
    npm run build
    ```
    构建产物将生成在 `dist` 目录中。

2.  **本地预览 (Preview)**：
    ```bash
    npm run preview
    ```
    这将启动一个本地服务器预览生产构建。

3.  **静态部署**：
    您可以将 `dist` 目录中的内容部署到任何静态网站托管服务，例如：
    *   Vercel
    *   Netlify
    *   GitHub Pages
    *   Nginx / Apache

### 配置 API 密钥 (Configuration)

要获取真实天气数据，您需要配置 API 密钥。

1.  打开 `src/constants.ts`。
2.  替换占位符为你申请的密钥：
    ```typescript
    export const CAIYUN_API_KEY = "你的彩云天气Token";
    export const OPENWEATHER_API_KEY = "你的OpenWeatherKey";
    ```

---

## License

This project is open source and available under the [MIT License](LICENSE).
