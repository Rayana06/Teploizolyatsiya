import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddLab3SystemFields1760000000000 implements MigrationInterface {
  name = 'AddLab3SystemFields1760000000000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "insulation_materials" ADD COLUMN IF NOT EXISTS "completed_at" timestamptz`);
    await queryRunner.query(`ALTER TABLE "insulation_materials" ADD COLUMN IF NOT EXISTS "moderator_id" integer`);
    await queryRunner.query(`
      DO $$ BEGIN
        ALTER TABLE "insulation_materials"
        ADD CONSTRAINT "fk_insulation_materials_moderator"
        FOREIGN KEY ("moderator_id") REFERENCES "users"("user_id") ON DELETE RESTRICT;
      EXCEPTION WHEN duplicate_object THEN NULL;
      END $$
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "insulation_materials" DROP CONSTRAINT IF EXISTS "fk_insulation_materials_moderator"`);
    await queryRunner.query(`ALTER TABLE "insulation_materials" DROP COLUMN IF EXISTS "moderator_id"`);
    await queryRunner.query(`ALTER TABLE "insulation_materials" DROP COLUMN IF EXISTS "completed_at"`);
  }
}
