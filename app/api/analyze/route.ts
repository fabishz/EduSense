import { NextRequest, NextResponse } from 'next/server';
import { ComprehendClient, DetectKeyPhrasesCommand, DetectSentimentCommand, DetectEntitiesCommand } from '@aws-sdk/client-comprehend';
import prisma from '../../../lib/prisma';

const comprehendClient = new ComprehendClient({ region: process.env.AWS_REGION });

export async function POST(req: NextRequest) {
  try {
    const { uploadId } = await req.json();

    // Fetch the extracted text from DB
    const upload = await prisma.upload.findUnique({ where: { id: uploadId } });
    if (!upload) {
      return NextResponse.json({ error: 'Upload not found' }, { status: 404 });
    }

    const text = upload.extractedText;

    // Detect key phrases
    const keyPhrasesCommand = new DetectKeyPhrasesCommand({
      Text: text,
      LanguageCode: 'en',
    });
    const keyPhrasesResponse = await comprehendClient.send(keyPhrasesCommand);
    const keyIdeas = keyPhrasesResponse.KeyPhrases?.map(kp => kp.Text).join(', ') || '';

    // Detect sentiment (used to infer strengths/weaknesses simplistically)
    const sentimentCommand = new DetectSentimentCommand({
      Text: text,
      LanguageCode: 'en',
    });
    const sentimentResponse = await comprehendClient.send(sentimentCommand);

    let strengths = '';
    let weaknesses = '';
    if (sentimentResponse.Sentiment === 'POSITIVE' || sentimentResponse.Sentiment === 'NEUTRAL') {
      strengths = 'Good understanding of the topic.';
      weaknesses = 'Needs minor improvements.';
    } else if (sentimentResponse.Sentiment === 'NEGATIVE') {
      strengths = 'Some understanding present.';
      weaknesses = 'Significant gaps in knowledge.';
    }

    // Generate a simple summary (using entities as a proxy)
    const entitiesCommand = new DetectEntitiesCommand({
      Text: text,
      LanguageCode: 'en',
    });
    const entitiesResponse = await comprehendClient.send(entitiesCommand);
    const summary = entitiesResponse.Entities?.map(e => e.Text).join(', ') || 'Summary not available.';

    // Grade recommendation (simplistic scale based on sentiment)
    let grade = 50;
    if (sentimentResponse.Sentiment === 'POSITIVE') grade = 85;
    else if (sentimentResponse.Sentiment === 'NEUTRAL') grade = 70;
    else if (sentimentResponse.Sentiment === 'NEGATIVE') grade = 40;

    // Save analysis to DB
    const analysis = await prisma.analysis.upsert({
      where: { uploadId },
      update: { summary, keyIdeas, strengths, weaknesses, grade },
      create: { uploadId, summary, keyIdeas, strengths, weaknesses, grade },
    });

    return NextResponse.json({ analysis });
  } catch (error) {
    console.error('Comprehend error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
