// app/api/predictions/route.js
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

    console.log("Fetching from FastAPI:", url);
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`FastAPI error: ${response.status}`);
    }

    const data = await response.json();
    return Response.json(data);

  } catch (err) {
    console.error("GET /api/predictions error:", err);
    return Response.json(
      { error: err?.message || "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(req) {
  try {
    const body = await req.json();

    console.log("POST to FastAPI /predict with:", body);
    const response = await fetch(`${FASTAPI_URL}/predict`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      throw new Error(`FastAPI error: ${response.status}`);
    }

    const data = await response.json();
    return Response.json(data);

  } catch (err) {
    console.error("POST /api/predictions error:", err);
    return Response.json(
      { error: err?.message || "Internal server error" },
      { status: 500 }
    );
  }
}