# -*- coding: utf-8 -*-
"""省一省核心业务逻辑单元测试（标准库 unittest，可被 pytest 直接发现）。

运行：python -m unittest discover -s backend/tests -v
覆盖：成本口径、同款匹配、条件价、历史真实性、权限、结算幂等、提醒去重、金额口径。
"""
import os
import sys
import tempfile
import unittest
from datetime import datetime, timedelta

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", ".."))
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from sqlalchemy import create_engine  # noqa: E402
from sqlalchemy.orm import sessionmaker  # noqa: E402

from app import deal_decision  # noqa: E402
from app.models import (  # noqa: E402
    AlertLog,
    Base,
    GroupMember,
    PlanGroup,
    PlanResult,
    PlanVote,
    PriceAlert,
    PriceSnapshot,
    Product,
    PurchasePlan,
    PurchaseRecord,
    Quote,
)


class DealDecisionTest(unittest.TestCase):
    def setUp(self):
        fd, path = tempfile.mkstemp(suffix=".db")
        os.close(fd)
        self.addCleanup(lambda: os.path.exists(path) and os.unlink(path))
        self.engine = create_engine(f"sqlite:///{path}", connect_args={"check_same_thread": False})
        Base.metadata.create_all(self.engine)
        self.db = sessionmaker(bind=self.engine)()
        self.product = Product(user_id=1, name="测试耳机", category="耳机", price_cent=39900)
        self.db.add(self.product)
        self.db.commit()
        self.db.refresh(self.product)

    def tearDown(self):
        self.db.close()
        self.engine.dispose()

    def _quote(self, **kw):
        base = dict(
            product_id=self.product.id, source_key="manual", platform="京东", price_cent=39900,
            qty=1, stock="in_stock", cost_complete=1, match_level="exact",
        )
        base.update(kw)
        q = Quote(**base)
        self.db.add(q)
        self.db.commit()
        self.db.refresh(q)
        return q

    def test_base_cost(self):
        q = self._quote(price_cent=39900, coupon_cent=2000, shipping_cent=800, fee_cent=100)
        self.assertEqual(deal_decision.base_cost_cent(q), 38800)

    def test_conditional_quote_excluded(self):
        self._quote(price_cent=39900)
        self._quote(price_cent=37900, coupon_cent=2000, shipping_cent=800, conditions="需学生认证")
        _, comp = deal_decision.comparable_quotes(self.db, self.product.id)
        self.assertEqual(len(comp), 1)
        self.assertEqual(comp[0].price_cent, 39900)

    def test_alternative_quote_not_lowest(self):
        exact = self._quote(price_cent=39900)
        alt = self._quote(price_cent=19900, platform="拼多多", match_level="alternative")
        _, comp = deal_decision.comparable_quotes(self.db, self.product.id)
        self.assertEqual([q.id for q in comp], [exact.id])
        self.assertNotIn(alt.id, [q.id for q in comp])

    def test_incomplete_cost_excluded(self):
        self._quote(price_cent=39900)
        self._quote(price_cent=35900, cost_complete=0)
        _, comp = deal_decision.comparable_quotes(self.db, self.product.id)
        self.assertEqual(len(comp), 1)

    def test_no_history_no_curve(self):
        h = deal_decision.history_stats(self.db, self.product.id)
        self.assertFalse(h["has_history"])
        self.assertEqual(h["points"], [])

    def test_single_day_history_no_trend(self):
        q = self._quote()
        for _ in range(3):
            self.db.add(PriceSnapshot(quote_id=q.id, product_id=self.product.id, price_cent=39900,
                                      source_key="manual", fetched_at="2026-11-04 10:00:00"))
        self.db.commit()
        h = deal_decision.history_stats(self.db, self.product.id)
        self.assertTrue(h["has_history"])
        self.assertFalse(h["trend_reliable"])

    def _plan(self, **kw):
        base = dict(user_id=1, product_id=self.product.id, title="测试计划", price_cent=39900,
                    budget_cent=60000, visibility="private", discuss_status="discussing",
                    end_mode="target_votes", target_votes=2)
        base.update(kw)
        p = PurchasePlan(**base)
        self.db.add(p)
        self.db.commit()
        self.db.refresh(p)
        return p

    def test_private_plan_permission(self):
        p = self._plan(visibility="private")
        self.assertTrue(deal_decision.can_read_plan(self.db, p, 1))
        self.assertFalse(deal_decision.can_read_plan(self.db, p, 2))

    def test_group_plan_permission(self):
        g = PlanGroup(owner_id=1, name="宿舍群", visibility="private")
        self.db.add(g)
        self.db.commit()
        p = self._plan(visibility="group", group_id=g.id)
        self.assertFalse(deal_decision.can_read_plan(self.db, p, 2, set()))
        self.assertTrue(deal_decision.can_read_plan(self.db, p, 2, {g.id}))

    def test_settle_idempotent(self):
        p = self._plan()
        n1, created1 = deal_decision.settle_plan(self.db, p, "manual")
        self.db.refresh(p)
        n2, created2 = deal_decision.settle_plan(self.db, p, "manual")
        self.assertTrue(created1)
        self.assertFalse(created2)
        self.assertEqual(self.db.query(PlanResult).filter(PlanResult.plan_id == p.id).count(), 1)
        self.assertEqual(n1.plan_id, p.id)

    def test_vote_summary_tie_and_empty(self):
        p = self._plan()
        empty = deal_decision.vote_summary(self.db, p)
        self.assertIn("暂无投票", empty["tendency"])
        self.db.add_all([PlanVote(plan_id=p.id, user_id=2, choice="buy"),
                         PlanVote(plan_id=p.id, user_id=3, choice="wait")])
        self.db.commit()
        tie = deal_decision.vote_summary(self.db, p)
        self.assertTrue(tie["tie"])
        self.assertIn("平票", tie["tendency"])

    def test_alert_dedup(self):
        p = self._plan()
        self._quote(price_cent=39900)
        alert = PriceAlert(user_id=1, plan_id=p.id, rule_type="target_price",
                           target_price_cent=40000, cooldown_min=1440)
        self.db.add(alert)
        self.db.commit()
        first = deal_decision.check_alerts(self.db, p.id)
        second = deal_decision.check_alerts(self.db, p.id)
        self.assertEqual(len(first), 1)
        self.assertEqual(len(second), 0)

    def test_money_summary_not_counting_deferred_as_saved(self):
        p1 = self._plan(decision_status="deferred", price_cent=39900)
        p2 = self._plan(decision_status="abandoned", price_cent=29900)
        self.db.add(PurchaseRecord(plan_id=p1.id, user_id=1, paid_cent=39900, private=1))
        self.db.commit()
        s = deal_decision.money_summary(self.db, 1)
        self.assertEqual(s["deferred_total"], 399.0)
        self.assertEqual(s["abandoned_total"], 299.0)
        self.assertEqual(s["spent_total"], 399.0)
        self.assertEqual(s["price_diff_total"], 0.0)  # 实付=预计，无可验证差额

    def test_source_status_is_truthful(self):
        status = {s["key"]: s for s in deal_decision.source_status()}
        self.assertEqual(status["manual"]["status"], "enabled")
        self.assertEqual(status["taobao"]["status"], "unconfigured")
        self.assertFalse(status["taobao"]["capabilities"]["history"])


if __name__ == "__main__":
    unittest.main(verbosity=2)