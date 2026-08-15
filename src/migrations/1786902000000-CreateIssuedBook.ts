import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateIssuedBook1786902000000 implements MigrationInterface {
    name = 'CreateIssuedBook1786902000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Create issued_book table (no FK to schools/users — schoolId is validated via JWT)
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
                CONSTRAINT "PK_issued_book" PRIMARY KEY ("id")
            )
        `);

        // FK to library_books only (safe — library_books.id is the real PK)
        await queryRunner.query(`
            DO $$ BEGIN
                IF NOT EXISTS (
                    SELECT 1 FROM information_schema.table_constraints
                    WHERE constraint_name = 'FK_issued_book_bookId'
                ) THEN
                    ALTER TABLE "issued_book"
                    ADD CONSTRAINT "FK_issued_book_bookId"
                    FOREIGN KEY ("bookId") REFERENCES "library_books"("id")
                    ON DELETE CASCADE ON UPDATE NO ACTION;
                END IF;
            END $$
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "issued_book" DROP CONSTRAINT IF EXISTS "FK_issued_book_bookId"`);
        await queryRunner.query(`DROP TABLE IF EXISTS "issued_book"`);
    }
}
