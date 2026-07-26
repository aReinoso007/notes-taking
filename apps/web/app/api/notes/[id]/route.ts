import { proxyToDjango } from "@/lib/proxy";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params) {
  const { id } = await params;
  return proxyToDjango(`/notes/${id}/`, { method: "GET" });
}

export async function PATCH(request: Request, { params }: Params) {
  const { id } = await params;
  const body = await request.text();
  return proxyToDjango(`/notes/${id}/`, { method: "PATCH", body });
}

export async function DELETE(_request: Request, { params }: Params) {
  const { id } = await params;
  return proxyToDjango(`/notes/${id}/`, { method: "DELETE" });
}
