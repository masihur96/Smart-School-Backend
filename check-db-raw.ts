import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
import { Routine } from './src/general/entities/routine.entity';
import { User } from './src/users/entities/user.entity';
import { Class } from './src/classes/entities/class.entity';
import { Subject } from './src/subjects/entities/subject.entity';

dotenv.config();

const AppDataSource = new DataSource({
    type: "postgres",
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT || '5432'),
    username: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    entities: [User, Class, Subject, Routine],
    synchronize: false,
});

async function run() {
    try {
        await AppDataSource.initialize();
        console.log("Data Source has been initialized!");
        const routineRepository = AppDataSource.getRepository(Routine);
        const routines = await routineRepository.find({
            where: { teacherId: 'faf19a04-8fd9-442f-b201-fbc04c6c9be8' },
            relations: ['teacherEntity', 'classEntity', 'subjectEntity']
        });
        console.log("Routines matches:", routines.length);
        if (routines.length > 0) {
            console.log("First routine with teacher entity:", JSON.stringify(routines[0], null, 2));
        }
        await AppDataSource.destroy();
    } catch (err) {
        console.error("Error during Data Source initialization:", err);
    }
}

run();
