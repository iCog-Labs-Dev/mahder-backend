
import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateManualWithdrawalRequest1793888765335
  implements MigrationInterface
{
  name = 'CreateManualWithdrawalRequest1793888765335';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "manual_withdrawal_request" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "user_id" uuid NOT NULL,
        "project_id" uuid NOT NULL,
        "transaction_id" uuid NOT NULL,
        "payment_method" character varying(20) NOT NULL,
        "phone_number" character varying(20) NOT NULL,
        "status" character varying(20) NOT NULL DEFAULT 'Pending',
        "rejection_reason" text,
        "reviewed_by" uuid,
        "reviewed_at" TIMESTAMP,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_manual_withdrawal_request"
          PRIMARY KEY ("id"),
        CONSTRAINT "UQ_manual_withdrawal_transaction"
          UNIQUE ("transaction_id")
      )
    `);

    await queryRunner.query(`
      ALTER TABLE "manual_withdrawal_request"
      ADD CONSTRAINT "FK_manual_withdrawal_user"
      FOREIGN KEY ("user_id") REFERENCES "users"("id")
      ON DELETE RESTRICT ON UPDATE NO ACTION
    `);

    await queryRunner.query(`
      ALTER TABLE "manual_withdrawal_request"
      ADD CONSTRAINT "FK_manual_withdrawal_project"
      FOREIGN KEY ("project_id") REFERENCES "project"("id")
      ON DELETE RESTRICT ON UPDATE NO ACTION
    `);

    await queryRunner.query(`
      ALTER TABLE "manual_withdrawal_request"
      ADD CONSTRAINT "FK_manual_withdrawal_transaction"
      FOREIGN KEY ("transaction_id") REFERENCES "transaction"("id")
      ON DELETE RESTRICT ON UPDATE NO ACTION
    `);

    await queryRunner.query(`
      ALTER TABLE "manual_withdrawal_request"
      ADD CONSTRAINT "FK_manual_withdrawal_reviewer"
      FOREIGN KEY ("reviewed_by") REFERENCES "users"("id")
      ON DELETE RESTRICT ON UPDATE NO ACTION
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP TABLE "manual_withdrawal_request"
    `);
  }
}
