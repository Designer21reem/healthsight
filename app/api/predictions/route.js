export const runtime = "nodejs";

const FASTAPI_URL = process.env.FASTAPI_URL || "http://localhost:8000";

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const disease = searchParams.get("disease");
    const year = searchParams.get("year");

    let url = `${FASTAPI_URL}/predictions`;

    if (disease) {
      url = `${FASTAPI_URL}/predictions/disease/${disease}`;
    } else if (year) {
      url = `${FASTAPI_URL}/predictions/year/${year}`;
    }

    const response = await fetch(url);

    if (!response.ok) throw new Error("FastAPI error");

    const data = await response.json();
    return Response.json(data);

  } catch (err) {
    return Response.json(
      { error: String(err?.message || err) },
      { status: 500 }
    );
  }
}


export async function POST(req) {
  try {
    const body = await req.json();

    const response = await fetch(`${FASTAPI_URL}/predict`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) throw new Error("FastAPI error");

    const data = await response.json();
    return Response.json(data);

  } catch (err) {
    return Response.json(
      { error: String(err?.message || err) },
      { status: 500 }
    );
  }
}