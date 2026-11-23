"""通用响应工具：ok / fail。"""

from fastapi import Header, HTTPException


def ok(data=None, message=""):
    return {"ok": True, "data": data, "message": message}


def fail(message: str, code: str = "BAD_REQUEST", status_code: int = 400):
    raise HTTPException(status_code=status_code, detail={"code": code, "message": message})


def _requester(x_user_id: str = Header(default="1")) -> int:
    try:
        return max(1, int(x_user_id))
    except (TypeError, ValueError):
        return 1
