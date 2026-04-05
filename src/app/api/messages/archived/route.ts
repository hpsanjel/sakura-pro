import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET - Get archived messages for the current user
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const search = searchParams.get('search') || '';

    const skip = (page - 1) * limit;

    // Get archived messages (isDeleted: true) for the current user
    const messages = await prisma.message.findMany({
      where: {
        consultancyId: session.user.consultancyId,
        isDeleted: true, // Only archived messages
        AND: [
          {
            OR: [
              { senderId: session.user.id },
              { recipientIds: { has: session.user.id } }
            ]
          }
        ],
        ...(search && {
          OR: [
            { subject: { contains: search, mode: 'insensitive' } },
            { content: { contains: search, mode: 'insensitive' } },
            { sender: { name: { contains: search, mode: 'insensitive' } } },
            { sender: { email: { contains: search, mode: 'insensitive' } } }
          ]
        })
      },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          }
        }
      },
      orderBy: { sentAt: 'desc' },
      skip,
      take: limit,
    });

    // Transform messages to add recipient details and metadata
    const transformedMessages = await Promise.all(
      messages.map(async (message: any) => {
        // Get recipient details
        const recipients = await prisma.user.findMany({
          where: {
            id: { in: message.recipientIds },
            consultancyId: session.user.consultancyId
          },
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          }
        });

        // Determine message status for current user
        const isFromMe = message.senderId === session.user.id;
        const isToMe = message.recipientIds.includes(session.user.id);
        
        let messageStatus = 'received';
        if (isFromMe && !isToMe) {
          messageStatus = 'sent';
        } else if (isFromMe && isToMe) {
          messageStatus = 'sent_to_self';
        }

        return {
          ...message,
          recipients,
          messageStatus,
          isFromMe,
          isToMe,
          isRead: isFromMe ? true : message.isRead, // Sender's messages are always considered read
          sentAt: message.sentAt.toISOString(), // Convert Date to string
        };
      })
    );

    // Get total count for pagination
    const totalCount = await prisma.message.count({
      where: {
        consultancyId: session.user.consultancyId,
        isDeleted: true,
        AND: [
          {
            OR: [
              { senderId: session.user.id },
              { recipientIds: { has: session.user.id } }
            ]
          }
        ],
        ...(search && {
          OR: [
            { subject: { contains: search, mode: 'insensitive' } },
            { content: { contains: search, mode: 'insensitive' } },
            { sender: { name: { contains: search, mode: 'insensitive' } } },
            { sender: { email: { contains: search, mode: 'insensitive' } } }
          ]
        })
      }
    });

    return NextResponse.json({
      messages: transformedMessages,
      pagination: {
        page,
        limit,
        total: totalCount,
        pages: Math.ceil(totalCount / limit)
      }
    });

  } catch (error) {
    console.error('Error fetching archived messages:', error);
    return NextResponse.json(
      { error: 'Failed to fetch archived messages' },
      { status: 500 }
    );
  }
}
