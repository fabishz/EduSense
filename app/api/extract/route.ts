import { NextRequest, NextResponse } from 'next/server';
import { TextractClient, StartDocumentTextDetectionCommand, GetDocumentTextDetectionCommand, Block } from '@aws-sdk/client-textract';
import prisma from '../../../lib/prisma';

const textractClient = new TextractClient({ region: process.env.AWS_REGION });

export async function POST(req: NextRequest) {
  try {
    const { studentName, fileUrl } = await req.json();

    // Start Textract job
    const startCommand = new StartDocumentTextDetectionCommand({
      DocumentLocation: {
        S3Object: {
          Bucket: process.env.AWS_S3_BUCKET_NAME!,
          Name: fileUrl,
        },
      },
    });

    const startResponse = await textractClient.send(startCommand);
    const jobId = startResponse.JobId;

    if (!jobId) {
      return NextResponse.json({ error: 'Failed to start Textract job' }, { status: 500 });
    }

    // Poll for job completion (simplified for MVP, consider async notification in production)
    let jobStatus = 'IN_PROGRESS';
    let textBlocks: string[] = [];

    while (jobStatus === 'IN_PROGRESS') {
      await new Promise((resolve) => setTimeout(resolve, 3000));

      const getCommand = new GetDocumentTextDetectionCommand({ JobId: jobId });
      const getResponse = await textractClient.send(getCommand);

      jobStatus = getResponse.JobStatus!;

      if (jobStatus === 'SUCCEEDED' && getResponse.Blocks) {
        textBlocks = getResponse.Blocks.filter((block: Block) => block.BlockType === 'LINE').map((block: Block) => block.Text || '');
      } else if (jobStatus === 'FAILED') {
        return NextResponse.json({ error: 'Textract job failed' }, { status: 500 });
      }
    }

    const extractedText = textBlocks.join('\n');

    // Save upload and extracted text to DB
    const upload = await prisma.upload.create({
      data: {
        studentName,
        fileUrl,
        extractedText,
      },
    });

    return NextResponse.json({ upload });
  } catch (error) {
    console.error('Textract error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
