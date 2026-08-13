import { MigrationInterface, QueryRunner } from "typeorm";

export class LibraryModule1786651726156 implements MigrationInterface {
    name = 'LibraryModule1786651726156'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "book" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "schoolId" uuid NOT NULL, "title" character varying NOT NULL, "author" character varying NOT NULL, "isbn" character varying, "category" character varying, "coverImageUrl" character varying, "isAvailable" boolean NOT NULL DEFAULT true, "description" text, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_a3afef72ec8f80e6e5c310b28a4" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "issued_book" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "schoolId" uuid NOT NULL, "bookId" uuid NOT NULL, "studentId" uuid NOT NULL, "issueDate" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "dueDate" TIMESTAMP WITH TIME ZONE NOT NULL, "returnDate" TIMESTAMP WITH TIME ZONE, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_b506f6c4bdc30efb3bb97ee5e61" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."book_request_status_enum" AS ENUM('pending', 'accepted', 'declined')`);
        await queryRunner.query(`CREATE TABLE "book_request" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "schoolId" uuid NOT NULL, "bookId" uuid NOT NULL, "studentId" uuid NOT NULL, "status" "public"."book_request_status_enum" NOT NULL DEFAULT 'pending', "requestDate" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_b858047bddd5d757cd3bd2c4dcd" PRIMARY KEY ("id"))`);
        
        await queryRunner.query(`ALTER TABLE "book" ADD CONSTRAINT "FK_b5127c7ebbe1710d6ecc73d4255" FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "issued_book" ADD CONSTRAINT "FK_c011aba776d9d801cbf329547e6" FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "issued_book" ADD CONSTRAINT "FK_bc37d67ca1817ee8638fb223d2c" FOREIGN KEY ("bookId") REFERENCES "book"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "issued_book" ADD CONSTRAINT "FK_7c8747b83285d1c1d79f17e3e7b" FOREIGN KEY ("studentId") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "book_request" ADD CONSTRAINT "FK_07649c5674d5951119176815aa7" FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "book_request" ADD CONSTRAINT "FK_b5e76bf7c1a32e525fc09905da3" FOREIGN KEY ("bookId") REFERENCES "book"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "book_request" ADD CONSTRAINT "FK_2165b19dc99e3b0dc1499aa99c5" FOREIGN KEY ("studentId") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "book_request" DROP CONSTRAINT "FK_2165b19dc99e3b0dc1499aa99c5"`);
        await queryRunner.query(`ALTER TABLE "book_request" DROP CONSTRAINT "FK_b5e76bf7c1a32e525fc09905da3"`);
        await queryRunner.query(`ALTER TABLE "book_request" DROP CONSTRAINT "FK_07649c5674d5951119176815aa7"`);
        await queryRunner.query(`ALTER TABLE "issued_book" DROP CONSTRAINT "FK_7c8747b83285d1c1d79f17e3e7b"`);
        await queryRunner.query(`ALTER TABLE "issued_book" DROP CONSTRAINT "FK_bc37d67ca1817ee8638fb223d2c"`);
        await queryRunner.query(`ALTER TABLE "issued_book" DROP CONSTRAINT "FK_c011aba776d9d801cbf329547e6"`);
        await queryRunner.query(`ALTER TABLE "book" DROP CONSTRAINT "FK_b5127c7ebbe1710d6ecc73d4255"`);
        
        await queryRunner.query(`DROP TABLE "book_request"`);
        await queryRunner.query(`DROP TYPE "public"."book_request_status_enum"`);
        await queryRunner.query(`DROP TABLE "issued_book"`);
        await queryRunner.query(`DROP TABLE "book"`);
    }

}
