import { MigrationInterface, QueryRunner } from "typeorm";

export class AddAvatarFields1780424444421 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "user" ADD "avatar" character varying`);
        await queryRunner.query(`ALTER TABLE "schools" ADD "avatar" character varying`);
        await queryRunner.query(`ALTER TABLE "notice" ADD "avatar" character varying`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "notice" DROP COLUMN "avatar"`);
        await queryRunner.query(`ALTER TABLE "schools" DROP COLUMN "avatar"`);
        await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "avatar"`);
    }

}
