import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

// Define types for the message data
interface MessageWithSender {
  id: string;
  senderId: string;
  recipientIds: string[];
  subject: string;
  content: string;
  isRead: boolean;
  isDeleted: boolean;
  sentAt: string;
  consultancyId: string;
  sender: {
    id: string;
    name: string | null;
    email: string;
    role: string;
  };
}

// Schema for sending a message
const sendMessageSchema = z.object({
  recipientIds: z.array(z.string()).min(1, "At least one recipient is required"),
  subject: z.string().min(1, "Subject is required"),
  content: z.string().min(1, "Message content is required"),
  attachments: z.array(z.string()).optional().default([]),
});

// GET - Get all messages for the current user
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const status = searchParams.get('status'); // 'sent', 'received', 'all'

    const skip = (page - 1) * limit;

    // Get messages for the current user
    const messages = await prisma.message.findMany({
      where: {
        consultancyId: session.user.consultancyId,
        isDeleted: false,
        AND: [
          {
            OR: [
              { senderId: session.user.id },
              { recipientIds: { has: session.user.id } }
            ]
          }
        ]
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
      messages.map(async (message) => {
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
        };
      })
    );

    // Filter by status if specified
    const filteredMessages = status === 'sent' 
      ? transformedMessages.filter((m: any) => m.messageStatus === 'sent' || m.messageStatus === 'sent_to_self')
      : status === 'received'
      ? transformedMessages.filter((m: any) => m.messageStatus === 'received')
      : transformedMessages;

    // Get total count for pagination
    const totalCount = await prisma.message.count({
      where: {
        consultancyId: session.user.consultancyId,
        AND: [
          { isDeleted: false },
          {
            OR: [
              { senderId: session.user.id },
              { recipientIds: { has: session.user.id } }
            ]
          }
        ]
      }
    });

    return NextResponse.json({
      messages: filteredMessages,
      pagination: {
        page,
        limit,
        total: totalCount,
        pages: Math.ceil(totalCount / limit)
      }
    });

  } catch (error) {
    console.error('Error fetching messages:', error);
    return NextResponse.json(
      { error: 'Failed to fetch messages' },
      { status: 500 }
    );
  }
}

// POST - Send a new message
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = sendMessageSchema.parse(body);

    // Validate that all recipients exist and belong to the same consultancy
    const recipients = await prisma.user.findMany({
      where: {
        id: { in: validatedData.recipientIds },
        consultancyId: session.user.consultancyId
      },
      select: { id: true, name: true, email: true, role: true }
    });

    if (recipients.length !== validatedData.recipientIds.length) {
      return NextResponse.json(
        { error: 'Some recipients are not found or not in your consultancy' },
        { status: 400 }
      );
    }

    // Create the message
    const message = await prisma.message.create({
      data: {
        senderId: session.user.id,
        recipientIds: validatedData.recipientIds,
        subject: validatedData.subject,
        content: validatedData.content,
        attachments: validatedData.attachments,
        consultancyId: session.user.consultancyId,
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
      }
    });

    return NextResponse.json({
      message: {
        ...message,
        recipients,
        messageStatus: 'sent',
        isFromMe: true,
        isToMe: validatedData.recipientIds.includes(session.user.id),
        isRead: true,
      }
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.issues },
        { status: 400 }
      );
    }

    console.error('Error sending message:', error);
    return NextResponse.json(
      { error: 'Failed to send message' },
      { status: 500 }
    );
  }
}
