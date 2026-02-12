# SkyYou Weather - Android 图标设置指南

## 快速设置应用图标

### 方法 1：使用 Android Asset Studio（推荐）

1. 访问：https://romannurik.github.io/AndroidAssetStudio/icons-launcher.html

2. 上传你的图标图片（1024x1024px 或更大）

3. 在 "Effect" 中选择：
   - Shape: Circle（圆形）或 Square（方形）
   - 根据需要调整

4. 点击 "Download .zip"

5. 解压后，将所有 `mipmap-*` 文件夹复制到：
   ```
   android/app/src/main/res/
   ```

### 方法 2：手动设置（如果已有各种尺寸的图标）

需要的图标尺寸：
- `mipmap-ldpi/`: 36x36
- `mipmap-mdpi/`: 48x48
- `mipmap-hdpi/`: 72x72
- `mipmap-xhdpi/`: 96x96
- `mipmap-xxhdpi/`: 144x144
- `mipmap-xxxhdpi/`: 192x192

每个目录需要两个文件：
- `ic_launcher.png` - 正常图标
- `ic_launcher_round.png` - 圆形图标

### 方法 3：使用 ImageMagick（命令行）

如果已安装 ImageMagick：

```bash
# 假设源图像为 icon.png
convert icon.png -resize 192x192 android/app/src/main/res/mipmap-xxxhdpi/ic_launcher.png
convert icon.png -resize 192x192 android/app/src/main/res/mipmap-xxxhdpi/ic_launcher_round.png
# ... 其他尺寸
```

## 完成后的步骤

1. 确保所有图标文件已放入对应目录
2. 在 Android Studio 中点击 **Build > Rebuild Project**
3. 运行以下命令重新同步：
   ```bash
   npm run build:android
   ```

## 验证图标

重建后，在 Android Studio 中查看 `res` 文件夹，应该能看到：
```
res/
├── mipmap-ldpi/
│   ├── ic_launcher.png
│   └── ic_launcher_round.png
├── mipmap-mdpi/
│   ├── ic_launcher.png
│   └── ic_launcher_round.png
├── mipmap-hdpi/
│   ├── ic_launcher.png
│   └── ic_launcher_round.png
├── mipmap-xhdpi/
│   ├── ic_launcher.png
│   └── ic_launcher_round.png
├── mipmap-xxhdpi/
│   ├── ic_launcher.png
│   └── ic_launcher_round.png
└── mipmap-xxxhdpi/
    ├── ic_launcher.png
    └── ic_launcher_round.png
```

## 已完成

✅ 包名已更新为：`com.echoran.skyyouweather`
