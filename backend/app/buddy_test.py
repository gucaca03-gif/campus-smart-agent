"""搭子性格档案：小动物测试 + MBTI 快测题库与计分。"""

# ---------- 小动物测试（10 题情景选择） ----------
# 每个选项给若干动物加分；8 种动物：柯基/猫猫/海豚/刺猬/仓鼠/狐狸/鹅/水獭

ANIMALS = {
    "柯基": {"emoji": "🐕", "label": "柯基型 · 自来熟社牛", "tags": ["e 人", "自来熟", "气氛担当"]},
    "猫猫": {"emoji": "🐈", "label": "猫猫型 · i 人慢热", "tags": ["i 人", "慢热", "独处充电"]},
    "海豚": {"emoji": "🐬", "label": "海豚型 · 话痨热心", "tags": ["e 人", "热心肠", "行动派"]},
    "刺猬": {"emoji": "🦔", "label": "刺猬型 · 外冷内热", "tags": ["i 人", "外冷内热", "毒舌但靠谱"]},
    "仓鼠": {"emoji": "🐹", "label": "仓鼠型 · 宅但靠谱", "tags": ["i 人", "宅", "靠谱"]},
    "狐狸": {"emoji": "🦊", "label": "狐狸型 · 鬼点子多", "tags": ["灵活", "鬼点子", "效率党"]},
    "鹅": {"emoji": "🦢", "label": "鹅型 · 计划通", "tags": ["计划通", "自律", "J 人"]},
    "水獭": {"emoji": "🦦", "label": "水獭型 · 佛系随性", "tags": ["佛系", "随性", "P 人"]},
}

ANIMAL_QUESTIONS = [
    {
        "q": "周五晚上 8 点，你的状态大概率是？",
        "options": [
            {"t": "已经在约饭局上了", "s": ["柯基", "海豚"]},
            {"t": "戴耳机打游戏/刷剧，别找我", "s": ["仓鼠", "猫猫"]},
            {"t": "列好明天要做的事才安心", "s": ["鹅"]},
            {"t": "突然想去哪个展或者夜市逛逛", "s": ["狐狸", "水獭"]},
        ],
    },
    {
        "q": "小组作业里你通常是？",
        "options": [
            {"t": "组长，分工催进度的那种", "s": ["鹅", "海豚"]},
            {"t": "默默把最难的活干了", "s": ["刺猬", "仓鼠"]},
            {"t": "活跃气氛+打圆场", "s": ["柯基"]},
            {"t": "灵感贡献者，思路清奇", "s": ["狐狸"]},
        ],
    },
    {
        "q": "陌生同学加你微信，第一反应？",
        "options": [
            {"t": "好啊！多认识个人", "s": ["柯基", "海豚"]},
            {"t": "先看朋友圈再决定聊不聊", "s": ["猫猫", "刺猬"]},
            {"t": "过了三天才想起来回复", "s": ["仓鼠", "水獭"]},
            {"t": "秒回，但聊天控制在三句内", "s": ["鹅", "狐狸"]},
        ],
    },
    {
        "q": "去图书馆自习，你的座位偏好？",
        "options": [
            {"t": "和熟人拼桌，学累了聊两句", "s": ["柯基", "海豚"]},
            {"t": "角落单人位，谁也别挨着我", "s": ["猫猫", "刺猬"]},
            {"t": "固定老位置，仪式感", "s": ["鹅", "仓鼠"]},
            {"t": "随便坐，哪里有空去哪里", "s": ["水獭", "狐狸"]},
        ],
    },
    {
        "q": "突然降温 10 度，你会？",
        "options": [
            {"t": "昨晚就看了天气预报换好衣服", "s": ["鹅"]},
            {"t": "冻到了才翻出羽绒服", "s": ["水獭", "仓鼠"]},
            {"t": "在群里问谁有多余的暖宝宝", "s": ["柯基", "海豚"]},
            {"t": "不说，硬扛，然后发朋友圈", "s": ["猫猫", "刺猬"]},
        ],
    },
    {
        "q": "旅行前你的攻略做多少？",
        "options": [
            {"t": "Excel 排好每天几点去哪", "s": ["鹅", "刺猬"]},
            {"t": "收藏了几十条视频，出发再说", "s": ["水獭", "狐狸"]},
            {"t": "看攻略不如看谁来，发动态拉人", "s": ["柯基"]},
            {"t": "订好酒店就够了，其他随缘", "s": ["猫猫", "仓鼠"]},
        ],
    },
    {
        "q": "遇到不合理的安排（比如晚上十点通知明天交材料），你会？",
        "options": [
            {"t": "吐槽归吐槽，肝到交完", "s": ["鹅", "仓鼠"]},
            {"t": "先找有没有规则漏洞", "s": ["狐狸"]},
            {"t": "在群里带头问清楚", "s": ["海豚", "柯基"]},
            {"t": "表面好的，内心已翻白眼", "s": ["猫猫", "刺猬"]},
        ],
    },
    {
        "q": "你手机里的社交软件未读消息通常？",
        "options": [
            {"t": "基本清零，消息必回", "s": ["海豚", "鹅"]},
            {"t": "99+，但重要的不会漏", "s": ["猫猫", "刺猬"]},
            {"t": "看心情，心情好秒回", "s": ["狐狸", "水獭"]},
            {"t": "分组屏蔽了很多群", "s": ["仓鼠"]},
        ],
    },
    {
        "q": "更愿意参加哪种集体活动？",
        "options": [
            {"t": "球赛/爬山，出汗就对了", "s": ["柯基", "海豚"]},
            {"t": "桌游/剧本杀，动脑子的", "s": ["狐狸", "刺猬"]},
            {"t": "看展/听讲座，安静的", "s": ["猫猫", "水獭"]},
            {"t": "聚餐，吃就行", "s": ["仓鼠", "鹅"]},
        ],
    },
    {
        "q": "朋友对你的评价最可能是？",
        "options": [
            {"t": "人形小太阳，能量拉满", "s": ["柯基", "海豚"]},
            {"t": "高冷但答应的事一定做到", "s": ["猫猫", "刺猬"]},
            {"t": "行走的日历和备忘录", "s": ["鹅"]},
            {"t": "有点懒但总有奇思妙想", "s": ["狐狸", "水獭"]},
        ],
    },
]

# ---------- MBTI 快测（4 维度 × 3 题） ----------

MBTI_QUESTIONS = [
    {"dim": "EI", "q": "周末连续social两天后，你感觉？", "a": "有点爽，但也想独处回血", "b": "完全不累，还想再约", "sa": "I", "sb": "E"},
    {"dim": "EI", "q": "新环境里认识新朋友，你通常？", "a": "等人先开口", "b": "主动打招呼", "sa": "I", "sb": "E"},
    {"dim": "EI", "q": "小组讨论时你更倾向于？", "a": "想好了再发言", "b": "边说边想", "sa": "I", "sb": "E"},
    {"dim": "SN", "q": "记课堂笔记你更喜欢？", "a": "按老师板书结构记", "b": "记自己理解的框架和联想", "sa": "S", "sb": "N"},
    {"dim": "SN", "q": "别人讲一个新想法，你第一反应是？", "a": "可行吗？怎么落地", "b": "有意思，还能怎么延展", "sa": "S", "sb": "N"},
    {"dim": "SN", "q": "你更擅长注意到？", "a": "细节和数字", "b": "整体和趋势", "sa": "S", "sb": "N"},
    {"dim": "TF", "q": "室友闹矛盾找你评理，你会？", "a": "先分析谁有道理", "b": "先安抚双方情绪", "sa": "T", "sb": "F"},
    {"dim": "TF", "q": "看到感人的新闻，你？", "a": "理性看看事实经过", "b": "容易共情到破防", "sa": "T", "sb": "F"},
    {"dim": "TF", "q": "拒绝别人的请求时你？", "a": "直接说明理由", "b": "委婉表达怕伤人", "sa": "T", "sb": "F"},
    {"dim": "JP", "q": "你的桌面/文件状态是？", "a": "分类整理，强迫症友好", "b": "乱中有序，我知道东西在哪", "sa": "J", "sb": "P"},
    {"dim": "JP", "q": "DDL 前 3 天你会？", "a": "已经做完大半", "b": "刚打开文档", "sa": "J", "sb": "P"},
    {"dim": "JP", "q": "计划被临时打乱，你？", "a": "有点烦躁，重新排计划", "b": "无所谓，随机应变", "sa": "J", "sb": "P"},
]


def score_animal(answers: list) -> dict:
    """answers: 每题选中的 option index 数组。返回 {animal, emoji, label, tags, scores}。"""
    scores = {k: 0 for k in ANIMALS}
    for qi, ans in enumerate(answers):
        if qi >= len(ANIMAL_QUESTIONS):
            break
        opts = ANIMAL_QUESTIONS[qi]["options"]
        if isinstance(ans, int) and 0 <= ans < len(opts):
            for a in opts[ans]["s"]:
                scores[a] += 1
    best = max(scores, key=lambda k: scores[k])
    meta = ANIMALS[best]
    return {"animal": best, "emoji": meta["emoji"], "label": meta["label"], "tags": meta["tags"], "scores": scores}


def score_mbti(answers: list) -> dict:
    """answers: 每题 'a'|'b'。返回 {mbti, dims}。"""
    dims = {"E": 0, "I": 0, "S": 0, "N": 0, "T": 0, "F": 0, "J": 0, "P": 0}
    for qi, ans in enumerate(answers):
        if qi >= len(MBTI_QUESTIONS):
            break
        q = MBTI_QUESTIONS[qi]
        pick = q["sb"] if ans == "b" else q["sa"]
        dims[pick] += 1
    mbti = ""
    for a, b in (("E", "I"), ("S", "N"), ("T", "F"), ("J", "P")):
        mbti += a if dims[a] >= dims[b] else b
    pct = {k: round(v / 3 * 100) for k, v in dims.items()}
    return {"mbti": mbti, "dims": pct}


# ---------- MBTI 相容度表（匹配分用，0-100） ----------
# 同字母组合越互补/越相似越高（简化经验表，共 16x16 上三角展开为字典查表，缺省 70）
MBTI_COMPAT = {
    "INTJ-ENFP": 95, "INTJ-ENTP": 92, "INTP-ENTJ": 93, "INTP-ENFJ": 92,
    "ENTJ-INFP": 92, "ENTJ-INTP": 93, "ENTP-INFJ": 92, "ENTP-INTJ": 92,
    "INFJ-ENTP": 92, "INFJ-ENFP": 88, "INFP-ENFJ": 90, "INFP-ENTJ": 92,
    "ENFJ-INFP": 90, "ENFJ-INTP": 92, "ENFP-INTJ": 95, "ENFP-INFJ": 88,
    "ISTJ-ESFP": 90, "ISTJ-ISFP": 85, "ISFP-ESTJ": 90, "ISFP-ESFJ": 88,
    "ESTJ-ISFP": 90, "ESTJ-ISFJ": 88, "ESFP-ISTJ": 90, "ESFP-ISFJ": 88,
    "ESFJ-ISFP": 88, "ESFJ-INFP": 82, "ISFJ-ESTP": 88, "ISFJ-ESFP": 88,
    "ESTP-ISFJ": 88, "ESTP-INFJ": 90, "ESTP-INTJ": 88, "ISTP-ESFJ": 85,
    "ISTP-ENFP": 82, "ISTP-ESTJ": 84,
}


def mbti_compat(a: str, b: str) -> int:
    if not a or not b or len(a) != 4 or len(b) != 4:
        return 70
    for key in (f"{a}-{b}", f"{b}-{a}"):
        if key in MBTI_COMPAT:
            return MBTI_COMPAT[key]
    same = sum(1 for x, y in zip(a, b) if x == y)
    return 90 if same >= 3 else (78 if same == 2 else 65)

# ---------- 校园生存人格（8 题 · 4 类） ----------

SURVIVAL_TYPES = {
    "卷王": {"emoji": "🏆", "label": "卷王型 · 图书馆钉子户", "tags": ["自律", "目标感", "DDL 克星"], "desc": "计划表比课表还满，考试周是你的主场。"},
    "养生": {"emoji": "🍵", "label": "养生型 · 佛系但稳", "tags": ["稳", "早睡", "会生活"], "desc": "不卷不摆，节奏稳定，图书馆闭馆前一定走。"},
    "社牛": {"emoji": "🎉", "label": "社牛型 · 校园气氛组", "tags": ["e 人", "组局", "人脉广"], "desc": "哪里有活动哪里就有你，认识半个学校。"},
    "隐士": {"emoji": "🌙", "label": "隐士型 · 独处充电", "tags": ["i 人", "独处", "专注"], "desc": "比起热闹，你更喜欢一个人的高效时光。"},
}

SURVIVAL_QUESTIONS = [
    {"q": "早八闹钟响到第三次，你通常？", "options": [
        {"t": "已经在食堂吃完早饭了", "s": ["卷王"]},
        {"t": "卡点起床，踩点进教室", "s": ["社牛"]},
        {"t": "干脆请假，身体最重要", "s": ["养生"]},
        {"t": "爬起来但全程神游", "s": ["隐士"]},
    ]},
    {"q": "食堂排队 20 分钟，你会？", "options": [
        {"t": "提前错峰，从不排队", "s": ["卷王"]},
        {"t": "边排边和前后同学聊起来", "s": ["社牛"]},
        {"t": "换个人少的窗口，吃啥都行", "s": ["养生"]},
        {"t": "直接点外卖回宿舍", "s": ["隐士"]},
    ]},
    {"q": "期末周你的作息是？", "options": [
        {"t": "提前两周排好复习计划", "s": ["卷王"]},
        {"t": "组队刷夜，互相监督", "s": ["社牛"]},
        {"t": "正常睡，效率比时长重要", "s": ["养生"]},
        {"t": "一个人泡图书馆，谁也别找我", "s": ["隐士"]},
    ]},
    {"q": "小组作业遇到划水队友，你？", "options": [
        {"t": "直接重做，靠自己最稳", "s": ["卷王"]},
        {"t": "在群里点名，拉大家一起干", "s": ["社牛"]},
        {"t": "能交就行，不追求满分", "s": ["养生"]},
        {"t": "默默做完，懒得沟通", "s": ["隐士"]},
    ]},
    {"q": "周末最理想的安排是？", "options": [
        {"t": "自习 + 竞赛 + 考证", "s": ["卷王"]},
        {"t": "约饭、桌游、KTV", "s": ["社牛"]},
        {"t": "睡到自然醒，散步晒太阳", "s": ["养生"]},
        {"t": "宅着追剧打游戏", "s": ["隐士"]},
    ]},
    {"q": "看到校园活动海报，你？", "options": [
        {"t": "先看有没有加分或证书", "s": ["卷王"]},
        {"t": "拉上朋友一起报名", "s": ["社牛"]},
        {"t": "有兴趣就去，不勉强", "s": ["养生"]},
        {"t": "拍张照，然后路过", "s": ["隐士"]},
    ]},
    {"q": "晚上 10 点收到“明早开会”，你？", "options": [
        {"t": "立刻准备材料", "s": ["卷王"]},
        {"t": "先在群里问清楚情况", "s": ["社牛"]},
        {"t": "先睡，明早再说", "s": ["养生"]},
        {"t": "已读，内心拒绝", "s": ["隐士"]},
    ]},
    {"q": "你书包里最常带的是？", "options": [
        {"t": "电脑、充电宝、计划本", "s": ["卷王"]},
        {"t": "零食，随时分享", "s": ["社牛"]},
        {"t": "水杯和一件外套", "s": ["养生"]},
        {"t": "耳机，降噪必备", "s": ["隐士"]},
    ]},
]


def score_survival(answers: list) -> dict:
    scores = {k: 0 for k in SURVIVAL_TYPES}
    for qi, ans in enumerate(answers):
        if qi >= len(SURVIVAL_QUESTIONS):
            break
        opts = SURVIVAL_QUESTIONS[qi]["options"]
        if isinstance(ans, int) and 0 <= ans < len(opts):
            for a in opts[ans]["s"]:
                scores[a] += 1
    best = max(scores, key=lambda k: scores[k])
    meta = SURVIVAL_TYPES[best]
    return {"type": best, "emoji": meta["emoji"], "label": meta["label"], "tags": meta["tags"], "desc": meta["desc"], "scores": scores}


# ---------- 社交电量（6 题） ----------

BATTERY_QUESTIONS = [
    {"q": "连续社交 3 小时后，你的电量？", "options": [
        {"t": "还能再战，越聊越精神", "v": 2},
        {"t": "有点累，但还能撑", "v": 1},
        {"t": "只想找个角落安静会儿", "v": 0},
        {"t": "已经想回家了", "v": -1},
    ]},
    {"q": "电梯里遇到不熟的同学，你？", "options": [
        {"t": "主动搭话，顺便加个微信", "v": 2},
        {"t": "点头微笑，简单聊两句", "v": 1},
        {"t": "看手机，假装很忙", "v": -1},
        {"t": "等下一趟", "v": -1},
    ]},
    {"q": "群里有人 @ 你帮忙，你？", "options": [
        {"t": "秒回“没问题”", "v": 2},
        {"t": "看一下时间再答应", "v": 1},
        {"t": "装作没看到", "v": -1},
        {"t": "私聊问清楚再决定", "v": 0},
    ]},
    {"q": "聚会进行到一半，你通常在？", "options": [
        {"t": "中心位置，气氛担当", "v": 2},
        {"t": "和熟人小圈子聊天", "v": 1},
        {"t": "找借口提前撤", "v": -1},
        {"t": "帮忙收拾、拍照", "v": 0},
    ]},
    {"q": "陌生人加你微信，你？", "options": [
        {"t": "直接通过，多认识个人", "v": 2},
        {"t": "先问是谁", "v": 1},
        {"t": "晾着，过几天再说", "v": -1},
        {"t": "看头像决定", "v": 0},
    ]},
    {"q": "周一早上走进教室，你？", "options": [
        {"t": "挨个打招呼", "v": 2},
        {"t": "和同桌聊两句", "v": 1},
        {"t": "戴耳机直奔后排", "v": -1},
        {"t": "找个安静位置坐下", "v": 0},
    ]},
]


def score_battery(answers: list) -> dict:
    total = 0
    for qi, ans in enumerate(answers):
        if qi >= len(BATTERY_QUESTIONS):
            break
        opts = BATTERY_QUESTIONS[qi]["options"]
        if isinstance(ans, int) and 0 <= ans < len(opts):
            total += int(opts[ans].get("v", 0))
    pct = max(0, min(100, round((total + 6) / 18 * 100)))
    if pct >= 80:
        meta = {"type": "满电社牛", "emoji": "🔋", "tags": ["e 人", "能量场", "组局达人"], "desc": "社交对你来说是充电，越热闹越有劲。"}
    elif pct >= 55:
        meta = {"type": "节能模式", "emoji": "🔌", "tags": ["看场合", "会取舍", "稳"], "desc": "该热闹时能热闹，但更懂得给自己留电。"}
    elif pct >= 30:
        meta = {"type": "待机状态", "emoji": "🪫", "tags": ["i 人", "慢热", "小圈子"], "desc": "人多的场合会累，熟人和独处才是你的舒适区。"}
    else:
        meta = {"type": "关机边缘", "emoji": "🌙", "tags": ["深度 i 人", "独处", "安静"], "desc": "社交耗电很快，安静的环境才能让你回血。"}
    return {"type": meta["type"], "emoji": meta["emoji"], "label": f"{meta['type']} · 社交电量 {pct}%", "tags": meta["tags"], "desc": meta["desc"], "pct": pct, "total": total}


def reading_template(kind: str, result: dict) -> str:
    """按测试结果生成一段口语化解读（本地即时，不依赖模型网关）。"""
    if kind == "animal":
        tags = result.get("tags") or []
        tail = tags[0] if tags else "合拍"
        return (
            f"你是{result.get('animal', '')}型：{result.get('label', '')}。"
            f"{'、'.join(tags)} 是你的社交关键词。"
            f"找搭子时优先看节奏是否一致——你适合那种能一起{tail}、也能各忙各的人。"
        )
    if kind == "mbti":
        return (
            f"你的 MBTI 是 {result.get('mbti', '')}。它只说明你偏好的信息与决策方式，不决定你能不能合群。"
            "找搭子时优先找能接受你节奏的人，比字母完全匹配更重要。"
        )
    if kind == "survival":
        tags = result.get("tags") or []
        return (
            f"你的校园生存人格是「{result.get('type', '')}」：{result.get('desc', '')}"
            f"（{'、'.join(tags)}）。"
            "建议找一个与你互补而不是完全相同的搭子：一个负责起头，一个负责收尾。"
        )
    if kind == "battery":
        tags = result.get("tags") or []
        return (
            f"你的社交电量是 {result.get('pct', 0)}%，属于「{result.get('type', '')}」：{result.get('desc', '')}"
            f"（{'、'.join(tags)}）。"
            "找搭子时说明自己的电量边界，比硬撑着社交更省心。"
        )
    return "测试完成，去档案页看看适合你的搭子类型。"
