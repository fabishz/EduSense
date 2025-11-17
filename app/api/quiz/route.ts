import { NextRequest, NextResponse } from 'next/server';
import { BedrockClient, InvokeModelCommand } from '@aws-sdk/client-bedrock';
import prisma from '../../../lib/prisma';

const bedrockClient = new BedrockClient({ region: process.env.AWS_REGION });

export async function POST(req: NextRequest) {
  try {
    const { uploadId } = await req.json();

    // Fetch the analysis from DB
    const analysis = await prisma.analysis.findUnique({ where: { uploadId } });
    if (!analysis) {
      return NextResponse.json({ error: 'Analysis not found' }, { status: 404 });
    }

    // Generate quiz questions using Bedrock
    const prompt = `Generate 5 quiz questions based on the following summary and key ideas:\nSummary: ${analysis.summary}\nKey Ideas: ${analysis.keyIdeas}`;

    const command = new InvokeModelCommand({
      modelId: process.env.BEDROCK_MODEL_ID!,
      input: JSON.stringify({ prompt }),
    });

    const response = await bedrockClient.send(command);

    // Assume response contains quiz questions as a string
    const questions = response.body?.toString() || '[]';

    // Save quiz to DB
    const quiz = await prisma.quiz.upsert({
      where: { uploadId },
      update: { questions },
      create: { uploadId, questions },
    });

    return NextResponse.json({ quiz });
  } catch (error) {
    console.error('Bedrock error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
