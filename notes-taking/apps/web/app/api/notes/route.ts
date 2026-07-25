import { proxyToDjango } from "@/lib/proxy";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const qs = searchParams.toString();
  const path = qs ? `/notes/?${qs}` : "/notes/";
  return proxyToDjango(path, { method: "GET" });
}

export async function POST(request: Request) {
  const body = await request.text();
  return proxyToDjango("/notes/", { method: "POST", body });
}
