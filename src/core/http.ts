export interface BinaryResponse {
  bytes: Buffer;
  contentType?: string;
}

export interface LanhuHttpClientOptions {
  cookie?: string;
  baseUrl?: string;
  fetchImpl?: typeof fetch;
}

export class LanhuHttpError extends Error {
  readonly code: string;
  readonly status?: number;
  readonly url?: string;
  readonly suggestion?: string;

  constructor(message: string, options: { code: string; status?: number; url?: string; suggestion?: string }) {
    super(message);
    this.name = "LanhuHttpError";
    this.code = options.code;
    this.status = options.status;
    this.url = options.url;
    this.suggestion = options.suggestion;
  }
}

export class LanhuHttpClient {
  private readonly cookie: string;
  private readonly baseUrl: string;
  private readonly fetchImpl: typeof fetch;

  constructor(options: LanhuHttpClientOptions = {}) {
    const cookie = options.cookie ?? process.env.LANHU_COOKIE;
    if (!cookie) {
      throw new LanhuHttpError("缺少 LANHU_COOKIE 环境变量。", {
        code: "LANHU_COOKIE_MISSING",
        suggestion: "登录蓝湖后，从浏览器 Network 面板复制任意 lanhuapp.com 请求的 Cookie 请求头，设置为 LANHU_COOKIE。"
      });
    }

    this.cookie = cookie;
    this.baseUrl = options.baseUrl ?? "https://lanhuapp.com";
    this.fetchImpl = options.fetchImpl ?? fetch;
  }

  async getJson<T>(pathOrUrl: string): Promise<T> {
    const url = this.toUrl(pathOrUrl);
    const response = await this.fetchImpl(url, {
      method: "GET",
      headers: this.defaultHeaders("application/json, text/plain, */*")
    });

    await assertOkResponse(response, url);

    const text = await response.text();
    try {
      return JSON.parse(text) as T;
    } catch {
      throw new LanhuHttpError("蓝湖接口返回了非 JSON 内容。", {
        code: "LANHU_NON_JSON_RESPONSE",
        status: response.status,
        url,
        suggestion: "检查 Cookie 是否过期，或该链接是否跳转到了登录/权限页面。"
      });
    }
  }

  async getBinary(pathOrUrl: string): Promise<BinaryResponse> {
    const url = this.toUrl(pathOrUrl);
    const response = await this.fetchImpl(url, {
      method: "GET",
      headers: this.defaultHeaders("*/*")
    });

    await assertOkResponse(response, url);

    const arrayBuffer = await response.arrayBuffer();
    return {
      bytes: Buffer.from(arrayBuffer),
      contentType: response.headers.get("content-type") ?? undefined
    };
  }

  private toUrl(pathOrUrl: string): string {
    if (/^https?:\/\//i.test(pathOrUrl)) {
      return pathOrUrl;
    }

    return new URL(pathOrUrl, this.baseUrl).toString();
  }

  private defaultHeaders(accept: string): Record<string, string> {
    return {
      Accept: accept,
      Cookie: this.cookie,
      Referer: "https://lanhuapp.com/web/",
      "User-Agent": "lanhu-readonly-mcp/0.1"
    };
  }
}

async function assertOkResponse(response: Response, url: string): Promise<void> {
  if (response.ok) {
    return;
  }

  const bodyPreview = await response.text().catch(() => "");
  throw new LanhuHttpError(`蓝湖请求失败：HTTP ${response.status}。`, {
    code: response.status === 403 || response.status === 418 ? "LANHU_PERMISSION_OR_SESSION_ERROR" : "LANHU_HTTP_ERROR",
    status: response.status,
    url,
    suggestion: buildStatusSuggestion(response.status, bodyPreview)
  });
}

function buildStatusSuggestion(status: number, bodyPreview: string): string {
  if (status === 401 || status === 403 || status === 418) {
    return "请确认 LANHU_COOKIE 未过期，并且当前账号拥有该项目查看权限。";
  }

  if (bodyPreview.includes("login") || bodyPreview.includes("登录")) {
    return "接口响应像登录页，请重新获取 LANHU_COOKIE。";
  }

  return "请稍后重试；如果持续失败，记录该 URL 和状态码以便适配蓝湖接口变化。";
}
