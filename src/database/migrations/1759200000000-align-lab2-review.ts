import { MigrationInterface, QueryRunner } from 'typeorm';

export class AlignLab2Review1759200000000 implements MigrationInterface {
  name = 'AlignLab2Review1759200000000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "password_hash" varchar(255)`);
    await queryRunner.query(`UPDATE "users" SET "password_hash" = '$2b$12$lab2.educational.password.hash' WHERE "password_hash" IS NULL`);
    await queryRunner.query(`ALTER TABLE "users" ALTER COLUMN "password_hash" SET NOT NULL`);
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN IF EXISTS "created_at"`);
    await queryRunner.query(`ALTER TABLE "insulation_material_likes" DROP COLUMN IF EXISTS "created_at"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "public"."ix_insulation_materials_status_price"`);
    await queryRunner.query(`ALTER TABLE "insulation_materials" DROP COLUMN IF EXISTS "manufacturer"`);
    await queryRunner.query(`ALTER TABLE "insulation_materials" DROP COLUMN IF EXISTS "application_area"`);
    await queryRunner.query(`ALTER TABLE "insulation_materials" DROP COLUMN IF EXISTS "sku"`);
    await queryRunner.query(`ALTER TABLE "insulation_materials" DROP COLUMN IF EXISTS "price_rub_m2"`);
    await queryRunner.query(`ALTER TABLE "insulation_materials" DROP COLUMN IF EXISTS "source_url"`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "ix_insulation_materials_status_thickness" ON "insulation_materials" ("status", "thickness_mm")`);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "public"."ix_insulation_materials_status_thickness"`);
    await queryRunner.query(`ALTER TABLE "insulation_materials" ADD COLUMN "source_url" varchar(500)`);
    await queryRunner.query(`ALTER TABLE "insulation_materials" ADD COLUMN "price_rub_m2" numeric(10,2)`);
    await queryRunner.query(`ALTER TABLE "insulation_materials" ADD COLUMN "sku" varchar(40)`);
    await queryRunner.query(`ALTER TABLE "insulation_materials" ADD COLUMN "application_area" varchar(120)`);
    await queryRunner.query(`ALTER TABLE "insulation_materials" ADD COLUMN "manufacturer" varchar(100)`);
    await queryRunner.query(`CREATE INDEX "ix_insulation_materials_status_price" ON "insulation_materials" ("status", "price_rub_m2")`);
    await queryRunner.query(`ALTER TABLE "insulation_material_likes" ADD COLUMN "created_at" timestamptz NOT NULL DEFAULT now()`);
    await queryRunner.query(`ALTER TABLE "users" ADD COLUMN "created_at" timestamptz NOT NULL DEFAULT now()`);
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "password_hash"`);
  }
}
