import { NextRequest, NextResponse } from "next/server";

const NETEASE_API_BASE = process.env.NETEASE_API_BASE_URL;

async function proxyRequest(
  request: NextRequest,
  path: string[]
): Promise<NextResponse> {
  if (!NETEASE_API_BASE) {
    return NextResponse.json(
      { code: 500, message: "API 配置错误", retryable: false },
      { status: 500 }
    );
  }

  try {
    const targetPath = path.join("/");
    const url = new URL(`/${targetPath}`, NETEASE_API_BASE);

    // 收集 URL 查询参数
    const searchParams = request.nextUrl.searchParams;
    searchParams.forEach((value, key) => {
      url.searchParams.set(key, value);
    });

    // 构建请求头 - 透传 cookie 和其他必要头
    const headers: Record<string, string> = {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
    };

    // 透传前端的 cookie（用于登录状态）
    const cookie = request.headers.get("cookie");
    if (cookie) {
      headers["cookie"] = cookie;
    }

    // 构建请求选项
    const fetchOptions: RequestInit = {
      method: request.method,
      headers,
    };

    // 对于 POST 请求，读取 body 并解析为查询参数追加到 URL
    // 开源 NeteaseCloudMusicApi 更习惯使用 GET + query parameters
    if (request.method === "POST") {
      const body = await request.text();
      if (body) {
        // 解析 form-urlencoded body
        const params = new URLSearchParams(body);
        params.forEach((value, key) => {
          url.searchParams.set(key, value);
        });
      }
      // 改用 GET 请求发送到开源 API
      fetchOptions.method = "GET";
    }

    // 发送请求到开源 API
    const response = await fetch(url.toString(), fetchOptions);

    // 获取响应体
    const data = await response.text();

    // 构建响应，透传 set-cookie 头
    const responseHeaders: Record<string, string> = {
      "Content-Type": "application/json; charset=utf-8",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Cookie",
      "Access-Control-Allow-Credentials": "true",
    };

    // 透传开源 API 返回的 set-cookie 头（关键：维持登录状态）
    const setCookies = response.headers.getSetCookie?.() || [];
    if (setCookies.length > 0) {
      // 使用 getSetCookie 获取所有 set-cookie 头
      responseHeaders["set-cookie"] = setCookies.join(", ");
    } else {
      // 备用方案：直接获取 set-cookie
      const singleCookie = response.headers.get("set-cookie");
      if (singleCookie) {
        responseHeaders["set-cookie"] = singleCookie;
      }
    }

    return new NextResponse(data, {
      status: response.status,
      headers: responseHeaders,
    });
  } catch (error) {
    console.error("Proxy error:", error);
    return NextResponse.json(
      { code: 500, message: "代理请求失败", retryable: true },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;
  return proxyRequest(request, path);
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;
  return proxyRequest(request, path);
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Cookie",
      "Access-Control-Allow-Credentials": "true",
    },
  });
}
