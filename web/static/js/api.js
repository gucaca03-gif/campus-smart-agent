async function request(path, options = {}) {
  const config = {
    headers: { "Content-Type": "application/json" },
    ...options,
  };
  if (config.body && typeof config.body !== "string") {
    config.body = JSON.stringify(config.body);
  }
  const res = await fetch(`/api${path}`, config);
  let payload = null;
  try {
    payload = await res.json();
  } catch (e) {
    payload = null;
  }
  if (!res.ok) {
    const detail = payload && payload.detail;
    const message =
      detail && typeof detail === "object"
        ? detail.message || "请求失败"
        : detail || `请求失败（HTTP ${res.status}）`;
    const error = new Error(message);
    error.code = detail && detail.code;
    error.status = res.status;
    throw error;
  }
  return payload ? payload.data : null;
}

export const api = {
  get(path) {
    return request(path);
  },
  post(path, body = {}) {
    return request(path, { method: "POST", body });
  },
  async upload(path, formData) {
    const res = await fetch(`/api${path}`, { method: "POST", body: formData });
    const payload = await res.json().catch(() => null);
    if (!res.ok) {
      const detail = payload && payload.detail;
      const message =
        detail && typeof detail === "object" ? detail.message || "上传失败" : detail || `上传失败（HTTP ${res.status}）`;
      throw new Error(message);
    }
    return payload ? payload.data : null;
  },
  put(path, body = {}) {
    return request(path, { method: "PUT", body });
  },
  patch(path, body = {}) {
    return request(path, { method: "PATCH", body });
  },
  del(path) {
    return request(path, { method: "DELETE" });
  },
};