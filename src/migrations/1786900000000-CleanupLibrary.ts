import { MigrationInterface, QueryRunner } from "typeorm";

export class CleanupLibrary1786900000000 implements MigrationInterface {
    name = 'CleanupLibrary1786900000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Drop book_request and issued_book tables if they exist (cleanup)
        await queryRunner.query(`DROP TABLE IF EXISTS "book_request" CASCADE`);
        await queryRunner.query(`DROP TABLE IF EXISTS "issued_book" CASCADE`);
        await queryRunner.query(`DROP TYPE IF EXISTS "public"."book_request_status_enum" CASCADE`);

        // Ensure library_books table exists (create if not already created by previous migration)
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

        // Ensure FK constraint exists on schoolId
        await queryRunner.query(`
            DO $$ BEGIN
                IF NOT EXISTS (
                    SELECT 1 FROM information_schema.table_constraints
                    WHERE constraint_name = 'FK_a082d4c6cf755c29df969eb7085'
                    AND table_name = 'library_books'
                ) THEN
                    ALTER TABLE "library_books"
                    ADD CONSTRAINT "FK_a082d4c6cf755c29df969eb7085"
                    FOREIGN KEY ("schoolId") REFERENCES "schools"("id")
                    ON DELETE NO ACTION ON UPDATE NO ACTION;
                END IF;
            END $$
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "library_books" DROP CONSTRAINT IF EXISTS "FK_a082d4c6cf755c29df969eb7085"`);
        await queryRunner.query(`DROP TABLE IF EXISTS "library_books"`);
    }
}
