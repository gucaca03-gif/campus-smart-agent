"""苏小师通用工具层。

内置：天气（Open-Meteo，免 key，失败降级 wttr.in）、时间、四则运算。
扩展：backend/mcp_tools.json 可登记外部工具（MCP server 的 command/args），
      预留 run_mcp_tool() 作为接入点；当前未配置时不影响内置能力。
"""

import ast
import html as html_lib
import json
import operator
import re
import time
import urllib.parse
import urllib.request
from datetime import datetime
from pathlib import Path

BACKEND_DIR = Path(__file__).resolve().parents[1]
MCP_CONFIG = BACKEND_DIR / "mcp_tools.json"

WEEKDAY_CN = ["周一", "周二", "周三", "周四", "周五", "周六", "周日"]

# 常用城市坐标（WGS-84）。默认徐州（泉山校区）。
CITY_COORDS = {
    "徐州": (34.1975, 117.1733),
    "南京": (32.0603, 118.7969),
    "苏州": (31.2989, 120.5853),
    "无锡": (31.4912, 120.3119),
    "常州": (31.8107, 119.9741),
    "镇江": (32.1878, 119.4250),
    "扬州": (32.3942, 119.4129),
    "南通": (31.9802, 120.8943),
    "盐城": (33.3477, 120.1614),
    "淮安": (33.6104, 119.0153),
    "连云港": (34.5967, 119.2216),
    "宿迁": (33.9631, 118.2752),
    "泰州": (32.4558, 119.9230),
    "北京": (39.9042, 116.4074),
    "上海": (31.2304, 121.4737),
    "天津": (39.3434, 117.3616),
    "重庆": (29.5630, 106.5516),
    "杭州": (30.2741, 120.1551),
    "广州": (23.1291, 113.2644),
    "深圳": (22.5431, 114.0579),
    "成都": (30.5728, 104.0668),
    "武汉": (30.5928, 114.3055),
    "西安": (34.3416, 108.9398),
    "青岛": (36.0671, 120.3826),
}

WEATHER_TEXT = {
    0: "晴", 1: "基本晴", 2: "多云", 3: "阴",
    45: "有雾", 48: "霜雾",
    51: "毛毛雨", 53: "小雨", 55: "中雨",
    56: "冻毛毛雨", 57: "冻雨",
    61: "小雨", 63: "中雨", 65: "大雨",
    66: "冻雨", 67: "强冻雨",
    71: "小雪", 73: "中雪", 75: "大雪", 77: "雪粒",
    80: "阵雨", 81: "强阵雨", 82: "暴雨",
    85: "阵雪", 86: "强阵雪",
    95: "雷阵雨", 96: "雷阵雨伴冰雹", 99: "强雷暴伴冰雹",
}

_TOOL_NAMES = ("get_weather", "get_time", "calc")

TOOL_SPECS = [
    {"name": "get_weather", "description": "查询指定城市未来几天的天气", "params": {"city": "城市名，默认徐州", "days": "天数，1-5"}},
    {"name": "get_time", "description": "获取当前日期、星期和时间", "params": {}},
    {"name": "calc", "description": "安全计算数学表达式", "params": {"expression": "四则运算表达式"}},
]

_WEATHER_CACHE: dict[tuple[str, int], tuple[float, dict]] = {}
WEATHER_TTL = 600


def resolve_city(text: str) -> tuple[str, float, float]:
    """从用户文本中识别城市，默认徐州。"""
    for city, (lat, lng) in CITY_COORDS.items():
        if city in (text or ""):
            return city, lat, lng
    lat, lng = CITY_COORDS["徐州"]
    return "徐州", lat, lng


def _get_json(url: str, timeout: int = 8) -> dict | list | None:
    try:
        req = urllib.request.Request(url, headers={"User-Agent": "aishida/1.0"})
        with urllib.request.urlopen(req, timeout=timeout) as res:
            return json.loads(res.read().decode("utf-8", errors="replace"))
    except Exception:
        return None


def get_weather(days: int = 3, city: str = "徐州") -> dict | None:
    """查询指定城市天气（1-7 天），Open-Meteo 免 key，失败降级 wttr.in。"""
    days = max(1, min(7, int(days or 3)))
    city = city if city in CITY_COORDS else "徐州"
    lat, lng = CITY_COORDS[city]

    cached = _WEATHER_CACHE.get((city, days))
    if cached and time.time() - cached[0] < WEATHER_TTL:
        return cached[1]

    url = (
        "https://api.open-meteo.com/v1/forecast"
        f"?latitude={lat}&longitude={lng}"
        "&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m"
        "&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max"
        f"&timezone=Asia%2FShanghai&forecast_days={days}"
    )
    data = _get_json(url)
    if isinstance(data, dict) and data.get("current"):
        current = data["current"]
        daily = data.get("daily") or {}
        dates = daily.get("time") or []
        forecast = []
        for i, day in enumerate(dates):
            forecast.append(
                {
                    "date": day,
                    "weekday": WEEKDAY_CN[datetime.strptime(day, "%Y-%m-%d").weekday()],
                    "text": WEATHER_TEXT.get((daily.get("weather_code") or [])[i], "未知"),
                    "max": (daily.get("temperature_2m_max") or [])[i],
                    "min": (daily.get("temperature_2m_min") or [])[i],
                    "precip": (daily.get("precipitation_probability_max") or [None])[i],
                }
            )
        result = {
            "source": "Open-Meteo",
            "city": city,
            "current": {
                "temp": current.get("temperature_2m"),
                "feels": current.get("apparent_temperature"),
                "humidity": current.get("relative_humidity_2m"),
                "wind": current.get("wind_speed_10m"),
                "text": WEATHER_TEXT.get(current.get("weather_code"), "未知"),
            },
            "forecast": forecast,
        }
        _WEATHER_CACHE[(city, days)] = (time.time(), result)
        return result

    wttr = _get_json(f"https://wttr.in/{city}?format=j1", timeout=8)
    if isinstance(wttr, dict) and wttr.get("current_condition"):
        cur = wttr["current_condition"][0]
        forecast = []
        for day in (wttr.get("weather") or [])[:days]:
            hourly = day.get("hourly") or [{}]
            midday = hourly[min(4, len(hourly) - 1)]
            forecast.append(
                {
                    "date": day.get("date"),
                    "weekday": WEEKDAY_CN[datetime.strptime(day.get("date"), "%Y-%m-%d").weekday()],
                    "text": (midday.get("lang_zh") or [{}])[0].get("value", "未知"),
                    "max": day.get("maxtempC"),
                    "min": day.get("mintempC"),
                    "precip": (midday.get("chanceofrain") or None),
                }
            )
        result = {
            "source": "wttr.in",
            "city": city,
            "current": {
                "temp": cur.get("temp_C"),
                "feels": cur.get("FeelsLikeC"),
                "humidity": cur.get("humidity"),
                "wind": cur.get("windspeedKmph"),
                "text": (cur.get("lang_zh") or [{}])[0].get("value", "未知"),
            },
            "forecast": forecast,
        }
        _WEATHER_CACHE[(city, days)] = (time.time(), result)
        return result
    return None


def get_time() -> dict:
    now = datetime.now()
    return {
        "date": now.strftime("%Y-%m-%d"),
        "time": now.strftime("%H:%M"),
        "weekday": WEEKDAY_CN[now.weekday()],
    }


_OPS = {
    ast.Add: operator.add,
    ast.Sub: operator.sub,
    ast.Mult: operator.mul,
    ast.Div: operator.truediv,
    ast.FloorDiv: operator.floordiv,
    ast.Mod: operator.mod,
    ast.Pow: operator.pow,
    ast.USub: operator.neg,
    ast.UAdd: operator.pos,
}


def _eval_node(node):
    if isinstance(node, ast.Expression):
        return _eval_node(node.body)
    if isinstance(node, ast.Constant) and isinstance(node.value, (int, float)):
        return node.value
    if isinstance(node, ast.BinOp) and type(node.op) in _OPS:
        return _OPS[type(node.op)](_eval_node(node.left), _eval_node(node.right))
    if isinstance(node, ast.UnaryOp) and type(node.op) in _OPS:
        return _OPS[type(node.op)](_eval_node(node.operand))
    raise ValueError("只支持数字和 + - * / // % ** 运算")


def calc(expression: str) -> dict:
    expr = (
        str(expression or "")
        .replace("×", "*")
        .replace("÷", "/")
        .replace("（", "(")
        .replace("）", ")")
        .replace("＋", "+")
        .replace("－", "-")
        .strip()
    )
    if not expr:
        raise ValueError("请输入算式")
    if len(expr) > 80:
        raise ValueError("算式太长")
    value = _eval_node(ast.parse(expr, mode="eval"))
    return {"expression": expr, "result": value}


_SEARCH_CACHE: dict[str, tuple[float, list]] = {}
SEARCH_TTL = 900


def _strip_html(text: str) -> str:
    text = re.sub(r"<[^>]+>", "", text or "")
    return html_lib.unescape(re.sub(r"\s+", " ", text)).strip()


def search_price_info(product: str, limit: int = 5, timeout: float = 6.0) -> list:
    """通过 Bing 公开搜索页检索商品价格/评测摘要（免 key，失败返回空列表）。"""
    keyword = (product or "").strip()
    if not keyword:
        return []
    limit = max(1, min(8, int(limit or 5)))
    cached = _SEARCH_CACHE.get(keyword)
    if cached and time.time() - cached[0] < SEARCH_TTL:
        return cached[1]
    url = "https://cn.bing.com/search?q=" + urllib.parse.quote_plus(
        keyword + " 价格"
    ) + "&mkt=zh-CN"
    try:
        req = urllib.request.Request(
            url,
            headers={
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36",
                "Accept-Language": "zh-CN,zh;q=0.9",
            },
        )
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            page = resp.read().decode("utf-8", errors="replace")
    except Exception:
        return []

    out = []
    for block in re.split(r'<li class="b_algo"', page)[1 : limit + 1]:
        m = re.search(r'<h2[^>]*>.*?<a[^>]*href="([^"]+)"[^>]*>(.*?)</a>', block, re.S)
        if not m:
            continue
        link = html_lib.unescape(m.group(1))
        title = _strip_html(m.group(2))[:120]
        sm = re.search(r"<p[^>]*>(.*?)</p>", block, re.S)
        snippet = _strip_html(sm.group(1))[:260] if sm else ""
        if not title or not link.startswith("http"):
            continue
        out.append({"title": title, "url": link, "snippet": snippet})
    if out:
        _SEARCH_CACHE[keyword] = (time.time(), out)
    return out


def search_price_info_multi(queries: list, limit: int = 5, deadline: float = 5.0) -> list:
    """按多个消歧后的查询词并发检索并去重，返回最相关的网页摘要。

    并发执行 + 整体截止时间：Bing 偶发单次连接慢，不能让它无限拖住查价流程。
    """
    limit = max(1, min(8, int(limit or 5)))
    words = [str(q or "").strip() for q in (queries or []) if str(q or "").strip()][:3]
    if not words:
        return []
    from concurrent.futures import ThreadPoolExecutor
    import time as _time

    results = []
    pool = ThreadPoolExecutor(max_workers=len(words))
    futures = [pool.submit(search_price_info, q, max(2, limit)) for q in words]
    deadline_at = _time.monotonic() + max(1.0, float(deadline))
    for fut in futures:
        remain = max(0.1, deadline_at - _time.monotonic())
        try:
            results.append(fut.result(timeout=remain))
        except Exception:
            results.append([])
    pool.shutdown(wait=False)
    out, seen = [], set()
    for items in results:
        for item in items:
            key = (item.get("url") or "").split("#")[0]
            if not key or key in seen:
                continue
            seen.add(key)
            out.append(item)
            if len(out) >= limit:
                return out
    return out


def _load_mcp_servers() -> list:
    if not MCP_CONFIG.exists():
        return []
    try:
        cfg = json.loads(MCP_CONFIG.read_text(encoding="utf-8"))
        return cfg.get("servers", []) if isinstance(cfg, dict) else []
    except (OSError, json.JSONDecodeError):
        return []


def mcp_tool_names() -> list:
    return [s.get("name") for s in _load_mcp_servers() if s.get("name")]


def tool_specs() -> list:
    specs = [
        {"name": "get_weather", "description": "查询指定城市当前天气与未来 1-7 天预报（免 key）"},
        {"name": "get_time", "description": "查询当前日期、星期与时间"},
        {"name": "calc", "description": "计算四则运算表达式"},
    ]
    for server in _load_mcp_servers():
        if server.get("enabled"):
            specs.append({"name": server.get("name"), "description": "MCP 外部工具（已登记）"})
    return specs


def run_tool(name: str, args: dict | None = None) -> dict:
    args = args or {}
    if name == "get_weather":
        data = get_weather(args.get("days", 3), args.get("city", "徐州"))
        if not data:
            raise RuntimeError("天气服务暂时不可用")
        return data
    if name == "get_time":
        return get_time()
    if name == "calc":
        return calc(args.get("expression", ""))
    raise KeyError(f"未知工具：{name}")