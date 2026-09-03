import { config } from "dotenv";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import bcrypt from "bcryptjs";

// Load environment variables
config({ path: ".env.local" });

// Prisma client initialization with adapter (same as lib/prisma.ts)
const connectionString = process.env.DATABASE_URL || "";
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
	console.log("🌱 Starting database seeding...");

	// Create system consultancy for superadmin
	const systemConsultancy = await prisma.consultancy.upsert({
		where: { email: "system@studyabroad.com" },
		update: { status: "ACTIVE" },
		create: {
			name: "System Administration",
			email: "system@studyabroad.com",
			phone: "+977-0000000000",
			address: "System",
			status: "ACTIVE",
		},
	});

	// Create superadmin user
	const superadmin = await prisma.user.upsert({
		where: { email: "superadmin@system.com" },
		update: {},
		create: {
			email: "superadmin@system.com",
			name: "Super Admin",
			password: await bcrypt.hash("hed0nist", 10),
			role: "SUPERADMIN",
			consultancyId: systemConsultancy.id,
		},
	});

	console.log("✅ Created superadmin user:", superadmin.email);

	// Create demo consultancy
	const consultancy = await prisma.consultancy.upsert({
		where: { email: "info@fate.edu.np" },
		update: { status: "ACTIVE" },
		create: {
			name: "Fate Education Consultancy",
			email: "info@fate.edu.np",
			phone: "+977-1234567890",
			address: "Kathmandu, Nepal",
			status: "ACTIVE",
		},
	});

	console.log("✅ Created consultancy:", consultancy.name);

	// Create admin user
	const admin = await prisma.user.upsert({
		where: { email: "admin@fate.edu.np" },
		update: {},
		create: {
			email: "admin@fate.edu.np",
			name: "Prem",
			password: await bcrypt.hash("hed0nist", 10),
			role: "ADMIN",
			consultancyId: consultancy.id,
		},
	});

	console.log("✅ Created admin user:", admin.email);

	// From here on, staff and student accounts are created by the consultancy
	// admin rather than the superadmin, mirroring how the app's own
	// "create user" flow works.
	const counselor = await prisma.user.upsert({
		where: { email: "counselor@fate.edu.np" },
		update: {},
		create: {
			email: "counselor@fate.edu.np",
			name: "Counselor",
			password: await bcrypt.hash("hed0nist", 10),
			role: "COUNSELOR",
			consultancyId: consultancy.id,
		},
	});

	console.log(`✅ Admin (${admin.email}) created counselor user:`, counselor.email);

	const teacherUser = await prisma.user.upsert({
		where: { email: "teacher@fate.edu.np" },
		update: {},
		create: {
			email: "teacher@fate.edu.np",
			name: "Teacher Sharma",
			password: await bcrypt.hash("hed0nist", 10),
			role: "TEACHER",
			consultancyId: consultancy.id,
		},
	});

	console.log(`✅ Admin (${admin.email}) created teacher user:`, teacherUser.email);

	const teacher = await prisma.teacher.upsert({
		where: { userId: teacherUser.id },
		update: {},
		create: {
			userId: teacherUser.id,
			consultancyId: consultancy.id,
			firstName: "Teacher",
			lastName: "Sharma",
			specialization: "Japanese Language & Culture",
			experience: "5 years of teaching Japanese to Nepali students",
			qualifications: "JLPT N1, Japanese Teaching Certificate",
		},
	});

	console.log("✅ Created teacher profile for:", teacherUser.name);

	const student = await prisma.user.upsert({
		where: { email: "student@fate.edu.np" },
		update: {},
		create: {
			email: "student@fate.edu.np",
			name: "Student",
			password: await bcrypt.hash("hed0nist", 10),
			role: "STUDENT",
			consultancyId: consultancy.id,
		},
	});

	console.log(`✅ Admin (${admin.email}) created student user:`, student.email);

	// Create sample students (actual student profiles)
	const student1 = await prisma.student.upsert({
		where: { passportNumber: "NP1234567" },
		update: {},
		create: {
			name: "Student Sanjel",
			passportNumber: "NP1234567",
			dateOfBirth: new Date("2000-05-15"),
			phone: "+977-9841234567",
			address: "Kathmandu, Nepal",
			education: "Bachelor in Computer Science",
			japaneseLanguageLevel: "N5",
			intake: "April 2024",
			visaStatus: "NEW_LEAD",
			consultancyId: consultancy.id,
			userId: student.id, // Link to the student user
			email: student.email,
			hasLoginAccess: true,
		},
	});

	console.log("✅ Created sample student:", student1.name);

	const student2 = await prisma.student.upsert({
		where: { passportNumber: "NP7654321" },
		update: {},
		create: {
			name: "Rajesh Sharma",
			passportNumber: "NP7654321",
			dateOfBirth: new Date("1999-08-22"),
			phone: "+977-9847654321",
			address: "Pokhara, Nepal",
			education: "Bachelor in Business Administration",
			japaneseLanguageLevel: "N4",
			intake: "July 2024",
			visaStatus: "DOCS_VERIFIED",
			consultancyId: consultancy.id,
		},
	});

	console.log("✅ Created sample student:", student2.name);

	// Create a sample school
	const school = await prisma.school.upsert({
		where: {
			id: "sample-school-id",
		},
		update: {},
		create: {
			id: "sample-school-id",
			name: "Tokyo Language Academy",
			address: "Shinjuku, Tokyo, Japan",
			website: "https://tla.example.com",
			isPartner: true,
			consultancyId: consultancy.id,
		},
	});

	console.log("✅ Created sample school:", school.name);

	// Create sample Japanese class
	const japaneseClass = await prisma.japaneseClass.upsert({
		where: { id: "sample-class-id" },
		update: {},
		create: {
			id: "sample-class-id",
			name: "N5 Morning Class",
			level: "N5",
			description: "Beginner Japanese language class for students preparing for N5 exam",
			maxStudents: 15,
			consultancyId: consultancy.id,
			teacherId: teacher.id,
			schedules: {
				create: [
					{
						dayOfWeek: 1, // Monday
						startTime: new Date("2000-01-01T09:00:00"),
						endTime: new Date("2000-01-01T10:30:00"),
						room: "Room 101",
					},
					{
						dayOfWeek: 3, // Wednesday
						startTime: new Date("2000-01-01T09:00:00"),
						endTime: new Date("2000-01-01T10:30:00"),
						room: "Room 101",
					},
					{
						dayOfWeek: 5, // Friday
						startTime: new Date("2000-01-01T09:00:00"),
						endTime: new Date("2000-01-01T10:30:00"),
						room: "Room 101",
					},
				],
			},
		},
		include: {
			schedules: true,
		},
	});

	console.log("✅ Created sample Japanese class:", japaneseClass.name);

	// Enroll some students in the class
	const studentsArray = [student1, student2];
	for (let i = 0; i < Math.min(2, studentsArray.length); i++) {
		const enrollment = await prisma.classEnrollment.upsert({
			where: {
				classId_scheduleId_studentId: {
					classId: japaneseClass.id,
					scheduleId: japaneseClass.schedules[0].id,
					studentId: studentsArray[i].id,
				},
			},
			update: {},
			create: {
				classId: japaneseClass.id,
				scheduleId: japaneseClass.schedules[0].id,
				studentId: studentsArray[i].id,
			},
		});

		console.log(`✅ Enrolled ${studentsArray[i].name} in ${japaneseClass.name}`);
	}

	console.log("🎉 Database seeding completed!");
	console.log("");
	console.log("Login credentials:");
	console.log("SuperAdmin: superadmin@system.com / hed0nist");
	console.log("Admin: admin@fate.edu.np / hed0nist");
	console.log("Counselor: counselor@fate.edu.np / hed0nist");
	console.log("Teacher: teacher@fate.edu.np / hed0nist");
	console.log("Student: student@fate.edu.np / hed0nist");
}

main()
	.catch((e) => {
		console.error("❌ Error seeding database:", e);
		process.exit(1);
	})
	.finally(async () => {
		await prisma.$disconnect();
	});
