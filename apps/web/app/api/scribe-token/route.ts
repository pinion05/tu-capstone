import { ElevenLabsClient } from '@elevenlabs/elevenlabs-js';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST() {
  const apiKey = process.env.ELEVENLABS_API_KEY;

  if (!apiKey) {
    return Response.json(
      {
        error: 'ELEVENLABS_API_KEY is missing. Add it to infra/.env and restart the web container.',
      },
      { status: 500 }
    );
  }

  try {
    const elevenlabs = new ElevenLabsClient({ apiKey });
    const result = await elevenlabs.tokens.singleUse.create('realtime_scribe');

    if (typeof result === 'string') {
      return Response.json({ token: result });
    }

    return Response.json(result);
  } catch (error) {
    console.error('Failed to create ElevenLabs Scribe token:', error);
    return Response.json({ error: 'Failed to create ElevenLabs Scribe token' }, { status: 500 });
  }
}
