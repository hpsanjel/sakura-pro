import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { UserRole } from '@/generated/prisma';

// GET - Get all users in the consultancy that can be messaged
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const role = searchParams.get('role') as UserRole; // Optional role filter

    // Get all users in the consultancy except the current user
    const users = await prisma.user.findMany({
      where: {
        consultancyId: session.user.consultancyId,
        id: { not: session.user.id },
        AND: [
          search ? {
            OR: [
              { name: { contains: search, mode: 'insensitive' } },
              { email: { contains: search, mode: 'insensitive' } }
            ]
          } : {},
          role ? { role: role } : {}
        ]
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      },
      orderBy: [
        { role: 'asc' },
        { name: 'asc' }
      ]
    });

    // Group users by role for better organization
    const groupedUsers = users.reduce((acc: any, user) => {
      if (!acc[user.role]) {
        acc[user.role] = [];
      }
      acc[user.role].push(user);
      return acc;
    }, {});

    return NextResponse.json({
      users: groupedUsers,
      allUsers: users, // Also return flat array for easier consumption
    });

  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json(
      { error: 'Failed to fetch users' },
      { status: 500 }
    );
  }
}
