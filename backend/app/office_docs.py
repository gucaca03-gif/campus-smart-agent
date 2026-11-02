import io
import re
import zipfile

IMAGE_EXTS = {"png", "jpg", "jpeg", "bmp", "webp", "tif", "tiff"}


def pdf_pages_as_images(data: bytes, max_pages: int = 20) -> list:
    """用 pymupdf 把 PDF 页渲染成 PNG 字节（供 OCR 使用）。"""
    try:
        import fitz
    except ImportError:
        return []
    out = []
    try:
        doc = fitz.open(stream=data, filetype="pdf")
        for page in doc[:max_pages]:
            pix = page.get_pixmap(dpi=150)
            out.append(pix.tobytes("png"))
        doc.close()
    except Exception:
        return []
    return out


def docx_images(data: bytes, max_images: int = 6) -> list:
    """提取 docx 内嵌图片（Word 里粘贴的截图等）。"""
    out = []
    try:
        with zipfile.ZipFile(io.BytesIO(data)) as z:
            media = [n for n in z.namelist() if n.startswith("word/media/")]
            media.sort()
            for name in media:
                if not name.rsplit(".", 1)[-1].lower() in IMAGE_EXTS:
                    continue
                out.append(z.read(name))
                if len(out) >= max_images:
                    break
    except Exception:
        return []
    return out


def file_to_text(filename: str, data: bytes) -> dict:
    """统一入口：文件转文本；扫描件/图片走 OCR。

    返回 {name, kind, text, source}，source ∈ native | ocr | empty。
    """
    from . import office_ai

    doc = parse_document(filename, data)
    ext = filename.rsplit(".", 1)[-1].lower() if "." in filename else ""
    text = doc.get("text") or ""
    source = "native" if text else "empty"

    def ocr_many(images: list, mime: str) -> str:
        parts = []
        for i, img in enumerate(images[:10]):
            try:
                parts.append(office_ai.ocr_image(img, mime=mime))
            except office_ai.AiUnavailable:
                raise
            except Exception:
                continue
        return "\n\n".join(parts)

    if ext in IMAGE_EXTS:
        try:
            text = office_ai.ocr_image(data, mime=f"image/{'jpeg' if ext in ('jpg', 'jpeg') else ext}")
            source = "ocr"
        except office_ai.AiUnavailable:
            raise
        except Exception:
            pass
    elif ext == "pdf" and len(text.strip()) < 60:
        pages = pdf_pages_as_images(data)
        if pages:
            text = ocr_many(pages, "image/png")
            if text.strip():
                source = "ocr"
    elif ext == "docx" and len(text.strip()) < 30:
        # Word 正文是截图（无文字）→ 提取内嵌图片走 OCR
        images = docx_images(data)
        if images:
            text = ocr_many(images, "image/png")
            if text.strip():
                source = "ocr"
    return {"name": doc["name"], "kind": doc["kind"], "text": text, "source": source}


def preview_document(filename: str, data: bytes) -> dict:
    """预览：返回可在前端渲染的结构。

    - pdf → {type: "pdf"}（前端 iframe 渲染）
    - 图片 → {type: "image"}（前端 img 渲染）
    - docx 有文本 → {type: "text", text}
    - docx 只有图片 → {type: "images", images: [dataURL]}
    """
    ext = filename.rsplit(".", 1)[-1].lower() if "." in filename else ""
    if ext == "pdf":
        return {"type": "pdf", "pages": len(pdf_pages_as_images(data, max_pages=50)) or None}
    if ext in IMAGE_EXTS:
        return {"type": "image"}
    if ext == "docx":
        doc = parse_document(filename, data)
        if (doc.get("text") or "").strip():
            return {"type": "text", "text": doc["text"][:20000]}
        images = docx_images(data, max_images=8)
        if images:
            import base64

            out = []
            for img in images:
                head = img[:8]
                mime = "image/png" if head.startswith(b"\x89PNG") else ("image/jpeg" if head.startswith(b"\xff\xd8") else "image/png")
                out.append(f"data:{mime};base64,{base64.b64encode(img).decode('ascii')}")
            return {"type": "images", "images": out}
        return {"type": "text", "text": ""}
    if ext == "xlsx":
        doc = parse_document(filename, data)
        return {"type": "text", "text": (doc.get("text") or "")[:20000]}
    return {"type": "text", "text": data.decode("utf-8", errors="ignore")[:20000]}


def parse_docx(data: bytes) -> str:
    with zipfile.ZipFile(io.BytesIO(data)) as z:
        xml = z.read("word/document.xml").decode("utf-8", errors="ignore")
    xml = re.sub(r"</w:p>", "\n", xml)
    xml = re.sub(r"<w:tab[^>]*/>", "\t", xml)
    return re.sub(r"<[^>]+>", "", xml).strip()


def _xlsx_col_idx(ref: str) -> int:
    col = re.match(r"([A-Z]+)", ref).group(1)
    n = 0
    for ch in col:
        n = n * 26 + ord(ch) - 64
    return n - 1


def parse_xlsx(data: bytes) -> list:
    with zipfile.ZipFile(io.BytesIO(data)) as z:
        names = z.namelist()
        shared = []
        if "xl/sharedStrings.xml" in names:
            sx = z.read("xl/sharedStrings.xml").decode("utf-8", errors="ignore")
            shared = re.findall(r"<t[^>]*>([^<]*)</t>", sx)
        sheet_name = next((n for n in names if re.match(r"xl/worksheets/sheet\d+\.xml", n)), None)
        if not sheet_name:
            return []
        sheet = z.read(sheet_name).decode("utf-8", errors="ignore")
    rows = []
    for row in re.findall(r"<row[^>]*>(.*?)</row>", sheet, re.S):
        cells = {}
        for m in re.finditer(r'<c\s+r="([A-Z]+\d+)"([^>]*)>(?:<v>([^<]*)</v>)?', row):
            ref, attrs, v = m.group(1), m.group(2), m.group(3)
            if v is None:
                continue
            val = shared[int(v)] if 't="s"' in attrs and v.isdigit() else v
            cells[_xlsx_col_idx(ref)] = val
        if cells:
            rows.append([cells.get(i, "") for i in range(max(cells) + 1)])
    return rows


def parse_pdf(data: bytes) -> str:
    try:
        from pypdf import PdfReader
        reader = PdfReader(io.BytesIO(data))
        return "\n".join((p.extract_text() or "") for p in reader.pages).strip()
    except Exception:
        return ""


def classify_document(filename: str, text: str) -> str:
    if "名额" in filename:
        return "quota"
    if "办法" in filename or "规定" in filename or "细则" in filename:
        return "policy"
    if "流程" in filename:
        return "process"
    if "通知" in filename:
        return "notice"
    if "申请" in filename:
        return "application"
    if "汇总" in filename or "名单" in filename:
        return "namelist"
    if "评选办法" in text[:500] or "评选条件" in text[:800]:
        return "policy"
    if "通知如下" in text[:200]:
        return "notice"
    if "申报流程" in text[:200]:
        return "process"
    if "推荐名额" in text[:200] and len(text) < 2000:
        return "quota"
    return "other"


def fix_filename(name: str) -> str:
    """兼容 curl/旧客户端传来的非 UTF-8 文件名。"""
    if not name:
        return name
    if any("" <= c <= "ÿ" for c in name):
        for enc in ("utf-8", "gbk"):
            try:
                return name.encode("latin-1").decode(enc)
            except (UnicodeEncodeError, UnicodeDecodeError):
                continue
    return name


KIND_LABELS = {
    "notice": "评选通知",
    "policy": "评选办法",
    "quota": "名额表",
    "process": "申报流程",
    "application": "申请材料",
    "namelist": "名单",
    "other": "文档",
}


def parse_document(filename: str, data: bytes) -> dict:
    filename = fix_filename(filename)
    ext = filename.rsplit(".", 1)[-1].lower() if "." in filename else ""
    text, table = "", None
    try:
        if ext == "docx":
            text = parse_docx(data)
        elif ext == "xlsx":
            table = parse_xlsx(data)
            text = "\n".join(" ".join(c for c in row if c) for row in table)
        elif ext == "pdf":
            text = parse_pdf(data)
        else:
            text = data.decode("utf-8", errors="ignore")
    except Exception:
        text = ""
    return {"name": filename, "kind": classify_document(filename, text), "text": text, "table": table}


CN_NUM = {"一": 1, "二": 2, "三": 3, "四": 4}


def extract_conditions(notice_text: str, policy_text: str) -> list:
    text = notice_text + "\n" + policy_text
    conds = []

    m = re.search(r"((?:[一二三]、){1,2}[一二三])年级", text)
    if m:
        grades = [CN_NUM[c] for c in m.group(1) if c in CN_NUM]
        conds.append({
            "key": "grade_range",
            "label": "年级范围",
            "standard": "、".join(f"{g}年级" for g in grades),
            "grades": grades,
            "source": f"原文：“…{text[max(0, m.start()-18):m.end()+6]}…”",
            "enabled": True,
        })

    m = re.search(r"排名前?\s*(\d+)\s*%", text) or re.search(r"前\s*(\d+)\s*%", text)
    if m:
        conds.append({
            "key": "score_rank",
            "label": "课程平均成绩排名",
            "standard": f"前 {m.group(1)}%",
            "max_percent": int(m.group(1)),
            "source": f"原文：“…{text[max(0, m.start()-22):m.end()+4]}…”",
            "enabled": True,
        })

    m = re.search(r"([一二])、([一二])等学业奖学金", text)
    if m:
        levels = sorted({CN_NUM[m.group(1)], CN_NUM[m.group(2)]})
        conds.append({
            "key": "scholarship",
            "label": "学业奖学金等级",
            "standard": "、".join("一二三四"[lv - 1] + "等" for lv in levels),
            "levels": levels,
            "source": f"原文：“…{text[max(0, m.start()-16):m.end()+6]}…”",
            "enabled": True,
        })

    if "未受过处分" in text or "无处分" in text:
        conds.append({
            "key": "no_punish",
            "label": "无处分记录",
            "standard": "在校期间未受过处分",
            "source": "评选条件",
            "enabled": True,
        })

    conds.append({
        "key": "quota",
        "label": "学院名额校验",
        "standard": "申报学院须在推荐名额表内",
        "source": "名额表附件",
        "enabled": True,
    })
    return conds


def extract_application_fields(text: str) -> dict:
    fields = {}
    m = re.search(r"姓名\s*[:：]?\s*([一-龥]{2,4})", text)
    if m:
        fields["name"] = m.group(1)
    m = re.search(r"学院\s*[:：]\s*([一-龥]{1,14}?(?:学院|学部|研究院))", text)
    if not m:
        m = re.search(r"([一-龥]{1,14}?(?:学院|学部|研究院))", text)
    if m:
        fields["college"] = m.group(1)
    m = re.search(r"([一二三四])年级", text)
    if m:
        fields["grade"] = CN_NUM[m.group(1)]
    else:
        m = re.search(r"(20\d{2})\s*级", text)
        if m:
            fields["grade"] = 2026 - int(m.group(1)) + 1
    m = re.search(r"前\s*(\d+)\s*%", text)
    if m:
        fields["rank_percent"] = int(m.group(1))
    else:
        m = re.search(r"(\d+)\s*/\s*(\d+)", text)
        if m and int(m.group(2)) > 0:
            fields["rank_percent"] = round(int(m.group(1)) / int(m.group(2)) * 100)
    m = re.search(r"([一二三四])等(?:学业)?奖学金", text)
    if m:
        fields["scholarship_level"] = CN_NUM[m.group(1)]
    fields["has_punish"] = bool(
        re.search(r"受[过到]?[^\n]{0,6}处分|处分[^\n]{0,4}(记录|处理)", text)
    ) and "未受过处分" not in text and "无处分" not in text
    return fields


def verify_applications(conditions: list, quota_rows: list, applications: list) -> dict:
    enabled = [c for c in conditions if c.get("enabled", True)]
    quota_map = {}
    for row in quota_rows or []:
        if len(row) >= 3 and row[1] and row[2] and row[1] != "研究生培养单位":
            quota_map[str(row[1]).replace("\n", "")] = row[2]
    results = []
    for app in applications:
        f = extract_application_fields(app.get("text", ""))
        checks = []
        for c in enabled:
            key = c["key"]
            verdict, actual = "missing", ""
            if key == "grade_range":
                if f.get("grade"):
                    actual = f"{f['grade']}年级"
                    verdict = "pass" if f["grade"] in c.get("grades", []) else "fail"
            elif key == "score_rank":
                if f.get("rank_percent") is not None:
                    actual = f"前 {f['rank_percent']}%"
                    verdict = "pass" if f["rank_percent"] <= c.get("max_percent", 100) else "fail"
            elif key == "scholarship":
                if f.get("scholarship_level"):
                    lv = f["scholarship_level"]
                    actual = "一二三四"[lv - 1] + "等学业奖学金"
                    verdict = "pass" if lv in c.get("levels", []) else "fail"
            elif key == "no_punish":
                verdict = "fail" if f.get("has_punish") else "pass"
                actual = "发现处分记录" if f.get("has_punish") else "无处分声明"
            elif key == "quota":
                college = f.get("college", "")
                hit = next((k for k in quota_map if k in college or college in k), None)
                if college:
                    actual = f"{college}（名额 {quota_map[hit]}）" if hit else college
                    verdict = "pass" if hit else "fail"
            checks.append({
                "key": key, "label": c["label"], "standard": c.get("standard", ""),
                "actual": actual, "verdict": verdict,
            })
        valid = [x for x in checks if x["verdict"] != "skip"]
        passed = bool(valid) and all(x["verdict"] == "pass" for x in valid)
        results.append({
            "file": app.get("name", ""),
            "fields": f,
            "checks": checks,
            "passed": passed,
            "pass_count": len([x for x in valid if x["verdict"] == "pass"]),
            "total": len(valid),
        })
    total = len(results)
    passed_n = sum(1 for r in results if r["passed"])
    return {
        "conditions": enabled,
        "results": results,
        "summary": {
            "total": total,
            "passed": passed_n,
            "failed": total - passed_n,
            "rate": round(passed_n / total * 100) if total else 0,
        },
    }