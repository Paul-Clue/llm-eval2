import { auth, currentUser } from "@clerk/nextjs/server";
import { prisma } from "../../../../utils/db";
import { NextResponse } from "next/server";

export async function POST() {
  try {
    const { userId } = await auth();
    const clerkUser = await currentUser();
    // let user;
    console.log('clerkUser', clerkUser);
    console.log('userId', userId);

    const existingUser = await prisma.user.findUnique({
      where: { clerkId: userId as string }
    });

    if (existingUser) {
      return NextResponse.json({ user: existingUser });
    }
    
    const user = await prisma.user.upsert({
      where: { email: clerkUser?.emailAddresses[0].emailAddress as string },
      update: {
        id: userId as string,
        clerkId: userId as string,
        email: clerkUser?.emailAddresses[0].emailAddress as string,
      },
      create: {
        id: userId as string,
        clerkId: userId as string,
        email: clerkUser?.emailAddresses[0].emailAddress as string,
      }
    });
  //   if (!existingUser) {
  //     user = await prisma.user.create({
  //       data: {
  //         id: userId as string,
  //         clerkId: userId as string,
  //         email: clerkUser?.emailAddresses[0].emailAddress as string,
  //     },
  //   });
  // }
  return NextResponse.json({ user });
    
    // return NextResponse.json({ message: 'User created' });
  } catch (error) {
    console.error('Error creating user:', error);
    return NextResponse.json({ error: 'Failed to create user' }, { status: 500 });
  }
}