import os
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, ROOT)

from app.cloud import obs  # noqa: E402

ENV_KEYS = ("OBS_ENDPOINT", "OBS_BUCKET", "OBS_ACCESS_KEY_ID", "OBS_SECRET_ACCESS_KEY")


def test_disabled_without_config(monkeypatch):
    for k in ENV_KEYS:
        monkeypatch.delenv(k, raising=False)
    assert obs.enabled() is False
    ok, msg = obs.put_bytes("a.pdf", b"x")
    assert ok is False
    assert "未配置" in msg


def test_upload_with_mock_client(monkeypatch):
    monkeypatch.setenv("OBS_ENDPOINT", "obs.cn-east-3.myhuaweicloud.com")
    monkeypatch.setenv("OBS_BUCKET", "test-bucket")
    monkeypatch.setenv("OBS_ACCESS_KEY_ID", "ak")
    monkeypatch.setenv("OBS_SECRET_ACCESS_KEY", "sk")
    assert obs.enabled() is True

    class _Resp:
        status = 200

    class _Client:
        args = None

        def putContent(self, bucket, key, data):
            self.args = (bucket, key, data)
            return _Resp()

    client = _Client()
    monkeypatch.setattr(obs, "_client", client)

    ok, key = obs.put_bytes("奖学金.pdf", b"abc")
    assert ok is True
    assert key.startswith("office/")
    assert key.endswith("奖学金.pdf")
    assert client.args[0] == "test-bucket"
    assert client.args[2] == b"abc"