import OpenAI from "openai";

export const runtime = "nodejs";
const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// كلمات نعتبرها "صحية"
const HEALTH_KEYWORDS = [
  "صداع","تعب","ألم","الم","حمى","حرارة","كحة","سعال","ضيق","نفس",
  "دوخة","غثيان","تقيؤ","قلق","توتر","اكتئاب","نوم",
  "headache","pain","fever","tired","cough","anxiety","sleep"
];

function looksHealthRelated(text) {
  const t = text.toLowerCase();
  return HEALTH_KEYWORDS.some(k => t.includes(k));
}

export async function POST(req) {
  try {
    const { message } = await req.json();
    if (!message) {
      return Response.json({ error: "message is required" }, { status: 400 });
    }

    // 🔒 Gate: إذا السؤال مو صحي، لا ننادي OpenAI
    if (!looksHealthRelated(message)) {
      return Response.json({
        replies: [
          {
            id: "system",
            name: "Assistant",
            emoji: "ℹ️",
            color: "text-gray-600",
            text: "هذا المساعد مخصص فقط للأسئلة الصحية والأعراض. رجاءً اذكر أعراضك أو حالتك الصحية."
          }
        ]
      });
    }

    // 🧠 استدعاء واحد فقط (تقليل صرف)
    const response = await client.responses.create({
      model: "gpt-4.1-mini",
      max_output_tokens: 450,
      input: [
        {
          role: "system",
          content: `
You are a multi-agent health assistant.
Return ONLY valid JSON in this exact format:

{
  "replies": [
    {"id":"nutritionist","name":"Nutritionist","emoji":"🥗","color":"text-green-600","text":"..."},
    {"id":"fitness","name":"Fitness Trainer","emoji":"💪","color":"text-orange-600","text":"..."},
    {"id":"doctor","name":"General Doctor","emoji":"👨‍⚕️","color":"text-purple-600","text":"..."},
    {"id":"psychiatrist","name":"Psychiatrist","emoji":"🧠","color":"text-pink-600","text":"..."}
  ]
}

Rules:
- No diagnosis, no medication names or doses.
- Short, practical advice.
- Doctor must include when to seek medical help.
`
        },
        { role: "user", content: message }
      ],
    });

    const text = response.output_text || "{}";

    let parsed;
    try {
      parsed = JSON.parse(text);
    } catch {
      return Response.json(
        { error: "AI returned invalid JSON", raw: text },
        { status: 500 }
      );
    }

    return Response.json(parsed);

  } catch (err) {
    console.error("API error:", err);
    return Response.json(
      { error: "Internal server error", details: String(err?.message || err) },
      { status: 500 }
    );
  }
}