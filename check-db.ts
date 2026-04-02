import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
import { Routine } from './src/general/entities/routine.entity';
import { User } from './src/users/entities/user.entity';
import { Class } from './src/classes/entities/class.entity';
import { Subject } from './src/subjects/entities/subject.entity';
import { Section } from './src/sections/entities/section.entity';
import { Exam } from './src/exams/entities/exam.entity';
import { ExamResult } from './src/exams/entities/exam-result.entity';
import { Attendance } from './src/attendance/entities/attendance.entity';
import { Marks } from './src/marks/entities/marks.entity';
import { Homework } from './src/homework/entities/homework.entity';
import { Notice } from './src/general/entities/notice.entity';

dotenv.config();

const AppDataSource = new DataSource({
    type: "postgres",
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT || '5432'),
    username: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    entities: [User, Class, Subject, Routine, Notice, Section, Exam, ExamResult, Attendance, Marks, Homework],
    synchronize: false,
});

async function run() {
    try {
        await AppDataSource.initialize();
        console.log("Data Source has been initialized!");
        const routineRepository = AppDataSource.getRepository(Routine);
        const routines = await routineRepository.find({ take: 5 });
        console.log("Routines:", JSON.stringify(routines, null, 2));
        await AppDataSource.destroy();
    } catch (err) {
        console.error("Error during Data Source initialization:", err);
    }
}

run();
