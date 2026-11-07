# -*- coding: utf-8 -*-
"""生成“无纸化学生档案”演示材料（虚构学生，覆盖文本/扫描件/图片 Word 通路）。

规则文档：
- archive-notice.docx  《2026级本科新生入学资格复核通知》+ 录取信息核对表
- archive-policy.pdf   《学生学籍档案管理办法（节选）》

待核查材料：
- archive-id.pdf       身份证扫描件（图片 PDF，OCR 通路）
- archive-diploma.pdf  高中毕业证书（文本层 PDF）
- archive-admission.docx 录取通知书（图片 Word，OCR 通路）
- archive-enrollment.docx 学籍在线验证报告（文本 Word）
"""
import io
import os
from pathlib import Path

OUT_DIR = Path(__file__).resolve().parents[2] / "web" / "static" / "demo" / "office"
OUT_DIR.mkdir(parents=True, exist_ok=True)

FONT_SONG = r"C:\Windows\Fonts\simsun.ttc"
FONT_HEI = r"C:\Windows\Fonts\simhei.ttf"

STUDENT = "陈星宇"
ID_NO = "320311200703120019"
BIRTH = "2007年3月12日"
HIGH_SCHOOL = "徐州市第一中学"
GRAD_DATE = "2026年6月"
CANDIDATE_NO = "26320301150001"
COLLEGE = "计算机科学与技术学院"
MAJOR = "软件工程"
STUDENT_NO = "2026010234"


def notice_docx():
    import docx
    from docx.shared import Pt
    from docx.enum.text import WD_ALIGN_PARAGRAPH

    doc = docx.Document()
    style = doc.styles["Normal"]
    style.font.name = "宋体"
    style.font.size = Pt(11)

    h = doc.add_heading("关于开展2026级本科新生入学资格复核工作的通知", level=1)
    h.alignment = WD_ALIGN_PARAGRAPH.CENTER

    for text in [
        "各学院、各有关部门：",
        "为做好2026级本科新生入学资格复核工作，进一步完善学生电子档案，现就有关事项通知如下。",
        "一、复核对象",
        "2026级全日制本科新生。",
        "二、复核材料",
        "学生须提交居民身份证、高中毕业证书、录取通知书和教育部学籍在线验证报告。",
        "三、复核要求",
        "请各学院对照《2026级本科新生录取信息核对表（节选）》，逐项核验学生材料。材料中的姓名、身份证号、高中毕业学校、高中毕业时间、高考考生号、录取学院、录取专业、学号须与录取信息一致。",
        "材料应清晰完整，不得涂改；发现信息不一致的，应暂缓注册并报教务处复核。",
    ]:
        p = doc.add_paragraph(text)

    doc.add_paragraph("")
    p = doc.add_paragraph("附表：2026级本科新生录取信息核对表（节选）")
    p.runs[0].bold = True

    rows = [
        ("姓名", STUDENT),
        ("身份证号", ID_NO),
        ("高中毕业学校", HIGH_SCHOOL),
        ("高中毕业时间", GRAD_DATE),
        ("高考考生号", CANDIDATE_NO),
        ("录取学院", COLLEGE),
        ("录取专业", MAJOR),
        ("学号", STUDENT_NO),
    ]
    table = doc.add_table(rows=1, cols=2)
    table.style = "Table Grid"
    head = table.rows[0].cells
    head[0].text = "核对字段"
    head[1].text = "录取信息标准值"
    for label, value in rows:
        cells = table.add_row().cells
        cells[0].text = label
        cells[1].text = value

    doc.add_paragraph("")
    doc.add_paragraph("教务处（学生档案管理中心）")
    doc.add_paragraph("2026年8月28日")
    doc.add_paragraph("注：本通知及附表仅用于校内功能演示，学生信息均为虚构。")

    path = OUT_DIR / "archive-notice.docx"
    doc.save(path)
    return path


def policy_pdf():
    from reportlab.lib.pagesizes import A4
    from reportlab.pdfgen import canvas
    from reportlab.pdfbase import pdfmetrics
    from reportlab.pdfbase.cidfonts import UnicodeCIDFont

    pdfmetrics.registerFont(UnicodeCIDFont("STSong-Light"))
    path = OUT_DIR / "archive-policy.pdf"
    c = canvas.Canvas(str(path), pagesize=A4)
    w, h = A4
    left = 64
    y = h - 80
    c.setFont("STSong-Light", 16)
    c.drawCentredString(w / 2, y, "江苏师范大学学生学籍档案管理办法（节选）")
    y -= 44
    c.setFont("STSong-Light", 11.5)
    lines = [
        "第一章　总则",
        "第一条　为规范学生学籍档案管理，推进学生档案电子化，制定本办法。",
        "第二条　学生学籍档案包括居民身份证、高中毕业证书、录取通知书、",
        "教育部学籍在线验证报告、新生入学登记表等材料。",
        "",
        "第二章　新生入学资格复核",
        "第三条　新生报到时，学院应核验身份证、高中毕业证书、录取通知书",
        "和学籍在线验证报告的原件或电子件。",
        "第四条　档案材料中的姓名、身份证号、高中毕业学校、高中毕业时间、",
        "高考考生号、录取学院、录取专业、学号，应与学校录取信息一致。",
        "第五条　高中毕业时间不得晚于入学当年8月31日；毕业证书编号应可在",
        "原毕业学校或教育行政部门查询。",
        "第六条　身份证应在有效期内，姓名、出生日期、身份证号须与录取信息一致。",
        "",
        "第三章　材料归档",
        "第七条　复核通过后，学院应将上述材料归入学生电子档案，形成“一人一档”。",
        "第八条　发现材料缺失或信息不一致的，应一次性告知学生补正；涉嫌伪造的，",
        "按规定移交学校相关部门处理。",
    ]
    for line in lines:
        c.drawString(left, y, line)
        y -= 22
    c.setFont("STSong-Light", 9)
    c.drawCentredString(w / 2, 60, "本文件仅用于校内功能演示，内容为节选改编。")
    c.showPage()
    c.save()
    return path


def id_card_pdf():
    from PIL import Image, ImageDraw, ImageFont

    W, H = 1240, 780
    img = Image.new("RGB", (W, H), (248, 249, 250))
    d = ImageDraw.Draw(img)
    ink = (30, 32, 38)
    gray = (90, 96, 104)
    f_title = ImageFont.truetype(FONT_HEI, 38)
    f_label = ImageFont.truetype(FONT_SONG, 30)
    f_value = ImageFont.truetype(FONT_HEI, 34)
    f_small = ImageFont.truetype(FONT_SONG, 24)

    d.rectangle([18, 18, W - 18, H - 18], outline=(170, 178, 190), width=3)
    d.text((52, 44), "中华人民共和国居民身份证", font=f_title, fill=ink)
    d.text((52, 118), "姓名", font=f_label, fill=gray)
    d.text((160, 108), STUDENT, font=f_value, fill=ink)
    d.text((52, 188), "性别", font=f_label, fill=gray)
    d.text((160, 178), "男", font=f_value, fill=ink)
    d.text((300, 188), "民族", font=f_label, fill=gray)
    d.text((400, 178), "汉", font=f_value, fill=ink)
    d.text((52, 258), "出生", font=f_label, fill=gray)
    d.text((160, 248), BIRTH, font=f_value, fill=ink)
    d.text((52, 328), "住址", font=f_label, fill=gray)
    d.text((160, 318), "江苏省徐州市泉山区大学路 1 号", font=f_value, fill=ink)
    d.text((52, 418), "公民身份号码", font=f_label, fill=gray)
    d.text((300, 408), ID_NO, font=f_value, fill=ink)
    d.text((52, 540), "签发机关", font=f_label, fill=gray)
    d.text((190, 530), "徐州市公安局泉山分局", font=f_value, fill=ink)
    d.text((52, 610), "有效期限", font=f_label, fill=gray)
    d.text((190, 600), "2025.07—2035.07", font=f_value, fill=ink)
    d.text((52, 700), "本材料仅用于校内功能演示，人员信息均为虚构。", font=f_small, fill=gray)

    path = OUT_DIR / "archive-id.pdf"
    img.save(path, "PDF", resolution=180.0)
    return path


def diploma_pdf():
    from reportlab.lib.pagesizes import A4
    from reportlab.pdfgen import canvas
    from reportlab.pdfbase import pdfmetrics
    from reportlab.pdfbase.cidfonts import UnicodeCIDFont

    pdfmetrics.registerFont(UnicodeCIDFont("STSong-Light"))
    path = OUT_DIR / "archive-diploma.pdf"
    c = canvas.Canvas(str(path), pagesize=A4)
    w, h = A4

    c.setStrokeColorRGB(0.62, 0.46, 0.2)
    c.setLineWidth(2)
    c.rect(32, 30, w - 64, h - 60)
    c.setFont("STSong-Light", 26)
    c.setFillColorRGB(0.16, 0.16, 0.16)
    c.drawCentredString(w / 2, h - 110, "江苏省普通高中毕业证书")
    c.setFont("STSong-Light", 12)
    c.drawCentredString(w / 2, h - 138, "普通高中毕业证书")

    c.setFont("STSong-Light", 13)
    y = h - 210
    lines = [
        f"学生 {STUDENT}，性别 男，公民身份号码 {ID_NO}，",
        f"于 2026 年 6 月毕业于 {HIGH_SCHOOL}，",
        "完成高中阶段学业，成绩合格，准予毕业。",
        "",
        "毕业证书编号：苏教毕字2026-0312",
        "发证单位：江苏省教育厅",
        "发证日期：2026年6月30日",
    ]
    for line in lines:
        c.drawString(90, y, line)
        y -= 30

    c.setFont("STSong-Light", 10)
    c.setFillColorRGB(0.45, 0.45, 0.45)
    c.drawCentredString(w / 2, 64, "本材料仅用于校内功能演示，人员与证书信息均为虚构。")
    c.showPage()
    c.save()
    return path


def admission_docx():
    from PIL import Image, ImageDraw, ImageFont
    import docx
    from docx.shared import Cm

    W, H = 1240, 1754
    img = Image.new("RGB", (W, H), (255, 253, 248))
    d = ImageDraw.Draw(img)
    ink = (36, 34, 32)
    red = (170, 42, 36)
    gray = (96, 92, 88)
    f_title = ImageFont.truetype(FONT_HEI, 56)
    f_sub = ImageFont.truetype(FONT_SONG, 30)
    f_body = ImageFont.truetype(FONT_SONG, 32)
    f_small = ImageFont.truetype(FONT_SONG, 24)

    d.rectangle([42, 42, W - 42, H - 42], outline=red, width=4)
    t = "江苏师范大学录取通知书"
    tw = d.textlength(t, font=f_title)
    d.text(((W - tw) / 2, 150), t, font=f_title, fill=red)
    s = "ADMISSION NOTICE · 2026"
    sw = d.textlength(s, font=f_sub)
    d.text(((W - sw) / 2, 238), s, font=f_sub, fill=gray)

    lines = [
        f"{STUDENT} 同学：",
        "",
        "经江苏省教育考试院审核、我校招生委员会批准，你已被我校",
        f"{COLLEGE}{MAJOR}专业录取，录取层次为本科。",
        "",
        f"高考考生号：{CANDIDATE_NO}",
        "报到日期：2026年9月1日",
        "报到校区：泉山校区",
        "",
        "请你持本通知书、居民身份证、高中毕业证书和学籍在线验证报告，",
        "按学校规定时间办理入学手续。",
    ]
    y = 360
    for line in lines:
        d.text((120, y), line, font=f_body, fill=ink)
        y += 62

    d.text((120, H - 300), "江苏师范大学招生办公室", font=f_body, fill=ink)
    d.text((120, H - 240), "2026年7月18日", font=f_body, fill=ink)
    d.text((120, H - 150), "本材料仅用于校内功能演示，录取信息均为虚构。", font=f_small, fill=gray)

    buf = io.BytesIO()
    img.save(buf, format="PNG")
    png = OUT_DIR / "_archive_admission_tmp.png"
    png.write_bytes(buf.getvalue())

    doc = docx.Document()
    sec = doc.sections[0]
    sec.top_margin = Cm(1.2)
    sec.bottom_margin = Cm(1.2)
    doc.add_picture(str(png), width=Cm(15.5))
    path = OUT_DIR / "archive-admission.docx"
    doc.save(path)
    png.unlink(missing_ok=True)
    return path


def enrollment_docx():
    import docx
    from docx.shared import Pt
    from docx.enum.text import WD_ALIGN_PARAGRAPH

    doc = docx.Document()
    doc.styles["Normal"].font.name = "宋体"
    doc.styles["Normal"].font.size = Pt(11)

    h = doc.add_heading("教育部学籍在线验证报告", level=1)
    h.alignment = WD_ALIGN_PARAGRAPH.CENTER
    doc.add_paragraph("在线验证码：DEMO202611060001（演示）")

    rows = [
        ("姓名", STUDENT),
        ("学号", STUDENT_NO),
        ("公民身份号码", ID_NO),
        ("层次", "本科"),
        ("学院", COLLEGE),
        ("专业", MAJOR),
        ("学籍状态", "在籍（注册学籍）"),
        ("入学日期", "2026-09-01"),
        ("预计毕业日期", "2030-06-30"),
    ]
    table = doc.add_table(rows=1, cols=2)
    table.style = "Table Grid"
    head = table.rows[0].cells
    head[0].text = "字段"
    head[1].text = "信息"
    for label, value in rows:
        cells = table.add_row().cells
        cells[0].text = label
        cells[1].text = value

    doc.add_paragraph("")
    doc.add_paragraph("注：本报告仅用于校内功能演示，学籍信息均为虚构。")
    path = OUT_DIR / "archive-enrollment.docx"
    doc.save(path)
    return path


def self_check():
    from pypdf import PdfReader

    ok = True
    diploma_text = (PdfReader(str(OUT_DIR / "archive-diploma.pdf")).pages[0].extract_text() or "")
    id_text = (PdfReader(str(OUT_DIR / "archive-id.pdf")).pages[0].extract_text() or "").strip()
    print("diploma text contains:", [k for k in (STUDENT, HIGH_SCHOOL, "2026年6月") if k in diploma_text])
    print("id pdf text length (should be empty for OCR):", len(id_text))
    print("notice exists:", (OUT_DIR / "archive-notice.docx").exists())
    print("admission exists:", (OUT_DIR / "archive-admission.docx").exists())
    print("enrollment exists:", (OUT_DIR / "archive-enrollment.docx").exists())
    ok &= STUDENT in diploma_text and HIGH_SCHOOL in diploma_text
    ok &= len(id_text) == 0
    return ok


if __name__ == "__main__":
    paths = [notice_docx(), policy_pdf(), id_card_pdf(), diploma_pdf(), admission_docx(), enrollment_docx()]
    for p in paths:
        print("generated", p.name, p.stat().st_size, "bytes")
    if not self_check():
        raise SystemExit(1)
    print("archive demo docs: PASS")