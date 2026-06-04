# 游戏存档备份脚本
# 用法: python backup_game_saves.py
# 会将所有游戏的存档复制到 F:\cx\tests\game-saves-backup\

import os, shutil, json
from datetime import datetime

BACKUP_ROOT = r"F:\cx\tests\game-saves-backup"

# 游戏存档路径映射
SAVES = {
    "Slay the Spire 2": [
        os.path.expandvars(r"%APPDATA%\SlayTheSpire2"),
    ],
    "Brotato": [
        os.path.expandvars(r"%APPDATA%\Brotato"),
    ],
    "Undertale": [
        os.path.expandvars(r"%LOCALAPPDATA%\UNDERTALE"),
    ],
    "DJMAX RESPECT V": [
        os.path.expandvars(r"%USERPROFILE%\AppData\LocalLow\Neowiz\DJMAX RESPECT V"),
    ],
    "Muse Dash": [
        os.path.expandvars(r"%USERPROFILE%\AppData\LocalLow\PeroPeroGames\MuseDash"),
    ],
    "MUSYNX": [
        os.path.expandvars(r"%USERPROFILE%\AppData\LocalLow\coweye\MUSYNX"),
        os.path.expandvars(r"%USERPROFILE%\AppData\LocalLow\coweye\MUSYNX RETURN"),
    ],
    "Malody V": [
        os.path.expandvars(r"%USERPROFILE%\AppData\LocalLow\Mugzone\Malody V"),
    ],
    "Limbus Company": [
        os.path.expandvars(r"%USERPROFILE%\AppData\LocalLow\ProjectMoon\LimbusCompany"),
        os.path.expandvars(r"%USERPROFILE%\AppData\LocalLow\Unity\ProjectMoon_LimbusCompany"),
    ],
    "Unheard": [
        os.path.expandvars(r"%USERPROFILE%\AppData\LocalLow\NEXTStudios\Unheard"),
    ],
    "Bloons TD 6": [
        os.path.expandvars(r"%USERPROFILE%\AppData\LocalLow\Ninja Kiwi\BloonsTD6"),
    ],
    "Steam 云存档": [
        r"F:\SteamLibrary\steamapps\common\SlayTheSpire",
        r"F:\SteamLibrary\steamapps\common\Terraria",
    ],
}

def backup():
    timestamp = datetime.now().strftime("%Y-%m-%d_%H%M%S")
    backup_dir = os.path.join(BACKUP_ROOT, timestamp)
    os.makedirs(backup_dir, exist_ok=True)

    total = 0
    success = 0

    for game, paths in SAVES.items():
        for src in paths:
            total += 1
            if not os.path.exists(src):
                continue
            dst = os.path.join(backup_dir, game, os.path.basename(src))
            os.makedirs(os.path.dirname(dst), exist_ok=True)
            try:
                if os.path.isdir(src):
                    shutil.copytree(src, dst, dirs_exist_ok=True)
                else:
                    shutil.copy2(src, dst)
                success += 1
            except Exception as e:
                print(f"  [跳过] {game}: {e}")

    # 写摘要
    summary = {
        "备份时间": timestamp,
        "成功": success,
        "总计": total,
        "游戏": list(SAVES.keys()),
    }
    with open(os.path.join(backup_dir, "backup_info.json"), "w", encoding="utf-8") as f:
        json.dump(summary, f, ensure_ascii=False, indent=2)

    print(f"备份完成: {success}/{total} 项 → {backup_dir}")

    # 清理旧备份（保留最近 5 个）
    all_backups = sorted(
        [d for d in os.listdir(BACKUP_ROOT) if os.path.isdir(os.path.join(BACKUP_ROOT, d))],
        reverse=True
    )
    for old in all_backups[5:]:
        shutil.rmtree(os.path.join(BACKUP_ROOT, old))
        print(f"清理旧备份: {old}")

if __name__ == "__main__":
    backup()
