import { NextResponse } from 'next/server';
import prisma from '../../../lib/prisma';

export async function GET() {
  try {
    const uploads = await prisma.upload.findMany({
      include: {
        analysis: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
    return NextResponse.json({ uploads });
  } catch (error) {
    console.error('Error fetching upload history:', error);
    return NextResponse.json(
      { error: 'Failed to fetch upload history' },
      { status: 500 }
    );
  }
}
