"""华为云 OBS 可选接入：上传原始材料留档。

未配置时自动禁用，不影响文件识别主流程。
配置项（.env）：
    OBS_ENDPOINT / OBS_BUCKET / OBS_ACCESS_KEY_ID / OBS_SECRET_ACCESS_KEY
依赖：esdk-obs-python（可选，未安装且未配置时不会触发 import）。
"""

import datetime
import os
import uuid

_client = None


def _env(key: str, default: str = "") -> str:
    return os.getenv(key, default).strip()


def enabled() -> bool:
    return bool(
        _env("OBS_ENDPOINT")
        and _env("OBS_BUCKET")
        and _env("OBS_ACCESS_KEY_ID")
        and _env("OBS_SECRET_ACCESS_KEY")
    )


def get_client():
    global _client
    if _client is not None:
        return _client
    from obs import ObsClient  # type: ignore

    _client = ObsClient(
        access_key_id=_env("OBS_ACCESS_KEY_ID"),
        secret_access_key=_env("OBS_SECRET_ACCESS_KEY"),
        server=_env("OBS_ENDPOINT"),
    )
    return _client


def put_bytes(filename: str, data: bytes, prefix: str = "office") -> tuple[bool, str]:
    """上传字节内容。返回 (是否成功, object key 或错误信息)。"""
    if not enabled():
        return False, "OBS 未配置"
    key = f"{prefix}/{datetime.date.today():%Y%m%d}/{uuid.uuid4().hex[:8]}_{filename}"
    try:
        resp = get_client().putContent(_env("OBS_BUCKET"), key, data)
        if getattr(resp, "status", 500) < 300:
            return True, key
        return False, f"OBS 上传失败：{getattr(resp, 'status', 'unknown')}"
    except Exception as exc:  # pragma: no cover - 依赖外部服务
        return False, f"OBS 上传异常：{exc}"