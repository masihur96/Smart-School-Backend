import { MigrationInterface, QueryRunner } from "typeorm";

export class LibraryModule1786651726156 implements MigrationInterface {
    name = 'LibraryModule1786651726156'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Use IF NOT EXISTS to make this idempotent - safe to re-run
        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS "library_books" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "schoolId" uuid NOT NULL,
                "title" character varying NOT NULL,
                "author" character varying NOT NULL,
                "isbn" character varying,
                "category" character varying,
                "coverImageUrl" character varying,
                "isAvailable" boolean NOT NULL DEFAULT true,
                "description" text,
                "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                CONSTRAINT "PK_6054209bc9f4326318a33fcda68" PRIMARY KEY ("id")
            )
        `);

        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS "issued_book" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "schoolId" uuid NOT NULL,
                "bookId" uuid NOT NULL,
                "studentId" uuid NOT NULL,
                "issueDate" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "dueDate" TIMESTAMP WITH TIME ZONE NOT NULL,
                "returnDate" TIMESTAMP WITH TIME ZONE,
                "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                CONSTRAINT "PK_b506f6c4bdc30efb3bb97ee5e61" PRIMARY KEY ("id")
            )
        `);

        await queryRunner.query(`DROP TYPE IF EXISTS "public"."book_request_status_enum" CASCADE`);
        await queryRunner.query(`CREATE TYPE "public"."book_request_status_enum" AS ENUM('pending', 'accepted', 'declined')`);

        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS "book_request" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "schoolId" uuid NOT NULL,
                "bookId" uuid NOT NULL,
                "studentId" uuid NOT NULL,
                "status" "public"."book_request_status_enum" NOT NULL DEFAULT 'pending',
                "requestDate" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                CONSTRAINT "PK_b858047bddd5d757cd3bd2c4dcd" PRIMARY KEY ("id")
            )
        `);

        // Add FK constraints only if they don't exist
        await queryRunner.query(`
            DO $$ BEGIN
                IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'FK_a082d4c6cf755c29df969eb7085') THEN
                    ALTER TABLE "library_books" ADD CONSTRAINT "FK_a082d4c6cf755c29df969eb7085" FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
                END IF;
            END $$
        `);
        await queryRunner.query(`
            DO $$ BEGIN
                IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'FK_c011aba776d9d801cbf329547e6') THEN
                    ALTER TABLE "issued_book" ADD CONSTRAINT "FK_c011aba776d9d801cbf329547e6" FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
                END IF;
            END $$
        `);
        await queryRunner.query(`
            DO $$ BEGIN
                IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'FK_bc37d67ca1817ee8638fb223d2c') THEN
                    ALTER TABLE "issued_book" ADD CONSTRAINT "FK_bc37d67ca1817ee8638fb223d2c" FOREIGN KEY ("bookId") REFERENCES "library_books"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
                END IF;
            END $$
        `);
        await queryRunner.query(`
            DO $$ BEGIN
                IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'FK_7c8747b83285d1c1d79f17e3e7b') THEN
                    ALTER TABLE "issued_book" ADD CONSTRAINT "FK_7c8747b83285d1c1d79f17e3e7b" FOREIGN KEY ("studentId") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
                END IF;
            END $$
        `);
        await queryRunner.query(`
            DO $$ BEGIN
                IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'FK_07649c5674d5951119176815aa7') THEN
                    ALTER TABLE "book_request" ADD CONSTRAINT "FK_07649c5674d5951119176815aa7" FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
                END IF;
            END $$
        `);
        await queryRunner.query(`
            DO $$ BEGIN
                IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'FK_b5e76bf7c1a32e525fc09905da3') THEN
                    ALTER TABLE "book_request" ADD CONSTRAINT "FK_b5e76bf7c1a32e525fc09905da3" FOREIGN KEY ("bookId") REFERENCES "library_books"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
                END IF;
            END $$
        `);
        await queryRunner.query(`
            DO $$ BEGIN
                IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'FK_2165b19dc99e3b0dc1499aa99c5') THEN
                    ALTER TABLE "book_request" ADD CONSTRAINT "FK_2165b19dc99e3b0dc1499aa99c5" FOREIGN KEY ("studentId") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
                END IF;
            END $$
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "book_request" DROP CONSTRAINT IF EXISTS "FK_2165b19dc99e3b0dc1499aa99c5"`);
        await queryRunner.query(`ALTER TABLE "book_request" DROP CONSTRAINT IF EXISTS "FK_b5e76bf7c1a32e525fc09905da3"`);
        await queryRunner.query(`ALTER TABLE "book_request" DROP CONSTRAINT IF EXISTS "FK_07649c5674d5951119176815aa7"`);
        await queryRunner.query(`ALTER TABLE "issued_book" DROP CONSTRAINT IF EXISTS "FK_7c8747b83285d1c1d79f17e3e7b"`);
        await queryRunner.query(`ALTER TABLE "issued_book" DROP CONSTRAINT IF EXISTS "FK_bc37d67ca1817ee8638fb223d2c"`);
        await queryRunner.query(`ALTER TABLE "issued_book" DROP CONSTRAINT IF EXISTS "FK_c011aba776d9d801cbf329547e6"`);
        await queryRunner.query(`ALTER TABLE "library_books" DROP CONSTRAINT IF EXISTS "FK_a082d4c6cf755c29df969eb7085"`);
        await queryRunner.query(`DROP TABLE IF EXISTS "book_request"`);
        await queryRunner.query(`DROP TYPE IF EXISTS "public"."book_request_status_enum"`);
        await queryRunner.query(`DROP TABLE IF EXISTS "issued_book"`);
        await queryRunner.query(`DROP TABLE IF EXISTS "library_books"`);
    }
}
