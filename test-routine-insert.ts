import { NestFactory } from '@nestjs/core';
import { AppModule } from './src/app.module';
import { GeneralService } from './src/general/general.service';
import { Day } from './src/general/entities/routine.entity';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const generalService = app.get(GeneralService);
  
  const res = await generalService.createRoutine({
    classId: "657ec116-f615-442b-8dc3-ce20d998210a",
    subjectId: "657ec116-f615-442b-8dc3-ce20d998210a",
    teacherId: "657ec116-f615-442b-8dc3-ce20d998210a",
    day: Day.MONDAY,
    startTime: "09:00:00",
    endTime: "10:00:00",
    schoolId: "3b1e7e8f-6e4c-4c0e-9c2a-6d8f4c1b7a91"
  });
  console.log("Inserted Routine:", res);
  await app.close();
}
bootstrap();
