import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET - Get a single message by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const message = await prisma.message.findFirst({
      where: {
        id: id,
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
      }
    });

    if (!message) {
      return NextResponse.json({ error: 'Message not found' }, { status: 404 });
    }

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

    // Mark as read if user is a recipient and hasn't read it yet
    if (isToMe && !message.isRead) {
      await prisma.message.update({
        where: { id: id },
        data: { isRead: true }
      });
      message.isRead = true;
    }

    return NextResponse.json({
      ...message,
      recipients,
      messageStatus,
      isFromMe,
      isToMe,
      isRead: isFromMe ? true : message.isRead,
    });

  } catch (error) {
    console.error('Error fetching message:', error);
    return NextResponse.json(
      { error: 'Failed to fetch message' },
      { status: 500 }
    );
  }
}

// PUT - Mark message as read/unread or archive/unarchive
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let body;
    try {
      body = await request.json();
    } catch (error) {
      return NextResponse.json({ error: 'Invalid JSON in request body' }, { status: 400 });
    }

    const { isRead, isDeleted } = body;

    // Verify the message exists and user has access
    const message = await prisma.message.findFirst({
      where: {
        id: id,
        consultancyId: session.user.consultancyId,
        AND: [
          {
            OR: [
              { senderId: session.user.id },
              { recipientIds: { has: session.user.id } }
            ]
          }
        ]
      }
    });

    if (!message) {
      return NextResponse.json({ error: 'Message not found or access denied' }, { status: 404 });
    }

    // Build update data object
    const updateData: any = {};
    
    if (typeof isRead === 'boolean') {
      updateData.isRead = isRead;
    }
    
    if (typeof isDeleted === 'boolean') {
      updateData.isDeleted = isDeleted;
    }

    const updatedMessage = await prisma.message.update({
      where: { id: id },
      data: updateData,
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

    return NextResponse.json(updatedMessage);

  } catch (error) {
    console.error('Error updating message:', error);
    return NextResponse.json(
      { error: 'Failed to update message' },
      { status: 500 }
    );
  }
}

// DELETE - Soft delete a message
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify the message exists and user has access
    const message = await prisma.message.findFirst({
      where: {
        id: id,
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
      }
    });

    if (!message) {
      return NextResponse.json({ error: 'Message not found or access denied' }, { status: 404 });
    }

    // Soft delete the message
    await prisma.message.update({
      where: { id: id },
      data: { isDeleted: true }
    });

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Error deleting message:', error);
    return NextResponse.json(
      { error: 'Failed to delete message' },
      { status: 500 }
    );
  }
}
