export type ApiSuccess<T> = { ok: true; data: T };
export type ApiError = { ok: false; error: { code: string; message: string } };

export class HttpError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
  ) {
    super(message);
  }
}

export function ok<T>(data: T, init: ResponseInit = {}): Response {
  return json({ ok: true, data }, init);
}

export function fail(error: unknown): Response {
  if (error instanceof HttpError) {
    return json({ ok: false, error: { code: error.code, message: error.message } }, {
      status: error.status,
    });
  }

  if (
    error &&
    typeof error === "object" &&
    "name" in error &&
    error.name === "ZodError"
  ) {
    return json({
      ok: false,
      error: { code: "validation_failed", message: "Request body failed validation" },
    }, { status: 400 });
  }

  console.error(error);
  return json({
    ok: false,
    error: { code: "internal_error", message: "Unexpected server error" },
  }, { status: 500 });
}

export function json(body: ApiSuccess<unknown> | ApiError, init: ResponseInit = {}): Response {
  return new Response(JSON.stringify(body), {
    ...init,
    headers: {
      "content-type": "application/json; charset=utf-8",
      ...(init.headers ?? {}),
    },
  });
}

export async function readJson<T>(req: Request): Promise<T> {
  try {
    return await req.json() as T;
  } catch {
    throw new HttpError(400, "invalid_json", "Request body must be valid JSON");
  }
}
