#!/usr/bin/env python3
"""
生成 Android 应用图标脚本
将源图标生成为不同分辨率的 Android 图标
"""

from PIL import Image
import os
from pathlib import Path

# Android 图标配置（分辨率）
ANDROID_ICONS = {
    'ldpi': 36,
    'mdpi': 48,
    'hdpi': 72,
    'xhdpi': 96,
    'xxhdpi': 144,
    'xxxhdpi': 192,
}

def generate_android_icons(source_image_path, output_dir):
    """
    从源图像生成 Android 图标
    
    Args:
        source_image_path: 源图像路径
        output_dir: 输出目录
    """
    try:
        # 打开源图像
        img = Image.open(source_image_path)
        print(f"✓ 打开源图像: {source_image_path}")
        print(f"  原始尺寸: {img.size}")
        
        # 转换为 RGBA（确保透明度）
        if img.mode != 'RGBA':
            img = img.convert('RGBA')
        
        # 生成各个分辨率的图标
        for density, size in ANDROID_ICONS.items():
            # 创建输出目录
            res_dir = os.path.join(output_dir, f'mipmap-{density}')
            os.makedirs(res_dir, exist_ok=True)
            
            # 调整图像尺寸（使用高质量的缩放）
            resized_img = img.resize((size, size), Image.Resampling.LANCZOS)
            
            # 保存为 ic_launcher.png 和 ic_launcher_round.png
            launcher_path = os.path.join(res_dir, 'ic_launcher.png')
            launcher_round_path = os.path.join(res_dir, 'ic_launcher_round.png')
            
            resized_img.save(launcher_path, 'PNG')
            resized_img.save(launcher_round_path, 'PNG')
            
            print(f"✓ 生成 {density:8s} ({size:3d}x{size:3d}): {launcher_path}")
        
        print("\n✓ 所有图标已成功生成！")
        return True
        
    except Exception as e:
        print(f"✗ 错误: {e}")
        return False

if __name__ == '__main__':
    # 项目路径
    project_dir = Path(__file__).parent
    source_image = project_dir / 'icon_source.png'
    res_output_dir = project_dir / 'android' / 'app' / 'src' / 'main' / 'res'
    
    if not source_image.exists():
        print(f"✗ 源图像不存在: {source_image}")
        print("\n请将要使用的图标保存为 icon_source.png")
        exit(1)
    
    # 生成图标
    success = generate_android_icons(str(source_image), str(res_output_dir))
    exit(0 if success else 1)
