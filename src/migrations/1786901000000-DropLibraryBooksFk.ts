import { MigrationInterface, QueryRunner } from "typeorm";

export class DropLibraryBooksFk1786901000000 implements MigrationInterface {
    name = 'DropLibraryBooksFk1786901000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Drop the FK constraint that links library_books.schoolId -> schools.id
        // The schoolId in the JWT is schools.schoolId (logical ID), not schools.id (PK),
        // so this FK was always invalid and caused FK violation on insert.
        await queryRunner.query(`
            ALTER TABLE "library_books"
            DROP CONSTRAINT IF EXISTS "FK_a082d4c6cf755c29df969eb7085"
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Re-add the constraint if rolling back (will only succeed if schoolId matches schools.id)
        await queryRunner.query(`
            ALTER TABLE "library_books"
            ADD CONSTRAINT "FK_a082d4c6cf755c29df969eb7085"
            FOREIGN KEY ("schoolId") REFERENCES "schools"("id")
            ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
    }
}
