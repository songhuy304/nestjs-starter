import { MigrationInterface, QueryRunner } from "typeorm";

export class UpdateTable1792144418136 implements MigrationInterface {
    name = 'UpdateTable1792144418136'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "notifications" ("created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, "id" SERIAL NOT NULL, "title" character varying NOT NULL, "content" character varying NOT NULL, "type" character varying NOT NULL, "isRead" boolean NOT NULL, "userId" integer NOT NULL, CONSTRAINT "PK_6a72c3c0f683f6462415e653c3a" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "tokens" ("created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, "id" SERIAL NOT NULL, "value" character varying NOT NULL, "type" character varying NOT NULL, "expiresAt" TIMESTAMP NOT NULL, "userId" integer NOT NULL, CONSTRAINT "PK_3001e89ada36263dabf1fb6210a" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."users_role_enum" AS ENUM('admin', 'user')`);
        await queryRunner.query(`CREATE TYPE "public"."users_provider_enum" AS ENUM('local', 'google', 'facebook', 'github')`);
        await queryRunner.query(`CREATE TABLE "users" ("created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, "id" SERIAL NOT NULL, "email" character varying NOT NULL, "password" character varying, "fullName" character varying NOT NULL, "isVerified" boolean NOT NULL DEFAULT false, "tokenVersion" integer NOT NULL DEFAULT '0', "avatar" character varying, "role" "public"."users_role_enum" NOT NULL DEFAULT 'admin', "provider" "public"."users_provider_enum" NOT NULL DEFAULT 'local', CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_a49a58e5fe52d7f5458a0863ae" ON "users" ("email", "provider") `);
        await queryRunner.query(`ALTER TABLE "notifications" ADD CONSTRAINT "FK_692a909ee0fa9383e7859f9b406" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "tokens" ADD CONSTRAINT "FK_d417e5d35f2434afc4bd48cb4d2" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "tokens" DROP CONSTRAINT "FK_d417e5d35f2434afc4bd48cb4d2"`);
        await queryRunner.query(`ALTER TABLE "notifications" DROP CONSTRAINT "FK_692a909ee0fa9383e7859f9b406"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_a49a58e5fe52d7f5458a0863ae"`);
        await queryRunner.query(`DROP TABLE "users"`);
        await queryRunner.query(`DROP TYPE "public"."users_provider_enum"`);
        await queryRunner.query(`DROP TYPE "public"."users_role_enum"`);
        await queryRunner.query(`DROP TABLE "tokens"`);
        await queryRunner.query(`DROP TABLE "notifications"`);
    }

}
