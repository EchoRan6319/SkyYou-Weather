# SkyYou Weather - Android 构建指南

本指南说明如何将 SkyYou Weather 构建为 Android APK 文件。

## 系统需求

- **Node.js** 18+ 和 npm
- **Java Development Kit (JDK)** 17+
- **Android Studio** 最新版本
- **Android SDK** API 36（最新）
- **Gradle** 8.x+

## 环境配置

### 1. 配置 Android SDK

在 Android Studio 中：
1. 打开 **Tools > SDK Manager**
2. 确保已安装：
   - **SDK Platforms**: Android 16 (API 36)
   - **SDK Tools**: 
     - Android SDK Build-Tools (最新)
     - Android Emulator
     - Android SDK Platform-Tools

### 2. 配置环境变量

在 Windows 中添加以下环境变量：
```
ANDROID_HOME = C:\Users\[YourUsername]\AppData\Local\Android\Sdk
ANDROID_SDK_ROOT = %ANDROID_HOME%
```

然后将以下路径添加到 `PATH`：
```
%ANDROID_HOME%\tools
%ANDROID_HOME%\platform-tools
```

### 3. 验证配置

```bash
cd "d:\EchoRan\Documents\GitHub\SkyYou-Weather"

# 验证 Java
java -version
javac -version

# 验证 Android SDK
echo %ANDROID_HOME%
```

## 构建步骤

### 快速构建 APK（调试版本）

```bash
cd "d:\EchoRan\Documents\GitHub\SkyYou-Weather"

# 1. 安装依赖（首次）
npm install

# 2. 构建 Web 应用
npm run build

# 3. 同步到 Android
npx cap sync android

# 4. 在 Android Studio 中打开项目
npx cap open android
```

然后在 Android Studio 中：
1. 点击 **Build > Build Bundle(s) / APK(s) > Build APK(s)**
2. 或使用快捷键 **Ctrl + F9**

### 命令行构建发布版本 APK

```bash
# 一键构建发布版本 APK
npm run build:apk
```

这会生成：`android/app/build/outputs/apk/release/app-release.apk`

### 构建 AAB（Google Play Bundle）

```bash
npm run build:aab
```

这会生成：`android/app/build/outputs/bundle/release/app-release.aab`

## 签名配置

### 为 APK 签名（必需用于发布）

#### 方式 1：使用 Android Studio（推荐）

1. 在 Android Studio 中打开项目：
   ```bash
   npx cap open android
   ```

2. 进入 **Build > Generate Signed Bundle/APK**

3. 选择 **APK** 并配置：
   - **Key store path**: 选择或创建新的密钥库
   - **Key store password**: 设置密码
   - **Key alias**: 输入别名
   - **Key password**: 输入密钥密码
   - **Build Variants**: 选择 `release`

4. 点击 **Create**

#### 方式 2：使用命令行

首先创建签名密钥库：

```bash
# 进入 android 目录
cd android

# 生成密钥（第一次）
keytool -genkey -v -keystore release-keystore.jks ^
  -keyalg RSA -keysize 2048 -validity 10000 ^
  -alias app -storepass YOUR_PASSWORD ^
  -keypass YOUR_PASSWORD

# 构建签名的 APK
./gradlew assembleRelease -Pandroid.injected.signing.store.file=release-keystore.jks ^
  -Pandroid.injected.signing.store.password=YOUR_PASSWORD ^
  -Pandroid.injected.signing.key.alias=app ^
  -Pandroid.injected.signing.key.password=YOUR_PASSWORD
```

## 故障排除

### 问题 1：Gradle 找不到 Android SDK

**解决方案**：创建或编辑 `android/local.properties`：
```properties
sdk.dir=C:\\Users\\[YourUsername]\\AppData\\Local\\Android\\Sdk
```

### 问题 2：内存不足错误

在 `android/gradle.properties` 中添加或修改：
```properties
org.gradle.jvmargs=-Xmx4096m
```

### 问题 3：Capacitor 同步失败

```bash
# 清除缓存并重新同步
npx cap sync android --refresh
```

### 问题 4：构建超时

在 `android/gradle.properties` 中增加超时时间：
```properties
org.gradle.daemon.performance.warn-threshold=20000
```

## 测试应用

### 在物理设备上测试

1. **启用开发者模式**：
   - 进入 **设置 > 关于手机 > 连续点击"版本号"7 次**

2. **启用 USB 调试**：
   - 进入 **设置 > 开发者选项 > USB 调试**

3. **连接设备**并运行：
   ```bash
   npx cap run android
   ```

### 在模拟器上测试

```bash
# 在 Android Studio 中启动模拟器，然后运行：
npx cap run android
```

## 发布 APK

### 用于 Google Play Store

1. **创建应用 ID**（如果还未创建）
2. **生成签名的 AAB**：
   ```bash
   npm run build:aab
   ```
3. **上传到 Google Play Console**

### 用于直接安装

1. **生成签名的 APK**：
   ```bash
   npm run build:apk
   ```
2. **手机通过 USB 安装**：
   ```bash
   adb install -r android/app/build/outputs/apk/release/app-release.apk
   ```

## 版本更新

编辑 `android/app/build.gradle` 中的版本号：

```groovy
defaultConfig {
    // ...
    versionCode 1  // 每次发布必须递增
    versionName "1.0"
}
```

## 更多信息

- [Capacitor Android 文档](https://capacitorjs.com/docs/android)
- [Gradle 官方文档](https://gradle.org/docs/)
- [Android Studio 文档](https://developer.android.com/studio/intro)

## 项目分支

- **main**: 主要分支（Web 版本）
- **android-native**: Android 原生开发分支

```bash
# 切换到 Android 分支
git checkout android-native
```
