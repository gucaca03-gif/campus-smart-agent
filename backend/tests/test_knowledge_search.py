import os
import sys
import tempfile

import pytest

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, ROOT)

from sqlalchemy import create_engine  # noqa: E402
from sqlalchemy.orm import sessionmaker  # noqa: E402

from app.knowledge import search_knowledge  # noqa: E402
from app.models import Base, KnowledgeChunk  # noqa: E402

SRC_BOOK = "研究生手册（2025）.pdf"
SRC_PARTY = "发展党员工作实施办法.pdf"

CHUNKS = [
    (SRC_BOOK, "研究生手册（2025）", 49,
     "第二条 研究生国家奖学金由中央财政承担，用于奖励纳入全国研究生招生计划内且表现优异的全日制研究生，"
     "旨在发展中国特色研究生教育，促进研究生培养机制改革，提高研究生培养质量。"
     "第三条 研究生国家奖学金名额分配主要依据各基层研究生培养单位的研究生规模、办学特色、培养质量、"
     "学科建设水平和国家亟需学科专业，以及上一年度研究生国家奖学金执行情况等因素确定。"),
    (SRC_BOOK, "研究生手册（2025）", 50,
     "第六条 研究生国家奖学金申请条件：具有中华人民共和国国籍；热爱社会主义祖国，拥护中国共产党的领导；"
     "遵守宪法和法律，遵守学校各项规章制度；诚实守信，道德品质优良，恪守学术规范；学习成绩优异，"
     "科研创新与实践能力显著。具体要求如下：二年级及以上年级研究生，上一学年已修课程平均成绩须在80分以上，"
     "且单科成绩不低于70分；新入学研究生重点考察入学前基本情况及取得的突出成绩。"),
    (SRC_BOOK, "研究生手册（2025）", 51,
     "第八条 在学制期限基本修业年限内，因国家、学校公派出国留学或校际交流在境外学习的研究生，"
     "仍具备研究生国家奖学金参评资格。第九条 研究生在学制期限基本修业年限内可多次获得研究生国家奖学金，"
     "但获奖所依据的申报成果不可重复使用。第十条 研究生存在违反校纪校规受到纪律处分、"
     "学术不端行为经查证属实、超出基本修业年限等情形之一的，当年不能申请研究生国家奖学金。"),
    (SRC_BOOK, "研究生手册（2025）", 53,
     "第十六条 评审程序：学校评审领导小组确定各培养单位名额后，发布评审工作通知；个人申请，符合申请条件并有意愿申请的研究生，"
     "如实填写《研究生国家奖学金申请表》，向所在培养单位提出申请并提交支撑材料；培养单位评审委员会组织初评，"
     "拟获奖名单在本单位内公示不少于5个工作日；公示无异议后报送研究生院，由学校评审领导小组审定并全校公示。"),
    (SRC_PARTY, "发展党员工作实施办法", 3,
     "第三条 各基层党委、党支部应当把立德树人作为根本任务，把吸收具有马克思主义信仰、共产主义觉悟和"
     "中国特色社会主义信念的先进分子入党作为重要任务。党支部应当做好入党积极分子的培养考察工作，"
     "指定一至两名正式党员作为培养联系人，定期听取思想汇报，经过一年以上培养考察后，方可列为发展对象。"),
    (SRC_BOOK, "研究生手册（2025）", 90,
     "第九十条 所有申请硕士学位的研究生，其学位论文在答辩前必须进行双盲评审。学位论文答辩委员会由"
     "不少于五人组成，其中应当有校外专家参加。答辩程序包括主席宣布程序及要求、答辩人宣读学位论文原创性声明、"
     "答辩人报告论文主要内容、委员提问与答辩、委员会评议并投票表决等环节。"),
]


@pytest.fixture()
def db():
    path = tempfile.mktemp(suffix=".db")
    engine = create_engine(f"sqlite:///{path}")
    Base.metadata.create_all(engine)
    session = sessionmaker(bind=engine)()
    session.add_all([
        KnowledgeChunk(source=s, title=t, chunk_index=i, content=c) for s, t, i, c in CHUNKS
    ])
    session.commit()
    yield session
    session.close()
    engine.dispose()
    if os.path.exists(path):
        os.remove(path)


def test_scholarship_returns_single_group_with_conditions(db):
    kb = search_knowledge(db, "奖学金怎么申请")
    assert len(kb) == 1, kb
    item = kb[0]
    assert "研究生手册" in item["source"]
    assert item["chunks"] >= 2
    assert "第六条" in item["content"]
    assert "申请条件" in item["content"]


def test_topic_term_keeps_unrelated_source_out(db):
    kb = search_knowledge(db, "奖学金怎么申请")
    assert all("发展党员" not in k["source"] for k in kb)


def test_join_process_hits_party_document(db):
    kb = search_knowledge(db, "入党流程")
    assert len(kb) == 1, kb
    assert "发展党员" in kb[0]["source"]
    assert "入党" in kb[0]["content"]


def test_unknown_topic_returns_empty(db):
    kb = search_knowledge(db, "图书馆开放时间")
    assert kb == []


def test_scholarship_context_includes_review_procedure(db):
    kb = search_knowledge(db, "奖学金怎么申请")
    assert "第十六条" in kb[0]["content"]
    assert "个人申请" in kb[0]["content"]