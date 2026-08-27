import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateOnlineClass1786645976995 implements MigrationInterface {
    name = 'CreateOnlineClass1786645976995'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE IF NOT EXISTS "online_class" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "title" character varying NOT NULL, "description" character varying, "meetLink" character varying NOT NULL, "date" TIMESTAMP WITH TIME ZONE NOT NULL, "startTime" character varying, "endTime" character varying, "hostId" character varying NOT NULL, "schoolId" character varying NOT NULL, "classId" character varying, "sectionId" character varying, "subjectId" character varying, "participantUuids" text, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_62707a82ed794cc3b4e63447129" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "online_class" ADD COLUMN IF NOT EXISTS "participantUuids" text`);
        await queryRunner.query(`ALTER TABLE "online_class" ALTER COLUMN "classId" DROP NOT NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "online_class"`);
    }

}
