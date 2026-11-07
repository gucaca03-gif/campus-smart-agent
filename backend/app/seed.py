from sqlalchemy.orm import Session

from .coords import wgs84_to_gcj02
from .models import (
    Base,
    BuddyPost,
    CalendarEvent,
    Campus,
    DealPost,
    DealVote,
    Errand,
    FitnessProfile,
    LostFound,
    News,
    Place,
    PurchaseIntent,
    Resource,
    ResourceLink,
    SchoolMetric,
    StudyPlan,
    PlanItem,
    User,
)

SCHOOL_URL = "http://www.jsnu.edu.cn/xxjj/list.htm"
XIAOLI_URL = "http://jwc.jsnu.edu.cn/54/06/c10536a414726/page.htm"

METRICS = [
    ("campuses", "校区", "4", "个", "官网学校简介"),
    ("colleges", "专业学院", "20", "个", "官网学院设置"),
    ("majors", "本科招生专业", "66", "个", "官网学校简介"),
    ("teachers", "专任教师", "1896", "人", "官网学校简介（2026-09）"),
    ("senior", "高级职称教师", "1032", "人", "官网学校简介"),
    ("phd_ratio", "博士占比", "66.6", "%", "官网学校简介"),
    ("undergrads", "全日制本科生", "25400", "余人", "官网学校简介"),
    ("postgrads", "博士硕士研究生", "7800", "余人", "官网学校简介"),
    ("intl_students", "留学生", "1000", "余人", "官网学校简介"),
    ("first_class_majors", "国家级一流本科专业", "24", "个", "官网学校简介"),
    ("first_class_courses", "国家级一流本科课程", "34", "门", "官网学校简介"),
    ("esi_top1", "ESI 全球前 1% 学科", "9", "个", "官网学校简介"),
    ("teaching_awards", "国家级教学成果奖", "11", "项", "官网学校简介"),
    ("demo_centers", "国家级实验教学示范中心", "2", "个", "官网学校简介"),
    ("area", "占地面积", "", "", "官网公开简介未给出数值"),
]

CAMPUSES = [
    ("泉山校区", "江苏省徐州市铜山新区上海路 101 号", "221116", 34.1920, 117.1760, "主校区；学校章程法定住所"),
    ("云龙校区", "江苏省徐州市云龙区和平路 57 号", "221009", 34.2510, 117.2010, "招生章程列示"),
    ("奎园校区", "江苏省徐州市泉山区解放南路", "221009", 34.2390, 117.1910, "官网页脚"),
    ("潘安湖校区", "江苏省徐州市潘安湖科教创新区学院路 1 号", "221132", 34.4110, 117.3210, "官网页脚；简介称贾汪"),
]

CALENDAR = [
    ("2026-2027-1", "学生报到/注册", "2026-09-06", "2026-09-06", "registration", "confirmed", XIAOLI_URL),
    ("2026-2027-1", "正式上课（第 1 周）", "2026-09-07", "2026-09-07", "teaching", "confirmed", XIAOLI_URL),
    ("2026-2027-1", "国庆节、中秋节", "2026-10-01", "2026-10-08", "holiday", "confirmed", XIAOLI_URL),
    ("2026-2027-1", "期末考试周", "2027-01-04", "2027-01-17", "exam", "inferred", XIAOLI_URL),
    ("2026-2027-1", "寒假开始", "2027-01-16", "2027-02-28", "holiday", "confirmed", XIAOLI_URL),
    ("2026-2027-2", "学生报到/注册", "2027-02-28", "2027-02-28", "registration", "confirmed", XIAOLI_URL),
    ("2026-2027-2", "正式上课（第 1 周）", "2027-03-01", "2027-03-01", "teaching", "confirmed", XIAOLI_URL),
    ("2026-2027-2", "清明节", "2027-04-05", "2027-04-05", "holiday", "inferred", XIAOLI_URL),
    ("2026-2027-2", "国际劳动节", "2027-05-01", "2027-05-02", "holiday", "inferred", XIAOLI_URL),
    ("2026-2027-2", "期末考试周", "2027-06-21", "2027-07-04", "exam", "inferred", XIAOLI_URL),
    ("2026-2027-2", "暑假开始", "2027-07-05", "2027-07-05", "holiday", "confirmed", XIAOLI_URL),
]

# 泉山校区真实地点：坐标为 OpenStreetMap 实测（WGS-84），入库时转为 GCJ-02（高德瓦片坐标系）
# (名称, 别名, 类型, 纬度, 经度, 入口临路, verified)
PLACES = [
    ("敬文图书馆", "图书馆,敬文图书馆,主馆,自习室", "library", 34.2004247, 117.1794894, "临志远路", 1),
    ("田家炳工学院", "工学院,田家炳,工科楼", "building", 34.2017679, 117.1799941, "临学苑路", 1),
    ("电气工程及自动化学院", "电气学院,电气楼", "building", 34.2017946, 117.1797553, "临学苑路", 1),
    ("教育科学学院", "教科院,教科学院", "building", 34.2012698, 117.1794224, "临玉泉路", 1),
    ("外国语学院", "外院,外语楼", "building", 34.2021401, 117.1783919, "临玉泉路", 1),
    ("文学院", "文院,文学楼", "building", 34.1948560, 117.1682709, "临圭山路", 1),
    ("音乐学院", "音乐楼", "building", 34.1967484, 117.1770348, "临玉泉路", 1),
    ("美术学院", "美术楼,美院", "building", 34.1973013, 117.1768298, "临玉泉路", 1),
    ("中俄学院", "圣理工学院,中俄", "building", 34.1947754, 117.1669234, "临圭山路", 1),
    ("历史文化与旅游学院", "历史学院,文旅学院", "building", 34.2013965, 117.1773685, "临玉泉路", 1),
    ("马克思主义学院", "马院", "building", 34.2014529, 117.1775217, "临玉泉路", 1),
    ("孟子学院", "孟子学院", "building", 34.2013432, 117.1776482, "临玉泉路", 1),
    ("建筑装饰学院", "建装学院", "building", 34.2024196, 117.1746444, "临志远路", 1),
    ("七食堂", "七餐,食堂", "canteen", 34.1939718, 117.1672731, "临圭山路", 1),
    ("牛山自习室", "牛山,图书馆牛山分馆", "library", 34.1938163, 117.1670851, "临圭山路", 1),
    ("牛山运动场", "运动场,操场,田径场", "sports", 34.1925876, 117.1629872, "临湘江路", 1),
    ("校医院", "医务室", "service", 34.2014472, 117.1805052, "临上海路", 1),
    ("东门", "正门,上海路门", "gate", 34.19750, 117.18080, "上海路一侧", 0),
    ("西门", "圭山门", "gate", 34.19500, 117.16650, "圭山路一侧", 0),
    ("南门", "南门", "gate", 34.19250, 117.17500, "校园南侧", 0),
    ("北门", "北门", "gate", 34.20260, 117.17550, "校园北侧", 0),
]

# 用户地图点选/确认的点位（GCJ-02，与生效数据库一致；不再走 WGS84 转换）
USER_PLACES = [
    ("34B宿舍楼", "", "dorm", 34.199806, 117.17921, "", "用户实测"),
    ("34C", "", "dorm", 34.199633, 117.17803, "", "用户实测"),
    ("34A", "", "dorm", 34.200378, 117.178084, "", "用户实测"),
    ("学生宿舍10号楼", "", "dorm", 34.199056, 117.179199, "", "用户实测"),
    ("学生宿舍11号楼", "", "dorm", 34.198691, 117.179291, "", "用户实测"),
    ("808", "工位", "building", 34.198856, 117.183378, "", "用户实测"),
    (
        "静远楼",
        "21世纪大楼,9号楼,静远楼,21世纪",
        "building",
        34.198856,
        117.183378,
        "面向敬文图书馆一侧",
        "用户确认：与808重合",
    ),
]

LABS = [
    ("人工智能实验室", "田家炳工学院", "501", 60, "机器学习、计算机视觉与智能系统实验教学", "GPU 工作站 40 台、投影、白板", "人工智能与计算机学院", "1,2,3,4,5", "08:00", "17:10"),
    ("计算机网络实验室", "田家炳工学院", "502", 50, "网络协议、路由交换与网络安全实验", "路由器 20 台、交换机 20 台、机柜", "人工智能与计算机学院", "1,2,3,4,5", "08:00", "17:10"),
    ("软件工程实验室", "田家炳工学院", "503", 45, "软件设计、测试与项目管理实验", "双屏工作站 45 台、投影", "人工智能与计算机学院", "1,2,3,4,5", "08:00", "17:10"),
    ("大数据实验室", "田家炳工学院", "504", 40, "数据采集、清洗、分析与可视化", "服务器集群 1 组、工作站 40 台", "人工智能与计算机学院", "1,2,3,4,5", "08:00", "17:10"),
    ("嵌入式系统实验室", "电气工程及自动化学院", "302", 36, "嵌入式开发、传感器与控制系统实验", "开发板 36 套、示波器 8 台", "电气工程及自动化学院、人工智能与计算机学院", "1,2,3,4,5", "08:00", "17:10"),
    ("师范生教学技能实训室", "教育科学学院", "201", 30, "师范生板书、说课、微课录制训练", "录播系统、三笔字台、微格教室", "全校师范类专业", "1,2,3,4,5", "08:00", "17:10"),
]

CLASSROOMS = [
    ("文学院楼-101", "文学院", "101", 120, "多媒体教室", "投影、音响、黑板"),
    ("文学院楼-102", "文学院", "102", 80, "多媒体教室", "投影、音响"),
    ("文学院楼-201", "文学院", "201", 60, "研讨教室", "圆桌、投影、白板"),
    ("文学院楼-202", "文学院", "202", 60, "研讨教室", "圆桌、投影、白板"),
    ("外语楼-101", "外国语学院", "101", 100, "多媒体教室", "投影、音响"),
    ("外语楼-102", "外国语学院", "102", 100, "多媒体教室", "投影、音响"),
    ("外语楼-201", "外国语学院", "201", 48, "普通教室", "黑板、可移动桌椅"),
    ("文旅学院楼-301", "历史文化与旅游学院", "301", 40, "研讨教室", "投影、白板"),
    ("文旅学院楼-302", "历史文化与旅游学院", "302", 40, "研讨教室", "投影、白板"),
    ("文旅学院楼-303", "历史文化与旅游学院", "303", 90, "多媒体教室", "投影、音响"),
]

NEWS = [
    ("江苏师范大学2026“智能制造江苏实践行”国际暑期学校圆满收官", "国际暑期学校完成各项议程，展示智能制造领域人才培养与校企合作成果。", "江苏师范大学", "http://www.jsnu.edu.cn/68/c7/c19772a420039/page.htm", "校园活动", "全校", "2026-08-13"),
    ("我校举行校企合作签约、FDE卓越工程师班开班暨华为开发者大赛开赛仪式", "学校与华为等企业共建人工智能应用与工程实践产教融合实训基地。", "江苏师范大学", "http://www.jsnu.edu.cn/73/67/c19770a422759/page.htm", "学术科研", "人工智能与计算机学院", "2026-10-26"),
    ("我校举办艺术学部标识雕塑揭幕仪式暨庆祝建校74周年师生艺术作品展", "艺术学部标识雕塑揭幕，师生艺术作品展同期开展。", "江苏师范大学", "http://www.jsnu.edu.cn/73/73/c19770a422771/page.htm", "校园活动", "艺术学部", "2026-10-24"),
    ("学校举行退休教师校史资料捐赠仪式", "退休教师向学校捐赠校史资料，丰富校史馆藏。", "江苏师范大学", "http://www.jsnu.edu.cn/73/01/c19770a422657/page.htm", "校园活动", "全校", "2026-10-23"),
    ("江苏师范大学2025年度中外合作办学年度办学报告公示", "江苏圣理工学院-中俄学院2025年度中外合作办学年度办学报告公示。", "江苏师范大学", "http://www.jsnu.edu.cn/6f/64/c19772a421732/page.htm", "通知公告", "江苏圣理工学院－中俄学院", "2026-10-08"),
    ("我校8个案例全部获评江苏省课程思政典型案例", "学校8个案例入选江苏省课程思政典型案例。", "教务处", "http://jwc.jsnu.edu.cn/73/86/c10414a422790/page.htm", "学术科研", "全校", "2026-10-20"),
    ("关于举办2026华为开发者大赛《智汇苏师、码“到”彭城》的通知", "赛事面向在校学生，具体报名与赛程以教务处通知为准。", "教务处", "http://jwc.jsnu.edu.cn/73/83/c10414a422787/page.htm", "通知公告", "人工智能与计算机学院", "2026-10-18"),
    ("关于开展2026-2027学年第一学期期中教学检查工作的通知", "本学期期中教学检查工作安排发布。", "教务处", "http://jwc.jsnu.edu.cn/73/50/c10414a422736/page.htm", "通知公告", "全校", "2026-10-15"),
    ("关于运动会期间停课的通知", "校运动会期间相关课程停课，具体安排见通知。", "教务处", "http://jwc.jsnu.edu.cn/72/f4/c10414a422644/page.htm", "通知公告", "全校", "2026-10-12"),
    ("江苏师范大学2026年秋季学期微专业招生报名通知", "秋季学期微专业报名工作启动。", "教务处", "http://jwc.jsnu.edu.cn/71/d0/c10414a422352/page.htm", "通知公告", "全校", "2026-10-09"),
    ("江苏师范大学科研团队在国际权威学术期刊《美国国家科学院院刊》发表论文", "学校科研团队在 PNAS 发表研究论文。", "江苏师范大学", "http://www.jsnu.edu.cn/", "学术科研", "全校", "2026-10-01"),
    ("江苏师范大学2026-2027学年校历发布", "2026-2027学年校历由教务处发布。", "教务处", "http://jwc.jsnu.edu.cn/54/06/c10536a414726/page.htm", "通知公告", "全校", "2026-05-28"),
]

LINKS = [
    ("信息类专业实验教学一体化平台", "https://cstlab.jsnu.edu.cn/indexcs/simple.jsp", "实验教学", "信息类专业", 1, 0, "CourseGrading 实验/评测平台；首页可达，登录后功能未验证"),
    ("江苏师范大学大模型广场", "https://model.jsnu.edu.cn/", "AI 平台", "全校", 1, 0, "统一 AI API 网关/控制台；账号与额度未验证"),
    ("江苏师范大学实践教学平台", "https://jsnu.eduplus.net/home/index", "实践教学", "全校", 1, 0, "官网入口"),
    ("江苏师范大学图书馆", "https://lib.jsnu.edu.cn/", "图书资源", "全校", 1, 0, "馆藏、借阅、数据库"),
    ("校园信息门户", "https://i.jsnu.edu.cn/", "信息服务", "全校", 1, 0, "通知、待办、校园身份"),
    ("数字迎新", "http://welcome.jsnu.edu.cn/", "迎新服务", "新生", 0, 0, "报到、校园信息"),
    ("本科招生网", "http://bkzs.jsnu.edu.cn", "招生就业", "考生/家长", 0, 0, "招生章程、专业介绍"),
    ("就业创业信息网", "http://jsnu.91job.org.cn", "招生就业", "毕业生", 0, 0, "招聘、就业指导"),
    ("江苏师范大学新闻网", "http://www.jsnu.edu.cn/news/list.htm", "新闻资讯", "全校", 0, 0, "校内新闻"),
    ("泉山校区全景", "https://www.720yun.com/t/79ajOzhvkv8", "校园导览", "全校", 0, 0, "校园全景导览"),
    ("教务系统", "http://www.jsnu.edu.cn/55/da/c19769a415194/page.htm", "教务服务", "全校", 1, 1, "课表、成绩、选课；需校园网/登录"),
]


def seed(db: Session) -> None:
    if db.query(User).count() > 0:
        return

    db.add(User(username="demo", display_name="师大同学", college="人工智能与计算机学院", role="student"))
    db.add(User(username="admin", display_name="资源管理员", college="教务处", role="admin"))

    for key, label, value, unit, source in METRICS:
        db.add(
            SchoolMetric(
                key=key,
                label=label,
                value=value,
                unit=unit,
                source_url=SCHOOL_URL,
                status="pending" if key == "area" else "verified",
                note="官网公开简介未给出数值，待校方提供" if key == "area" else "",
            )
        )

    for name, address, postcode, lat, lng, note in CAMPUSES:
        db.add(Campus(name=name, address=address, postcode=postcode, lat=lat, lng=lng, note=note))

    for term, title, start, end, typ, status, source in CALENDAR:
        db.add(CalendarEvent(term=term, title=title, start_date=start, end_date=end, type=typ, status=status, source_url=source))

    for name, alias, typ, lat, lng, entrance, verified in PLACES:
        glng, glat = wgs84_to_gcj02(lng, lat)
        db.add(
            Place(
                campus_id=1,
                name=name,
                alias=alias,
                type=typ,
                lat=glat,
                lng=glng,
                entrance=entrance,
                verified=verified,
                source="OpenStreetMap 实测坐标（GCJ-02）" if verified else "位置已确认",
            )
        )

    # 用户实测/确认点位（已是 GCJ-02，直接入库，不再转换）
    for name, alias, typ, lat, lng, entrance, source in USER_PLACES:
        db.add(
            Place(
                campus_id=1,
                name=name,
                alias=alias,
                type=typ,
                lat=lat,
                lng=lng,
                entrance=entrance,
                verified=1,
                source=source,
            )
        )
    db.flush()

    place_map = {p.name: p.id for p in db.query(Place).all()}

    for name, building, room, cap, desc, equip, audience, days, start, end in LABS:
        db.add(
            Resource(
                type="lab",
                name=name,
                campus_id=1,
                place_id=place_map.get(building),
                room=f"{building} {room}",
                capacity=cap,
                description=desc,
                equipment=equip,
                audience=audience,
                open_days=days,
                open_start=start,
                open_end=end,
                approval_required=1,
                is_demo=1,
                data_note="演示实验室数据，待实验室管理处核验",
            )
        )

    for name, building, room, cap, typ, equip in CLASSROOMS:
        db.add(
            Resource(
                type="classroom",
                name=name,
                campus_id=1,
                place_id=place_map.get(building),
                room=f"{building} {room}",
                capacity=cap,
                description=f"{typ}，可容纳 {cap} 人",
                equipment=equip,
                audience="全校",
                open_days="1,2,3,4,5,6,7",
                open_start="18:30",
                open_end="20:40",
                approval_required=1,
                is_demo=1,
                data_note="演示教室数据，排课占用为演示，待教务处导出",
            )
        )

    seat_place = place_map.get("敬文图书馆")
    for area, prefix, count, base_x, base_y in (("A 区 · 二楼自习区", "A", 30, 8, 20), ("B 区 · 三楼静音区", "B", 30, 8, 52)):
        for i in range(count):
            row, col = divmod(i, 10)
            db.add(
                Resource(
                    type="seat",
                    name=f"{area} {prefix}{i + 1:02d}",
                    campus_id=1,
                    place_id=seat_place,
                    room=area,
                    capacity=1,
                    description=f"{area} 自习座位，{'靠窗' if col in (0, 9) else '普通'}",
                    equipment="电源" if i % 3 == 0 else "",
                    audience="全校",
                    open_days="1,2,3,4,5,6,7",
                    open_start="08:00",
                    open_end="22:00",
                    approval_required=0,
                    is_demo=1,
                    data_note="演示座位数据，待图书馆座位系统授权",
                    x=base_x + col * 5,
                    y=base_y + row * 4,
                )
            )

    for title, summary, source, url, category, college, published in NEWS:
        db.add(News(title=title, summary=summary, source=source, source_url=url, category=category, college=college, published_at=published))

    for name, url, category, audience, need_login, need_net, note in LINKS:
        db.add(ResourceLink(name=name, url=url, category=category, audience=audience, need_login=need_login, need_campus_net=need_net, note=note))

    buddies = [
        ("学习", "考研数学自习搭子", "每周三、周五晚上在图书馆三楼自习，目标 408，希望一起刷题互相监督。", "周三/周五 19:00-21:30", "图书馆", "泉山校区"),
        ("运动", "夜跑搭子（5 公里）", "每晚 21:00 牛山运动场慢跑 5 公里，配速 6 分左右，新手也可以一起。", "每天 21:00", "牛山运动场", "泉山校区"),
        ("摄影", "周末校园秋景拍摄", "想拍钟楼、梧桐和教学楼光影，有相机，欢迎互拍。", "周六 15:00", "钟楼", "泉山校区"),
        ("饭搭子", "一食堂新窗口试吃", "中午一起去七食堂新开的窗口，人多可拼桌。", "周二 12:00", "七食堂", "泉山校区"),
        ("游戏", "周末桌游/开黑搭子", "周六下午大学生活动中心，桌游或手游都行。", "周六 14:00", "大学生活动中心", "泉山校区"),
        ("观展", "艺术学部展览一起看", "建校 74 周年师生艺术作品展，想找同好一起看展。", "周日 10:00", "美术学院", "泉山校区"),
    ]
    for typ, title, content, time_text, place, campus in buddies:
        db.add(BuddyPost(type=typ, title=title, content=content, time_text=time_text, place=place, campus=campus))

    deals = [
        ("机械键盘", 39900, "写代码手感更好，现在的键盘有几个键失灵。", "数码"),
        ("降噪耳机", 89900, "图书馆和宿舍都需要，想减少环境噪音。", "数码"),
        ("运动鞋", 49900, "旧鞋底磨平了，想买一双日常跑步鞋。", "服饰"),
        ("外接显示器", 129900, "写代码和看论文双屏效率更高。", "数码"),
        ("胶囊咖啡机", 59900, "每天一杯咖啡，长期看可能比外卖便宜。", "生活"),
    ]
    for product, price, reason, category in deals:
        db.add(DealPost(product=product, price_cent=price, reason=reason, category=category))
    db.flush()
    for i, post in enumerate(db.query(DealPost).all()):
        for uid, vote in ((1, "think"), (2, "buy" if i % 2 == 0 else "no")):
            db.add(DealVote(post_id=post.id, user_id=uid, vote=vote))

    for name, price, status in (("二手平板", 29900, "abandoned"), ("显示器支架", 12900, "bought"), ("露营椅", 59900, "pending")):
        db.add(PurchaseIntent(name=name, price_cent=price, status=status, decided_at="2026-10-20 10:00:00" if status != "pending" else ""))

    errands = [
        ("express", "东门菜鸟驿站代拿", "东门菜鸟驿站", "田家炳工学院 501", "￥5", "今天 18:00 前", "小件包裹，麻烦送到实验室。"),
        ("express", "小东门快递代取", "东门快递点", "七食堂门口", "￥3", "今天 17:30", "两个小包裹。"),
        ("help", "帮忙搬一箱书到图书馆", "田家炳工学院", "敬文图书馆三楼", "请喝奶茶", "今天下午", "约 20 公斤，需要小推车。"),
        ("help", "借用投影仪一小时", "音乐学院", "文学院楼-201", "自取", "周三 19:00", "社团活动使用，会按时归还。"),
        ("express", "雨天帮带一份饭", "七食堂", "外语楼-201", "￥5", "今天 12:00", "不要辣。"),
    ]
    for typ, title, pickup, dest, reward, window, note in errands:
        db.add(Errand(type=typ, title=title, pickup=pickup, destination=dest, reward=reward, time_window=window, note=note))

    lost = [
        ("found", "校园卡（张同学）", "七食堂", "2026-10-26 12:30", "在七食堂二楼靠窗座位捡到，请描述卡面信息认领。"),
        ("lost", "黑色雨伞", "图书馆", "2026-10-25 21:00", "伞柄有白色贴纸，可能落在三楼自习区。"),
        ("found", "AirPods 耳机盒", "牛山运动场", "2026-10-24 18:40", "看台台阶上捡到，耳机盒有划痕。"),
        ("lost", "蓝色水杯", "文学院楼-201", "2026-10-23 16:00", "杯身有姓名贴，请捡到的同学联系。"),
    ]
    for typ, name, place, happened, desc in lost:
        db.add(LostFound(type=typ, name=name, place=place, happened_at=happened, description=desc))

    plan = StudyPlan(title="本周复习计划", start_date="2026-10-27", end_date="2026-11-02", status="active")
    db.add(plan)
    db.flush()
    for title, day, start, end in (
        ("高等数学错题整理", "2026-10-27", "19:00", "20:30"),
        ("数据结构实验", "2026-10-28", "14:00", "16:00"),
        ("英语听力", "2026-10-29", "08:00", "09:00"),
        ("算法刷题", "2026-10-30", "19:00", "21:00"),
    ):
        db.add(PlanItem(plan_id=plan.id, title=title, day=day, start_at=start, end_at=end))

    db.add(FitnessProfile(user_id=1, consent=0))
    db.commit()