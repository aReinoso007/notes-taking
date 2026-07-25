import { proxyToDjango } from "@/lib/proxy";

export async function GET() {
  return proxyToDjango("/categories/", { method: "GET" });
}

export async function POST(request: Request) {
  const body = await request.text();
  return proxyToDjango("/categories/", { method: "POST", body });
}
