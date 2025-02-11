import { NextResponse } from 'next/server';

const API_KEY = process.env.DATA_GOV_IN_API_KEY;
const API_URL = 'https://api.data.gov.in/resource/37231365-78ba-44d5-ac22-3deec40b9197';

export async function GET() {
  if (!API_KEY) {
    console.error('API key is missing');
    return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
  }

  try {
    const url = `${API_URL}?api-key=${API_KEY}&offset=0&limit=all&format=json`;
    const response = await fetch(url, { method: 'GET' });

    if (!response.ok) {
      console.error(`API request failed with status: ${response.status}`);
      return NextResponse.json({ error: `API request failed with status ${response.status}` }, { status: response.status });
    }

    const data = await response.json();

    if (!data?.records || !Array.isArray(data.records)) {
      console.error('Invalid data format received');
      return NextResponse.json({ error: 'Invalid data format from API' }, { status: 500 });
    }

    const districts = Array.from(new Set(
      data.records.map((record: { district_name_english?: string }) => record.district_name_english).filter(Boolean)
    )).sort();

    return NextResponse.json(districts);
  } catch (error) {
    console.error('Error fetching districts:', error);
    return NextResponse.json({ error: 'Failed to fetch districts' }, { status: 500 });
  }
}
