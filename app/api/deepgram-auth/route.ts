import { NextResponse } from 'next/server';


export async function GET() {   
  try {
    const apiKey = process.env.DEEPGRAM_API_KEY;
    return NextResponse.json({ apiKey });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch data" },
      { status: 500 }
    );
  }
}