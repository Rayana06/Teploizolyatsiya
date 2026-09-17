import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateLab2Schema1757900000000 implements MigrationInterface {
  name = 'CreateLab2Schema1757900000000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE TYPE "insulation_material_status" AS ENUM ('draft', 'published', 'deleted')`);
    await queryRunner.query(`
      CREATE TABLE "users" (
        "user_id" SERIAL NOT NULL,
        "email" varchar(254) NOT NULL,
        "display_name" varchar(100) NOT NULL,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "pk_users" PRIMARY KEY ("user_id"),
        CONSTRAINT "uq_users_email" UNIQUE ("email")
      )
    `);
    await queryRunner.query(`
      CREATE TABLE "insulation_materials" (
        "insulation_material_id" SERIAL NOT NULL,
        "name" varchar(120) NOT NULL,
        "short_description" varchar(300),
        "status" "insulation_material_status" NOT NULL DEFAULT 'draft',
        "image_url" varchar(500),
        "video_url" varchar(500),
        "insulation_type" varchar(50),
        "thickness_mm" smallint,
        "manufacturer" varchar(100),
        "application_area" varchar(120),
        "sku" varchar(40),
        "price_rub_m2" numeric(10,2),
        "source_url" varchar(500),
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "published_at" timestamptz,
        "creator_id" integer NOT NULL,
        CONSTRAINT "pk_insulation_materials" PRIMARY KEY ("insulation_material_id"),
        CONSTRAINT "ck_insulation_materials_thickness" CHECK ("thickness_mm" IS NULL OR "thickness_mm" > 0),
        CONSTRAINT "ck_insulation_materials_price" CHECK ("price_rub_m2" IS NULL OR "price_rub_m2" >= 0),
        CONSTRAINT "fk_insulation_materials_creator" FOREIGN KEY ("creator_id") REFERENCES "users"("user_id") ON DELETE RESTRICT ON UPDATE NO ACTION
      )
    `);
    await queryRunner.query(`CREATE UNIQUE INDEX "uq_insulation_materials_one_draft_per_creator" ON "insulation_materials" ("creator_id") WHERE "status" = 'draft'`);
    await queryRunner.query(`CREATE INDEX "ix_insulation_materials_status_price" ON "insulation_materials" ("status", "price_rub_m2")`);
    await queryRunner.query(`
      CREATE TABLE "insulation_material_likes" (
        "insulation_material_like_id" SERIAL NOT NULL,
        "user_id" integer NOT NULL,
        "insulation_material_id" integer NOT NULL,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "pk_insulation_material_likes" PRIMARY KEY ("insulation_material_like_id"),
        CONSTRAINT "uq_insulation_material_likes_user_material" UNIQUE ("user_id", "insulation_material_id"),
        CONSTRAINT "fk_insulation_material_likes_user" FOREIGN KEY ("user_id") REFERENCES "users"("user_id") ON DELETE RESTRICT ON UPDATE NO ACTION,
        CONSTRAINT "fk_insulation_material_likes_material" FOREIGN KEY ("insulation_material_id") REFERENCES "insulation_materials"("insulation_material_id") ON DELETE RESTRICT ON UPDATE NO ACTION
      )
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "insulation_material_likes"`);
    await queryRunner.query(`DROP INDEX "public"."ix_insulation_materials_status_price"`);
    await queryRunner.query(`DROP INDEX "public"."uq_insulation_materials_one_draft_per_creator"`);
    await queryRunner.query(`DROP TABLE "insulation_materials"`);
    await queryRunner.query(`DROP TABLE "users"`);
    await queryRunner.query(`DROP TYPE "insulation_material_status"`);
  }
}
